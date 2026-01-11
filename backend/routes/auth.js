const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const PatientProfile = require("../models/PatientProfile");
const router = express.Router();
const { generateOTP, sendEmailOTP } = require("../util/otpGenerator");

const otpStorage = new Map();

/* ======================
   SEND OTP
====================== */
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const otp = generateOTP();

    otpStorage.set(email.toLowerCase(), {
      otp,
      expires: Date.now() + 10 * 60 * 1000,
      attempts: 0
    });

    await sendEmailOTP(email, otp);

    res.json({ message: "OTP sent to email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

/* ======================
   VERIFY OTP
====================== */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const data = otpStorage.get(email.toLowerCase());

    if (!data) {
      return res.status(400).json({ message: "OTP expired or not found" });
    }

    if (data.expires < Date.now()) {
      otpStorage.delete(email.toLowerCase());
      return res.status(400).json({ message: "OTP expired" });
    }

    if (data.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    otpStorage.delete(email.toLowerCase());

    // Find the user and generate a token
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { isVerified: true, verifiedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ 
      message: "OTP verified successfully",
      newToken: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "OTP verification failed" });
  }
});

/* ======================
   REGISTER (NO OTP HERE)
====================== */
router.post("/register", async (req, res) => {
  try {
    const { userType, name, email, password, phone, parentEmail } = req.body;

    if (!userType || !name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // patient → parent validation
    if (userType === "patient") {
      if (!parentEmail) {
        return res.status(400).json({ message: "Parent email required" });
      }

      const parent = await User.findOne({
        email: parentEmail.toLowerCase(),
        userType: "parent"
      });

      if (!parent) {
        return res.status(400).json({ message: "Valid parent not found" });
      }
    }

    const user = new User({
      userType,
      name,
      email: email.toLowerCase(),
      password,
      phone,
      isVerified: false
    });

    await user.save();
    // 🔗 LINK PATIENT TO PARENT-ADDED PROFILE (IF EXISTS)
    if (userType === "patient") {
      const profile = await PatientProfile.findOne({
        patientEmail: email.toLowerCase()
      });

      if (profile) {
        profile.linkedUserId = user._id;
        await profile.save();
      }
    }


    // send OTP AFTER registration
    const otp = generateOTP();
    otpStorage.set(email.toLowerCase(), {
      otp,
      expires: Date.now() + 10 * 60 * 1000,
      attempts: 0
    });
    await sendEmailOTP(email, otp);

    res.status(201).json({
      message: "Registration successful. OTP sent to email."
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
});

/* ======================
   LOGIN (OTP ENFORCED)
====================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "OTP verification required. Please verify your email first."
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

/* ======================
   VALIDATE TOKEN
====================== */
router.get("/validate", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      res.json({ 
        valid: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          userType: user.userType
        }
      });
    } catch (jwtError) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (err) {
    console.error('Token validation error:', err);
    res.status(500).json({ message: 'Token validation failed' });
  }
});

module.exports = router;
