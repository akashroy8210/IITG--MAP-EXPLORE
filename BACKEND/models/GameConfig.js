const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Singleton document for event-wide settings. Always fetch/update via
 * GameConfig.getSingleton() below so there is never more than one row.
 */
const gameConfigSchema = new Schema(
  {
    // Optional synchronized "doors open" moment before teams may press START.
    officialStartTime: {
      type: Date,
      default: null,
    },
    isRegistrationLocked: {
      type: Boolean,
      default: false,
    },
    // Fallback penalty if a hint subdocument omits its own penaltySeconds.
    defaultHintPenaltySeconds: {
      type: Number,
      default: 30,
    },
    // Anti-brute-force throttle on /api/game/verify-code and /api/game/maingate-code.
    codeAttemptCooldownSeconds: {
      type: Number,
      default: 3,
    },
  },
  { timestamps: true }
);

const SINGLETON_ID = "game_config_singleton";

gameConfigSchema.statics.getSingleton = async function () {
  let config = await this.findById(SINGLETON_ID);
  if (!config) {
    config = await this.create({ _id: SINGLETON_ID });
  }
  return config;
};

module.exports = mongoose.model("GameConfig", gameConfigSchema);
