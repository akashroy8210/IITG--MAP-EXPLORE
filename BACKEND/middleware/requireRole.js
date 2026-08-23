/**
 * Role-based authorization middleware factory.
 * Must be used AFTER adminAuth (which sets req.admin).
 *
 * Usage:
 *   router.post('/sensitive', adminAuth, requireRole('ADMIN'), handler)
 *   router.get('/students', adminAuth, requireRole(['ADMIN', 'DEVOPS']), handler)
 */
function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];

  return function (req, res, next) {
    if (!req.admin) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    if (!allowed.includes(req.admin.role)) {
      return res.status(403).json({
        message: `This action requires one of the following roles: ${allowed.join(', ')}`,
      });
    }
    next();
  };
}

module.exports = requireRole;
