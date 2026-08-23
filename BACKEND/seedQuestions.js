require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Map = require('./models/Map');
const Question = require('./models/Question');
const { ROUTE_GROUPS } = require('./services/routeKey.service');

// Individual puzzle definitions
const PUZZLE_DEFINITIONS = {
  LIBRARY_TELESCOPE: {
    puzzleId: 'puzzle-1',
    promptText: 'Find all 4 parts of the telescope image hidden across campus. Guess the object!',
    answer: 'telescope',
    answerAcceptVariants: ['a telescope', 'the telescope'],
    locationName: 'zone_central_library',
    verificationCode: 'REF-9182',
    hints: [{ hintNumber: 1, text: 'Look around Central Library, LHC, Senate Hall, and Brahmaputra Hostel.', penaltySeconds: 30 }],
    isFinalPuzzle: false,
  },
  PHYSICS_REFRACTION: {
    puzzleId: 'puzzle-2',
    promptText: 'What is the name of the phenomenon where light bends as it passes from one medium to another?',
    answer: 'refraction',
    answerAcceptVariants: ['refraction of light', 'light refraction'],
    locationName: 'zone_physics_core4',
    verificationCode: 'AUDI-7423',
    hints: [{ hintNumber: 1, text: 'Think of how lenses bend light to focus starlight in a telescope.', penaltySeconds: 30 }],
    isFinalPuzzle: false,
  },
  AUDITORIUM_WHISPERS: {
    puzzleId: 'puzzle-3',
    promptText: 'Five friends in the front row of the Auditorium — who is sitting in seat 3?',
    answer: 'chirag',
    answerAcceptVariants: ['chirag', 'chirag.'],
    locationName: 'zone_auditorium',
    verificationCode: '7423',
    hints: [{ hintNumber: 1, text: 'Deduce the seat orders from left to right.', penaltySeconds: 30 }],
    isFinalPuzzle: false,
  },
  LIBRARY_KEYPAD: {
    puzzleId: 'puzzle-4',
    promptText: 'Enter the 4-digit code carried from the Auditorium to open the Library Keypad.',
    answer: '7423',
    answerAcceptVariants: ['7423'],
    locationName: 'zone_library_keypad',
    verificationCode: 'SAC-8156',
    hints: [{ hintNumber: 1, text: 'Use the code given after solving the Auditorium riddle.', penaltySeconds: 30 }],
    isFinalPuzzle: false,
  },
  NEWSAC_FINAL: {
    puzzleId: 'puzzle-5',
    type: 'final',
    promptText: 'Solve the equation chalked on the wall inside New SAC: (12 × 3) - (8 ÷ 4) + 1',
    answer: '35',
    answerAcceptVariants: ['35'],
    locationName: 'zone_new_sac',
    verificationCode: '8156',
    hints: [{ hintNumber: 1, text: 'Follow standard order of operations: 36 - 2 + 1 = 35', penaltySeconds: 30 }],
    isFinalPuzzle: true,
  },
};

