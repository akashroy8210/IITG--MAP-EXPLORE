const Student = require('../models/Student');
const Question = require('../models/Question');
const UserQuestionProgress = require('../models/UserQuestionProgress');
const HintUsageLog = require('../models/HintUsageLog');
const BonusUsageLog = require('../models/BonusUsageLog');
const GameConfig = require('../models/GameConfig');
const { normalizeText } = require('../utils/normalize');
const { computeAdjustedTimeSeconds } = require('../utils/scoring');
const { buildUserState, toPublicQuestion } = require('../utils/stateBuilder');
const { codeAttemptCooldownRemaining } = require('../utils/rateLimiter');
const emitters = require('../sockets/emitters');

function answerMatches(question, submitted) {
  const normalized = normalizeText(submitted);
  const candidates = [question.answer, ...(question.answerAcceptVariants || [])].map(normalizeText);
  return candidates.includes(normalized);
}

async function requireActiveStudent(userId) {
  const student = await Student.findById(userId);
  if (!student) {
    const err = new Error('Student not found');
    err.status = 404;
    throw err;
  }
  return student;
}

// ─── GET /api/student/me ──────────────────────────────────────────────────────

async function getMe(req, res) {
  const state = await buildUserState(req.userId);
  if (!state) return res.status(404).json({ message: 'Student not found' });
  res.json(state);
}

// ─── POST /api/game/start ─────────────────────────────────────────────────────

async function startGame(req, res) {
  const student = await requireActiveStudent(req.userId);

  if (student.gameStatus !== 'not_started') {
    const state = await buildUserState(student._id);
    return res.json(state);
  }

  // Find questions for this student's map + route sequence, ordered by stageIndex
  const routeGroup = student.routeKey ? student.routeKey.split('_').slice(0, 2).join('_') : 'ROUTE_A';
  const questions = await Question.find({
    mapId: student.mapId,
    $or: [{ routeKey: student.routeKey }, { routeKey: routeGroup }, { routeKey: 'DEFAULT' }],
  }).sort({ stageIndex: 1 });

  if (!questions || questions.length === 0) {
    return res.status(500).json({
      message: 'No questions configured for your map and route. Contact an administrator.',
    });
  }

  const firstQuestionId = questions[0]._id;
  const now = new Date();

  const started = await Student.findOneAndUpdate(
    { _id: student._id, gameStatus: 'not_started' },
    {
      $set: {
        gameStatus: 'in_progress',
        startedAt: now,
        currentStageIndex: 0,
        currentQuestionId: firstQuestionId,
      },
    },
    { new: true }
  );

  if (!started) {
    const state = await buildUserState(student._id);
    return res.json(state);
  }

  await UserQuestionProgress.findOneAndUpdate(
    { userId: student._id, questionId: firstQuestionId },
    { $setOnInsert: { userId: student._id, questionId: firstQuestionId, stageIndex: 0, status: 'active' } },
    { upsert: true }
  );

  const firstQuestion = toPublicQuestion(await Question.findById(firstQuestionId));
  emitters.emitGameStarted(student._id, { startedAt: now, firstQuestion });

  const state = await buildUserState(student._id);
  res.json(state);
}

// ─── POST /api/game/answer ────────────────────────────────────────────────────

async function submitAnswer(req, res) {
  const { questionId, answer } = req.body;
  if (!questionId || answer === undefined) {
    return res.status(400).json({ message: 'questionId and answer are required' });
  }

  const student = await requireActiveStudent(req.userId);
  if (student.gameStatus !== 'in_progress' || String(student.currentQuestionId) !== String(questionId)) {
    return res.status(400).json({ message: 'This question is not currently active for you' });
  }

  const question = await Question.findById(questionId);
  if (!question) return res.status(404).json({ message: 'Question not found' });
  if (question.type === 'final') {
    return res.status(400).json({ message: 'Use /api/game/final-answer for the final puzzle' });
  }

  const now = new Date();
  const normalized = normalizeText(answer);

  if (!answerMatches(question, answer)) {
    await UserQuestionProgress.updateOne(
      { userId: student._id, questionId },
      { $push: { answerAttempts: { value: normalized, correct: false, at: now } } }
    );
    emitters.emitAnswerRejected(student._id, { questionId });
    return res.json({ correct: false });
  }

  const result = await UserQuestionProgress.findOneAndUpdate(
    { userId: student._id, questionId, status: 'active' },
    {
      $set: { status: 'answer_solved', solvedAt: now },
      $push: { answerAttempts: { value: normalized, correct: true, at: now } },
    },
    { new: true }
  );

  if (!result) {
    return res.status(409).json({ correct: false, alreadySolved: true });
  }

  emitters.emitAnswerSolved(student._id, { questionId });
  res.json({ correct: true });
}

