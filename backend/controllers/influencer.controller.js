import InfluencerProfile from '../models/InfluencerProfile.model.js';
import User from '../models/User.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { fetchCompleteChannelProfile } from '../services/youtube.service.js';

// @desc    Get influencer profile
// @route   GET /api/influencers/profile
// @access  Private (Influencer only)
export const getProfile = asyncHandler(async (req, res) => {
  const profile = await InfluencerProfile.findOne({ userId: req.user._id });

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: 'Profile not found'
    });
  }

  res.status(200).json({
    success: true,
    data: { profile }
  });
});

// @desc    Create or update influencer profile
// @route   POST /api/influencers/profile
// @access  Private (Influencer only)
export const createOrUpdateProfile = asyncHandler(async (req, res) => {
  const {
    name,
    bio,
    profileImage,
    niche,
    platformType,
    youtubeChannelUrl,
    instagramHandle,
    instagramUrl,
    contentTypes,
    portfolioLinks
  } = req.body;

  // Find or create profile
  let profile = await InfluencerProfile.findOne({ userId: req.user._id });

  const profileData = {
    userId: req.user._id,
    name,
    bio,
    profileImage,
    niche,
    platformType,
    contentTypes,
    portfolioLinks
  };

  // Add YouTube data if provided
  if (youtubeChannelUrl) {
    profileData.youtubeChannelUrl = youtubeChannelUrl;
  }

  // Add Instagram data if provided
  if (instagramHandle) {
    profileData.instagramHandle = instagramHandle;
    profileData.instagramUrl = instagramUrl || `https://instagram.com/${instagramHandle}`;
  }

  if (profile) {
    // Update existing profile
    profile = await InfluencerProfile.findOneAndUpdate(
      { userId: req.user._id },
      profileData,
      { new: true, runValidators: true }
    );
  } else {
    // Create new profile
    profile = await InfluencerProfile.create(profileData);
  }

  // Update user's profileCompleted status
  const user = await User.findById(req.user._id);
  if (name && niche && (youtubeChannelUrl || instagramHandle)) {
    user.profileCompleted = true;
    await user.save();
  }

  res.status(200).json({
    success: true,
    message: profile ? 'Profile updated successfully' : 'Profile created successfully',
    data: { profile }
  });
});

// @desc    Fetch YouTube profile data automatically
// @route   POST /api/influencers/fetch-youtube
// @access  Private (Influencer only)
export const fetchYouTubeProfile = asyncHandler(async (req, res) => {
  const { youtubeChannelUrl } = req.body;

  if (!youtubeChannelUrl) {
    return res.status(400).json({
      success: false,
      message: 'YouTube channel URL is required'
    });
  }

  // Check if API key is configured
  if (!process.env.YOUTUBE_API_KEY) {
    return res.status(503).json({
      success: false,
      message: 'YouTube API is not configured. Please contact administrator.'
    });
  }

  // Fetch channel data from YouTube
  const result = await fetchCompleteChannelProfile(youtubeChannelUrl);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.error || 'Failed to fetch YouTube channel data'
    });
  }

  // Update influencer profile with fetched data
  const profile = await InfluencerProfile.findOne({ userId: req.user._id });

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: 'Please create your profile first'
    });
  }

  // Update profile with YouTube data
  profile.youtubeChannelUrl = youtubeChannelUrl;
  profile.youtubeChannelId = result.data.channelId;
  profile.subscriberCount = result.data.subscriberCount;
  profile.totalViews = result.data.totalViews;
  profile.videoCount = result.data.videoCount;
  profile.averageViews = result.data.averageViews;
  profile.engagementRate = result.data.engagementRate;
  profile.lastDataFetch = new Date();
  profile.verificationStatus = 'verified';
  profile.verifiedBadge = true;
  profile.verifiedAt = new Date();

  // Auto-calculate trust score after updating stats
  profile.trustScore = profile.calculateTrustScore();

  await profile.save();

  res.status(200).json({
    success: true,
    message: 'YouTube profile data fetched successfully',
    data: {
      profile,
      fetchedData: result.data
    }
  });
});

