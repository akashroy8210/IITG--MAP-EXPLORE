const mongoose = require('mongoose');

const setsSchema = new mongoose.Schema(
  {
    setsKey: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sets', setsSchema);