const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Append-only audit log of every bonus used across the event.
 * References Student instead of Team.
 */
const bonusUsageLogSchema = new Schema(
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
    rewardSeconds: {
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

bonusUsageLogSchema.index({ userId: 1, questionId: 1 });

module.exports = mongoose.model('BonusUsageLog', bonusUsageLogSchema);
