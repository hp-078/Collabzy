const youtubeService = require('../services/youtube.service');

/**
 * @desc    Fetch YouTube channel profile and analytics
 * @route   POST /api/youtube/fetch-profile
 * @access  Private (Influencer only)
 */
const fetchYouTubeProfile = async (req, res) => {
  try {
    const { youtubeUrl } = req.body;

    // Validation
    if (!youtubeUrl) {
      return res.status(400).json({
        success: false,
        message: 'YouTube URL is required',
      });
    }

    // Validate URL format
    if (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid YouTube URL format',
      });
    }

    // Fetch profile data from YouTube API
    const result = await youtubeService.fetchCompleteProfile(youtubeUrl);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
        quotaUsed: result.quotaUsed,
      });
    }

    // Return successful response
    return res.status(200).json({
      success: true,
      message: 'YouTube profile fetched successfully',
      data: result.data,
    });
  } catch (error) {
    console.error('Error fetching YouTube profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching YouTube profile',
      error: error.message,
    });
  }
};

/**
 * @desc    Analyze a specific YouTube video
 * @route   POST /api/youtube/analyze-video
 * @access  Private (Influencer/Brand)
 */
const analyzeYouTubeVideo = async (req, res) => {
  try {
    const { videoUrl } = req.body;

    // Validation
    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Video URL is required',
      });
    }

    // Validate URL format
    if (!videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid YouTube video URL format',
      });
    }

    // Analyze video
    const result = await youtubeService.analyzeVideo(videoUrl);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
        quotaUsed: result.quotaUsed,
      });
    }

    // Return successful response
    return res.status(200).json({
      success: true,
      message: 'Video analyzed successfully',
      data: result.data,
    });
  } catch (error) {
    console.error('Error analyzing YouTube video:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while analyzing video',
      error: error.message,
    });
  }
};

/**
 * @desc    Get current YouTube API quota usage
 * @route   GET /api/youtube/quota
 * @access  Private (Admin only)
 */
const getQuotaUsage = async (req, res) => {
  try {
    const quotaInfo = youtubeService.getQuotaUsage();

    return res.status(200).json({
      success: true,
      data: quotaInfo,
    });
  } catch (error) {
    console.error('Error fetching quota usage:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching quota usage',
      error: error.message,
    });
  }
};

module.exports = {
  fetchYouTubeProfile,
  analyzeYouTubeVideo,
  getQuotaUsage,
};
