import express from 'express';
import { createCheckoutSession, createPortalSession, handleWebhook } from '../controllers/paymentController.js';
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

router.post('/create-checkout-session', authMiddleware, createCheckoutSession);
router.post('/create-portal-session', authMiddleware, createPortalSession);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;
