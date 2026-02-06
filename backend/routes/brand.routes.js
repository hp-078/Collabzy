const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brand.controller');
const { requireAuth, requireBrand, optionalAuth } = require('../middleware/auth.middleware');

// Public routes
router.get('/list', optionalAuth, brandController.listBrands);

// Protected routes (require brand role) - MUST be before /:id
router.get('/profile/me', requireAuth, requireBrand, brandController.getOwnProfile);
router.put('/profile', requireAuth, requireBrand, brandController.updateProfile);

// Public by-ID route (/:id pattern comes LAST)
router.get('/:id', brandController.getProfileById);

module.exports = router;
