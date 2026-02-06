const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const InfluencerProfile = require('../models/InfluencerProfile.model');
const BrandProfile = require('../models/BrandProfile.model');

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
 * Register new user
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { name, companyName, email, password, role } = req.body;

    // Validate required fields
    // Accept either 'name' (for influencers) or 'companyName' (for brands)
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
    if (!['influencer', 'brand', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "influencer", "brand", or "admin"'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create user
    const user = await User.create({
      name: userName,
      email: email.toLowerCase(),
      password,
      role
    });

    // Auto-create profile based on role
    let profile = null;
    try {
      if (role === 'influencer') {
        profile = await InfluencerProfile.create({
          user: user._id,
          name: userName,
          bio: '',
          niche: [], // Changed from 'category' to 'niche' to match model
          platformType: 'Instagram', // Provide default value from enum
          youtubeUrl: '',
          instagramUrl: ''
        });
        console.log('✅ Influencer profile created:', profile._id);
      } else if (role === 'brand') {
        profile = await BrandProfile.create({
          user: user._id,
          companyName: userName,
          description: '',
          // Don't include 'industry' - it has enum validation, leave it undefined
          // Don't include 'companySize' - it has enum validation, leave it undefined
          location: '',
          logo: '',
          websiteUrl: '',
          contactPerson: {
            name: '',
            email: user.email, // Pre-fill with user's email
            phone: ''
          }
        });
        console.log('✅ Brand profile created:', profile._id);
      }
    } catch (profileError) {
      console.error('⚠️ Profile creation error:', profileError);
      console.error('⚠️ Error details:', {
        message: profileError.message,
        errors: profileError.errors,
        stack: profileError.stack
      });
      // Don't fail registration if profile creation fails
      // User can create/complete profile later
    }

    // Generate token
    const token = generateToken(user._id);

    // Return response
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
        hasProfile: !!profile,
        profile: profile || null
      }
    });
  } catch (error) {
    console.error('Register error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};

/**
 * Login user
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

    // Get profile data if exists
    let profile = null;
    if (user.role === 'influencer') {
      profile = await InfluencerProfile.findOne({ user: user._id });
    } else if (user.role === 'brand') {
      profile = await BrandProfile.findOne({ user: user._id });
    }

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        hasProfile: !!profile,
        profile: profile || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

/**
 * Get current user
 * GET /api/auth/me
 */
exports.getMe = async (req, res) => {
  try {
    const user = req.user;

    // Get profile data
    let profile = null;
    if (user.role === 'influencer') {
      profile = await InfluencerProfile.findOne({ user: user._id });
    } else if (user.role === 'brand') {
      profile = await BrandProfile.findOne({ user: user._id });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
        createdAt: user.createdAt,
        hasProfile: !!profile,
        profile: profile || null
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data'
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
        message: 'Please provide current password and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password'
    });
  }
};

/**
 * Logout (client-side action, just return success)
 * POST /api/auth/logout
 */
exports.logout = (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};
