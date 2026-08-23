const jwt = require('jsonwebtoken');

/**
 * Admin/DevOps JWT authentication middleware.
 * Verifies the Bearer JWT issued at admin login.
 * Attaches req.admin = { adminId, email, role } to the request.
 */
function adminAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Admin authentication required' });
  }

  try {
    const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
    const payload = jwt.verify(token, secret);

    if (!payload.adminId) {
      return res.status(403).json({ message: 'Token is not an admin token' });
    }

    req.admin = {
      adminId: payload.adminId,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired admin token' });
  }
}

module.exports = adminAuth;
