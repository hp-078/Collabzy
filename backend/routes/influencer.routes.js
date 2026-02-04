const express = require('express');
const router = express.Router();
const influencerController = require('../controllers/influencer.controller');
const { requireAuth, requireInfluencer } = require('../middleware/auth.middleware');

// Public routes - anyone can view influencer profiles
router.get('/list', influencerController.listInfluencers);
router.get('/:id', influencerController.getInfluencerById);

// Protected routes - require authentication
router.use(requireAuth);

// Influencer-only routes - require influencer role
router.get('/profile/me', requireInfluencer, influencerController.getOwnProfile);
router.put('/profile', requireInfluencer, influencerController.updateProfile);
router.post('/profile', requireInfluencer, influencerController.createProfile);

// Profile fetching routes - influencer only
router.post('/fetch-youtube', requireInfluencer, influencerController.fetchYouTubeProfile);
router.post('/fetch-instagram', requireInfluencer, influencerController.fetchInstagramProfile);

module.exports = router;
