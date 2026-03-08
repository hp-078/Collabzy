// backend/controllers/auth.controller.enhanced.js
// Enhanced authentication controller with refresh token support

const bcrypt = require('bcrypt');
const User = require('../models/User.model');
const InfluencerProfile = require('../models/InfluencerProfile.model');
const BrandProfile = require('../models/BrandProfile.model');
const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    setRefreshTokenCookie,
    clearRefreshTokenCookie
} = require('../utils/tokens');

/**
 * Register new user with email verification
 */
exports.register = async (req, res) => {
    try {
        const { email, password, role, fullName, companyName } = req.body;

        // Validate input
        if (!email || !password || !role) {
            return res.status(400).json({
                success: false,
                error: 'Email, password, and role are required'
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'Email already registered'
            });
        }

        // Validate role
        if (!['influencer', 'brand'].includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Role must be influencer or brand'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await User.create({
            email: email.toLowerCase(),
            password: hashedPassword,
            role,
            tokenVersion: 0,
            emailVerified: false
        });

        // Create role-specific profile
        if (role === 'influencer') {
            await InfluencerProfile.create({
                userId: user._id,
                fullName: fullName || '',
                trustScore: 50 // Starting trust score
            });
        } else if (role === 'brand') {
            await BrandProfile.create({
                userId: user._id,
                companyName: companyName || ''
            });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Set refresh token cookie
        setRefreshTokenCookie(res, refreshToken);

        // TODO: Send email verification link
        // await EmailService.sendVerificationEmail(user.email, verificationToken);

        return res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                emailVerified: user.emailVerified
            },
            accessToken
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            success: false,
            error: 'Registration failed'
        });
    }
};

/**
 * Login with email and password
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Check if suspended
        if (user.status === 'suspended') {
            return res.status(403).json({
                success: false,
                error: 'Account suspended. Contact support.'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Set refresh token cookie
        setRefreshTokenCookie(res, refreshToken);

        return res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                emailVerified: user.emailVerified
            },
            accessToken
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            error: 'Login failed'
        });
    }
};

/**
 * Refresh access token using refresh token
 */
exports.refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                error: 'Refresh token required'
            });
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            clearRefreshTokenCookie(res);
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired refresh token'
            });
        }

        // Find user
        const user = await User.findById(decoded.userId);
        if (!user) {
            clearRefreshTokenCookie(res);
            return res.status(401).json({
                success: false,
                error: 'User not found'
            });
        }

        // Check token version (for revocation)
        if (decoded.tokenVersion !== user.tokenVersion) {
            clearRefreshTokenCookie(res);
            return res.status(401).json({
                success: false,
                error: 'Token revoked. Please login again.'
            });
        }

        // Generate new access token
        const newAccessToken = generateAccessToken(user);

        return res.json({
            success: true,
            accessToken: newAccessToken
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        return res.status(500).json({
            success: false,
            error: 'Token refresh failed'
        });
    }
};

/**
 * Logout - clear refresh token cookie
 */
exports.logout = async (req, res) => {
    try {
        clearRefreshTokenCookie(res);

        return res.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({
            success: false,
            error: 'Logout failed'
        });
    }
};

/**
 * Revoke all refresh tokens for a user (force re-login on all devices)
 */
exports.revokeTokens = async (req, res) => {
    try {
        const userId = req.userId;

        // Increment token version to invalidate all existing refresh tokens
        await User.findByIdAndUpdate(userId, {
            $inc: { tokenVersion: 1 }
        });

        clearRefreshTokenCookie(res);

        return res.json({
            success: true,
            message: 'All sessions revoked. Please login again.'
        });
    } catch (error) {
        console.error('Revoke tokens error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to revoke tokens'
        });
    }
};

/**
 * Get current authenticated user
 */
exports.getCurrentUser = async (req, res) => {
    try {
        const user = req.user;

        let profile = null;
        if (user.role === 'influencer') {
            profile = await InfluencerProfile.findOne({ userId: user._id });
        } else if (user.role === 'brand') {
            profile = await BrandProfile.findOne({ userId: user._id });
        }

        return res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                emailVerified: user.emailVerified,
                status: user.status
            },
            profile
        });
    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch user'
        });
    }
};

/**
 * Change password (requires current password)
 */
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.userId;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'New password must be at least 8 characters'
            });
        }

        // Get user with password
        const user = await User.findById(userId);

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Current password is incorrect'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password and revoke all tokens
        user.password = hashedPassword;
        user.tokenVersion += 1;
        await user.save();

        clearRefreshTokenCookie(res);

        return res.json({
            success: true,
            message: 'Password changed successfully. Please login again.'
        });
    } catch (error) {
        console.error('Change password error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to change password'
        });
    }
};

/**
 * Verify email with token (placeholder)
 */
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        // TODO: Verify email token and update user
        // const decoded = jwt.verify(token, process.env.EMAIL_SECRET);
        // await User.findByIdAndUpdate(decoded.userId, { emailVerified: true });

        return res.json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        console.error('Email verification error:', error);
        return res.status(400).json({
            success: false,
            error: 'Invalid or expired verification token'
        });
    }
};

/**
 * Request password reset (placeholder)
 */
exports.requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            // Don't reveal if email exists
            return res.json({
                success: true,
                message: 'If email exists, reset link has been sent'
            });
        }

        // TODO: Generate reset token and send email
        // const resetToken = jwt.sign({ userId: user._id }, process.env.RESET_SECRET, { expiresIn: '1h' });
        // await EmailService.sendPasswordReset(email, resetToken);

        return res.json({
            success: true,
            message: 'If email exists, reset link has been sent'
        });
    } catch (error) {
        console.error('Password reset request error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to process request'
        });
    }
};

/**
 * Reset password with token (placeholder)
 */
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 8 characters'
            });
        }

        // TODO: Verify reset token and update password
        // const decoded = jwt.verify(token, process.env.RESET_SECRET);
        // const hashedPassword = await bcrypt.hash(newPassword, 12);
        // await User.findByIdAndUpdate(decoded.userId, { password: hashedPassword, tokenVersion: { $inc: 1 } });

        return res.json({
            success: true,
            message: 'Password reset successful'
        });
    } catch (error) {
        console.error('Password reset error:', error);
        return res.status(400).json({
            success: false,
            error: 'Invalid or expired reset token'
        });
    }
};
