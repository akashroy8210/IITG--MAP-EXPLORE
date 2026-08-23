const Counter = require('../models/Counter');

const COUNTER_NAME = 'studentUserNumber';
const START_VALUE = 100000; // first student gets 100001

/**
 * Ensure the counter document exists starting from START_VALUE.
 * Call once at server startup (or on first use — upsert handles it).
 */
async function ensureCounter() {
  const Counter = require('../models/Counter');
  await Counter.findOneAndUpdate(
    { _id: COUNTER_NAME },
    { $setOnInsert: { seq: START_VALUE } },
    { upsert: true }
  );
}

/**
 * Atomically get the next user number.
 * Returns a number like 100001, 100002, …
 */
async function nextUserNumber() {
  const value = await Counter.nextValue(COUNTER_NAME);
  // If counter was just created at 0 by nextValue, nudge it up past START_VALUE.
  // But since ensureCounter sets seq=100000 first, first increment → 100001.
  return value < START_VALUE + 1 ? START_VALUE + 1 : value;
}

module.exports = { nextUserNumber, ensureCounter };
