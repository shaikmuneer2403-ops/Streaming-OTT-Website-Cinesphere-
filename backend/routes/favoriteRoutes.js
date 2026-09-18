import express from 'express';
import {
  getUserFavorites,
  toggleFavorite,
  removeFavorite
} from '../controllers/favoriteController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getUserFavorites);
router.post('/', toggleFavorite);
router.delete('/:id', removeFavorite);

export default router;
