const InfluencerProfile = require('../models/InfluencerProfile.model');

/**
 * Create influencer profile
 * POST /api/influencer/profile
 */
exports.createProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if profile already exists
    const existingProfile = await InfluencerProfile.findOne({ user: userId });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: 'Profile already exists. Use update instead.'
      });
    }

    // Prepare profile data
    const profileData = {
      user: userId,
      name: req.body.name || req.user.name,
      bio: req.body.bio || '',
      avatar: req.body.avatar || '',
      location: req.body.location || '',
      website: req.body.website || '',
      platformType: req.body.platformType || req.body.platform || 'Instagram',
      youtubeUrl: req.body.youtubeUrl || '',
      instagramUrl: req.body.instagramUrl || '',
      services: req.body.services || []
    };

    // Handle niche (can be string or array)
    if (req.body.niche) {
      profileData.niche = Array.isArray(req.body.niche)
        ? req.body.niche
        : [req.body.niche];
    }

    const profile = await InfluencerProfile.create(profileData);

    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      data: profile
    });
  } catch (error) {
    console.error('Create profile error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create profile'
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

    let profile = await InfluencerProfile.findOne({ user: userId });

    if (!profile) {
      // Create new profile if doesn't exist
      profile = new InfluencerProfile({
        user: userId,
        name: req.body.name || req.user.name
      });
    }

    // Update basic fields
    const basicFields = ['name', 'bio', 'avatar', 'location', 'website',
      'youtubeUrl', 'instagramUrl', 'tiktokUrl', 'services'];

    basicFields.forEach(field => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    // Handle niche (can be string or array from frontend)
    if (req.body.niche !== undefined) {
      if (Array.isArray(req.body.niche)) {
        profile.niche = req.body.niche;
      } else if (typeof req.body.niche === 'string' && req.body.niche) {
        profile.niche = [req.body.niche];
      }
    }

    // Handle platform field (frontend sends 'platform', model uses 'platformType')
    if (req.body.platform) {
      profile.platformType = req.body.platform;
    }
    if (req.body.platformType) {
      profile.platformType = req.body.platformType;
    }

    // Update combined stats and trust score
    profile.updateCombinedStats();

    await profile.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profile
    });
  } catch (error) {
    console.error('Update profile error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

/**
 * Get own profile
 * GET /api/influencer/profile/me
 */
exports.getOwnProfile = async (req, res) => {
  try {
    const profile = await InfluencerProfile.findOne({ user: req.user._id })
      .populate('user', 'name email role');

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
      message: 'Failed to fetch profile'
    });
  }
};

/**
 * Get influencer by ID
 * GET /api/influencer/:id
 */
exports.getProfileById = async (req, res) => {
  try {
    const profile = await InfluencerProfile.findById(req.params.id)
      .populate('user', 'name email');

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
    console.error('Get profile by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch influencer'
    });
  }
};

/**
 * List all influencers with filters
 * GET /api/influencer/list
 */
exports.listInfluencers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      niche,
      platform,
      minFollowers,
      maxFollowers,
      minTrustScore,
      verified,
      sortBy = 'trustScore',
      order = 'desc',
      search
    } = req.query;

    // Build filter
    const filter = {};

    if (niche) {
      filter.niche = niche;
    }

    if (platform && platform !== 'all') {
      filter.platformType = platform;
    }

    if (minFollowers) {
      filter.totalFollowers = { $gte: parseInt(minFollowers) };
    }

    if (maxFollowers) {
      filter.totalFollowers = { ...filter.totalFollowers, $lte: parseInt(maxFollowers) };
    }

    if (minTrustScore) {
      filter.trustScore = { $gte: parseInt(minTrustScore) };
    }

    if (verified === 'true') {
      filter.isVerified = true;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort
    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [influencers, total] = await Promise.all([
      InfluencerProfile.find(filter)
        .populate('user', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      InfluencerProfile.countDocuments(filter)
    ]);

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
      message: 'Failed to fetch influencers'
    });
  }
};

/**
 * Fetch YouTube data (placeholder - would need YouTube API integration)
 * POST /api/influencer/fetch-youtube
 */
exports.fetchYouTubeProfile = async (req, res) => {
  try {
    const { youtubeUrl } = req.body;

    if (!youtubeUrl) {
      return res.status(400).json({
        success: false,
        message: 'YouTube URL is required'
      });
    }

    const profile = await InfluencerProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found. Create profile first.'
      });
    }

    // In a real implementation, this would call YouTube API
    // For now, just save the URL
    profile.youtubeUrl = youtubeUrl;
    profile.youtubeStats.lastFetched = new Date();

    await profile.save();

    res.json({
      success: true,
      message: 'YouTube profile linked successfully',
      data: profile
    });
  } catch (error) {
    console.error('Fetch YouTube error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch YouTube data'
    });
  }
};

/**
 * Fetch Instagram data (placeholder - would need Instagram API integration)
 * POST /api/influencer/fetch-instagram
 */
exports.fetchInstagramProfile = async (req, res) => {
  try {
    const { instagramUrl } = req.body;

    if (!instagramUrl) {
      return res.status(400).json({
        success: false,
        message: 'Instagram URL is required'
      });
    }

    const profile = await InfluencerProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found. Create profile first.'
      });
    }

    // In a real implementation, this would call Instagram API
    // For now, just save the URL
    profile.instagramUrl = instagramUrl;
    profile.instagramStats.lastFetched = new Date();

    await profile.save();

    res.json({
      success: true,
      message: 'Instagram profile linked successfully',
      data: profile
    });
  } catch (error) {
    console.error('Fetch Instagram error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Instagram data'
    });
  }
};
