const InfluencerProfile = require('../models/InfluencerProfile.model');
const User = require('../models/User.model');

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
      'youtubeUrl', 'instagramUrl', 'tiktokUrl', 'services', 'platforms'];

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

    // ── Sync platforms array stats into dedicated stats fields ──
    // When the frontend sends an updated `platforms` array (e.g. after
    // adding / removing a platform via the modal), make sure the canonical
    // youtubeStats / instagramStats / youtubeData / instagramData fields
    // stay in sync so that the public profile shows the latest data.
    if (Array.isArray(req.body.platforms)) {
      const ytPlatform = req.body.platforms.find(p => p.type === 'YouTube');
      const igPlatform = req.body.platforms.find(p => p.type === 'Instagram');

      // Sync YouTube from platforms array → dedicated fields (only if the
      // dedicated fields are empty or the platforms entry has fresher data)
      if (ytPlatform?.stats) {
        const hasExistingYt = profile.youtubeStats?.subscribers > 0;
        if (!hasExistingYt) {
          profile.youtubeStats = {
            subscribers: ytPlatform.stats.subscribers || 0,
            totalViews:  ytPlatform.stats.views || 0,
            videoCount:  ytPlatform.stats.videos || 0,
            engagementRate: ytPlatform.stats.engagementRate || 0,
            averageViews: 0,
            lastFetched: ytPlatform.lastFetched ? new Date(ytPlatform.lastFetched) : new Date(),
          };
          if (!profile.youtubeData?.title && ytPlatform.channelTitle) {
            profile.youtubeData = {
              ...profile.youtubeData?.toObject?.() || {},
              title: ytPlatform.channelTitle,
              fetchedAt: ytPlatform.lastFetched ? new Date(ytPlatform.lastFetched) : new Date(),
            };
          }
          if (ytPlatform.channelId) {
            profile.youtubeChannelId = ytPlatform.channelId;
          }
        }
        if (ytPlatform.url && !profile.youtubeUrl) {
          profile.youtubeUrl = ytPlatform.url;
        }
      }

      // If YouTube platform was removed, clear the dedicated fields
      if (!ytPlatform && !req.body.youtubeUrl) {
        profile.youtubeStats = { subscribers: 0, totalViews: 0, videoCount: 0, averageViews: 0, engagementRate: 0 };
        profile.youtubeData = undefined;
        profile.youtubeChannelId = '';
        profile.youtubeUrl = '';
      }

      // Sync Instagram from platforms array → dedicated fields
      if (igPlatform?.stats) {
        const hasExistingIg = profile.instagramStats?.followers > 0;
        if (!hasExistingIg) {
          profile.instagramStats = {
            followers:  igPlatform.stats.followers || 0,
            following:  igPlatform.stats.following || 0,
            posts:      igPlatform.stats.posts || 0,
            engagementRate: igPlatform.stats.engagementRate || 0,
            averageLikes: 0,
            averageComments: 0,
            lastFetched: igPlatform.lastFetched ? new Date(igPlatform.lastFetched) : new Date(),
          };
          if (!profile.instagramData?.username && igPlatform.username) {
            profile.instagramData = {
              ...profile.instagramData?.toObject?.() || {},
              username: igPlatform.username,
              fetchedAt: igPlatform.lastFetched ? new Date(igPlatform.lastFetched) : new Date(),
            };
            profile.instagramUsername = igPlatform.username;
          }
        }
        if (igPlatform.url && !profile.instagramUrl) {
          profile.instagramUrl = igPlatform.url;
        }
      }

      // If Instagram platform was removed, clear the dedicated fields
      if (!igPlatform && !req.body.instagramUrl) {
        profile.instagramStats = { followers: 0, following: 0, posts: 0, averageLikes: 0, averageComments: 0, engagementRate: 0 };
        profile.instagramData = undefined;
        profile.instagramUsername = '';
        profile.instagramUrl = '';
      }
    }

    // Update combined stats and trust score
    profile.updateCombinedStats();

    await profile.save();

    // Sync name to User model so auth/me returns updated name
    if (req.body.name && req.body.name !== req.user.name) {
      await User.findByIdAndUpdate(req.user._id, { name: req.body.name });
    }

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
 * Fetch YouTube data from YouTube API and store in database
 * POST /api/influencer/fetch-youtube
 */
