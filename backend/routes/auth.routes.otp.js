// backend/routes/auth.routes.otp.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller.otp');
const { requireAuth } = require('../middleware/auth.middleware');
const { validateRegister, validateLogin, validateUpdatePassword } = require('../middleware/validation.middleware');

// Public routes - OTP based registration
router.post('/register-send-otp', validateRegister, authController.registerSendOTP);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);

// Public routes - Forgot Password
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-forgot-otp', authController.verifyForgotOTP);
router.post('/resend-forgot-otp', authController.resendForgotOTP);

// Public routes - Login
router.post('/login', validateLogin, authController.login);

// Protected routes
router.get('/me', requireAuth, authController.getMe);
router.put('/password', requireAuth, validateUpdatePassword, authController.updatePassword);
router.post('/logout', requireAuth, authController.logout);

module.exports = router;