// ─── POST /api/game/verify-code ───────────────────────────────────────────────

async function verifyCode(req, res) {
  const { questionId, code } = req.body;
  if (!questionId || !code) {
    return res.status(400).json({ message: 'questionId and code are required' });
  }

  const student = await requireActiveStudent(req.userId);
  if (student.gameStatus !== 'in_progress' || String(student.currentQuestionId) !== String(questionId)) {
    return res.status(400).json({ message: 'This question is not currently active for you' });
  }

  const progress = await UserQuestionProgress.findOne({ userId: student._id, questionId });
  if (!progress || progress.status === 'active') {
    return res.status(400).json({ message: 'Solve the puzzle before entering the location code' });
  }

  const config = await GameConfig.getSingleton();
  const cooldown = codeAttemptCooldownRemaining(progress.codeAttempts, config.codeAttemptCooldownSeconds);
  if (cooldown > 0) {
    return res.status(429).json({ message: 'Slow down', retryAfterSeconds: cooldown });
  }

  if (progress.status === 'code_verified') {
    const freshStudent = await Student.findById(student._id);
    const nextQuestion = await Question.findById(freshStudent.currentQuestionId);
    return res.json({ correct: true, alreadyVerified: true, nextQuestion: toPublicQuestion(nextQuestion) });
  }

  const question = await Question.findById(questionId);
  const now = new Date();
  const normalized = normalizeText(code);
  const isCorrect = normalizeText(question.verificationCode) === normalized;

  if (!isCorrect) {
    await UserQuestionProgress.updateOne(
      { userId: student._id, questionId },
      { $push: { codeAttempts: { value: normalized, correct: false, at: now } } }
    );
    return res.json({ correct: false });
  }

  const verified = await UserQuestionProgress.findOneAndUpdate(
    { userId: student._id, questionId, status: 'answer_solved' },
    {
      $set: { status: 'code_verified', codeVerifiedAt: now },
      $push: { codeAttempts: { value: normalized, correct: true, at: now } },
    },
    { new: true }
  );

  if (!verified) {
    return res.status(409).json({ correct: false, alreadyVerified: true });
  }

  // Advance to next question
  const nextIndex = student.currentStageIndex + 1;
  // Find next question in sequence for this student
  const routeGroup = student.routeKey ? student.routeKey.split('_').slice(0, 2).join('_') : 'ROUTE_A';
  const nextQuestion = await Question.findOne({
    mapId: student.mapId,
    $or: [{ routeKey: student.routeKey }, { routeKey: routeGroup }, { routeKey: 'DEFAULT' }],
    stageIndex: nextIndex,
  });

  if (!nextQuestion) {
    return res.status(500).json({ message: 'No question configured after this stage' });
  }

  await Student.updateOne(
    { _id: student._id },
    { $set: { currentStageIndex: nextIndex, currentQuestionId: nextQuestion._id } }
  );

  await UserQuestionProgress.findOneAndUpdate(
    { userId: student._id, questionId: nextQuestion._id },
    {
      $setOnInsert: {
        userId: student._id,
        questionId: nextQuestion._id,
        stageIndex: nextIndex,
        status: 'active',
      },
    },
    { upsert: true }
  );

  const publicNext = toPublicQuestion(nextQuestion);

  if (nextQuestion.isFinalPuzzle) {
    emitters.emitFinalPuzzleUnlocked(student._id, { finalQuestion: publicNext });
    return res.json({ correct: true, finalPuzzleUnlocked: true, finalQuestion: publicNext });
  }

  emitters.emitCodeVerified(student._id, { questionId, nextQuestion: publicNext, stageIndex: nextIndex });
  res.json({ correct: true, nextQuestion: publicNext, stageIndex: nextIndex });
}