exports.fetchYouTubeProfile = async (req, res) => {
  try {
    const { youtubeUrl, forceRefresh } = req.body;

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

    // Check if we have cached data and forceRefresh is not requested
    if (!forceRefresh && profile.youtubeData?.fetchedAt) {
      // Always return cached data unless explicitly requesting refresh
      return res.json({
        success: true,
        message: 'YouTube data retrieved from cache',
        cached: true,
        data: {
          channel: {
            title: profile.youtubeData.title,
            description: profile.youtubeData.description,
            thumbnail: profile.youtubeData.thumbnail,
            customUrl: profile.youtubeData.customUrl,
            country: profile.youtubeData.country,
            publishedAt: profile.youtubeData.publishedAt,
            channelId: profile.youtubeChannelId,
            subscriberCount: profile.youtubeStats?.subscribers || 0,
            viewCount: profile.youtubeStats?.totalViews || 0,
            videoCount: profile.youtubeStats?.videoCount || 0
          },
          metrics: {
            engagementRate: profile.youtubeStats?.engagementRate || 0,
            averageViews: profile.youtubeStats?.averageViews || 0
          },
          recentVideos: profile.youtubeData.recentVideos || []
        }
      });
    }

    // Fetch fresh data from YouTube API
    const youtubeService = require('../services/youtube.service');
    const result = await youtubeService.fetchCompleteProfile(youtubeUrl);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
        quotaUsed: result.quotaUsed
      });
    }

    // Update profile with fetched data
    profile.youtubeUrl = youtubeUrl;
    profile.youtubeChannelId = result.data.channel.channelId;

    // Store stats
    profile.youtubeStats = {
      subscribers: result.data.channel.subscriberCount,
      totalViews: result.data.channel.viewCount,
      videoCount: result.data.channel.videoCount,
      averageViews: result.data.metrics.averageViews,
      engagementRate: result.data.metrics.engagementRate,
      lastFetched: new Date()
    };

    // Store detailed data
    profile.youtubeData = {
      title: result.data.channel.title,
      description: result.data.channel.description,
      thumbnail: result.data.channel.thumbnail,
      customUrl: result.data.channel.customUrl,
      country: result.data.channel.country,
      publishedAt: result.data.channel.publishedAt,
      recentVideos: result.data.recentVideos,
      fetchedAt: new Date()
    };

    // Update combined stats
    profile.updateCombinedStats();

    await profile.save();

    res.json({
      success: true,
      message: 'YouTube profile fetched and saved successfully',
      cached: false,
      data: {
        channel: {
          title: profile.youtubeData.title,
          description: profile.youtubeData.description,
          thumbnail: profile.youtubeData.thumbnail,
          customUrl: profile.youtubeData.customUrl,
          country: profile.youtubeData.country,
          publishedAt: profile.youtubeData.publishedAt,
          channelId: profile.youtubeChannelId,
          subscriberCount: profile.youtubeStats.subscribers,
          viewCount: profile.youtubeStats.totalViews,
          videoCount: profile.youtubeStats.videoCount
        },
        metrics: {
          engagementRate: profile.youtubeStats.engagementRate,
          averageViews: profile.youtubeStats.averageViews
        },
        recentVideos: result.data.recentVideos
      }
    });
  } catch (error) {
    console.error('Fetch YouTube error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch YouTube data',
      error: error.message
    });
  }
};

/**
 * Fetch Instagram data from Instagram API and store in database
 * POST /api/influencer/fetch-instagram
 */
