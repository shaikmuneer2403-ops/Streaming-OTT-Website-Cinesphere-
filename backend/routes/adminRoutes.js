import express from 'express';
import {
  getAdminUsers,
  getAdminLoginActivity,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getAnalytics,
  getAdminComments,
  moderateComment,
  getLiveActivity
} from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Enforce authentication & admin role across all /api/admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// User management (Requirement 12)
router.get('/users', getAdminUsers);
router.get('/login-activity', getAdminLoginActivity);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Platform Analytics & Metrics
router.get('/analytics', getAnalytics);

// Comment moderation
router.get('/comments', getAdminComments);
router.put('/comments/:id/moderate', moderateComment);

// Live socket viewer activity
router.get('/live-activity', getLiveActivity);

export default router;