// ─── POST /api/game/hint ──────────────────────────────────────────────────────

async function useHint(req, res) {
  const { questionId, hintNumber } = req.body;
  if (!questionId || !hintNumber) {
    return res.status(400).json({ message: 'questionId and hintNumber are required' });
  }

  const student = await requireActiveStudent(req.userId);
  if (String(student.currentQuestionId) !== String(questionId)) {
    return res.status(400).json({ message: 'This question is not currently active for you' });
  }

  const question = await Question.findById(questionId);
  if (!question) return res.status(404).json({ message: 'Question not found' });

  const hint = (question.hints || []).find(h => h.hintNumber === Number(hintNumber));
  if (!hint) return res.status(404).json({ message: 'Hint not found' });

  const progress = await UserQuestionProgress.findOneAndUpdate(
    { userId: student._id, questionId, hintsUsed: { $ne: hint.hintNumber } },
    { $addToSet: { hintsUsed: hint.hintNumber } },
    { new: true }
  );

  if (!progress) {
    return res.status(409).json({ message: 'Hint already used' });
  }

  const now = new Date();
  await Promise.all([
    Student.updateOne({ _id: student._id }, { $inc: { totalHintPenaltySeconds: hint.penaltySeconds } }),
    HintUsageLog.create({
      userId: student._id,
      questionId,
      hintNumber: hint.hintNumber,
      penaltySeconds: hint.penaltySeconds,
      usedAt: now,
    }),
  ]);

  const payload = {
    questionId,
    hintNumber: hint.hintNumber,
    hintText: hint.text,
    penaltySeconds: hint.penaltySeconds,
  };
  emitters.emitHintUsed(student._id, payload);
  res.json(payload);
}

// ─── POST /api/game/bonus ─────────────────────────────────────────────────────

async function useBonus(req, res) {
  const { questionId } = req.body;
  if (!questionId) return res.status(400).json({ message: 'questionId is required' });

  const student = await requireActiveStudent(req.userId);
  if (String(student.currentQuestionId) !== String(questionId)) {
    return res.status(400).json({ message: 'This question is not currently active for you' });
  }

  const question = await Question.findById(questionId);
  if (!question || !question.bonus) {
    return res.status(400).json({ message: 'No bonus available for this question' });
  }

  const progress = await UserQuestionProgress.findOneAndUpdate(
    { userId: student._id, questionId, bonusUsed: false },
    { $set: { bonusUsed: true } },
    { new: true }
  );

  if (!progress) {
    return res.status(409).json({ message: 'Bonus already used' });
  }

  const now = new Date();
  await Promise.all([
    Student.updateOne({ _id: student._id }, { $inc: { totalBonusRewardSeconds: question.bonus.rewardSeconds } }),
    BonusUsageLog.create({
      userId: student._id,
      questionId,
      rewardSeconds: question.bonus.rewardSeconds,
      usedAt: now,
    }),
  ]);

  const payload = {
    questionId,
    rewardSeconds: question.bonus.rewardSeconds,
    description: question.bonus.description,
  };
  emitters.emitBonusUsed(student._id, payload);
  res.json(payload);
}

// ─── POST /api/game/final-answer ─────────────────────────────────────────────

