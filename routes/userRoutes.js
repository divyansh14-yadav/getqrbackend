import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from "../utils/cloudStorage.js";
import bcryptjs from "bcryptjs";

const router = express.Router();

// ---- Setup File Storage ----
const storage = multer.memoryStorage(); // Use memory storage for cloud upload

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// ---- Routes ----

// ✅ Get current logged-in user with getFeatureAccess + role
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    console.log("✅ Returning user profile:", user);

    res.json({
      ...user.toObject(),
      getFeatureAccess: user.getFeatureAccess?.() || {},
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile", error: err.message });
  }
});

// Public profile for QR page rendering
router.get("/public/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select(
      "username displayName bio profileImage links headerImage introText"
    ).populate("qrPageSettings");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fallbacks
    if (!user.links) user.links = [];
    // if (!user.profileImage) user.profileImage = "/profile-placeholder.png";

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error loading public profile" });
  }
});

// Update profile fields (display name, bio, links)
router.put("/update", authMiddleware, async (req, res) => {
  const { displayName, bio, links } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { displayName, bio, links },
      { new: true }
    ).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile." });
  }
});

// Upload profile image
router.post("/upload-image", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    console.log(`✅ File received: ${req.file.originalname}`);

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file, 'qrlinks/profile');

    const imageUrl = result.secure_url;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: imageUrl },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`✅ Profile image updated for user ${req.user.id}: ${imageUrl}`);
    res.json({ imageUrl, user });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: "Failed to upload image.", details: err.message });
  }
});

// Upload header image and intro text
router.put("/profile-media", authMiddleware, upload.single("headerImage"), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.body.introText) user.introText = req.body.introText;

    if (req.file) {
      console.log(`✅ Header image received: ${req.file.originalname}`);

      // Upload to Cloudinary
      const result = await uploadToCloudinary(req.file, 'qrlinks/headers');
      user.headerImage = result.secure_url;

      console.log(`✅ Header image uploaded to Cloudinary: ${result.secure_url}`);
    }

    await user.save();
    console.log(`✅ Profile media updated for user ${req.user.id}`);

    res.json({
      message: "Updated successfully",
      headerImage: user.headerImage,
      introText: user.introText,
    });
  } catch (err) {
    console.error("❌ Profile media upload error:", err);
    res.status(500).json({ error: "Failed to upload header media.", details: err.message });
  }
});

// Change password
router.put("/password", authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id);

  const checkPassword = await bcryptjs.compare(currentPassword, user.password)

  if (!checkPassword) {
    return res.status(400).json({
      message: "wrong Current Password"
    })
  }

  const hash = await bcryptjs.hash(newPassword, 10)

  const chnage = await User.findOneAndUpdate({ _id: req.user.id }, {

    $set: {
      password: hash
    }
  }, { new: true })

  res.status(200).json({ message: "Password updated" });

});

// Logout all devices
router.post("/logoutAll", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id);
  user.deviceId = null;
  await user.save();
  res.json({ message: "Logged out all devices" });
});

// Delete account
router.delete("/", authMiddleware, async (req, res) => {
  await User.findByIdAndDelete(req.user.id);
  res.json({ message: "Account deleted" });
});

export default router;
