import { verifyToken } from '../utils/jwt.js';
import UserModel from '../models/User.js';

/**
 * Mandatory authentication middleware.
 * Expects header: "Authorization: Bearer <token>"
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided. Please log in.'
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.'
    });
  }

  // Retrieve user record from MongoDB to verify account active status
  const user = await UserModel.findById(decoded.id).select('-passwordHash');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Account no longer exists in MongoDB.'
    });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({
      success: false,
      message: 'This account has been suspended by platform administration.'
    });
  }

  req.user = user;
  next();
}

/**
 * Optional authentication middleware.
 * If token is present, populates req.user. If not, proceeds without error.
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded) {
      const user = await UserModel.findById(decoded.id);
      if (user && user.status !== 'suspended') {
        req.user = user;
      }
    }
  }
  next();
}

export default authenticateToken;
