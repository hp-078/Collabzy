const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { validateRegister, validateLogin, validateUpdatePassword } = require('../middleware/validation.middleware');

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);

// Protected routes
router.get('/me', requireAuth, authController.getMe);
router.post('/logout', requireAuth, authController.logout);
router.put('/password', requireAuth, validateUpdatePassword, authController.updatePassword);

module.exports = router;
