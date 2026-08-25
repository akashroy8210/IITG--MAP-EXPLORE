const Question = require('../models/Question');

/**
 * Generate a random 4-digit location verification code
 */
function generateLocationCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// ─── GET /api/admin/questions ──────────────────────────────────────────────────

async function listQuestions(req, res) {
  const { isFirst, isFinal, active } = req.query;
  const filter = {};

  if (isFirst !== undefined) filter.isFirstPuzzle = isFirst === 'true';
  if (isFinal !== undefined) filter.isFinalPuzzle = isFinal === 'true';
  if (active !== undefined) filter.isActive = active === 'true';

  const questions = await Question.find(filter).sort({ createdAt: -1 });
  res.json({ questions, count: questions.length });
}

// ─── POST /api/admin/questions ─────────────────────────────────────────────────

async function createQuestion(req, res) {
  const {
    Question: questionText,
    QuestionAssets,
    answer,
    nextLocationHint,
    verificationCode,
    hints,
    isFirstPuzzle,
    isFinalPuzzle,
    isActive,
  } = req.body;

  if (!questionText) {
    return res.status(400).json({ message: 'Question text is required' });
  }

  // Normalize answers
  const normalizedAnswers = Array.isArray(answer)
    ? answer.map((a) => String(a).trim().toLowerCase()).filter(Boolean)
    : [String(answer || '').trim().toLowerCase()].filter(Boolean);

  if (normalizedAnswers.length === 0) {
    return res.status(400).json({ message: 'At least one accepted answer is required' });
  }

  // Auto-generate verification code if not provided (except for final puzzle)
  const finalCode = isFinalPuzzle
    ? null
    : String(verificationCode || generateLocationCode()).trim();

  const newQuestion = await Question.create({
    Question: questionText,
    QuestionAssets: QuestionAssets || [],
    answer: normalizedAnswers,
    nextLocationHint: nextLocationHint || null,
    verificationCode: finalCode,
    hints: hints && hints.text ? { text: hints.text, penaltySeconds: Number(hints.penaltySeconds || 30) } : null,
    isFirstPuzzle: Boolean(isFirstPuzzle),
    isFinalPuzzle: Boolean(isFinalPuzzle),
    isActive: isActive !== undefined ? Boolean(isActive) : true,
  });

  res.status(201).json({
    message: 'Question created successfully',
    question: newQuestion,
  });
}

// ─── GET /api/admin/questions/:id ──────────────────────────────────────────────

async function getQuestion(req, res) {
  const question = await Question.findById(req.params.id);
  if (!question) return res.status(404).json({ message: 'Question not found' });
  res.json({ question });
}

// ─── PUT /api/admin/questions/:id ──────────────────────────────────────────────

async function updateQuestion(req, res) {
  const {
    Question: questionText,
    QuestionAssets,
    answer,
    nextLocationHint,
    verificationCode,
    hints,
    isFirstPuzzle,
    isFinalPuzzle,
    isActive,
  } = req.body;

  const updateFields = {};
  if (questionText !== undefined) updateFields.Question = questionText;
  if (QuestionAssets !== undefined) updateFields.QuestionAssets = QuestionAssets;
  if (answer !== undefined) {
    updateFields.answer = Array.isArray(answer)
      ? answer.map((a) => String(a).trim().toLowerCase()).filter(Boolean)
      : [String(answer).trim().toLowerCase()].filter(Boolean);
  }
  if (nextLocationHint !== undefined) updateFields.nextLocationHint = nextLocationHint;
  if (verificationCode !== undefined) updateFields.verificationCode = String(verificationCode).trim();
  if (hints !== undefined) {
    updateFields.hints = hints && hints.text ? { text: hints.text, penaltySeconds: Number(hints.penaltySeconds || 30) } : null;
  }
  if (isFirstPuzzle !== undefined) updateFields.isFirstPuzzle = Boolean(isFirstPuzzle);
  if (isFinalPuzzle !== undefined) updateFields.isFinalPuzzle = Boolean(isFinalPuzzle);
  if (isActive !== undefined) updateFields.isActive = Boolean(isActive);

  const updated = await Question.findByIdAndUpdate(
    req.params.id,
    { $set: updateFields },
    { new: true }
  );

  if (!updated) return res.status(404).json({ message: 'Question not found' });
  res.json({ message: 'Question updated successfully', question: updated });
}

// ─── DELETE /api/admin/questions/:id ───────────────────────────────────────────

async function deleteQuestion(req, res) {
  const deleted = await Question.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Question not found' });
  res.json({ message: 'Question deleted successfully' });
}

// ─── POST /api/admin/questions/bulk ────────────────────────────────────────────

async function bulkUploadQuestions(req, res) {
  const { questions } = req.body;
  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: 'questions array is required' });
  }

  const results = [];
  let successful = 0;
  let failed = 0;

  for (let i = 0; i < questions.length; i++) {
    const row = questions[i];
    try {
      const qText = row.Question || row.question;
      if (!qText) throw new Error('Question text is missing');

      const rawAnswer = row.answer || row.answers;
      const normalizedAnswers = Array.isArray(rawAnswer)
        ? rawAnswer.map((a) => String(a).trim().toLowerCase()).filter(Boolean)
        : String(rawAnswer || '')
            .split(',')
            .map((a) => a.trim().toLowerCase())
            .filter(Boolean);

      if (normalizedAnswers.length === 0) {
        throw new Error('At least one answer is required');
      }

      const isFinal = Boolean(row.isFinalPuzzle || row.isFinal);
      const isFirst = Boolean(row.isFirstPuzzle || row.isFirst);
      const code = isFinal ? null : String(row.verificationCode || generateLocationCode()).trim();

      const parsedHintText = row.hintText || row.hint || row.Hint || row.questionHint || (row.hints && typeof row.hints === 'object' ? row.hints.text : row.hints) || null;
      const parsedPenalty = Number(row.hintPenalty || row.penalty || (row.hints && row.hints.penaltySeconds) || 30);

      const created = await Question.create({
        Question: qText,
        QuestionAssets: Array.isArray(row.QuestionAssets) ? row.QuestionAssets : [],
        answer: normalizedAnswers,
        nextLocationHint: row.nextLocationHint || row.locationClue || row.nextLocation || row.nextClue || null,
        verificationCode: code,
        hints: parsedHintText ? { text: String(parsedHintText).trim(), penaltySeconds: parsedPenalty } : null,
        isFirstPuzzle: isFirst,
        isFinalPuzzle: isFinal,
        isActive: true,
      });

      results.push({ rowNumber: i + 1, status: 'success', id: created._id, Question: created.Question });
      successful++;
    } catch (err) {
      results.push({ rowNumber: i + 1, status: 'failed', error: err.message });
      failed++;
    }
  }

  res.json({
    summary: { total: questions.length, successful, failed },
    results,
  });
}

module.exports = {
  listQuestions,
  createQuestion,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  bulkUploadQuestions,
};
