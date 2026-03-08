// backend/routes/auth.routes.enhanced.js
// Enhanced authentication routes with refresh token support

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller.enhanced');
const { authenticateToken } = require('../middleware/auth.middleware.enhanced');
const rateLimit = require('express-rate-limit');

// Rate limiters for auth endpoints
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Too many login attempts. Please try again after 15 minutes.',
    skipSuccessfulRequests: true
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations
    message: 'Too many registration attempts. Please try again later.'
});

const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts
    message: 'Too many password reset requests. Please try again later.'
});

// Public routes
router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

// Password reset routes (public)
router.post('/request-password-reset', passwordResetLimiter, authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

// Email verification
router.get('/verify-email/:token', authController.verifyEmail);

// Protected routes (require authentication)
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/change-password', authenticateToken, authController.changePassword);
router.post('/revoke-tokens', authenticateToken, authController.revokeTokens);

module.exports = router;