// @desc    Analyze post/video performance
// @route   POST /api/influencers/analyze-post
// @access  Private (Influencer only)
export const analyzePost = asyncHandler(async (req, res) => {
  const { postUrl } = req.body;

  if (!postUrl) {
    return res.status(400).json({
      success: false,
      message: 'Post URL is required'
    });
  }

  // Check if it's a YouTube video
  if (postUrl.includes('youtube.com') || postUrl.includes('youtu.be')) {
    // Extract video ID
    let videoId;
    try {
      const url = new URL(postUrl);
      if (url.hostname.includes('youtu.be')) {
        videoId = url.pathname.substring(1);
      } else {
        videoId = url.searchParams.get('v');
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid YouTube URL'
      });
    }

    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract video ID from URL'
      });
    }

    // Fetch video stats
    const { fetchVideoStats } = await import('../services/youtube.service.js');
    const result = await fetchVideoStats(videoId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch video statistics'
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data
    });
  }

  // Instagram post analysis (placeholder for future)
  if (postUrl.includes('instagram.com')) {
    return res.status(501).json({
      success: false,
      message: 'Instagram post analysis coming soon. Currently requires manual entry.'
    });
  }

  res.status(400).json({
    success: false,
    message: 'Unsupported platform. Only YouTube and Instagram are supported.'
  });
});

// @desc    Get influencer by ID (public view)
// @route   GET /api/influencers/:id
// @access  Public
export const getInfluencerById = asyncHandler(async (req, res) => {
  const profile = await InfluencerProfile.findOne({ userId: req.params.id })
    .populate('userId', 'email createdAt');

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: 'Influencer not found'
    });
  }

  res.status(200).json({
    success: true,
    data: { profile }
  });
});

// @desc    Get all influencers (with filters)
// @route   GET /api/influencers
// @access  Public
export const getAllInfluencers = asyncHandler(async (req, res) => {
  const {
    niche,
    platformType,
    minFollowers,
    maxFollowers,
    minEngagement,
    minTrustScore,
    page = 1,
    limit = 20
  } = req.query;

  // Build filter query
  const filter = { verificationStatus: 'verified' };

  if (niche) filter.niche = niche;
  if (platformType && platformType !== 'Any') {
    filter.$or = [
      { platformType: platformType },
      { platformType: 'Both' }
    ];
  }
  if (minFollowers) {
    filter.$or = [
      { subscriberCount: { $gte: parseInt(minFollowers) } },
      { followerCount: { $gte: parseInt(minFollowers) } }
    ];
  }
  if (maxFollowers) {
    filter.$or = [
      { subscriberCount: { $lte: parseInt(maxFollowers) } },
      { followerCount: { $lte: parseInt(maxFollowers) } }
    ];
  }
  if (minEngagement) filter.engagementRate = { $gte: parseFloat(minEngagement) };
  if (minTrustScore) filter.trustScore = { $gte: parseInt(minTrustScore) };

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [influencers, total] = await Promise.all([
    InfluencerProfile.find(filter)
      .populate('userId', 'email')
      .sort({ trustScore: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    InfluencerProfile.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    count: influencers.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: { influencers }
  });
});

// @desc    Update trust score manually (admin only)
// @route   PUT /api/influencers/:id/trust-score
// @access  Private (Admin only)
export const updateTrustScore = asyncHandler(async (req, res) => {
  const profile = await InfluencerProfile.findOne({ userId: req.params.id });

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: 'Influencer not found'
    });
  }

  // Recalculate trust score
  profile.trustScore = profile.calculateTrustScore();
  await profile.save();

  res.status(200).json({
    success: true,
    message: 'Trust score updated successfully',
    data: {
      trustScore: profile.trustScore
    }
  });
});

export default {
  getProfile,
  createOrUpdateProfile,
  fetchYouTubeProfile,
  analyzePost,
  getInfluencerById,
  getAllInfluencers,
  updateTrustScore
};
