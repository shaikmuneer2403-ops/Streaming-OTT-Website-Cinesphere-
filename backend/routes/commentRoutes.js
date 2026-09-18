import express from 'express';
import {
  getMovieComments,
  addComment,
  toggleLikeComment,
  replyComment,
  reportComment,
  deleteComment
} from '../controllers/commentController.js';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:movieId', optionalAuth, getMovieComments);
router.post('/', authenticateToken, addComment);
router.post('/:id/like', authenticateToken, toggleLikeComment);
router.post('/:id/reply', authenticateToken, replyComment);
router.post('/:id/report', authenticateToken, reportComment);
router.delete('/:id', authenticateToken, deleteComment);

export default router;
