const express = require('express');
const router = express.Router();
const influencerController = require('../controllers/influencer.controller');
const { requireAuth, requireInfluencer, optionalAuth } = require('../middleware/auth.middleware');

// Public routes
router.get('/list', optionalAuth, influencerController.listInfluencers);
router.get('/:id', influencerController.getProfileById);

// Protected routes (require influencer role)
router.post('/profile', requireAuth, requireInfluencer, influencerController.createProfile);
router.put('/profile', requireAuth, requireInfluencer, influencerController.updateProfile);
router.get('/profile/me', requireAuth, requireInfluencer, influencerController.getOwnProfile);

// Social media integration
router.post('/fetch-youtube', requireAuth, requireInfluencer, influencerController.fetchYouTubeProfile);
router.post('/fetch-instagram', requireAuth, requireInfluencer, influencerController.fetchInstagramProfile);

module.exports = router;
