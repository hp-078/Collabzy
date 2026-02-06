const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', requireAuth, authController.getMe);
router.put('/password', requireAuth, authController.updatePassword);
router.post('/logout', requireAuth, authController.logout);

module.exports = router;
