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

    // Get brand profile
    const brandProfile = await BrandProfile.findOne({ user: brandId });

    // Validate budget
    const budgetMin = req.body.budgetMin || req.body.budget?.min || 0;
    const budgetMax = req.body.budgetMax || req.body.budget?.max || 0;

    if (budgetMin < 0 || budgetMax < 0) {
      return res.status(400).json({
        success: false,
        message: 'Budget values cannot be negative'
      });
    }

    if (budgetMin > budgetMax) {
      return res.status(400).json({
        success: false,
        message: 'Minimum budget cannot exceed maximum budget'
      });
    }

    // Validate dates
    const startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
    const deadline = new Date(req.body.deadline);

    if (deadline <= startDate) {
      return res.status(400).json({
        success: false,
        message: 'Deadline must be after start date'
      });
    }

    // Validate maxInfluencers
    const maxInfluencers = req.body.maxInfluencers || 10;
    if (maxInfluencers <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Maximum influencers must be greater than 0'
      });
    }

    const campaignData = {
      brand: brandId,
      brandProfile: brandProfile?._id,
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      platformType: req.body.platformType || 'Any',
      budget: {
        min: budgetMin,
        max: budgetMax
      },
      deliverables: req.body.deliverables || [],
      startDate: startDate,
      deadline: deadline,
      eligibility: {
        minFollowers: req.body.eligibility?.minFollowers || req.body.minFollowers || 0,
        maxFollowers: req.body.eligibility?.maxFollowers || req.body.maxFollowers || 10000000,
        minEngagementRate: req.body.eligibility?.minEngagementRate || 0,
        requiredNiches: req.body.eligibility?.requiredNiches || [],
        minTrustScore: req.body.eligibility?.minTrustScore || 0,
        requiredPlatforms: req.body.eligibility?.requiredPlatforms || []
      },
      status: req.body.status || 'active',
      termsAndConditions: req.body.termsAndConditions || '',
      tags: req.body.tags || [],
      maxInfluencers: maxInfluencers
    };

    const campaign = await Campaign.create(campaignData);
    await campaign.populate('brand', 'name email');

    // Update brand profile stats
    if (brandProfile) {
      brandProfile.activeCampaigns += 1;
      await brandProfile.save();
    }

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: campaign
    });
  } catch (error) {
    console.error('Create campaign error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create campaign'
    });
  }
};

/**
 * Get all campaigns with filtering
 * GET /api/campaigns
 */
exports.getAllCampaigns = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      platform,
      status,
      minBudget,
      maxBudget,
      search,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter
    const filter = {
      status: status || 'active',
      deadline: { $gt: new Date() }
    };

    if (category) {
      filter.category = category;
    }

    if (platform && platform !== 'all' && platform !== 'Any') {
      filter.platformType = { $in: [platform, 'Any', 'Multiple'] };
    }

    if (minBudget) {
      filter['budget.min'] = { $gte: parseInt(minBudget) };
    }

    if (maxBudget) {
      filter['budget.max'] = { $lte: parseInt(maxBudget) };
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort
    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [campaigns, total] = await Promise.all([
      Campaign.find(filter)
        .populate('brand', 'name email')
        .populate('brandProfile', 'companyName logo industry')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Campaign.countDocuments(filter)
    ]);

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
    console.error('Get all campaigns error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaigns'
    });
  }
};

/**
 * Get campaign by ID
 * GET /api/campaigns/:id
 */
exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('brand', 'name email')
      .populate('brandProfile', 'companyName logo industry websiteUrl');

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
      message: 'Failed to fetch campaign'
    });
  }
};

/**
 * Update campaign (Brand only, owner only)
 * PUT /api/campaigns/:id
 */
exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check ownership
    if (campaign.brand.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this campaign'
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'title', 'description', 'category', 'platformType',
      'deliverables', 'deadline', 'status', 'termsAndConditions',
      'tags', 'maxInfluencers'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        campaign[field] = req.body[field];
      }
    });

    // Update budget with validation
    if (req.body.budget || req.body.budgetMin || req.body.budgetMax) {
      const newBudgetMin = req.body.budgetMin || req.body.budget?.min || campaign.budget.min;
      const newBudgetMax = req.body.budgetMax || req.body.budget?.max || campaign.budget.max;

      if (newBudgetMin < 0 || newBudgetMax < 0) {
        return res.status(400).json({
          success: false,
          message: 'Budget values cannot be negative'
        });
      }

      if (newBudgetMin > newBudgetMax) {
        return res.status(400).json({
          success: false,
          message: 'Minimum budget cannot exceed maximum budget'
        });
      }

      campaign.budget = {
        min: newBudgetMin,
        max: newBudgetMax
      };
    }

    // Validate deadline if updated
    if (req.body.deadline) {
      const newDeadline = new Date(req.body.deadline);
      if (newDeadline <= campaign.startDate) {
        return res.status(400).json({
          success: false,
          message: 'Deadline must be after start date'
        });
      }
    }

    // Validate maxInfluencers if updated
    if (req.body.maxInfluencers !== undefined) {
      if (req.body.maxInfluencers <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Maximum influencers must be greater than 0'
        });
      }
    }

    // Update eligibility
    if (req.body.eligibility) {
      campaign.eligibility = { ...campaign.eligibility, ...req.body.eligibility };
    }

    await campaign.save();
    await campaign.populate('brand', 'name email');

    res.json({
      success: true,
      message: 'Campaign updated successfully',
      data: campaign
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update campaign'
    });
  }
};

/**
 * Delete campaign (Brand only, owner only)
 * DELETE /api/campaigns/:id
 */
exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check ownership
    if (campaign.brand.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this campaign'
      });
    }

    // Check for active deals
    if (campaign.acceptedCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete campaign with active deals'
      });
    }

    await Campaign.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete campaign'
    });
  }
};

/**
 * Get brand's campaigns
 * GET /api/campaigns/brand/my-campaigns
 */
exports.getMyCampaigns = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = { brand: req.user._id };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [campaigns, total] = await Promise.all([
      Campaign.find(filter)
        .populate('brandProfile', 'companyName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Campaign.countDocuments(filter)
    ]);

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
      message: 'Failed to fetch campaigns'
    });
  }
};

/**
 * Get eligible campaigns for influencer
 * GET /api/campaigns/influencer/eligible
 */
exports.getEligibleCampaigns = async (req, res) => {
  try {
    const { category, platform, page = 1, limit = 20 } = req.query;

    // Get influencer profile
    const influencerProfile = await InfluencerProfile.findOne({ user: req.user._id });
    if (!influencerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Influencer profile not found'
      });
    }

    // Build filter
    const filter = {
      status: 'active',
      deadline: { $gt: new Date() }
    };

    if (category) filter.category = category;
    if (platform && platform !== 'all') filter.platformType = platform;

    // Get campaigns and filter by eligibility
    const allCampaigns = await Campaign.find(filter)
      .populate('brand', 'name')
      .populate('brandProfile', 'companyName logo')
      .sort({ createdAt: -1 });

    const eligibleCampaigns = allCampaigns.filter(campaign => {
      const check = campaign.isEligible(influencerProfile);
      return check.eligible;
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
      message: 'Failed to fetch eligible campaigns'
    });
  }
};

/**
 * Get recommended campaigns with match scores
 * GET /api/campaigns/influencer/recommended
 */
exports.getRecommendedCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Get influencer profile
    const influencerProfile = await InfluencerProfile.findOne({ user: req.user._id });
    if (!influencerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Influencer profile not found'
      });
    }

    // Get active campaigns
    const allCampaigns = await Campaign.find({
      status: 'active',
      deadline: { $gt: new Date() }
    })
      .populate('brand', 'name')
      .populate('brandProfile', 'companyName logo');

    // Filter eligible and calculate match scores
    const campaignsWithScores = allCampaigns
      .map(campaign => {
        const eligibilityCheck = campaign.isEligible(influencerProfile);
        if (!eligibilityCheck.eligible) return null;

        const matchScore = campaign.calculateMatchScore(influencerProfile);
        return {
          ...campaign.toObject(),
          matchScore,
          eligible: true
        };
      })
      .filter(c => c !== null)
      .sort((a, b) => b.matchScore - a.matchScore);

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
      message: 'Failed to fetch recommended campaigns'
    });
  }
};
