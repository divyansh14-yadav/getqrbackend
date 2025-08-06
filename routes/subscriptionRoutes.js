import express from 'express';
import { 
  getSubscriptionStatus, 
  getAvailablePlans, 
  cancelSubscription 
} from '../controllers/subscriptionController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Get current subscription status
router.get('/status', authMiddleware, getSubscriptionStatus);

// Get available subscription plans
router.get('/plans', getAvailablePlans);

// Cancel subscription
router.post('/cancel', authMiddleware, cancelSubscription);

export default router; 