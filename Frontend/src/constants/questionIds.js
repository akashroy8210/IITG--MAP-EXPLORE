//
// Central registry of puzzle/question identifiers shared by every Puzzle page.
//
// Each student is assigned a random question set at login.
// The assigned set is stored in localStorage under:
//
//   "student_sets_key"
//
// MongoDB _id values are different for questions in different sets,
// so puzzle IDs must NOT be hardcoded.
//
// Instead, each question is matched to its puzzle number using
// the first alphabetic word of the question text.
//
// Current question mapping:
//
// Puzzle 1 → Find
// Puzzle 2 → Ah
// Puzzle 3 → Whispers
// Puzzle 4 → Enter
// Puzzle 5 → MA
//

const DEFAULT_QUESTION_IDS = {
  PUZZLE_1: "6a908a68da69799f2d1dfbba",
  PUZZLE_2: "6a908a08da69799f2d1dfbb7",
  PUZZLE_3: "6a908a08da69799f2d1dfbb8",
  PUZZLE_4: "6a908a08da69799f2d1dfbb9",
  PUZZLE_5: "6a908aaada69799f2d1dfbbb",
};


// ---------------------------------------------------------
// First word → Puzzle number
// ---------------------------------------------------------

const STARTING_WORD_TO_PUZZLE = {
  find: "PUZZLE_1",
  calculate: "PUZZLE_2",
  whispers: "PUZZLE_3",
  what: "PUZZLE_4",
  solve: "PUZZLE_5",
};


// ---------------------------------------------------------
// Get the student's assigned questions from localStorage
// ---------------------------------------------------------

function getAssignedQuestions() {
  try {
    const stored = localStorage.getItem("student_sets_key");

    if (!stored) {
      console.warn("student_sets_key not found in localStorage");
      return null;
    }

    const sets = JSON.parse(stored);

    return sets?.[0]?.questions ?? null;
  } catch (error) {
    console.error(
      "Failed to read student_sets_key from localStorage:",
      error
    );

    return null;
  }
}


// ---------------------------------------------------------
// Extract the first alphabetic word from a question
//
// Examples:
//
// "Find all 4 parts..."        → find
// "Ah, you made it..."         → ah
// "Whispers From the Front..." → whispers
// "Enter the code..."          → enter
// "(MA)² + (CL)²..."           → ma
//
// The regex intentionally searches for the first alphabetic
// word anywhere in the beginning, so "(MA)" works too.
// ---------------------------------------------------------

function getFirstWord(questionText) {
  if (!questionText || typeof questionText !== "string") {
    return null;
  }

  const match = questionText
    .trim()
    .match(/[A-Za-z']+/);

  return match?.[0]?.toLowerCase() ?? null;
}


// ---------------------------------------------------------
// Resolve the MongoDB question IDs for this student's set
// ---------------------------------------------------------

export function resolveQuestionIds() {
  const questions = getAssignedQuestions();

  // Start with defaults.
  // These are only used if the student's question set cannot
  // be loaded or a puzzle cannot be matched.
  const ids = {
    ...DEFAULT_QUESTION_IDS,
  };

  if (!Array.isArray(questions)) {
    console.warn(
      "No assigned questions found. Using default question IDs."
    );

    return ids;
  }

  for (const question of questions) {
    const firstWord = getFirstWord(question?.Question);

    if (!firstWord) {
      console.warn(
        "Could not determine first word for question:",
        question
      );
      continue;
    }

    const puzzleKey = STARTING_WORD_TO_PUZZLE[firstWord];

    if (!puzzleKey) {
      console.warn(
        `No puzzle mapping found for starting word: "${firstWord}"`
      );
      continue;
    }

    if (!question?._id) {
      console.warn(
        `Question matched ${puzzleKey}, but it has no _id:`,
        question
      );
      continue;
    }

    ids[puzzleKey] = question._id;

    console.log(
      `${puzzleKey} → "${firstWord}" → ${question._id}`
    );
  }

  return ids;
}


// ---------------------------------------------------------
// Resolve IDs once when this module is imported
// ---------------------------------------------------------

export const QUESTION_IDS = resolveQuestionIds();


// ---------------------------------------------------------
// Default export
// ---------------------------------------------------------

export default QUESTION_IDS;