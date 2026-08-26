const Sets = require('../models/Sets.model');
const Student = require('../models/Student');
const { generatePredefinedSets, assignSetsRoundRobin } = require('../services/sets.service');

// ─── GET /api/admin/sets ───────────────────────────────────────────────────────

async function listSets(req, res) {
  const sets = await Sets.find({}).populate('questions').sort({ setsKey: 1 });
  res.json({ sets, count: sets.length });
}

// ─── GET /api/admin/sets/:id ───────────────────────────────────────────────────

async function getSet(req, res) {
  const set = await Sets.findById(req.params.id).populate('questions');
  if (!set) return res.status(404).json({ message: 'Set not found' });
  res.json({ set });
}

// ─── POST /api/admin/sets/generate ─────────────────────────────────────────────

async function generateSetsController(req, res) {
  const { numberOfSets = 5, middleQuestionsCount = 3 } = req.body;

  try {
    const generated = await generatePredefinedSets({
      numberOfSets: Number(numberOfSets),
      middleQuestionsCount: Number(middleQuestionsCount),
    });

    res.status(201).json({
      message: `Successfully generated ${generated.length} predefined question sets`,
      sets: generated,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// ─── POST /api/admin/sets/assign ───────────────────────────────────────────────

async function assignSetsController(req, res) {
  try {
    const result = await assignSetsRoundRobin();
    res.json({
      message: `Assigned sets to ${result.assignedCount} students`,
      ...result,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// ─── DELETE /api/admin/sets/:id ────────────────────────────────────────────────

async function deleteSet(req, res) {
  try {
    const set = await Sets.findByIdAndDelete(req.params.id);
    if (!set) return res.status(404).json({ message: 'Set not found' });

    // Unassign from students who were assigned this set
    await Student.updateMany({ setsKey: req.params.id }, { $set: { setsKey: null } });

    res.json({ message: `Question Set ${set.setsKey} deleted successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ─── DELETE /api/admin/sets ────────────────────────────────────────────────────

async function deleteAllSets(req, res) {
  try {
    const count = await Sets.countDocuments();
    await Sets.deleteMany({});
    // Unassign from all students
    await Student.updateMany({}, { $set: { setsKey: null } });

    res.json({ message: `All ${count} question sets deleted successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  listSets,
  getSet,
  generateSetsController,
  assignSetsController,
  deleteSet,
  deleteAllSets,
};
