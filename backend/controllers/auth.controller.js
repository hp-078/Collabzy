import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import InfluencerProfile from '../models/InfluencerProfile.model.js';
import BrandProfile from '../models/BrandProfile.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { email, password, role, name } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered'
    });
  }

  // Create user
  const user = await User.create({
    email,
    password,
    role
  });

  // Create role-specific profile
  if (role === 'influencer') {
    const influencerProfile = await InfluencerProfile.create({
      userId: user._id,
      name: name || 'New Influencer',
      niche: 'Other',
      platformType: 'YouTube'
    });
    user.influencerProfile = influencerProfile._id;
  } else if (role === 'brand') {
    const brandProfile = await BrandProfile.create({
      userId: user._id,
      companyName: name || 'New Brand'
    });
    user.brandProfile = brandProfile._id;
  }

  await user.save();

  // Generate token
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profileCompleted: user.profileCompleted
      }
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user and explicitly select password
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check if account is active
  if (user.status !== 'active') {
    return res.status(403).json({
      success: false,
      message: `Account is ${user.status}. Please contact support.`
    });
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profileCompleted: user.profileCompleted,
        lastLogin: user.lastLogin
      }
    }
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate(req.user.role === 'influencer' ? 'influencerProfile' : 'brandProfile');

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  // In a JWT setup, logout is handled client-side by removing the token
  // We can add token blacklisting here if needed in the future
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default { register, login, getMe, logout };
