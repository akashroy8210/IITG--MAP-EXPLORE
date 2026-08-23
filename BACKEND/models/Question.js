const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * A single hint that can be revealed for a question.
 */
const hintSchema = new Schema(
  {
    hintNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    text: {
      type: String,
      required: true,
    },
    penaltySeconds: {
      type: Number,
      required: true,
      default: 30,
      min: 0,
    },
  },
  { _id: false }
);

/**
 * Optional bonus opportunity attached to a question.
 */
const bonusSchema = new Schema(
  {
    description: {
      type: String,
      required: true,
    },
    rewardSeconds: {
      type: Number,
      required: true,
      min: 0,
    },
    maxUses: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
  },
  { _id: false }
);

/**
 * All puzzles are pre-created before the event - nothing here is
 * generated dynamically during the game.
 */
const questionSchema = new Schema(
  {
    // Position in the sequence for this team's route (0 = first question after start).
    stageIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    mapId: {
      type: Schema.Types.ObjectId,
      ref: "Map",
      required: true,
    },
    routeKey: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["location", "final"],
      default: "location",
    },

    promptText: {
      type: String,
      required: true,
    },
    promptAssets: [
      {
        type: String, // image / audio URLs
      },
    ],

    // Normalized (lowercase + trimmed) expected answer.
    answer: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    answerAcceptVariants: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // Internal reference only - never sent to the client.
    locationName: {
      type: String,
      default: null,
    },
    // Code found at the physical/Gather location. Null for the final puzzle.
    verificationCode: {
      type: String,
      default: null,
      trim: true,
    },

    hints: {
      type: [hintSchema],
      default: [],
    },
    bonus: {
      type: bonusSchema,
      default: null,
    },

    isFinalPuzzle: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

questionSchema.index({ mapId: 1, routeKey: 1, stageIndex: 1 }, { unique: true });

module.exports = mongoose.model("Question", questionSchema);
