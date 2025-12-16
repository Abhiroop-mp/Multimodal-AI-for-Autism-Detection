const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const { generateOTP, sendEmailOTP } = require('../util/otpGenerator');

const otpStorage = new Map();

// Send OTP endpoint
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const otp = generateOTP();

    // Store OTP with expiration (10 minutes)
    otpStorage.set(email, {
      otp,
      expires: Date.now() + 10 * 60 * 1000,
      attempts: 0
    });

    // Send OTP via email
    const emailSent = await sendEmailOTP(email, otp);

    if (emailSent) {
      res.json({ message: 'OTP sent to your email successfully' });
    } else {
      res.status(500).json({ message: 'Failed to send OTP email' });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify OTP endpoint
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const storedData = otpStorage.get(email);

    // Check if OTP exists and is not expired
    if (!storedData) {
      return res.status(400).json({ message: 'OTP not found or expired' });
    }

    if (storedData.expires < Date.now()) {
      otpStorage.delete(email);
      return res.status(400).json({ message: 'OTP expired' });
    }

    // Check attempt limit
    if (storedData.attempts >= 3) {
      otpStorage.delete(email);
      return res.status(400).json({ message: 'Too many attempts. Please request a new OTP.' });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      storedData.attempts += 1;
      otpStorage.set(email, storedData);
      const remainingAttempts = 3 - storedData.attempts;
      return res.status(400).json({ 
        message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.` 
      });
    }

    // OTP verified successfully
    otpStorage.delete(email);

    // Update user verification status if user exists
    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { isVerified: true, verifiedAt: new Date() }
    );

    res.json({ 
      message: 'OTP verified successfully',
      verified: true 
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Enhanced registration endpoint with OTP verification
router.post('/register', async (req, res) => {
  try {
    const { userType, name, email, password, phone, parentEmail, otp } = req.body;

    // Validate required fields
    if (!userType || !name || !email || !password) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Validate user type
    const validUserTypes = ['patient', 'parent', 'doctor'];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if OTP is verified
    const storedOtpData = otpStorage.get(email);
    if (!storedOtpData || storedOtpData.otp !== otp) {
      return res.status(400).json({ message: 'OTP verification required. Please verify your email first.' });
    }

    // Remove OTP after successful verification for registration
    otpStorage.delete(email);

    // Check if user already exists (case insensitive)
    const existingUser = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } 
    });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Enhanced parent email validation for patients
    if (userType === 'patient') {
      if (!parentEmail) {
        return res.status(400).json({ 
          message: 'Parent/Guardian email is required for patient registration' 
        });
      }

      if (!emailRegex.test(parentEmail)) {
        return res.status(400).json({ message: 'Invalid parent email format' });
      }

      if (parentEmail.toLowerCase() === email.toLowerCase()) {
        return res.status(400).json({ 
          message: 'Parent email cannot be the same as patient email' 
        });
      }

      // Check if parent email exists and is a parent
      const parentUser = await User.findOne({ 
        email: { $regex: new RegExp(`^${parentEmail}$`, 'i') } 
      });
      
      if (!parentUser) {
        return res.status(400).json({ 
          message: 'The provided parent email is not registered. Please ask your parent to register first.' 
        });
      }

      if (parentUser.userType !== 'parent') {
        return res.status(400).json({ 
          message: 'The provided email belongs to a patient, not a parent. Please provide a parent email.' 
        });
      }
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Create user with verified status
    const user = new User({ 
      userType, 
      name, 
      email: email.toLowerCase(), 
      password, 
      phone,
      isVerified: true,
      verifiedAt: new Date()
    });
    await user.save();

    // Handle parent-patient linking
    if (userType === 'patient' && parentEmail) {
      try {
        const parentUser = await User.findOne({ 
          email: { $regex: new RegExp(`^${parentEmail}$`, 'i') } 
        });

        if (parentUser && parentUser.userType === 'parent') {
          // Create bidirectional relationship
          if (!parentUser.parentOf.includes(user._id)) {
            parentUser.parentOf.push(user._id);
            await parentUser.save();
          }

          if (!user.managedBy.includes(parentUser._id)) {
            user.managedBy.push(parentUser._id);
            await user.save();
          }

          console.log(`✅ Linked patient ${email} to parent ${parentEmail}`);
        }
      } catch (relationshipError) {
        console.error('Relationship creation error:', relationshipError);
        // Continue registration even if linking fails
      }
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        userType: user.userType,
        email: user.email,
        isVerified: user.isVerified
      },
      message: userType === 'patient' ? 
        'Registration successful! Your parent has been linked to your account.' : 
        'Registration successful!'
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error: ' + Object.values(error.errors).map(e => e.message).join(', ') 
      });
    }
    
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user (case insensitive email search)
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } 
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    if (user.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        userType: user.userType, 
        email: user.email,
        isVerified: user.isVerified
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Endpoint to check if an email is registered as a parent
router.post('/check-parent', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } 
    });

    if (!user) {
      return res.json({ 
        exists: false, 
        message: 'Email not registered. Please ask this person to register as a parent first.' 
      });
    }

    if (user.userType !== 'parent') {
      return res.json({ 
        exists: true, 
        isParent: false,
        message: 'This email belongs to a patient, not a parent. Please provide a parent email.' 
      });
    }

    res.json({ 
      exists: true, 
      isParent: true,
      parentName: user.name,
      message: 'Valid parent email' 
    });

  } catch (error) {
    console.error('Check parent error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;