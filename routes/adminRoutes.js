import express from "express";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

// GET all users (admin only)
router.get("/users", authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
});

// Grant lifetime access
router.post("/lifetime/:id", authMiddleware, adminOnly, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.subscription = "lifetime";
  user.trialExpires = null;
  await user.save();

  res.json({ message: "Lifetime access granted" });
});

// Deactivate a user
router.post("/deactivate/:id", authMiddleware, adminOnly, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.subscription = "trial";
  user.trialExpires = new Date(Date.now() - 1000);
  await user.save();

  res.json({ message: "User deactivated" });
});

export default router;
