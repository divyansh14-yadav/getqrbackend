import express from 'express';
import { saveLinks, getLinks } from '../controllers/qrController.js';
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post('/save', authMiddleware, saveLinks);
router.get('/:userId', getLinks);

export default router;