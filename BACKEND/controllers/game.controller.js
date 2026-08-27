const Student = require('../models/Student');
const Question = require('../models/Question');
const Sets = require('../models/Sets.model');
const UserQuestionProgress = require('../models/UserQuestionProgress');
const { normalizeText } = require('../utils/normalize');
const { computeAdjustedTimeSeconds } = require('../utils/scoring');
const { buildUserState, toPublicQuestion } = require('../utils/stateBuilder');
const emitters = require('../sockets/emitters');
const crypto = require("crypto");
const GameSession = require("../models/GameSession.js");

function answerMatches(question, submitted) {
  const normalized = normalizeText(submitted);
  const candidates = (question.answer || []).map(normalizeText);
  return candidates.includes(normalized);
}

/**
 * Generate a random 4-digit numeric verification code
 */
function generateNumericCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

async function requireActiveStudent(userId) {
  const student = await Student.findById(userId).populate('setsKey');
  if (!student) {
    const err = new Error('Student not found');
    err.status = 404;
    throw err;
  }
  return student;
}

// ─── GET /api/student/me & GET /api/game/state ─────────────────────────────────

async function getMe(req, res) {
  const state = await buildUserState(req.userId);
  if (!state) return res.status(404).json({ message: 'Student not found' });
  res.json(state);
}

// ─── POST /api/game/start ─────────────────────────────────────────────────────

async function startGame(req, res) {
  console.log("inStartgame")
  const student = await requireActiveStudent(req.userId);

  const sessionId = crypto.randomUUID();

    await GameSession.create({
      sessionId,
      student: student._id,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      active: true,
    });

  // Idempotent start: if already started, resume without resetting timer
  if (student.gameStatus !== 'not_started') {
    const state = await buildUserState(student._id);
    return res.json({...state,sessionId});
  }

  if (!student.setsKey || !student.setsKey.questions || student.setsKey.questions.length === 0) {
    return res.status(400).json({
      message: 'No question set assigned to your account. Please contact an administrator.',
    });
  }

  const firstQuestionId = student.setsKey.questions[0]._id || student.setsKey.questions[0];
  const now = new Date();

  student.gameStatus = 'in_progress';
  student.startedAt = now;
  student.currentQuestionId = firstQuestionId;
  await student.save();

  // Initialize progress with an auto-generated unique verification code for this student
  const uniqueCode = generateNumericCode();
  await UserQuestionProgress.findOneAndUpdate(
    { userId: student._id, questionId: firstQuestionId },
    {
      $setOnInsert: {
        userId: student._id,
        questionId: firstQuestionId,
        status: 'unsolved',
        verificationCode: uniqueCode,
      },
    },
    { upsert: true }
  );

  const firstQuestion = toPublicQuestion(await Question.findById(firstQuestionId));
  emitters.emitGameStarted(student._id, { startedAt: now, firstQuestion });

    
  const state = await buildUserState(student._id);
  res.json({
    ...state,
    sessionId,
  });
}

// ─── POST /api/game/answer ────────────────────────────────────────────────────

