import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendOtpEmail } from '../utils/mail.js';

export const register = async (req, res) => {
  try {
    const { email, password, displayName, deviceId } = req.body;
    
    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: 'Email already exists' });
    
    // Validate displayName
    if (!displayName || displayName.trim() === '') {
      return res.status(400).json({ message: 'Display name is required' });
    }
    
    // Use displayName as base username, clean it and convert to lowercase
    let baseUsername = displayName.toLowerCase().replace(/[^a-z0-9]/g, ''); 
    
    // If baseUsername is empty after cleaning, use a default
    if (!baseUsername || baseUsername === '') {
      baseUsername = 'user';
    }
    
    // First, try to use the displayName as username directly
    let finalUsername = baseUsername;
    let existingUsername = await User.findOne({ username: finalUsername });
    
    // If displayName is already taken as username, add random numbers
    if (existingUsername) {
      const randomNumbers = Math.floor(100 + Math.random() * 900); 
      finalUsername = `${baseUsername}${randomNumbers}`;
      
      // Check if the generated username with numbers also exists
      existingUsername = await User.findOne({ username: finalUsername });
      if (existingUsername) {
        // Try with different random numbers
        const newRandomNumbers = Math.floor(100 + Math.random() * 900);
        const alternativeUsername = `${baseUsername}${newRandomNumbers}`;
        
        const existingAltUsername = await User.findOne({ username: alternativeUsername });
        if (existingAltUsername) {
          return res.status(400).json({ message: 'Username already exists, please try a different display name' });
        }
        
        finalUsername = alternativeUsername;
      }
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      email, 
      password: hash, 
      username: finalUsername, 
      displayName: displayName.trim(),
      deviceId 
    });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    const otp = Math.floor(100000 + Math.random() * 900000);
    await sendOtpEmail(email, otp);
    await User.findByIdAndUpdate(user._id, { otp });

    res.json({ 
      message: "please verify your email",
      username: finalUsername,
      displayName: displayName.trim()
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });


    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials' });

    if (user.deviceId && user.deviceId !== deviceId) {
      return res.status(403).json({ message: 'Access from new device blocked' });
    } else if (!user.deviceId) {
      user.deviceId = deviceId;
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const verifyOtp = async (req, res) => {
  try {
      const { email, otp, purpose } = req.body;

    if (!email || !otp) {
      return res
        .status(400)
        .json({ message: "Please provide both email and OTP." });
    }

    const user = await User.findOne({ email, otp });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or OTP." });
    }

    if (user.otpExpires < Date.now()) {
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    let updateFields = {
      otp: "",
      isEmail_verification: true,
      isForgetPurpose: purpose
    };

    const updatedUser = await User.findOneAndUpdate(
      { email, otp },
      { $set: updateFields },
      { new: true }
    );

    res
      .status(200)
      .json({
        message: "OTP verified successfully.",
        isEmail_verification: true,
      });

  } catch (error) {
    console.error("Error verifying OTP:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};



export const resendOtp = async (req, res) => {

  try {

    const { email, isForgetPurpose } = req.body

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(400).json({
        message: "not found details"
      })
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    await sendOtpEmail(email, otp);
    await User.findByIdAndUpdate(user._id, { otp, isForgetPurpose });

    res.status(200).json({ message: 'OTP resent successfully to your email', isForgetPurpose });

  } catch (error) {
    res.status(500).json({
      message: "internal server error"
    })
  }
}



export const reset_password = async (req, res) => {

  try {
      const { email, newPassword, confirm_password } = req.body

      const checkAuth = await User.findOne({ email })

      if (!checkAuth) {
          return res.status(400).json({
              message: "no details found"
          })
      }

      if (newPassword != confirm_password) {
          return res.status(400).json({
              message: "confirm password are not matched"
          })
      }

      const hash = await bcrypt.hash(newPassword, 10)

      const chnage = await User.findOneAndUpdate({ email }, {

          $set: {
              password: hash
          }
      }, { new: true })

      res.status(200).json({
          message: "reset password successfully"
      })

  } catch (error) {
      res.status(500).json({
          message: "internal server error"
      })
  }
}