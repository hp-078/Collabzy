const Campaign = require('../models/Campaign.model');
const BrandProfile = require('../models/BrandProfile.model');
const InfluencerProfile = require('../models/InfluencerProfile.model');

/**
 * Create a new campaign (Brand only)
 * POST /api/campaigns
 */
exports.createCampaign = async (req, res) => {
  try {
    const brandId = req.user._id;

    // Check if brand profile exists
    const brandProfile = await BrandProfile.findOne({ userId: brandId });
    if (!brandProfile) {
      return res.status(404).json({
        success: false,
        message: 'Brand profile not found. Please create your profile first.'
      });
    }

    // Create campaign with brand info
    const campaignData = {
      brand: brandId,
      brandProfile: brandProfile._id,
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      platformType: req.body.platformType,
      budget: {
        min: req.body.budgetMin || req.body.budget?.min,
        max: req.body.budgetMax || req.body.budget?.max
      },
      deliverables: req.body.deliverables || [],
      startDate: req.body.startDate || new Date(),
      deadline: req.body.deadline,
      eligibility: {
        minFollowers: req.body.eligibility?.minFollowers || req.body.minFollowers || 0,
        maxFollowers: req.body.eligibility?.maxFollowers || req.body.maxFollowers || 10000000,
        minEngagementRate: req.body.eligibility?.minEngagementRate || req.body.minEngagementRate || 0,
        requiredNiches: req.body.eligibility?.requiredNiches || req.body.requiredNiches || [],
        minTrustScore: req.body.eligibility?.minTrustScore || req.body.minTrustScore || 0,
        requiredPlatforms: req.body.eligibility?.requiredPlatforms || req.body.requiredPlatforms || []
      },
      status: req.body.status || 'active',
      termsAndConditions: req.body.termsAndConditions || '',
      tags: req.body.tags || []
    };

    const campaign = await Campaign.create(campaignData);

    // Populate brand info for response
    await campaign.populate('brand', 'name email');
    await campaign.populate('brandProfile', 'brandName industry');

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: campaign
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create campaign',
      error: error.message
    });
  }
};

/**
 * Update campaign (Brand only, owner only)
 * PUT /api/campaigns/:id
 */
exports.updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const brandId = req.user._id;

    // Find campaign and verify ownership
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check ownership
    if (campaign.brand.toString() !== brandId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this campaign'
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'title', 'description', 'category', 'platformType',
      'deliverables', 'deadline', 'status', 'termsAndConditions', 'tags'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        campaign[field] = req.body[field];
      }
    });

    // Update budget if provided
    if (req.body.budgetMin !== undefined || req.body.budget?.min !== undefined) {
      campaign.budget.min = req.body.budgetMin || req.body.budget.min;
    }
    if (req.body.budgetMax !== undefined || req.body.budget?.max !== undefined) {
      campaign.budget.max = req.body.budgetMax || req.body.budget.max;
    }

    // Update eligibility criteria
    if (req.body.eligibility) {
      Object.keys(req.body.eligibility).forEach(key => {
        if (req.body.eligibility[key] !== undefined) {
          campaign.eligibility[key] = req.body.eligibility[key];
        }
      });
    }

    await campaign.save();

    await campaign.populate('brand', 'name email');
    await campaign.populate('brandProfile', 'brandName industry');

    res.json({
      success: true,
      message: 'Campaign updated successfully',
      data: campaign
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update campaign',
      error: error.message
    });
  }
};

/**
 * Delete campaign (Brand only, owner only)
 * DELETE /api/campaigns/:id
 */
exports.deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const brandId = req.user._id;

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check ownership
    if (campaign.brand.toString() !== brandId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this campaign'
      });
    }

    // Check if campaign has active applications/deals
    if (campaign.acceptedCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete campaign with active deals. Please close the campaign instead.'
      });
    }

    await Campaign.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete campaign',
      error: error.message
    });
  }
};

/**
 * Get campaign by ID (Public)
 * GET /api/campaigns/:id
 */
exports.getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findById(id)
      .populate('brand', 'name email')
      .populate('brandProfile', 'brandName industry logo website');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Increment view count
    campaign.viewCount += 1;
    await campaign.save();

    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign',
      error: error.message
    });
  }
};

/**
 * Get brand's campaigns (Brand only)
 * GET /api/campaigns/brand/my-campaigns
 */
exports.getMyCampaigns = async (req, res) => {
  try {
    const brandId = req.user._id;
    const { status, page = 1, limit = 20 } = req.query;

    // Build filter
    const filter = { brand: brandId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const campaigns = await Campaign.find(filter)
      .populate('brandProfile', 'brandName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Campaign.countDocuments(filter);

    res.json({
      success: true,
      data: campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get my campaigns error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaigns',
      error: error.message
    });
  }
};

/**
 * Get eligible campaigns for influencer (Influencer only)
 * GET /api/campaigns/influencer/eligible
 */
exports.getEligibleCampaigns = async (req, res) => {
  try {
    const influencerId = req.user._id;
    const { category, platform, page = 1, limit = 20 } = req.query;

    // Get influencer profile
    const influencerProfile = await InfluencerProfile.findOne({ userId: influencerId });
    if (!influencerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Influencer profile not found'
      });
    }

    // Build filter for active campaigns
    const filter = {
      status: 'active',
      deadline: { $gt: new Date() }
    };

    if (category) {
      filter.category = category;
    }

    if (platform && platform !== 'all') {
      filter.platformType = platform;
    }

    // Get all active campaigns
    const allCampaigns = await Campaign.find(filter)
      .populate('brand', 'name')
      .populate('brandProfile', 'brandName logo')
      .sort({ createdAt: -1 });

    // Filter campaigns where influencer is eligible
    const eligibleCampaigns = allCampaigns.filter(campaign => {
      const eligibilityCheck = campaign.isEligible(influencerProfile);
      return eligibilityCheck.eligible;
    });

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedCampaigns = eligibleCampaigns.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: paginatedCampaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: eligibleCampaigns.length,
        pages: Math.ceil(eligibleCampaigns.length / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get eligible campaigns error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch eligible campaigns',
      error: error.message
    });
  }
};

/**
 * Get recommended campaigns with match scores (Influencer only)
 * GET /api/campaigns/influencer/recommended
 */
exports.getRecommendedCampaigns = async (req, res) => {
  try {
    const influencerId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    // Get influencer profile
    const influencerProfile = await InfluencerProfile.findOne({ userId: influencerId });
    if (!influencerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Influencer profile not found'
      });
    }

    // Get all active campaigns
    const allCampaigns = await Campaign.find({
      status: 'active',
      deadline: { $gt: new Date() }
    })
      .populate('brand', 'name')
      .populate('brandProfile', 'brandName logo')
      .lean();

    // Filter eligible campaigns and calculate match scores
    const campaignsWithScores = allCampaigns
      .map(campaign => {
        // Create a Mongoose document instance for methods
        const campaignDoc = new Campaign(campaign);
        const eligibilityCheck = campaignDoc.isEligible(influencerProfile);
        
        if (!eligibilityCheck.eligible) {
          return null;
        }

        const matchScore = campaignDoc.calculateMatchScore(influencerProfile);
        
        return {
          ...campaign,
          matchScore,
          eligible: true
        };
      })
      .filter(c => c !== null)
      .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score descending

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedCampaigns = campaignsWithScores.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: paginatedCampaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: campaignsWithScores.length,
        pages: Math.ceil(campaignsWithScores.length / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get recommended campaigns error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommended campaigns',
      error: error.message
    });
  }
};

module.exports = exports;
