import express from 'express';
import {
  getPlans,
  createCheckoutSession,
  confirmUpgrade
} from '../controllers/subscriptionController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/plans', getPlans);
router.post('/checkout-session', authenticateToken, createCheckoutSession);
router.post('/upgrade', authenticateToken, confirmUpgrade);

export default router;
