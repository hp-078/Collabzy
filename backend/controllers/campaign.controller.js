import Campaign from '../models/Campaign.model.js';
import InfluencerProfile from '../models/InfluencerProfile.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';

// @desc    Create new campaign
// @route   POST /api/campaigns
// @access  Private (Brand only)
export const createCampaign = asyncHandler(async (req, res) => {
  const campaignData = {
    ...req.body,
    brandUserId: req.user._id
  };

  const campaign = await Campaign.create(campaignData);

  res.status(201).json({
    success: true,
    message: 'Campaign created successfully',
    data: { campaign }
  });
});

// @desc    Get all campaigns (with filters)
// @route   GET /api/campaigns
// @access  Public
export const getAllCampaigns = asyncHandler(async (req, res) => {
  const {
    category,
    platformType,
    minBudget,
    maxBudget,
    status = 'active',
    page = 1,
    limit = 20
  } = req.query;

  // Build filter
  const filter = { status, isPublic: true };

  if (category) filter.category = category;
  if (platformType && platformType !== 'Any') filter.platformType = platformType;
  if (minBudget) filter['budget.min'] = { $gte: parseInt(minBudget) };
  if (maxBudget) filter['budget.max'] = { $lte: parseInt(maxBudget) };

  // Only show non-expired campaigns
  filter.expiresAt = { $gt: new Date() };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [campaigns, total] = await Promise.all([
    Campaign.find(filter)
      .populate('brandUserId', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Campaign.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    count: campaigns.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: { campaigns }
  });
});

// @desc    Get eligible campaigns for logged-in influencer
// @route   GET /api/campaigns/eligible
// @access  Private (Influencer only)
export const getEligibleCampaigns = asyncHandler(async (req, res) => {
  const influencerProfile = await InfluencerProfile.findOne({ userId: req.user._id });

  if (!influencerProfile) {
    return res.status(404).json({
      success: false,
      message: 'Please complete your profile first'
    });
  }

  // Get all active campaigns
  const campaigns = await Campaign.find({
    status: 'active',
    isPublic: true,
    expiresAt: { $gt: new Date() }
  }).populate('brandUserId', 'email');

  // Filter eligible campaigns
  const eligibleCampaigns = campaigns.filter(campaign => {
    const eligibility = campaign.checkEligibility(influencerProfile);
    return eligibility.isEligible;
  });

  res.status(200).json({
    success: true,
    count: eligibleCampaigns.length,
    data: { campaigns: eligibleCampaigns }
  });
});

// @desc    Get recommended campaigns for influencer
// @route   GET /api/campaigns/recommended
// @access  Private (Influencer only)
export const getRecommendedCampaigns = asyncHandler(async (req, res) => {
  const influencerProfile = await InfluencerProfile.findOne({ userId: req.user._id });

  if (!influencerProfile) {
    return res.status(404).json({
      success: false,
      message: 'Please complete your profile first'
    });
  }

  // Get all active campaigns
  const campaigns = await Campaign.find({
    status: 'active',
    isPublic: true,
    expiresAt: { $gt: new Date() }
  }).populate('brandUserId', 'email');

  // Calculate match score for each campaign
  const campaignsWithScores = campaigns.map(campaign => {
    const eligibility = campaign.checkEligibility(influencerProfile);
    
    if (!eligibility.isEligible) {
      return null;
    }

    // Calculate match score
    let matchScore = 0;

    // Niche match (40 points)
    if (campaign.category === influencerProfile.niche) {
      matchScore += 40;
    } else if (campaign.eligibilityCriteria.requiredNiche === influencerProfile.niche) {
      matchScore += 20;
    }

    // Follower range fit (20 points)
    const followerCount = campaign.platformType === 'YouTube' 
      ? influencerProfile.subscriberCount 
      : influencerProfile.followerCount;
    
    if (followerCount >= campaign.eligibilityCriteria.minFollowers &&
        (!campaign.eligibilityCriteria.maxFollowers || followerCount <= campaign.eligibilityCriteria.maxFollowers)) {
      matchScore += 20;
    } else if (followerCount >= campaign.eligibilityCriteria.minFollowers) {
      matchScore += 10;
    }

    // Engagement match (15 points)
    if (influencerProfile.engagementRate > campaign.eligibilityCriteria.minEngagementRate + 5) {
      matchScore += 15;
    } else if (influencerProfile.engagementRate >= campaign.eligibilityCriteria.minEngagementRate) {
      matchScore += 10;
    }

    // Trust score (10 points)
    if (influencerProfile.trustScore >= 80) {
      matchScore += 10;
    } else if (influencerProfile.trustScore >= 60) {
      matchScore += 5;
    }

    // Platform match (15 points)
    if (campaign.platformType === influencerProfile.platformType ||
        campaign.platformType === 'Both' ||
        influencerProfile.platformType === 'Both') {
      matchScore += 15;
    }

    return {
      ...campaign.toObject(),
      matchScore: Math.min(100, matchScore)
    };
  }).filter(campaign => campaign !== null);

  // Sort by match score
  campaignsWithScores.sort((a, b) => b.matchScore - a.matchScore);

  // Return top 10
  const recommendedCampaigns = campaignsWithScores.slice(0, 10);

  res.status(200).json({
    success: true,
    count: recommendedCampaigns.length,
    data: { campaigns: recommendedCampaigns }
  });
});

// @desc    Get campaign by ID
// @route   GET /api/campaigns/:id
// @access  Public
export const getCampaignById = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id)
    .populate('brandUserId', 'email');

  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  // Increment view count
  campaign.views += 1;
  await campaign.save();

  res.status(200).json({
    success: true,
    data: { campaign }
  });
});

// @desc    Get brand's campaigns
// @route   GET /api/campaigns/my-campaigns
// @access  Private (Brand only)
export const getMyCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await Campaign.find({ brandUserId: req.user._id })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: campaigns.length,
    data: { campaigns }
  });
});

// @desc    Update campaign
// @route   PUT /api/campaigns/:id
// @access  Private (Brand only, owner only)
export const updateCampaign = asyncHandler(async (req, res) => {
  let campaign = await Campaign.findById(req.params.id);

  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  // Check ownership
  if (campaign.brandUserId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this campaign'
    });
  }

  campaign = await Campaign.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Campaign updated successfully',
    data: { campaign }
  });
});

// @desc    Delete campaign
// @route   DELETE /api/campaigns/:id
// @access  Private (Brand only, owner only)
export const deleteCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);

  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  // Check ownership
  if (campaign.brandUserId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this campaign'
    });
  }

  await campaign.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Campaign deleted successfully'
  });
});

export default {
  createCampaign,
  getAllCampaigns,
  getEligibleCampaigns,
  getRecommendedCampaigns,
  getCampaignById,
  getMyCampaigns,
  updateCampaign,
  deleteCampaign
};
