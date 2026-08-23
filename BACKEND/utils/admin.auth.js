function adminAuth(req, res, next) {
  const key = req.headers['x-admin-key'];

  if (!process.env.ADMIN_KEY) {
    return res.status(500).json({ message: 'Server misconfigured: ADMIN_KEY not set' });
  }

  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ message: 'Invalid admin key' });
  }

  next();
}

module.exports = adminAuth;
