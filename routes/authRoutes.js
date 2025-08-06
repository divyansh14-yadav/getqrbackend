// routes/authRoutes.js
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { register, resendOtp, reset_password, verifyOtp } from "../controllers/authController.js";

const router = express.Router();

// Register
router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/reset-otp", resendOtp)
router.post("/reset-password", reset_password)

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    if (!user.isEmail_verification) return res.status(401).json({ message: "Please verify your email", isEmail_verification: user.isEmail_verification });


    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;