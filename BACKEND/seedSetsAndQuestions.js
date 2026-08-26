require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Map = require('./models/Map');
const Question = require('./models/Question');
const Sets = require('./models/Sets.model');
const { generatePredefinedSets, assignSetsRoundRobin } = require('./services/sets.service');

const QUESTIONS_DATA = [
  {
    Question: 'Find all 4 parts of the telescope image hidden across campus. Guess the object!',
    QuestionAssets: [],
    answer: ['telescope', 'a telescope', 'the telescope'],
    nextLocationHint: 'Head over to Central Library to locate the telescope observation marker.',
    verificationCode: '9182',
    hints: { text: 'Look around Central Library, LHC, Senate Hall, and Brahmaputra Hostel.', penaltySeconds: 30 },
    isFirstPuzzle: true,
    isFinalPuzzle: false,
  },
  {
    Question: 'What is the name of the phenomenon where light bends as it passes from one optical medium to another?',
    QuestionAssets: [],
    answer: ['refraction', 'refraction of light', 'light refraction'],
    nextLocationHint: 'Search near the Physics Dept Core 4 laboratory entrance.',
    verificationCode: '7423',
    hints: { text: 'Think of how optical lenses bend starlight in a telescope.', penaltySeconds: 30 },
    isFirstPuzzle: false,
    isFinalPuzzle: false,
  },
  {
    Question: 'Five friends in the front row of the Auditorium — who is sitting in seat 3?',
    QuestionAssets: [],
    answer: ['chirag', 'chirag.'],
    nextLocationHint: 'Proceed to the main Auditorium foyer.',
    verificationCode: '4829',
    hints: { text: 'Deduce the seat orders from left to right.', penaltySeconds: 30 },
    isFirstPuzzle: false,
    isFinalPuzzle: false,
  },
  {
    Question: 'Enter the 4-digit code carried from the Auditorium to open the Library Keypad.',
    QuestionAssets: [],
    answer: ['7423'],
    nextLocationHint: 'Go to the Central Library digital entrance keypad.',
    verificationCode: '8156',
    hints: { text: 'Use the code revealed after the Auditorium riddle.', penaltySeconds: 30 },
    isFirstPuzzle: false,
    isFinalPuzzle: false,
  },
  {
    Question: 'Solve the equation chalked on the wall inside New SAC: (12 × 3) - (8 ÷ 4) + 1',
    QuestionAssets: [],
    answer: ['35'],
    nextLocationHint: 'Solve the chalkboard inside New SAC, then proceed to the Main Gate!',
    verificationCode: null,
    hints: { text: 'Follow standard order of operations: 36 - 2 + 1 = 35', penaltySeconds: 30 },
    isFirstPuzzle: false,
    isFinalPuzzle: true,
  },
];

async function seedData() {
  await connectDB();
  console.log('Seeding Questions, Maps, and Sets with pure numeric verification codes...');

  // 1. Seed Maps (Ensure 5 maps exist)
  for (let m = 1; m <= 5; m++) {
    await Map.findOneAndUpdate(
      { mapNumber: m },
      {
        $set: {
          name: `Map ${String(m).padStart(2, '0')}`,
          mapNumber: m,
          mapUrl: 'https://play.workadventu.re/@/iitgmap/iitgmap/small-forest-office',
          capacity: 10,
          status: 'available',
        },
      },
      { upsert: true, returnDocument: 'after' }
    );
  }
  console.log('✅ 5 WorkAdventure Maps verified.');

  // 2. Upsert Pre-created Questions with pure numeric codes
  for (const qData of QUESTIONS_DATA) {
    await Question.findOneAndUpdate(
      { Question: qData.Question },
      { $set: qData },
      { upsert: true, returnDocument: 'after' }
    );
  }
  console.log(`✅ ${QUESTIONS_DATA.length} pre-created questions seeded.`);

  // 3. Generate 5 Predefined Sets
  const sets = await generatePredefinedSets({ numberOfSets: 5, middleQuestionsCount: 3 });
  console.log(`✅ ${sets.length} Predefined Question Sets generated:`);
  for (const s of sets) {
    console.log(`   ${s.setsKey} ➔ [${s.questions.map((q) => q.Question.slice(0, 20) + '...').join(' -> ')}]`);
  }

  // 4. Assign sets to any unassigned students
  const assignResult = await assignSetsRoundRobin();
  console.log(`✅ Assigned sets to ${assignResult.assignedCount} students.`);

  console.log('🎉 Seeding complete!');
  process.exit(0);
}

seedData().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
