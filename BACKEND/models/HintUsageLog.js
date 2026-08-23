const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Append-only log of every hint used.
 * References Student instead of Team.
 */
const hintUsageLogSchema = new Schema(
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
    hintNumber: {
      type: Number,
      required: true,
    },
    penaltySeconds: {
      type: Number,
      required: true,
      default: 0,
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

hintUsageLogSchema.index({ userId: 1, questionId: 1, hintNumber: 1 });

module.exports = mongoose.model('HintUsageLog', hintUsageLogSchema);
