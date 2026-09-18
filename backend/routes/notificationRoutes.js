import express from 'express';
import NotificationModel from '../models/Notification.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res, next) => {
  try {
    const list = await NotificationModel.findByUser(req.user._id);
    return res.json({
      success: true,
      count: list.length,
      notifications: list
    });
  } catch (err) {
    next(err);
  }
});

router.put('/:id/read', async (req, res, next) => {
  try {
    const updated = await NotificationModel.markAsRead(req.params.id, req.user._id);
    return res.json({
      success: true,
      notification: updated
    });
  } catch (err) {
    next(err);
  }
});

router.put('/read-all', async (req, res, next) => {
  try {
    await NotificationModel.markAllAsRead(req.user._id);
    return res.json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
