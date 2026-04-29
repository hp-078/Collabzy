// backend/controllers/auth.controller.otp.js
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const PendingUser = require('../models/PendingUser.model');
const ForgotPasswordRequest = require('../models/ForgotPasswordRequest.model');
const InfluencerProfile = require('../models/InfluencerProfile.model');
const BrandProfile = require('../models/BrandProfile.model');
const { generateOTPWithExpiry, verifyOTP } = require('../services/otp.service');
const { sendOTPEmail } = require('../config/email');
const bcrypt = require('bcrypt');

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'collabzy-secret-key',
    { expiresIn: '7d' }
  );
};

/**
 * Register new user - Send OTP
 * POST /api/auth/register-send-otp
 */
exports.registerSendOTP = async (req, res) => {
  try {
    const { name, companyName, email, password, role } = req.body;

    // Validate required fields
    const userName = role === 'brand' ? companyName : name;
    
    if (!userName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: ' + 
                 (role === 'brand' ? 'companyName' : 'name') + 
                 ', email, password, role'
      });
    }

    // Validate role
    if (!['influencer', 'brand'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "influencer" or "brand"'
      });
    }

    // Check if a verified user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && existingUser.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Look for a pending registration
    let pending = await PendingUser.findOne({ email: email.toLowerCase() });

    // Generate OTP
    const { otp, otpExpiry, expiresIn } = generateOTPWithExpiry();

    // If a pending registration exists, update OTP and optionally update password/name
    if (pending) {
      // If OTP still valid, update pending OTP and fields
      pending.otp = otp;
      pending.otpExpiry = otpExpiry;
      // Update fields if new values provided
      if (password) pending.password = password;
      if (userName) pending.name = userName;
      await pending.save();
    } else {
      // No pending registration - create one (password stored temporarily until verification)
      pending = await PendingUser.create({
        name: userName,
        email: email.toLowerCase(),
        password, // stored temporarily; will be used to create final User on verification
        role,
        otp,
        otpExpiry
      });
    }

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, userName);
    } catch (emailError) {
      console.error('❌ Email send failed:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.',
        error: emailError.message
      });
    }

    // Return success without revealing OTP (in production)
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email',
      email: email,
      expiresIn,
      // Note: In production, don't send OTP back. This is only for development/testing
      ...(process.env.NODE_ENV !== 'production' && { otp }) // Only in development
    });
  } catch (error) {
    console.error('❌ Register OTP error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.',
      error: error.message
    });
  }
};

/**
 * Verify OTP and Complete Registration
 * POST /api/auth/verify-otp
 */
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Find pending registration first
    const pending = await PendingUser.findOne({ email: email.toLowerCase() });

    if (!pending) {
      return res.status(404).json({
        success: false,
        message: 'Pending registration not found. Please register first.'
      });
    }

    // Verify OTP against pending record
    const verification = verifyOTP(pending.otp, otp, pending.otpExpiry);
    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }

    // Create final user from pending registration
    // Use password from pending (plain) so User model pre-save will hash it
    const newUser = await User.create({
      name: pending.name,
      email: pending.email,
      password: pending.password,
      role: pending.role,
      emailVerified: true
    });

    // Remove pending registration
    await PendingUser.deleteOne({ _id: pending._id });

    // assign user reference to newUser for the rest of the flow
    const user = newUser;

    // Auto-create profile based on role
    let profile = null;
    try {
      if (user.role === 'influencer') {
        profile = await InfluencerProfile.create({
          user: user._id,
          name: user.name,
          bio: '',
          niche: [],
          platformType: 'Instagram',
          youtubeUrl: '',
          instagramUrl: ''
        });
        console.log('✅ Influencer profile created:', profile._id);
      } else if (user.role === 'brand') {
        profile = await BrandProfile.create({
          user: user._id,
          companyName: user.name,
          description: '',
          location: '',
          logo: '',
          websiteUrl: '',
          contactPerson: {
            name: '',
            email: user.email,
            phone: ''
          }
        });
        console.log('✅ Brand profile created:', profile._id);
      }
    } catch (profileError) {
      console.error('⚠️ Profile creation error:', profileError);
      // Don't fail OTP verification if profile creation fails
    }

    // Generate token
    const token = generateToken(user._id);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        avatar: user.avatar,
        createdAt: user.createdAt,
        hasProfile: !!profile,
        profile: profile || null
      }
    });
  } catch (error) {
    console.error('❌ OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed. Please try again.',
      error: error.message
    });
  }
};

