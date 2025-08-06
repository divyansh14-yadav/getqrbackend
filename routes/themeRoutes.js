// routes/themeRoutes.js
import express from "express";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// GET current user's QR theme settings
router.get("/theme", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("qrPageSettings subscription");
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Check if user has QR customization access
    const featureAccess = user.getFeatureAccess();
    if (!featureAccess.canCustomizeQR) {
      return res.status(403).json({ 
        message: "Theme customization not available with your current subscription. Upgrade to customize your Theme page.",
        subscription: user.subscription,
        canCustomizeQR: false
      });
    }
    
    res.json({
      ...user.qrPageSettings,
      canCustomizeQR: true,
      subscription: user.subscription
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// UPDATE current user's QR theme settings
router.put("/theme", authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if user has QR customization access
    const featureAccess = user.getFeatureAccess();
    if (!featureAccess.canCustomizeQR) {
      return res.status(403).json({ 
        message: "Theme customization not available with your current subscription. Upgrade to customize your Theme page.",
        subscription: user.subscription,
        canCustomizeQR: false
      });
    }

    user.qrPageSettings = {
      ...user.qrPageSettings,
      ...updates,
    };
    await user.save();
    
    res.json({
      ...user.qrPageSettings,
      canCustomizeQR: true,
      subscription: user.subscription,
      message: "Theme updated successfully"
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update theme", error: err.message });
  }
});

export default router;