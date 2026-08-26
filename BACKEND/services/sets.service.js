const Sets = require('../models/Sets.model');
const Question = require('../models/Question');
const Student = require('../models/Student');

/**
 * Fisher-Yates shuffle helper
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate predefined sets:
 *  - First question: ALWAYS identical for all sets.
 *  - Middle questions: randomly selected and permuted per set from active pool.
 *  - Final question: ALWAYS identical for all sets (isFinalPuzzle: true).
 */
async function generatePredefinedSets({ numberOfSets = 5, middleQuestionsCount = 3 }) {
  // 1. Locate First Question
  let firstQuestion = await Question.findOne({ isFirstPuzzle: true, isActive: true });
  if (!firstQuestion) {
    firstQuestion = await Question.findOne({ isFinalPuzzle: false, isActive: true }).sort({ createdAt: 1 });
  }
  if (!firstQuestion) {
    throw new Error('No active questions found to designate as the first question.');
  }

  // 2. Locate Final Question
  let finalQuestion = await Question.findOne({ isFinalPuzzle: true, isActive: true });
  if (!finalQuestion) {
    finalQuestion = await Question.findOne({ _id: { $ne: firstQuestion._id }, isActive: true }).sort({ createdAt: -1 });
  }
  if (!finalQuestion) {
    throw new Error('No active question found to designate as the final question.');
  }

  // 3. Locate Middle Question Pool (excluding first & final)
  const middlePool = await Question.find({
    _id: { $nin: [firstQuestion._id, finalQuestion._id] },
    isActive: true,
  });

  const actualMiddleCount = Math.min(middleQuestionsCount, middlePool.length);

  const generatedSets = [];

  for (let i = 1; i <= numberOfSets; i++) {
    const setsKey = `SET_${String(i).padStart(2, '0')}`;
    
    // Pick and shuffle middle questions
    const shuffledPool = shuffleArray(middlePool);
    const selectedMiddle = shuffledPool.slice(0, actualMiddleCount).map((q) => q._id);

    const questionSequence = [firstQuestion._id, ...selectedMiddle, finalQuestion._id];

    const setDoc = await Sets.findOneAndUpdate(
      { setsKey },
      {
        $set: {
          setsKey,
          questions: questionSequence,
        },
      },
      { upsert: true, returnDocument: 'after' }
    ).populate('questions');

    generatedSets.push(setDoc);
  }

  return generatedSets;
}

/**
 * Assign Sets round-robin to students who don't have setsKey assigned yet,
 * or re-assign all students who haven't started playing.
 */
async function assignSetsRoundRobin() {
  const sets = await Sets.find({}).sort({ setsKey: 1 });
  if (sets.length === 0) {
    throw new Error('No sets available. Please generate sets first.');
  }

  const students = await Student.find({ gameStatus: 'not_started' }).sort({ userNumber: 1 });
  let assignedCount = 0;

  for (let i = 0; i < students.length; i++) {
    const assignedSet = sets[i % sets.length];
    await Student.updateOne(
      { _id: students[i]._id },
      { $set: { setsKey: assignedSet._id } }
    );
    assignedCount++;
  }

  return { totalStudents: students.length, assignedCount };
}

module.exports = {
  generatePredefinedSets,
  assignSetsRoundRobin,
};
