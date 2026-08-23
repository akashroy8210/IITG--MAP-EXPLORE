const jwt = require('jsonwebtoken');

/**
 * Student authentication middleware.
 * Verifies the Bearer JWT issued at student login.
 * Attaches req.userId and req.username to the request.
 */
function studentAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Missing bearer token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    req.username = payload.username;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = studentAuth;
