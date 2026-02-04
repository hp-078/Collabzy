const instagramService = require('../services/instagram.service');

/**
 * @desc    Fetch Instagram profile and analytics
 * @route   POST /api/instagram/fetch-profile
 * @access  Private (Influencer only)
 */
const fetchInstagramProfile = async (req, res) => {
  try {
    const { instagramUrl } = req.body;

    // Validation
    if (!instagramUrl) {
      return res.status(400).json({
        success: false,
        message: 'Instagram URL is required',
      });
    }

    // Validate URL format
    if (!instagramUrl.includes('instagram.com')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Instagram URL format',
      });
    }

    // Fetch profile data
    const result = await instagramService.fetchCompleteProfile(instagramUrl);

    if (!result.success && result.requiresManualInput) {
      // Return structure for manual input
      return res.status(200).json({
        success: true,
        requiresManualInput: true,
        username: result.username,
        profileUrl: result.profileUrl,
        message: result.message,
      });
    }

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    // Return successful response
    return res.status(200).json({
      success: true,
      message: 'Instagram profile fetched successfully',
      method: result.method,
      data: result.data,
    });
  } catch (error) {
    console.error('Error fetching Instagram profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching Instagram profile',
      error: error.message,
    });
  }
};

/**
 * @desc    Submit manual Instagram profile data
 * @route   POST /api/instagram/manual-profile
 * @access  Private (Influencer only)
 */
const submitManualProfile = async (req, res) => {
  try {
    const { username, followers, following, posts, name, biography, profilePicture } = req.body;

    // Validation
    if (!username || !followers) {
      return res.status(400).json({
        success: false,
        message: 'Username and follower count are required',
      });
    }

    // Create manual profile
    const result = instagramService.createManualProfile({
      username,
      followers,
      following,
      posts,
      name,
      biography,
      profilePicture,
    });

    return res.status(200).json({
      success: true,
      message: 'Instagram profile data saved successfully',
      data: result.data,
    });
  } catch (error) {
    console.error('Error saving manual profile:', error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Analyze a specific Instagram post
 * @route   POST /api/instagram/analyze-post
 * @access  Private (Influencer/Brand)
 */
const analyzeInstagramPost = async (req, res) => {
  try {
    const { postUrl } = req.body;

    // Validation
    if (!postUrl) {
      return res.status(400).json({
        success: false,
        message: 'Post URL is required',
      });
    }

    // Validate URL format
    if (!postUrl.includes('instagram.com')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Instagram post URL format',
      });
    }

    // Analyze post
    const result = await instagramService.analyzePost(postUrl);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    // Return successful response
    return res.status(200).json({
      success: true,
      message: 'Post analyzed successfully',
      data: result.data,
    });
  } catch (error) {
    console.error('Error analyzing Instagram post:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while analyzing post',
      error: error.message,
    });
  }
};

module.exports = {
  fetchInstagramProfile,
  submitManualProfile,
  analyzeInstagramPost,
};