exports.fetchInstagramProfile = async (req, res) => {
  try {
    const { instagramUrl, forceRefresh } = req.body;

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

    // Check if we have cached data and forceRefresh is not requested
    if (!forceRefresh && profile.instagramData?.fetchedAt) {
      // Always return cached data unless explicitly requesting refresh
      return res.json({
        success: true,
        message: 'Instagram data retrieved from cache',
        cached: true,
        data: {
          profile: profile.instagramData,
          metrics: {
            engagementRate: profile.instagramStats.engagementRate,
            averageLikes: profile.instagramStats.averageLikes,
            averageComments: profile.instagramStats.averageComments
          },
          recentPosts: profile.instagramData.recentMedia || []
        }
      });
    }

    // Fetch fresh data from Instagram API
    const instagramService = require('../services/instagram.service');
    const result = await instagramService.fetchCompleteProfile(instagramUrl);

    if (!result.success) {
      if (result.requiresManualInput) {
        return res.status(200).json({
          success: true,
          requiresManualInput: true,
          username: result.username,
          profileUrl: result.profileUrl,
          message: result.message
        });
      }

      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    // Update profile with fetched data
    profile.instagramUrl = instagramUrl;
    profile.instagramUsername = result.data.profile.username;

    // Store stats
    profile.instagramStats = {
      followers: result.data.profile.followers,
      following: result.data.profile.following,
      posts: result.data.profile.posts,
      averageLikes: result.data.metrics.averageLikes,
      averageComments: result.data.metrics.averageComments,
      engagementRate: result.data.metrics.engagementRate,
      lastFetched: new Date()
    };

    // Store detailed data
    profile.instagramData = {
      username: result.data.profile.username,
      name: result.data.profile.name,
      biography: result.data.profile.biography,
      profilePicture: result.data.profile.profilePicture,
      isVerified: result.data.profile.isVerified,
      isBusinessAccount: result.data.profile.isBusinessAccount,
      recentMedia: result.data.recentPosts.map(post => ({
        mediaId: post.id,
        caption: post.caption,
        mediaType: post.mediaType,
        mediaUrl: post.thumbnailUrl,
        thumbnail: post.thumbnailUrl,
        permalink: post.permalink,
        timestamp: post.timestamp,
        likes: post.likes,
        comments: post.comments
      })),
      fetchedAt: new Date()
    };

    // Update combined stats
    profile.updateCombinedStats();

    await profile.save();

    res.json({
      success: true,
      message: 'Instagram profile fetched and saved successfully',
      cached: false,
      method: result.method,
      data: {
        profile: profile.instagramData,
        metrics: {
          engagementRate: profile.instagramStats.engagementRate,
          averageLikes: profile.instagramStats.averageLikes,
          averageComments: profile.instagramStats.averageComments
        },
        recentPosts: result.data.recentPosts
      }
    });
  } catch (error) {
    console.error('Fetch Instagram error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Instagram data',
      error: error.message
    });
  }
};

/**
 * Refresh YouTube data (force refetch)
 * POST /api/influencer/refresh-youtube
 */
exports.refreshYouTubeProfile = async (req, res) => {
  try {
    const profile = await InfluencerProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found. Create profile first.'
      });
    }

    if (!profile.youtubeUrl) {
      return res.status(400).json({
        success: false,
        message: 'No YouTube URL linked to profile. Please link a YouTube channel first.'
      });
    }

    // Force refresh by calling fetchYouTubeProfile with forceRefresh flag
    req.body = {
      youtubeUrl: profile.youtubeUrl,
      forceRefresh: true
    };

    return exports.fetchYouTubeProfile(req, res);
  } catch (error) {
    console.error('Refresh YouTube error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh YouTube data',
      error: error.message
    });
  }
};

/**
 * Refresh Instagram data (force refetch)
 * POST /api/influencer/refresh-instagram
 */
exports.refreshInstagramProfile = async (req, res) => {
  try {
    const profile = await InfluencerProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found. Create profile first.'
      });
    }

    if (!profile.instagramUrl) {
      return res.status(400).json({
        success: false,
        message: 'No Instagram URL linked to profile. Please link an Instagram account first.'
      });
    }

    // Force refresh by calling fetchInstagramProfile with forceRefresh flag
    req.body = {
      instagramUrl: profile.instagramUrl,
      forceRefresh: true
    };

    return exports.fetchInstagramProfile(req, res);
  } catch (error) {
    console.error('Refresh Instagram error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh Instagram data',
      error: error.message
    });
  }
};
