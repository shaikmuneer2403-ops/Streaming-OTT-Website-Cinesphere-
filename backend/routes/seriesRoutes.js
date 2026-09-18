import express from 'express';
import { getAllSeries, getSeriesById, createSeries, updateSeries, deleteSeries } from '../controllers/seriesController.js';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/', optionalAuth, getAllSeries);
router.get('/:id', optionalAuth, getSeriesById);

router.post('/', authenticateToken, requireAdmin, createSeries);
router.put('/:id', authenticateToken, requireAdmin, updateSeries);
router.delete('/:id', authenticateToken, requireAdmin, deleteSeries);

export default router;
