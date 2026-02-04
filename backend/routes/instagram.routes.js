const express = require('express');
const router = express.Router();
const {
  fetchInstagramProfile,
  submitManualProfile,
  analyzeInstagramPost,
} = require('../controllers/instagram.controller');
const { requireAuth, requireInfluencer } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/instagram/fetch-profile
 * @desc    Fetch Instagram profile and analytics
 * @access  Private (Influencer only)
 */
router.post('/fetch-profile', requireAuth, requireInfluencer, fetchInstagramProfile);

/**
 * @route   POST /api/instagram/manual-profile
 * @desc    Submit manual Instagram profile data
 * @access  Private (Influencer only)
 */
router.post('/manual-profile', requireAuth, requireInfluencer, submitManualProfile);

/**
 * @route   POST /api/instagram/analyze-post
 * @desc    Analyze a specific Instagram post
 * @access  Private (Authenticated users)
 */
router.post('/analyze-post', requireAuth, analyzeInstagramPost);

module.exports = router;
