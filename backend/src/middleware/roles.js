const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  next();
};

const requireOwnerOrAdmin = (getOwnerId) => async (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (req.user.role === 'admin' || req.user.role === 'moderator') return next();
  try {
    const ownerId = await getOwnerId(req);
    if (!ownerId) return res.status(404).json({ message: 'Resource not found' });
    if (ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireRole, requireOwnerOrAdmin };