async function submitAnswer(req, res) {
  const { questionId, answer } = req.body;
  console.log("hi-1")
  console.log(questionId, answer);
  if (!questionId || answer === undefined) {
    return res.status(400).json({ message: 'questionId and answer are required' });
  }
  console.log("hi0")

  const student = await requireActiveStudent(req.userId);
  console.log(student);
  if (student.gameStatus !== 'in_progress' || String(student.currentQuestionId) !== String(questionId)) {
    return res.status(400).json({ message: 'This question is not currently active for you' });
  }
  console.log("hi1");
  const question = await Question.findById(questionId);
  if (!question) return res.status(404).json({ message: 'Question not found' });
  console.log("hi2")
  const now = new Date();
  const normalized = normalizeText(answer);
  console.log(question);
  if (!answerMatches(question, answer)) {
    await UserQuestionProgress.updateOne(
      { userId: student._id, questionId },
      { $push: { answerAttempts: { answer: [normalized], isCorrect: false, attemptedAt: now } } }
    );
    emitters.emitAnswerRejected(student._id, { questionId });
    return res.json({ correct: false, message: 'Incorrect answer. Try again!' });
  }
  console.log("hi3")

  // Ensure unique verificationCode exists on student's progress
  let progress = await UserQuestionProgress.findOne({ userId: student._id, questionId });
  let userVerificationCode = progress?.verificationCode;
  if (!userVerificationCode && !question.isFinalPuzzle) {
    userVerificationCode = generateNumericCode();
  }
  console.log(student);
  const result = await UserQuestionProgress.findOneAndUpdate(
    { userId: student._id, questionId, status: 'unsolved' },
    {
      $set: {
        status: 'answer_solved',
        solvedAt: now,
        verificationCode: userVerificationCode,
      },
      $push: { answerAttempts: { answer: [normalized], isCorrect: true, attemptedAt: now } },
    },
    { new: true }
  );
   console.log(result);
  if (!result) {
    return res.json({
      correct: true,
      alreadySolved: true,
      verificationCode: progress?.verificationCode,
    });
  }
  console.log("hi5");
  if (question.isFinalPuzzle) {
    await Student.updateOne({ _id: student._id }, { $set: { finalAnswerSolvedAt: now } });
    emitters.emitFinalSolved(student._id, { mainGateScreen: true });
    return res.json({
      correct: true,
      isFinalPuzzle: true,
      mainGateScreen: true,
      mainGateCode: student.mainGateCode,
      message: 'Final puzzle solved! Enter your Main Gate code to complete the quest.',
    });
  }

  emitters.emitAnswerSolved(student._id, { questionId });
 
  res.json({
    correct: true,
    status: 'answer_solved',
    nextLocationHint: question.nextLocationHint,
    verificationCode: userVerificationCode, // Unique automatically generated code for this specific student!
    message: 'Answer correct! Go to the location to find and verify the code.',
  });
}

// ─── POST /api/game/verify-code ───────────────────────────────────────────────

async function verifyCode(req, res) {
  const { questionId, code } = req.body;
  console.log("verify-1");
  if (!questionId || !code) {
    return res.status(400).json({ message: 'questionId and code are required' });
  }

  const student = await requireActiveStudent(req.userId);

    if (student.gameStatus !== 'in_progress' || String(student.currentQuestionId) !== String(questionId)) {
    return res.status(400).json({ message: 'This question is not currently active for you' });
  }
console.log("verify1");
  const progress = await UserQuestionProgress.findOne({ userId: student._id, questionId });
  console.log(progress);
  if (!progress || progress.status === 'unsolved') {
    return res.status(400).json({ message: 'Solve the question first before entering the location code' });
  }
console.log("verify2");
  if (progress.status === 'location_verified') {
    const nextQuestion = await Question.findById(student.currentQuestionId);
    return res.json({ correct: true, alreadyVerified: true, nextQuestion: toPublicQuestion(nextQuestion) });
  }
console.log("verify3");
  const now = new Date();
  const normalizedInput = normalizeText(code);
  // Verify against this student's unique generated verificationCode
  const expectedCode = normalizeText(progress.verificationCode || '');
  console.log(expectedCode);
  const isCorrect = expectedCode && normalizedInput === expectedCode;

  if (!isCorrect) {
    await UserQuestionProgress.updateOne(
      { userId: student._id, questionId },
      { $push: { codeAttempts: { code: normalizedInput, isCorrect: false, attemptedAt: now } } }
    );
    return res.json({
      correct: false,
      message: 'Incorrect location code. Please check your unique code and try again.',
    });
  }
console.log("verify4");
  await UserQuestionProgress.updateOne(
    { userId: student._id, questionId },
    {
      $set: { status: 'location_verified', verifiedAt: now },
      $push: { codeAttempts: { code: normalizedInput, isCorrect: true, attemptedAt: now } },
    }
  );

  // Advance to next question in student's assigned Sets sequence
  const setDoc = student.setsKey;
  const questionsList = setDoc.questions || [];
  const currentIdx = questionsList.findIndex((qId) => String(qId._id || qId) === String(questionId));
  const nextIdx = currentIdx + 1;

  if (nextIdx < questionsList.length) {
    const nextQuestionId = questionsList[nextIdx]._id || questionsList[nextIdx];
    await Student.updateOne(
      { _id: student._id },
      { $set: { currentQuestionId: nextQuestionId } }
    );

    // Initialize progress for the next question with a new unique code
    const nextUniqueCode = generateNumericCode();
    await UserQuestionProgress.findOneAndUpdate(
      { userId: student._id, questionId: nextQuestionId },
      {
        $setOnInsert: {
          userId: student._id,
          questionId: nextQuestionId,
          status: 'unsolved',
        },
      },
      { upsert: true }
    );

    const nextQuestion = await Question.findById(nextQuestionId);
    const publicNext = toPublicQuestion(nextQuestion);

    emitters.emitCodeVerified(student._id, { questionId, nextQuestion: publicNext, stageIndex: nextIdx });
    return res.json({ correct: true, status: 'location_verified', nextQuestion: publicNext });
  }
console.log("verify5");
  res.json({ correct: true, status: 'location_verified', allStagesComplete: true });
}

