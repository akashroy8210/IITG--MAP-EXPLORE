const AdminUser = require('../models/AdminUser');
const { generatePassword } = require('../services/password.service');

// ─── GET /api/admin/members ───────────────────────────────────────────────────

async function listMembers(req, res) {
  const members = await AdminUser.find()
    .sort({ createdAt: -1 })
    .select('-passwordHash')
    .lean();

  res.json(members);
}

// ─── POST /api/admin/members ──────────────────────────────────────────────────

async function createMember(req, res) {
  const { name, email, role } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ message: 'name, email, and role are required' });
  }

  if (!['ADMIN', 'DEVOPS'].includes(role.toUpperCase())) {
    return res.status(400).json({ message: 'role must be ADMIN or DEVOPS' });
  }

  const existing = await AdminUser.findOne({ email: email.trim().toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: `An admin account with email "${email}" already exists` });
  }

  const temporaryPassword = generatePassword();
  const passwordHash = await AdminUser.hashPassword(temporaryPassword);

  const member = await AdminUser.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
    role: role.toUpperCase(),
  });

  res.status(201).json({
    success: true,
    member: {
      id: member._id,
      name: member.name,
      email: member.email,
      role: member.role,
      isActive: member.isActive,
      createdAt: member.createdAt,
    },
    temporaryPassword, // returned once only
  });
}

// ─── POST /api/admin/members/bulk ────────────────────────────────────────────

async function bulkCreateMembers(req, res) {
  const entries = req.body.members;

  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ message: 'Body must include a non-empty "members" array' });
  }

  const results = [];

  for (const entry of entries) {
    const { name, email, role } = entry;

    if (!name || !email || !role) {
      results.push({ name, email, status: 'failed', error: 'name, email, and role are required' });
      continue;
    }

    if (!['ADMIN', 'DEVOPS'].includes(String(role).toUpperCase())) {
      results.push({ name, email, status: 'failed', error: 'role must be ADMIN or DEVOPS' });
      continue;
    }

    try {
      const existing = await AdminUser.findOne({ email: email.trim().toLowerCase() });
      if (existing) {
        results.push({ name, email, status: 'failed', error: 'Email already in use' });
        continue;
      }

      const temporaryPassword = generatePassword();
      const passwordHash = await AdminUser.hashPassword(temporaryPassword);

      const member = await AdminUser.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: String(role).toUpperCase(),
      });

      results.push({
        status: 'created',
        name: member.name,
        email: member.email,
        role: member.role,
        temporaryPassword,
      });
    } catch (err) {
      results.push({ name, email, status: 'failed', error: err.message });
    }
  }

  const created = results.filter(r => r.status === 'created').length;
  const failed = results.filter(r => r.status === 'failed').length;

  res.status(created > 0 ? (failed > 0 ? 207 : 201) : 400).json({
    summary: { total: results.length, created, failed },
    results,
  });
}

// ─── PATCH /api/admin/members/:id/status ─────────────────────────────────────

async function updateMemberStatus(req, res) {
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ message: 'isActive must be a boolean' });
  }

  // Prevent self-deactivation
  if (String(req.params.id) === String(req.admin.adminId) && !isActive) {
    return res.status(400).json({ message: 'You cannot deactivate your own account' });
  }

  const member = await AdminUser.findByIdAndUpdate(
    req.params.id,
    { $set: { isActive } },
    { new: true }
  ).select('-passwordHash');

  if (!member) return res.status(404).json({ message: 'Admin member not found' });

  res.json({ message: `Member ${isActive ? 'activated' : 'deactivated'} successfully`, member });
}

// ─── GET /api/admin/members/:id ──────────────────────────────────────────────

async function getMember(req, res) {
  const member = await AdminUser.findById(req.params.id).select('-passwordHash');
  if (!member) return res.status(404).json({ message: 'Admin member not found' });
  res.json(member);
}

module.exports = { listMembers, createMember, bulkCreateMembers, updateMemberStatus, getMember };
