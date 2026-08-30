const Student = require('../models/Student');
const UserQuestionProgress = require('../models/UserQuestionProgress');

/**
 * GET /api/admin/leaderboard
 * Computes live leaderboard with question solving progress, verifications,
 * timer breakdowns, and overall rank.
 */
async function getLeaderboard(req, res) {
  try {
    const students = await Student.find({})
      .populate('mapId', 'name mapNumber')
      .populate('setsKey')
      .lean();

    const progressDocs = await UserQuestionProgress.find({}).lean();

    // Map of userId -> progress records
    const progressMap = {};
    for (const p of progressDocs) {
      const uId = String(p.userId);
      if (!progressMap[uId]) progressMap[uId] = [];
      progressMap[uId].push(p);
    }

    const leaderboard = students.map((student) => {
      const uId = String(student._id);
      const studentProgress = progressMap[uId] || [];

      // Total questions in student's set
      let totalQuestions = 0;
      if (student.setsKey && Array.isArray(student.setsKey.questions)) {
        totalQuestions = student.setsKey.questions.length;
      }

      // Count answered & location verified
      const answersSolvedCount = studentProgress.filter(
        (p) => p.status === 'answer_solved' || p.status === 'location_verified'
      ).length;

      const locationsVerifiedCount = studentProgress.filter(
        (p) => p.status === 'location_verified'
      ).length;

      // Calculate time
      let rawTimeSeconds = 0;
      let adjustedTimeSeconds = 0;
      if (student.startedAt) {
        const start = new Date(student.startedAt).getTime();
        const end = student.completedAt ? new Date(student.completedAt).getTime() : Date.now();
        rawTimeSeconds = Math.max(0, Math.floor((end - start) / 1000));
        adjustedTimeSeconds = Math.max(0, rawTimeSeconds + (student.totalHintPenaltySeconds || 0));
      }

      // If game is completed, all questions are solved & verified
      const isCompleted = student.gameStatus === 'completed';
      const finalAnswersSolved = isCompleted && totalQuestions > 0 ? totalQuestions : answersSolvedCount;
      const finalLocationsVerified = isCompleted && totalQuestions > 0 ? totalQuestions : locationsVerifiedCount;

      return {
        _id: student._id,
        userNumber: student.userNumber,
        name: student.name,
        username: student.username,
        email: student.email,
        gameStatus: student.gameStatus,
        startedAt: student.startedAt,
        completedAt: student.completedAt,
        map: student.mapId ? { id: student.mapId._id, name: student.mapId.name } : null,
        setsKey: student.setsKey ? student.setsKey.setsKey : null,
        totalHintPenaltySeconds: student.totalHintPenaltySeconds || 0,
        rawTimeSeconds,
        adjustedTimeSeconds,
        answersSolved: finalAnswersSolved,
        locationsVerified: finalLocationsVerified,
        totalQuestions,
        currentQuestionId: student.currentQuestionId,
      };
    });

    // Filter only started students for rankings calculation
    const started = leaderboard.filter((s) => s.gameStatus !== 'not_started');

    started.sort((a, b) => {
      // 1. Completed first
      const aDone = a.gameStatus === 'completed' ? 0 : 1;
      const bDone = b.gameStatus === 'completed' ? 0 : 1;
      if (aDone !== bDone) return aDone - bDone;

      // 2. More questions solved first
      const qDiff = b.answersSolved - a.answersSolved;
      if (qDiff !== 0) return qDiff;

      // 3. Less time taken first (adjusted time ascending)
      return a.adjustedTimeSeconds - b.adjustedTimeSeconds;
    });

    // Assign rank
    started.forEach((s, idx) => {
      s.rank = idx + 1;
    });

    res.json({
      leaderboard: started,
      allStudentsCount: leaderboard.length,
      startedCount: started.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * GET /api/admin/students-progress
 * Returns detailed student-wise progress for each assigned question,
 * including game start time, end time, and solvedAt / verifiedAt timestamps.
 */
async function getStudentQuestionProgress(req, res) {
  try {
    const students = await Student.find({})
      .populate('mapId', 'name mapNumber')
      .populate({
        path: 'setsKey',
        populate: {
          path: 'questions',
          select: 'Question nextLocationHint isFirstPuzzle isFinalPuzzle',
        },
      })
      .lean();

    const progressDocs = await UserQuestionProgress.find({}).lean();

    // Map of userId -> questionId -> progressDoc
    const progressMap = {};
    for (const p of progressDocs) {
      const uId = String(p.userId);
      const qId = String(p.questionId);
      if (!progressMap[uId]) progressMap[uId] = {};
      progressMap[uId][qId] = p;
    }

    const studentsProgress = students.map((student) => {
      const uId = String(student._id);
      const userProgMap = progressMap[uId] || {};

      let questionsList = [];
      if (student.setsKey && Array.isArray(student.setsKey.questions)) {
        questionsList = student.setsKey.questions;
      }

      const questionBreakdown = questionsList.map((q, idx) => {
        const qId = String(q._id || q);
        const p = userProgMap[qId];

        const isCompleted = student.gameStatus === 'completed';

        let status = p ? p.status : 'unsolved';
        let solvedAt = p ? p.solvedAt : null;
        let verifiedAt = p ? p.verifiedAt : null;

        if (isCompleted) {
          status = 'location_verified';
          if (!solvedAt && student.completedAt) solvedAt = student.completedAt;
          if (!verifiedAt && student.completedAt) verifiedAt = student.completedAt;
        }

        return {
          sequence: idx + 1,
          questionId: qId,
          questionText: q.Question || Question #,
          isFirstPuzzle: Boolean(q.isFirstPuzzle),
          isFinalPuzzle: Boolean(q.isFinalPuzzle),
          status,
          solvedAt,
          verifiedAt,
          hintsUsed: p ? Boolean(p.hintsUsed) : false,
          answerAttemptsCount: p && Array.isArray(p.answerAttempts) ? p.answerAttempts.length : 0,
          codeAttemptsCount: p && Array.isArray(p.codeAttempts) ? p.codeAttempts.length : 0,
        };
      });

      const totalQuestions = questionBreakdown.length;
      const solvedCount = questionBreakdown.filter(
        (q) => q.status === 'answer_solved' || q.status === 'location_verified'
      ).length;
      const verifiedCount = questionBreakdown.filter((q) => q.status === 'location_verified').length;

      return {
        _id: student._id,
        userNumber: student.userNumber,
        name: student.name,
        username: student.username,
        email: student.email,
        gameStatus: student.gameStatus,
        startedAt: student.startedAt,
        completedAt: student.completedAt,
        map: student.mapId ? { id: student.mapId._id, name: student.mapId.name } : null,
        setsKey: student.setsKey ? student.setsKey.setsKey : null,
        totalQuestions,
        solvedCount,
        verifiedCount,
        questions: questionBreakdown,
      };
    });

    res.json({
      students: studentsProgress,
      totalCount: studentsProgress.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { getLeaderboard, getStudentQuestionProgress };