// ─── POST /api/game/hint ──────────────────────────────────────────────────────

async function useHint(req, res) {
  const { questionId } = req.body;
  if (!questionId) {
    return res.status(400).json({ message: 'questionId is required' });
  }

  const student = await requireActiveStudent(req.userId);
  if (String(student.currentQuestionId) !== String(questionId)) {
    return res.status(400).json({ message: 'Hints can only be used on your active question' });
  }

  const question = await Question.findById(questionId);
  if (!question || !question.hints) {
    return res.status(404).json({ message: 'No hint configured for this question' });
  }

  const progress = await UserQuestionProgress.findOne({ userId: student._id, questionId });
  if (progress && progress.status !== 'unsolved') {
    return res.status(400).json({ message: 'Cannot use hint on an already solved question' });
  }

  const penalty = question.hints.penaltySeconds || 30;

  if (!progress || !progress.hintsUsed) {
    await Promise.all([
      UserQuestionProgress.updateOne(
        { userId: student._id, questionId },
        { $set: { hintsUsed: true } },
        { upsert: true }
      ),
      Student.updateOne(
        { _id: student._id },
        { $inc: { totalHintPenaltySeconds: penalty } }
      ),
    ]);
  }

  emitters.emitHintUsed(student._id, { questionId, penaltySeconds: penalty });

  res.json({
    success: true,
    hintText: question.hints.text,
    penaltySeconds: penalty,
  });
}

// ─── POST /api/game/final-answer ──────────────────────────────────────────────

async function finalAnswer(req, res) {
  return submitAnswer(req, res);
}

// ─── POST /api/game/maingate-code ─────────────────────────────────────────────

async function mainGateCode(req, res) {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'code is required' });

  const student = await requireActiveStudent(req.userId);

  if (student.gameStatus === 'completed') {
    const { rawTimeSeconds, adjustedTimeSeconds } = computeAdjustedTimeSeconds(student);
    return res.json({
      correct: true,
      alreadyCompleted: true,
      completionTimeSeconds: rawTimeSeconds,
      adjustedTimeSeconds,
    });
  }

  if (!student.finalAnswerSolvedAt) {
    return res.status(400).json({ message: 'Solve the final puzzle equation before Main Gate verification' });
  }

  const now = new Date();
  const normalizedInput = normalizeText(code);
  const expectedCode = normalizeText(student.mainGateCode || '');
  const digitsOnlyInput = String(code).replace(/\D/g, '');
  const digitsOnlyExpected = String(student.mainGateCode || '').replace(/\D/g, '');

  const isCorrect = normalizedInput === expectedCode || (digitsOnlyExpected && digitsOnlyInput === digitsOnlyExpected);

  if (!isCorrect) {
    return res.json({ correct: false, message: 'Invalid Main Gate code' });
  }

  student.gameStatus = 'completed';
  student.completedAt = now;
  await student.save();

  const { rawTimeSeconds, adjustedTimeSeconds } = computeAdjustedTimeSeconds({
    startedAt: student.startedAt,
    completedAt: student.completedAt,
    totalHintPenaltySeconds: student.totalHintPenaltySeconds,
  });

  emitters.emitGameCompleted(student._id, {
    completedAt: now,
    completionTimeSeconds: rawTimeSeconds,
    adjustedTimeSeconds,
  });

  res.json({
    correct: true,
    gameCompleted: true,
    completionTimeSeconds: rawTimeSeconds,
    adjustedTimeSeconds,
  });
}

module.exports = {
  getMe,
  startGame,
  submitAnswer,
  verifyCode,
  useHint,
  finalAnswer,
  mainGateCode,
};
