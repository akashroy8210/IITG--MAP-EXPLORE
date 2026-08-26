const Student = require('../models/Student');
const Map = require('../models/Map');
const Sets = require('../models/Sets.model');
const UserQuestionProgress = require('../models/UserQuestionProgress');
const { createStudent, bulkCreateStudents } = require('../services/student.service');
const { generatePassword } = require('../services/password.service');

// ─── GET /api/admin/students ──────────────────────────────────────────────────

async function listStudents(req, res) {
  const {
    page = 1,
    limit = 20,
    search = '',
    status,
    mapId,
    setsKey,
    sortBy = 'userNumber',
    sortOrder = 'asc',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  // Build filter
  const filter = {};
  if (status) filter.status = status;
  if (mapId) filter.mapId = mapId;
  if (setsKey) filter.setsKey = setsKey;
  if (search.trim()) {
    const re = new RegExp(search.trim(), 'i');
    filter.$or = [
      { username: re },
      { name: re },
      { email: re },
      ...(isNaN(search) ? [] : [{ userNumber: Number(search) }]),
    ];
  }

  const sortDir = sortOrder === 'desc' ? -1 : 1;

  const [students, total] = await Promise.all([
    Student.find(filter)
      .populate('mapId', 'name mapNumber mapUrl')
      .populate('setsKey', 'setsKey')
      .sort({ [sortBy]: sortDir })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Student.countDocuments(filter),
  ]);

  res.json({
    data: students,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
}

// ─── POST /api/admin/students ─────────────────────────────────────────────────

async function createSingleStudent(req, res) {
  const { name, email } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'name is required' });
  }

  try {
    const { student, map, temporaryPassword, mainGateCode, assignedSet } = await createStudent({
      name: name.trim(),
      email: email ? email.trim().toLowerCase() : null,
    });

    res.status(201).json({
      success: true,
      student: {
        id: student._id,
        userNumber: student.userNumber,
        username: student.username,
        name: student.name,
        email: student.email,
        setsKey: assignedSet ? assignedSet.setsKey : null,
        mainGateCode,
        status: student.status,
        map: {
          id: map._id,
          name: map.name,
          mapNumber: map.mapNumber,
          mapUrl: map.mapUrl,
        },
        createdAt: student.createdAt,
      },
      temporaryPassword,
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message });
  }
}

// ─── POST /api/admin/students/bulk ───────────────────────────────────────────

async function bulkCreate(req, res) {
  const entries = req.body.students;

  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ message: 'Body must include a non-empty "students" array' });
  }

  const valid = [];
  const preErrors = [];
  for (const entry of entries) {
    if (!entry.name || !entry.name.trim()) {
      preErrors.push({ name: entry.name || '(empty)', email: entry.email, error: 'name is required' });
    } else {
      valid.push({ name: entry.name.trim(), email: entry.email ? entry.email.trim().toLowerCase() : null });
    }
  }

  const results = await bulkCreateStudents(valid);

  const allResults = [...preErrors.map((e) => ({ ...e, status: 'failed' })), ...results];
  const created = allResults.filter((r) => r.status === 'created').length;
  const failed = allResults.filter((r) => r.status === 'failed').length;

  res.status(failed > 0 ? (created > 0 ? 207 : 200) : 201).json({
    summary: { total: allResults.length, created, failed },
    results: allResults,
  });
}

// ─── GET /api/admin/students/:id ─────────────────────────────────────────────

async function getStudent(req, res) {
  const student = await Student.findById(req.params.id)
    .populate('mapId', 'name mapNumber mapUrl capacity assignedCount status')
    .populate('setsKey');

  if (!student) return res.status(404).json({ message: 'Student not found' });

  res.json(student);
}

// ─── PATCH /api/admin/students/:id/status ────────────────────────────────────

async function updateStatus(req, res) {
  const { status } = req.body;
  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ message: 'status must be "active" or "inactive"' });
  }

  const student = await Student.findByIdAndUpdate(
    req.params.id,
    { $set: { status } },
    { new: true }
  ).populate('mapId', 'name mapNumber');

  if (!student) return res.status(404).json({ message: 'Student not found' });

  res.json({ message: `Student ${status === 'active' ? 'activated' : 'deactivated'} successfully`, student });
}

// ─── POST /api/admin/students/:id/reset-password ─────────────────────────────

async function resetPassword(req, res) {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const newPassword = generatePassword();
  const passwordHash = await Student.hashPassword(newPassword);

  await Student.updateOne({ _id: student._id }, { $set: { password: passwordHash } });

  res.json({
    message: 'Password reset successfully',
    userNumber: student.userNumber,
    username: student.username,
    temporaryPassword: newPassword,
  });
}

// ─── POST /api/admin/students/:id/assign-set ─────────────────────────────────

async function assignStudentSet(req, res) {
  const { setsKeyId } = req.body;
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const setDoc = await Sets.findById(setsKeyId);
  if (!setDoc) return res.status(404).json({ message: 'Set not found' });

  await Student.updateOne({ _id: student._id }, { $set: { setsKey: setDoc._id } });

  res.json({
    message: `Set ${setDoc.setsKey} assigned to #${student.userNumber}`,
    setsKey: setDoc.setsKey,
  });
}

// ─── DELETE /api/admin/students/:id ──────────────────────────────────────────

async function deleteStudent(req, res) {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  if (student.mapId) {
    await Map.findOneAndUpdate(
      { _id: student.mapId, assignedCount: { $gt: 0 } },
      {
        $inc: { assignedCount: -1 },
        $set: { status: 'available' },
        $pull: { studentIds: student._id },
      }
    ).catch(() => {});
  }

  await Promise.all([
    UserQuestionProgress.deleteMany({ userId: student._id }).catch(() => {}),
    Student.deleteOne({ _id: student._id }),
  ]);

  res.json({
    success: true,
    message: `Student #${student.userNumber} (${student.name}) removed successfully. Map slot released.`,
    userNumber: student.userNumber,
  });
}

module.exports = {
  listStudents,
  createSingleStudent,
  bulkCreate,
  getStudent,
  updateStatus,
  resetPassword,
  assignStudentSet,
  deleteStudent,
};
