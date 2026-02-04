const express = require('express');
const router = express.Router();
const {
  fetchYouTubeProfile,
  analyzeYouTubeVideo,
  getQuotaUsage,
} = require('../controllers/youtube.controller');
const { requireAuth, requireInfluencer, requireAdmin } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/youtube/fetch-profile
 * @desc    Fetch YouTube channel profile and analytics
 * @access  Private (Influencer only)
 */
router.post('/fetch-profile', requireAuth, requireInfluencer, fetchYouTubeProfile);

/**
 * @route   POST /api/youtube/analyze-video
 * @desc    Analyze a specific YouTube video
 * @access  Private (Authenticated users)
 */
router.post('/analyze-video', requireAuth, analyzeYouTubeVideo);

/**
 * @route   GET /api/youtube/quota
 * @desc    Get current YouTube API quota usage
 * @access  Private (Admin only)
 */
router.get('/quota', requireAuth, requireAdmin, getQuotaUsage);

module.exports = router;
