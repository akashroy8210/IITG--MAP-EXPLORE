const mongoose = require('mongoose');
const { Schema } = mongoose;

const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 100000 },
});

counterSchema.statics.nextValue = async function (counterName) {
  const counter = await this.findOneAndUpdate(
    { _id: counterName },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  return counter.seq;
};

module.exports = mongoose.model('Counter', counterSchema);
