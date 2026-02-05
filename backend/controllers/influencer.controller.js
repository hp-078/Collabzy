const InfluencerProfile = require('../models/InfluencerProfile.model');
const User = require('../models/User.model');
const youtubeService = require('../services/youtube.service');
const instagramService = require('../services/instagram.service');

/**
 * Calculate trust score for an influencer profile
 * Base: 50 points
 * + Engagement rate bonus: 0-20 points
 * + Verified account: 10 points
 * + Past collaborations: 5 points each (max 20)
 * + Reviews: 1 point per positive, -5 per negative
 * - Low engagement: -10 points
 * - Incomplete profile: -15 points
 * Range: 0-100
 */
const calculateTrustScore = (profile) => {
  let score = 50; // Base score

  // Engagement rate bonus (0-20 points)
  if (profile.engagementRate > 0) {
    if (profile.engagementRate >= 8) {
      score += 20; // Excellent engagement (8%+)
    } else if (profile.engagementRate >= 5) {
      score += 15; // Good engagement (5-8%)
    } else if (profile.engagementRate >= 3) {
      score += 10; // Average engagement (3-5%)
    } else if (profile.engagementRate >= 1) {
      score += 5; // Low engagement (1-3%)
    } else {
      score -= 10; // Very low engagement (<1%)
    }
  }

  // Verified account bonus
  if (profile.verified) {
    score += 10;
  }

  // Past collaborations bonus (5 points each, max 20)
  const collabBonus = Math.min((profile.pastCollaborations || 0) * 5, 20);
  score += collabBonus;

  // Reviews impact
  if (profile.totalReviews > 0) {
    const positiveReviews = Math.floor((profile.averageRating || 0) >= 4 ? profile.totalReviews * 0.7 : 0);
    const negativeReviews = Math.floor((profile.averageRating || 0) < 3 ? profile.totalReviews * 0.3 : 0);
    
    score += positiveReviews;
    score -= negativeReviews * 5;
  }

  // Incomplete profile penalty
  const requiredFields = [profile.name, profile.bio, profile.niche, profile.platform];
  const missingFields = requiredFields.filter(field => !field || field.length === 0);
  if (missingFields.length > 0) {
    score -= 15;
  }

  // Cap score between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Create or initialize influencer profile
 * POST /api/influencer/profile
 */
exports.createProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if profile already exists
    const existingProfile = await InfluencerProfile.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: 'Profile already exists. Use PUT /api/influencer/profile to update.'
      });
    }

    // Create new profile
    const profileData = {
      userId,
      name: req.body.name || req.user.name,
      email: req.body.email || req.user.email,
      bio: req.body.bio || '',
      niche: req.body.niche || '',
      platform: req.body.platform || 'Multiple Platforms',
      location: req.body.location || '',
      avatar: req.body.avatar || '',
      youtubeUrl: req.body.youtubeUrl || '',
      instagramUrl: req.body.instagramUrl || '',
      website: req.body.website || '',
      services: req.body.services || [],
      verified: false,
      trustScore: 50 // Initial base score
    };

    const profile = await InfluencerProfile.create(profileData);

    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      data: profile
    });
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create profile',
      error: error.message
    });
  }
};

/**
 * Update influencer profile
 * PUT /api/influencer/profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const profile = await InfluencerProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found. Create a profile first.'
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'name', 'bio', 'niche', 'platform', 'location', 'avatar',
      'youtubeUrl', 'instagramUrl', 'website', 'services'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    // Recalculate trust score
    profile.trustScore = calculateTrustScore(profile);

    await profile.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

/**
 * Get own profile (authenticated influencer)
 * GET /api/influencer/profile/me
 */
exports.getOwnProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const profile = await InfluencerProfile.findOne({ userId }).populate('userId', 'email role');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Get own profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

/**
 * Get influencer profile by ID (public)
 * GET /api/influencer/:id
 */
exports.getInfluencerById = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await InfluencerProfile.findById(id)
      .populate('userId', 'email')
      .select('-__v');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Influencer not found'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Get influencer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch influencer',
      error: error.message
    });
  }
};

/**
 * List influencers with filters (public)
 * GET /api/influencer/list
 * Query params: niche, platform, minFollowers, maxFollowers, minEngagement, minTrustScore, search
 */
