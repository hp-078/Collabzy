import Application from '../models/Application.model.js';
import Campaign from '../models/Campaign.model.js';
import InfluencerProfile from '../models/InfluencerProfile.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';

// @desc    Submit application to campaign
// @route   POST /api/applications
// @access  Private (Influencer only)
export const submitApplication = asyncHandler(async (req, res) => {
  const { campaignId, proposalText, expectedDeliverables, timeline } = req.body;

  // Check if campaign exists
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  // Check if campaign is active
  if (campaign.status !== 'active' || campaign.expiresAt < new Date()) {
    return res.status(400).json({
      success: false,
      message: 'Campaign is not accepting applications'
    });
  }

  // Get influencer profile
  const influencerProfile = await InfluencerProfile.findOne({ userId: req.user._id });
  if (!influencerProfile) {
    return res.status(404).json({
      success: false,
      message: 'Please complete your profile first'
    });
  }

  // Check eligibility
  const eligibility = campaign.checkEligibility(influencerProfile);
  if (!eligibility.isEligible) {
    return res.status(403).json({
      success: false,
      message: 'You do not meet the eligibility criteria for this campaign',
      reasons: eligibility.reasons
    });
  }

  // Check if already applied
  const existingApplication = await Application.findOne({
    campaignId,
    influencerId: req.user._id
  });

  if (existingApplication) {
    return res.status(400).json({
      success: false,
      message: 'You have already applied to this campaign'
    });
  }

  // Calculate match score
  const matchScore = await Application.calculateMatchScore(campaignId, influencerProfile._id);

  // Create application
  const application = await Application.create({
    campaignId,
    influencerId: req.user._id,
    brandId: campaign.brandUserId,
    proposalText,
    expectedDeliverables,
    timeline,
    matchScore
  });

  // Increment application count on campaign
  campaign.totalApplications += 1;
  await campaign.save();

  res.status(201).json({
    success: true,
    message: 'Application submitted successfully',
    data: { application }
  });
});

// @desc    Get my applications (influencer)
// @route   GET /api/applications/my-applications
// @access  Private (Influencer only)
export const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ influencerId: req.user._id })
    .populate('campaignId', 'title category budget platformType status expiresAt')
    .populate('brandId', 'email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: applications.length,
    data: { applications }
  });
});

// @desc    Get applications for my campaigns (brand)
// @route   GET /api/applications/campaign/:campaignId
// @access  Private (Brand only)
export const getCampaignApplications = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;

  // Check if campaign exists and belongs to user
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  if (campaign.brandUserId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view applications for this campaign'
    });
  }

  // Get applications
  const applications = await Application.find({ campaignId })
    .populate('influencerId', 'email profileCompleted')
    .populate({
      path: 'influencerId',
      populate: {
        path: 'influencerProfile',
        model: 'InfluencerProfile'
      }
    })
    .sort({ matchScore: -1, createdAt: -1 });

  res.status(200).json({
    success: true,
    count: applications.length,
    data: { applications }
  });
});

// @desc    Get application by ID
// @route   GET /api/applications/:id
// @access  Private (Influencer or Brand)
export const getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('campaignId')
    .populate('influencerId', 'email')
    .populate('brandId', 'email');

  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Application not found'
    });
  }

  // Check authorization
  const isInfluencer = application.influencerId._id.toString() === req.user._id.toString();
  const isBrand = application.brandId._id.toString() === req.user._id.toString();

  if (!isInfluencer && !isBrand) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this application'
    });
  }

  res.status(200).json({
    success: true,
    data: { application }
  });
});

// @desc    Update application status (brand)
// @route   PUT /api/applications/:id/status
// @access  Private (Brand only)
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, message } = req.body;

  const application = await Application.findById(req.params.id);

  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Application not found'
    });
  }

  // Check authorization
  if (application.brandId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this application'
    });
  }

  // Update status
  application.status = status;
  if (message) {
    application.brandResponse = {
      message,
      respondedAt: new Date()
    };
  }

  if (status === 'accepted') {
    application.acceptedAt = new Date();
  } else if (status === 'rejected') {
    application.rejectedAt = new Date();
  }

  await application.save();

  // Update campaign status if needed
  if (status === 'accepted') {
    const campaign = await Campaign.findById(application.campaignId);
    if (campaign && campaign.status === 'active') {
      campaign.status = 'in-progress';
      campaign.selectedInfluencer = application.influencerId;
      await campaign.save();
    }
  }

  res.status(200).json({
    success: true,
    message: `Application ${status} successfully`,
    data: { application }
  });
});

// @desc    Withdraw application (influencer)
// @route   DELETE /api/applications/:id
// @access  Private (Influencer only)
export const withdrawApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);

  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Application not found'
    });
  }

  // Check authorization
  if (application.influencerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to withdraw this application'
    });
  }

  // Can only withdraw pending applications
  if (application.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Can only withdraw pending applications'
    });
  }

  await application.deleteOne();

  // Decrement campaign application count
  const campaign = await Campaign.findById(application.campaignId);
  if (campaign && campaign.totalApplications > 0) {
    campaign.totalApplications -= 1;
    await campaign.save();
  }

  res.status(200).json({
    success: true,
    message: 'Application withdrawn successfully'
  });
});

// @desc    Submit deliverable (influencer)
// @route   POST /api/applications/:id/deliverable
// @access  Private (Influencer only)
export const submitDeliverable = asyncHandler(async (req, res) => {
  const { deliverableUrl, description, metrics } = req.body;

  const application = await Application.findById(req.params.id);

  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Application not found'
    });
  }

  // Check authorization
  if (application.influencerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to submit deliverable for this application'
    });
  }

  // Only accepted applications can submit deliverables
  if (application.status !== 'accepted') {
    return res.status(400).json({
      success: false,
      message: 'Can only submit deliverables for accepted applications'
    });
  }

  // Add deliverable
  application.deliverableSubmitted = {
    url: deliverableUrl,
    description,
    metrics,
    submittedAt: new Date()
  };

  application.status = 'completed';
  await application.save();

  res.status(200).json({
    success: true,
    message: 'Deliverable submitted successfully',
    data: { application }
  });
});

// @desc    Rate influencer (brand)
// @route   POST /api/applications/:id/rate
// @access  Private (Brand only)
export const rateInfluencer = asyncHandler(async (req, res) => {
  const { rating, review } = req.body;

  const application = await Application.findById(req.params.id);

  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Application not found'
    });
  }

  // Check authorization
  if (application.brandId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to rate this application'
    });
  }

  // Can only rate completed applications
  if (application.status !== 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Can only rate completed applications'
    });
  }

  // Add rating
  application.rating = {
    score: rating,
    review,
    ratedAt: new Date()
  };

  await application.save();

  // Update influencer profile stats
  const influencerProfile = await InfluencerProfile.findOne({ userId: application.influencerId });
  if (influencerProfile) {
    influencerProfile.completedDeals += 1;
    influencerProfile.ratings.push({
      score: rating,
      review,
      brandId: application.brandId,
      campaignId: application.campaignId,
      date: new Date()
    });
    
    // Recalculate trust score
    influencerProfile.trustScore = influencerProfile.calculateTrustScore();
    await influencerProfile.save();
  }

  res.status(200).json({
    success: true,
    message: 'Rating submitted successfully',
    data: { application }
  });
});

export default {
  submitApplication,
  getMyApplications,
  getCampaignApplications,
  getApplicationById,
  updateApplicationStatus,
  withdrawApplication,
  submitDeliverable,
  rateInfluencer
};
