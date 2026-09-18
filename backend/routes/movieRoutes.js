import express from 'express';
import { getAllMovies, getMovieById, createMovie, updateMovie, deleteMovie } from '../controllers/movieController.js';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Public / client routes
router.get('/', optionalAuth, getAllMovies);
router.get('/:id', optionalAuth, getMovieById);

// Admin-only management routes
router.post('/', authenticateToken, requireAdmin, createMovie);
router.put('/:id', authenticateToken, requireAdmin, updateMovie);
router.delete('/:id', authenticateToken, requireAdmin, deleteMovie);

export default router;
