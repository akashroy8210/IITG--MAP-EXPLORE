const mongoose = require('mongoose');
const { Schema } = mongoose;

const attemptSchema = new Schema(
  {
    answer: [
      {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
    ],
    isCorrect: { type: Boolean, required: true },
    attemptedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PROGRESS_STATUS = ['unsolved', 'answer_solved', 'location_verified'];

/**
 * User Question Progress
 * One record per (student, question).
 * Lifecycle: unsolved -> answer_solved -> location_verified
 * Each student has an auto-generated unique verificationCode per question.
 */
const userQuestionProgressSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: PROGRESS_STATUS,
      default: 'unsolved',
    },
    // Auto-generated unique numeric location verification code for this specific student
    verificationCode: {
      type: String,
      default: null,
      trim: true,
    },
    answerAttempts: { type: [attemptSchema], default: [] },
    codeAttempts: [
      {
        code: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
        attemptedAt: { type: Date, default: Date.now },
      },
    ],
    solvedAt: { type: Date, default: null },
    verifiedAt: { type: Date, default: null },
    hintsUsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userQuestionProgressSchema.index({ userId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model('UserQuestionProgress', userQuestionProgressSchema);
module.exports.PROGRESS_STATUS = PROGRESS_STATUS;
