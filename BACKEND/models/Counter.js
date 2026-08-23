const mongoose = require('mongoose');

/**
 * Atomic sequence counter.
 * Usage: Counter.nextValue('studentUserNumber') → 100001, 100002, …
 */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },   // e.g. 'studentUserNumber'
  seq: { type: Number, default: 0 },
});

/**
 * Atomically increment and return the next value.
 * findOneAndUpdate with $inc is a single round-trip; MongoDB guarantees
 * no two callers receive the same returned value.
 */
counterSchema.statics.nextValue = async function (name) {
  const doc = await this.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return doc.seq;
};

module.exports = mongoose.model('Counter', counterSchema);
