const Student = require('../models/Student');
const Question = require('../models/Question');
const UserQuestionProgress = require('../models/UserQuestionProgress');

// Strip server-only fields before sending question to client
function toPublicQuestion(question) {
  if (!question) return null;
  return {
    _id: question._id,
    stageIndex: question.stageIndex,
    type: question.type,
    promptText: question.promptText,
    promptAssets: question.promptAssets,
    isFinalPuzzle: question.isFinalPuzzle,
    bonus: question.bonus
      ? { description: question.bonus.description, rewardSeconds: question.bonus.rewardSeconds }
      : null,
  };
}

/**
 * Build the full state object for a student.
 * Used by GET /api/student/me and the state_sync socket event.
 */
async function buildUserState(userId) {
  const student = await Student.findById(userId).populate('mapId', 'name mapUrl mapNumber');
  if (!student) return null;

  let currentQuestion = null;
  let hintsAvailable = [];
  let bonusAvailable = false;

  if (student.currentQuestionId && student.gameStatus === 'in_progress') {
    const [question, progress] = await Promise.all([
      Question.findById(student.currentQuestionId),
      UserQuestionProgress.findOne({ userId: student._id, questionId: student.currentQuestionId }),
    ]);

    if (question) {
      currentQuestion = toPublicQuestion(question);
      const usedHints = new Set(progress?.hintsUsed || []);
      hintsAvailable = (question.hints || []).map(h => ({
        hintNumber: h.hintNumber,
        penaltySeconds: h.penaltySeconds,
        used: usedHints.has(h.hintNumber),
      }));
      bonusAvailable = !!question.bonus && !progress?.bonusUsed;
    }
  }

  return {
    userId: student._id,
    userNumber: student.userNumber,
    username: student.username,
    name: student.name,
    status: student.status,
    map: student.mapId
      ? {
          id: student.mapId._id,
          name: student.mapId.name,
          mapUrl: student.mapId.mapUrl,
          mapNumber: student.mapId.mapNumber,
        }
      : null,
    routeKey: student.routeKey,
    gameStatus: student.gameStatus,
    startedAt: student.startedAt,
    completedAt: student.completedAt,
    currentStageIndex: student.currentStageIndex,
    currentQuestion,
    hintsAvailable,
    bonusAvailable,
    totalHintPenaltySeconds: student.totalHintPenaltySeconds,
    totalBonusRewardSeconds: student.totalBonusRewardSeconds,
  };
}

module.exports = { buildUserState, toPublicQuestion };
