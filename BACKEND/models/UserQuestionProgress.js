const mongoose = require('mongoose');
const { Schema } = mongoose;

const attemptSchema = new Schema(
  {
    value: { type: String, required: true },
    correct: { type: Boolean, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PROGRESS_STATUS = ['active', 'answer_solved', 'code_verified'];

/**
 * One row per (student, question) — the append-only ledger of what happened
 * at each stage. Unique compound index on (userId, questionId) ensures atomic
 * answer/code submissions.
 */
const userQuestionProgressSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    stageIndex: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: PROGRESS_STATUS,
      default: 'active',
    },
    answerAttempts: { type: [attemptSchema], default: [] },
    solvedAt: { type: Date, default: null },
    codeAttempts: { type: [attemptSchema], default: [] },
    codeVerifiedAt: { type: Date, default: null },
    hintsUsed: { type: [Number], default: [] },
    bonusUsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userQuestionProgressSchema.index({ userId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model('UserQuestionProgress', userQuestionProgressSchema);
module.exports.PROGRESS_STATUS = PROGRESS_STATUS;
