/**
 * Admin role verification middleware.
 * Must be preceded by authenticateToken middleware.
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required prior to role verification.'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Administrator privileges required for this action.'
    });
  }

  next;
  next();
}

export default requireAdmin;