/**
 * Resend OTP
 * POST /api/auth/resend-otp
 */
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // First look for a pending registration
    let pending = await PendingUser.findOne({ email: email.toLowerCase() });

    if (pending) {
      if (pending.otpExpiry && new Date() < pending.otpExpiry) {
        // allow resending by generating a fresh OTP
      }

      const { otp, otpExpiry, expiresIn } = generateOTPWithExpiry();
      pending.otp = otp;
      pending.otpExpiry = otpExpiry;
      await pending.save();

      try {
        await sendOTPEmail(email, otp, pending.name);
      } catch (emailError) {
        console.error('❌ Email send failed:', emailError);
        return res.status(500).json({
          success: false,
          message: 'Failed to resend OTP. Please try again.',
          error: emailError.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'OTP resent successfully to your email',
        email: email,
        expiresIn,
        ...(process.env.NODE_ENV !== 'production' && { otp })
      });
    }

    // If no pending registration, fall back to legacy user entries
    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiry');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    // Generate new OTP for legacy unverified user
    const { otp, otpExpiry, expiresIn } = generateOTPWithExpiry();

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, user.name);
    } catch (emailError) {
      console.error('❌ Email send failed:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to resend OTP. Please try again.',
        error: emailError.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully to your email',
      email: email,
      expiresIn,
      ...(process.env.NODE_ENV !== 'production' && { otp })
    });
  } catch (error) {
    console.error('❌ Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP. Please try again.',
      error: error.message
    });
  }
};

/**
 * Login user (existing flow - kept for backward compatibility)
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user with password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email first',
        email: user.email
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      error: error.message
    });
  }
};

/**
 * Get current user
 * GET /api/auth/me
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data',
      error: error.message
    });
  }
};

/**
 * Update password
 * PUT /api/auth/password
 */
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    const user = await User.findById(req.userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('❌ Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password',
      error: error.message
    });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
exports.logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
};

/**
 * Forgot Password - Send OTP to email
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find verified user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email first'
      });
    }

    // Generate OTP
    const { otp, otpExpiry, expiresIn } = generateOTPWithExpiry();

    // Create or update forgot password request
    let forgotRequest = await ForgotPasswordRequest.findOne({ email: email.toLowerCase() });

    if (forgotRequest) {
      // Update existing request
      forgotRequest.otp = otp;
      forgotRequest.otpExpiry = otpExpiry;
      await forgotRequest.save();
    } else {
      // Create new request
      forgotRequest = await ForgotPasswordRequest.create({
        email: email.toLowerCase(),
        userId: user._id,
        otp,
        otpExpiry
      });
    }

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, user.name);
    } catch (emailError) {
      console.error('❌ Email send failed:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.',
        error: emailError.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email',
      email: email,
      expiresIn,
      ...(process.env.NODE_ENV !== 'production' && { otp })
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process forgot password request',
      error: error.message
    });
  }
};

/**
 * Verify Forgot Password OTP and Reset Password
 * POST /api/auth/verify-forgot-otp
 */
exports.verifyForgotOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Validate input
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required'
      });
    }

    // Find forgot password request
    const forgotRequest = await ForgotPasswordRequest.findOne({ email: email.toLowerCase() });

    if (!forgotRequest) {
      return res.status(404).json({
        success: false,
        message: 'Password reset request not found. Please initiate forgot password first.'
      });
    }

    // Verify OTP
    const verification = verifyOTP(forgotRequest.otp, otp, forgotRequest.otpExpiry);

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }

    // Find user and update password
    const user = await User.findById(forgotRequest.userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    // Delete forgot password request
    await ForgotPasswordRequest.deleteOne({ _id: forgotRequest._id });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Verify forgot password OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed. Please try again.',
      error: error.message
    });
  }
};

/**
 * Resend Forgot Password OTP
 * POST /api/auth/resend-forgot-otp
 */
exports.resendForgotOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find forgot password request
    const forgotRequest = await ForgotPasswordRequest.findOne({ email: email.toLowerCase() });

    if (!forgotRequest) {
      return res.status(404).json({
        success: false,
        message: 'Password reset request not found. Please initiate forgot password first.'
      });
    }

    // Generate new OTP
    const { otp, otpExpiry, expiresIn } = generateOTPWithExpiry();

    forgotRequest.otp = otp;
    forgotRequest.otpExpiry = otpExpiry;
    await forgotRequest.save();

    // Find user for name in email
    const user = await User.findById(forgotRequest.userId);

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, user.name);
    } catch (emailError) {
      console.error('❌ Email send failed:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to resend OTP. Please try again.',
        error: emailError.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully to your email',
      email: email,
      expiresIn,
      ...(process.env.NODE_ENV !== 'production' && { otp })
    });
  } catch (error) {
    console.error('❌ Resend forgot password OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP. Please try again.',
      error: error.message
    });
  }
};
