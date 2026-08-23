const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const AdminUser = require('../models/AdminUser');
const { loginLimiter, adminLoginLimiter } = require('../utils/rateLimiter');

// ─── Student Login ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/student/login
 * Body: { username, password }
 */
async function studentLogin(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'username and password are required' });
  }

  // Need passwordHash — use .select('+passwordHash') to override select:false
  const student = await Student.findOne({
    username: String(username).trim().toLowerCase(),
  }).select('+passwordHash').populate('mapId', 'name mapUrl mapNumber');

  if (!student) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const passwordMatches = await student.comparePassword(password);
  if (!passwordMatches) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  if (student.status === 'inactive') {
    return res.status(403).json({ message: 'Your account has been deactivated. Contact an administrator.' });
  }

  // Update last login (non-critical)
  Student.updateOne({ _id: student._id }, { $set: { lastLogin: new Date() } }).catch(() => {});

  const token = jwt.sign(
    { userId: student._id.toString(), username: student.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
  );

  res.json({
    token,
    student: {
      userNumber: student.userNumber,
      username: student.username,
      name: student.name,
      email: student.email,
      status: student.status,
      gameStatus: student.gameStatus,
      map: student.mapId
        ? {
            id: student.mapId._id,
            name: student.mapId.name,
            mapUrl: student.mapId.mapUrl,
            mapNumber: student.mapId.mapNumber,
          }
        : null,
      routeKey: student.routeKey,
    },
  });
}

// ─── Admin Login ───────────────────────────────────────────────────────────────

/**
 * POST /api/admin/login
 * Body: { email, password }
 */
async function adminLogin(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  const admin = await AdminUser.findOne({
    email: String(email).trim().toLowerCase(),
  }).select('+passwordHash');

  if (!admin) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const passwordMatches = await admin.comparePassword(password);
  if (!passwordMatches) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  if (!admin.isActive) {
    return res.status(403).json({ message: 'This admin account has been deactivated.' });
  }

  AdminUser.updateOne({ _id: admin._id }, { $set: { lastLogin: new Date() } }).catch(() => {});

  const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
  const token = jwt.sign(
    { adminId: admin._id.toString(), email: admin.email, role: admin.role },
    secret,
    { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '8h' }
  );

  res.json({
    token,
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  });
}

module.exports = { studentLogin, adminLogin };