exports.listInfluencers = async (req, res) => {
  try {
    const {
      niche,
      platform,
      minFollowers,
      maxFollowers,
      minEngagement,
      minTrustScore,
      search,
      page = 1,
      limit = 20
    } = req.query;

    // Build filter object
    const filter = {};

    // Niche filter
    if (niche) {
      filter.niche = { $regex: niche, $options: 'i' };
    }

    // Platform filter
    if (platform && platform !== 'All') {
      filter.platform = { $regex: platform, $options: 'i' };
    }

    // Follower range filter
    if (minFollowers || maxFollowers) {
      filter.followers = {};
      if (minFollowers) filter.followers.$gte = parseInt(minFollowers);
      if (maxFollowers) filter.followers.$lte = parseInt(maxFollowers);
    }

    // Engagement rate filter
    if (minEngagement) {
      filter.engagementRate = { $gte: parseFloat(minEngagement) };
    }

    // Trust score filter
    if (minTrustScore) {
      filter.trustScore = { $gte: parseInt(minTrustScore) };
    }

    // Search by name
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const influencers = await InfluencerProfile.find(filter)
      .select('-__v')
      .sort({ trustScore: -1, followers: -1 }) // Sort by trust score, then followers
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await InfluencerProfile.countDocuments(filter);

    res.json({
      success: true,
      data: influencers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('List influencers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch influencers',
      error: error.message
    });
  }
};

/**
 * Fetch YouTube profile data and update influencer profile
 * POST /api/influencer/fetch-youtube
 */
exports.fetchYouTubeProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { youtubeUrl } = req.body;

    if (!youtubeUrl) {
      return res.status(400).json({
        success: false,
        message: 'YouTube URL is required'
      });
    }

    // Find or create profile
    let profile = await InfluencerProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found. Create a profile first.'
      });
    }

    // Fetch YouTube data
    const youtubeData = await youtubeService.fetchCompleteProfile(youtubeUrl);

    if (!youtubeData.success) {
      return res.status(400).json({
        success: false,
        message: youtubeData.error || 'Failed to fetch YouTube profile'
      });
    }

    // Update profile with YouTube data
    profile.youtubeUrl = youtubeUrl;
    profile.youtubeStats = {
      subscribers: youtubeData.subscribers,
      totalViews: youtubeData.totalViews,
      videoCount: youtubeData.videoCount,
      averageViews: youtubeData.averageViews,
      engagementRate: youtubeData.engagementRate,
      lastFetched: new Date()
    };

    // Update combined stats for backward compatibility
    profile.followers = Math.max(profile.followers || 0, youtubeData.subscribers);
    profile.totalViews = (profile.totalViews || 0) + youtubeData.totalViews;
    profile.engagementRate = youtubeData.engagementRate;

    // Auto-verify on successful fetch
    profile.verified = true;

    // Update avatar if not set
    if (!profile.avatar && youtubeData.channelThumbnail) {
      profile.avatar = youtubeData.channelThumbnail;
    }

    // Update bio if not set
    if (!profile.bio && youtubeData.channelDescription) {
      profile.bio = youtubeData.channelDescription.substring(0, 500);
    }

    // Recalculate trust score
    profile.trustScore = calculateTrustScore(profile);

    await profile.save();

    res.json({
      success: true,
      message: 'YouTube profile fetched and updated successfully',
      data: {
        profile,
        youtubeData
      }
    });
  } catch (error) {
    console.error('Fetch YouTube profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch YouTube profile',
      error: error.message
    });
  }
};

/**
 * Fetch Instagram profile data and update influencer profile
 * POST /api/influencer/fetch-instagram
 */
exports.fetchInstagramProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { instagramUrl } = req.body;

    if (!instagramUrl) {
      return res.status(400).json({
        success: false,
        message: 'Instagram URL is required'
      });
    }

    // Find profile
    let profile = await InfluencerProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found. Create a profile first.'
      });
    }

    // Fetch Instagram data
    const instagramData = await instagramService.fetchCompleteProfile(instagramUrl);

    if (!instagramData.success) {
      return res.status(400).json({
        success: false,
        message: instagramData.error || 'Failed to fetch Instagram profile',
        requiresManualInput: instagramData.requiresManualInput || false
      });
    }

    // Update profile with Instagram data
    profile.instagramUrl = instagramUrl;
    profile.instagramUsername = instagramData.username;
    profile.instagramStats = {
      followers: instagramData.followers,
      following: instagramData.following,
      posts: instagramData.posts,
      averageLikes: instagramData.averageLikes,
      averageComments: instagramData.averageComments,
      engagementRate: instagramData.engagementRate,
      lastFetched: new Date()
    };

    // Update combined stats for backward compatibility
    profile.followers = Math.max(profile.followers || 0, instagramData.followers);
    profile.engagementRate = Math.max(profile.engagementRate || 0, instagramData.engagementRate);

    // Auto-verify on successful fetch
    profile.verified = true;

    // Update avatar if not set
    if (!profile.avatar && instagramData.profilePicture) {
      profile.avatar = instagramData.profilePicture;
    }

    // Update bio if not set
    if (!profile.bio && instagramData.bio) {
      profile.bio = instagramData.bio.substring(0, 500);
    }

    // Recalculate trust score
    profile.trustScore = calculateTrustScore(profile);

    await profile.save();

    res.json({
      success: true,
      message: 'Instagram profile fetched and updated successfully',
      data: {
        profile,
        instagramData
      }
    });
  } catch (error) {
    console.error('Fetch Instagram profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Instagram profile',
      error: error.message
    });
  }
};

module.exports = exports;