async function finalAnswer(req, res) {
  const { answer } = req.body;
  if (answer === undefined) return res.status(400).json({ message: 'answer is required' });

  const student = await requireActiveStudent(req.userId);
  if (!student.currentQuestionId) {
    return res.status(400).json({ message: 'Final puzzle is not unlocked yet' });
  }

  const question = await Question.findById(student.currentQuestionId);
  if (!question || !question.isFinalPuzzle) {
    return res.status(400).json({ message: 'Final puzzle is not unlocked yet' });
  }

  const now = new Date();
  const normalized = normalizeText(answer);

  if (!answerMatches(question, answer)) {
    await UserQuestionProgress.updateOne(
      { userId: student._id, questionId: question._id },
      { $push: { answerAttempts: { value: normalized, correct: false, at: now } } }
    );
    return res.json({ correct: false });
  }

  const solved = await UserQuestionProgress.findOneAndUpdate(
    { userId: student._id, questionId: question._id, status: 'active' },
    {
      $set: { status: 'answer_solved', solvedAt: now },
      $push: { answerAttempts: { value: normalized, correct: true, at: now } },
    },
    { new: true }
  );

  if (solved) {
    await Student.updateOne({ _id: student._id }, { $set: { finalAnswerSolvedAt: now } });
  }

  emitters.emitFinalSolved(student._id, { mainGateScreen: true, mainGateCode: student.mainGateCode });
  res.json({
    correct: true,
    mainGateScreen: true,
    mainGateCode: student.mainGateCode,
    message: `Final equation solved! Run to the Main Gate and enter your secret victory code: ${student.mainGateCode}`,
  });
}

// ─── POST /api/game/maingate-code ─────────────────────────────────────────────

async function mainGateCode(req, res) {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'code is required' });

  const student = await requireActiveStudent(req.userId);

  if (student.gameStatus === 'completed') {
    const { rawTimeSeconds, adjustedTimeSeconds } = computeAdjustedTimeSeconds(student);
    const [questionsSolved, hintsUsed, bonusesUsed] = await Promise.all([
      UserQuestionProgress.countDocuments({ userId: student._id, status: { $in: ['answer_solved', 'code_verified'] } }),
      HintUsageLog.countDocuments({ userId: student._id }),
      BonusUsageLog.countDocuments({ userId: student._id }),
    ]);
    return res.json({
      correct: true,
      alreadyCompleted: true,
      completionTimeSeconds: rawTimeSeconds,
      adjustedTimeSeconds,
      questionsSolved,
      hintsUsed,
      bonusesUsed,
    });
  }

  const config = await GameConfig.getSingleton();
  const cooldown = codeAttemptCooldownRemaining(student.mainGateAttempts || [], config.codeAttemptCooldownSeconds);
  if (cooldown > 0) {
    return res.status(429).json({ message: 'Slow down', retryAfterSeconds: cooldown });
  }

  // Validate code against this student's unique personal mainGateCode
  const now = new Date();
  const normalized = normalizeText(code);
  const studentCode = student.mainGateCode ? normalizeText(student.mainGateCode) : '';
  const digitsOnlyInput = String(code).replace(/\D/g, '');
  const digitsOnlyStudent = String(student.mainGateCode || '').replace(/\D/g, '');

  const isCorrect = (studentCode && normalized === studentCode) || (digitsOnlyStudent && digitsOnlyInput === digitsOnlyStudent);

  if (!isCorrect) {
    return res.json({ correct: false, message: 'Invalid Main Gate code' });
  }

  const completed = await Student.findOneAndUpdate(
    { _id: student._id, gameStatus: { $ne: 'completed' } },
    { $set: { gameStatus: 'completed', completedAt: now } },
    { new: true }
  );

  if (!completed) {
    return mainGateCode(req, res);
  }

  const { rawTimeSeconds, adjustedTimeSeconds } = computeAdjustedTimeSeconds({
    startedAt: completed.startedAt,
    completedAt: completed.completedAt,
    totalHintPenaltySeconds: completed.totalHintPenaltySeconds,
    totalBonusRewardSeconds: completed.totalBonusRewardSeconds,
  });

  const [questionsSolved, hintsUsed, bonusesUsed] = await Promise.all([
    UserQuestionProgress.countDocuments({ userId: student._id, status: { $in: ['answer_solved', 'code_verified'] } }),
    HintUsageLog.countDocuments({ userId: student._id }),
    BonusUsageLog.countDocuments({ userId: student._id }),
  ]);

  emitters.emitGameCompleted(student._id, { completedAt: now, completionTimeSeconds: rawTimeSeconds, adjustedTimeSeconds });

  res.json({ correct: true, completionTimeSeconds: rawTimeSeconds, adjustedTimeSeconds, questionsSolved, hintsUsed, bonusesUsed });
}

module.exports = {
  getMe,
  startGame,
  submitAnswer,
  verifyCode,
  useHint,
  useBonus,
  finalAnswer,
  mainGateCode,
};
