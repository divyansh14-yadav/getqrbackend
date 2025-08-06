import express from 'express';
const router = express.Router();
import { trackScan, trackClick, getAnalytics } from '../controllers/analyticsController.js';
import authMiddleware from '../middleware/authMiddleware.js';

router.post('/scan/:userId', trackScan);
router.post('/click/:userId', trackClick);
router.get('/analytics', authMiddleware, getAnalytics);

export default router;
