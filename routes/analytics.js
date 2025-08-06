import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import checkFeatureAccess from "../middleware/checkFeatureAccess.js";

const router = express.Router();

router.get("/", authMiddleware, checkFeatureAccess("analytics"), async (req, res) => {
  try {
    // Placeholder analytics (replace later with real DB logic)
    const mockAnalytics = {
      scans: 12,
      views: 30,
      linkClicks: {
        instagram: 10,
        tiktok: 5,
        whatsapp: 3,
      },
    };

    res.json({ success: true, data: mockAnalytics });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load analytics" });
  }
});

export default router;