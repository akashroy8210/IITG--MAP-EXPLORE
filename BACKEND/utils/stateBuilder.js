const Student = require('../models/Student');
const Question = require('../models/Question');
const Sets = require('../models/Sets.model');
const UserQuestionProgress = require('../models/UserQuestionProgress');
const { computeAdjustedTimeSeconds } = require('./scoring');

/**
 * Sanitizes a Question document for client delivery.
 * Strips secret fields: `answer` and `verificationCode`.
 */
function toPublicQuestion(question) {
  if (!question) return null;
  return {
    id: question._id,
    Question: question.Question,
    QuestionAssets: question.QuestionAssets || [],
    nextLocationHint: question.nextLocationHint,
    hints: question.hints
      ? {
          text: question.hints.text,
          penaltySeconds: question.hints.penaltySeconds,
        }
      : null,
    isFirstPuzzle: question.isFirstPuzzle || false,
    isFinalPuzzle: question.isFinalPuzzle || false,
  };
}

/**
 * Compiles a student's full real-time game session state.
 */
async function buildUserState(userId) {
  const student = await Student.findById(userId)
    .populate('mapId', 'name mapNumber mapUrl')
    .populate('setsKey');

  if (!student) return null;

  const [currentQuestion, progressList] = await Promise.all([
    student.currentQuestionId ? Question.findById(student.currentQuestionId) : null,
    UserQuestionProgress.find({ userId: student._id }).lean(),
  ]);

  const { rawTimeSeconds, adjustedTimeSeconds } = computeAdjustedTimeSeconds({
    startedAt: student.startedAt,
    completedAt: student.completedAt,
    totalHintPenaltySeconds: student.totalHintPenaltySeconds,
  });

  const currentProgress = progressList.find(
    (p) => String(p.questionId) === String(student.currentQuestionId)
  );

  let currentStageIndex = 0;
  let totalStages = 0;
  if (student.setsKey && Array.isArray(student.setsKey.questions)) {
    totalStages = student.setsKey.questions.length;
    const foundIdx = student.setsKey.questions.findIndex(
      (qId) => String(qId._id || qId) === String(student.currentQuestionId)
    );
    if (foundIdx !== -1) {
      currentStageIndex = foundIdx;
    }
  }

  return {
    student: {
      id: student._id,
      userNumber: student.userNumber,
      username: student.username,
      name: student.name,
      email: student.email,
      status: student.status,
      map: student.mapId
        ? {
            id: student.mapId._id,
            name: student.mapId.name,
            mapNumber: student.mapId.mapNumber,
            mapUrl: student.mapId.mapUrl,
          }
        : null,
      setsKey: student.setsKey ? student.setsKey.setsKey || student.setsKey : null,
    },
    game: {
      status: student.gameStatus,
      startedAt: student.startedAt,
      completedAt: student.completedAt,
      currentStageIndex,
      totalStages,
      currentQuestion: toPublicQuestion(currentQuestion),
      currentQuestionStatus: currentProgress ? currentProgress.status : 'unsolved',
      hintsUsed: currentProgress ? Boolean(currentProgress.hintsUsed) : false,
      elapsedSeconds: rawTimeSeconds,
      adjustedTimeSeconds,
      stagesCompleted: progressList.filter((p) => p.status === 'location_verified').length,
      finalAnswerSolved: Boolean(student.finalAnswerSolvedAt),
    },
  };
}

module.exports = { buildUserState, toPublicQuestion };