// 5 Distinct Route Sequences to scatter students across different locations:
const ROUTE_SEQUENCES = {
  ROUTE_A: [
    PUZZLE_DEFINITIONS.LIBRARY_TELESCOPE, // Stage 0: Starts at Library
    PUZZLE_DEFINITIONS.PHYSICS_REFRACTION, // Stage 1: Physics Core 4
    PUZZLE_DEFINITIONS.AUDITORIUM_WHISPERS, // Stage 2: Auditorium
    PUZZLE_DEFINITIONS.LIBRARY_KEYPAD,     // Stage 3: Library Keypad
    PUZZLE_DEFINITIONS.NEWSAC_FINAL,       // Stage 4: New SAC
  ],
  ROUTE_B: [
    PUZZLE_DEFINITIONS.PHYSICS_REFRACTION, // Stage 0: Starts at Physics Core 4
    PUZZLE_DEFINITIONS.AUDITORIUM_WHISPERS, // Stage 1: Auditorium
    PUZZLE_DEFINITIONS.LIBRARY_TELESCOPE, // Stage 2: Library
    PUZZLE_DEFINITIONS.LIBRARY_KEYPAD,     // Stage 3: Library Keypad
    PUZZLE_DEFINITIONS.NEWSAC_FINAL,       // Stage 4: New SAC
  ],
  ROUTE_C: [
    PUZZLE_DEFINITIONS.AUDITORIUM_WHISPERS, // Stage 0: Starts at Auditorium
    PUZZLE_DEFINITIONS.LIBRARY_TELESCOPE, // Stage 1: Library
    PUZZLE_DEFINITIONS.PHYSICS_REFRACTION, // Stage 2: Physics Core 4
    PUZZLE_DEFINITIONS.LIBRARY_KEYPAD,     // Stage 3: Library Keypad
    PUZZLE_DEFINITIONS.NEWSAC_FINAL,       // Stage 4: New SAC
  ],
  ROUTE_D: [
    PUZZLE_DEFINITIONS.LIBRARY_KEYPAD,     // Stage 0: Starts at Library Keypad
    PUZZLE_DEFINITIONS.AUDITORIUM_WHISPERS, // Stage 1: Auditorium
    PUZZLE_DEFINITIONS.PHYSICS_REFRACTION, // Stage 2: Physics Core 4
    PUZZLE_DEFINITIONS.LIBRARY_TELESCOPE, // Stage 3: Library
    PUZZLE_DEFINITIONS.NEWSAC_FINAL,       // Stage 4: New SAC
  ],
  ROUTE_E: [
    PUZZLE_DEFINITIONS.LIBRARY_TELESCOPE, // Stage 0: Starts at Library
    PUZZLE_DEFINITIONS.AUDITORIUM_WHISPERS, // Stage 1: Auditorium
    PUZZLE_DEFINITIONS.PHYSICS_REFRACTION, // Stage 2: Physics Core 4
    PUZZLE_DEFINITIONS.LIBRARY_KEYPAD,     // Stage 3: Library Keypad
    PUZZLE_DEFINITIONS.NEWSAC_FINAL,       // Stage 4: New SAC
  ],
};

async function seedRoutesAndQuestions() {
  await connectDB();

  console.log('Seeding 5 distinct route sequences for all maps...');

  const maps = await Map.find({});
  if (maps.length === 0) {
    const defaultMap = await Map.create({
      name: 'Map 01',
      mapNumber: 1,
      mapUrl: 'https://play.workadventu.re/@/iitgmap/iitgmap/small-forest-office',
      capacity: 10,
      assignedCount: 0,
      status: 'available',
    });
    maps.push(defaultMap);
  }

  for (const map of maps) {
    for (const [routeGroup, sequence] of Object.entries(ROUTE_SEQUENCES)) {
      for (let stageIdx = 0; stageIdx < sequence.length; stageIdx++) {
        const puzzle = sequence[stageIdx];
        await Question.findOneAndUpdate(
          { mapId: map._id, routeKey: routeGroup, stageIndex: stageIdx },
          {
            $set: {
              mapId: map._id,
              routeKey: routeGroup,
              stageIndex: stageIdx,
              type: puzzle.type || 'location',
              promptText: puzzle.promptText,
              answer: puzzle.answer,
              answerAcceptVariants: puzzle.answerAcceptVariants,
              locationName: puzzle.locationName,
              verificationCode: puzzle.verificationCode,
              hints: puzzle.hints,
              isFinalPuzzle: puzzle.isFinalPuzzle || false,
            },
          },
          { upsert: true, returnDocument: 'after' }
        );
      }
    }
  }

  console.log('✅ All 5 distinct route sequences successfully seeded for all maps!');
  process.exit(0);
}

seedRoutesAndQuestions().catch((err) => {
  console.error('❌ Question seeding error:', err);
  process.exit(1);
});
