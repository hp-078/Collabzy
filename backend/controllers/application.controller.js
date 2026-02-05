const Application = require('../models/Application.model');
const Campaign = require('../models/Campaign.model');
const InfluencerProfile = require('../models/InfluencerProfile.model');
const mongoose = require('mongoose');

// ==========================================
// SUBMIT APPLICATION (Influencer)
// ==========================================
exports.submitApplication = async (req, res) => {
  try {
    const {
      campaignId,
      proposalText,
      quotedPrice,
      deliveryPlan,
      estimatedDeliveryTime,
      coverLetter,
      portfolioSamples
    } = req.body;

    // Validate required fields
    if (!campaignId || !proposalText || !quotedPrice) {
      return res.status(400).json({
        success: false,
        message: 'Campaign ID, proposal text, and quoted price are required'
      });
    }

    // Check if campaign exists and is active
    const campaign = await Campaign.findById(campaignId).populate('brandProfile');
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (campaign.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Campaign is not accepting applications. Current status: ${campaign.status}`
      });
    }

    // Check if deadline has passed
    if (campaign.deadline && new Date(campaign.deadline) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Campaign deadline has passed'
      });
    }

    // Get influencer profile
    const influencerProfile = await InfluencerProfile.findOne({ userId: req.user._id });
    if (!influencerProfile) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your influencer profile before applying to campaigns'
      });
    }

    // Check if profile is complete enough
    if (!influencerProfile.name || !influencerProfile.niche || influencerProfile.platforms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile (name, niche, and at least one platform) before applying'
      });
    }

    // Check eligibility
    const eligibility = campaign.checkEligibility(influencerProfile);
    if (!eligibility.eligible) {
      return res.status(400).json({
        success: false,
        message: `You are not eligible for this campaign. Reason: ${eligibility.reason}`
      });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      campaign: campaignId,
      influencer: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this campaign',
        applicationId: existingApplication._id
      });
    }

    // Validate quoted price is within budget range
    if (campaign.budget && campaign.budget.min && quotedPrice < campaign.budget.min) {
      return res.status(400).json({
        success: false,
        message: `Quoted price must be at least ${campaign.budget.min}`
      });
    }

    if (campaign.budget && campaign.budget.max && quotedPrice > campaign.budget.max) {
      return res.status(400).json({
        success: false,
        message: `Quoted price cannot exceed ${campaign.budget.max}`
      });
    }

    // Calculate match score
    const matchScore = campaign.calculateMatchScore(influencerProfile);

    // Create application
    const application = new Application({
      campaign: campaignId,
      influencer: req.user._id,
      influencerProfile: influencerProfile._id,
      brand: campaign.brandUser,
      proposalText,
      quotedPrice,
      deliveryPlan,
      estimatedDeliveryTime,
      coverLetter,
      portfolioSamples,
      matchScore,
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        changedAt: new Date(),
        changedBy: req.user._id,
        note: 'Application submitted'
      }]
    });

    await application.save();

    // Increment campaign application count
    campaign.applicationCount = (campaign.applicationCount || 0) + 1;
    await campaign.save();

    // Populate application for response
    await application.populate([
      { path: 'campaign', select: 'title description budget deadline' },
      { path: 'influencerProfile', select: 'name avatar niche platforms followers engagementRate trustScore' }
    ]);

    // TODO: Send notification to brand

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });

  } catch (error) {
    console.error('Error submitting application:', error);
    
    // Handle duplicate application error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this campaign'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  }
};

// ==========================================
// GET INFLUENCER'S OWN APPLICATIONS
// ==========================================
exports.getMyApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = { influencer: req.user._id };
    
    // Filter by status if provided
    if (status && ['pending', 'shortlisted', 'accepted', 'rejected', 'withdrawn'].includes(status)) {
      query.status = status;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const applications = await Application.find(query)
      .populate({
        path: 'campaign',
        select: 'title description budget deliverables deadline status category platformType',
        populate: {
          path: 'brandProfile',
          select: 'name logo industry'
        }
      })
      .populate('brand', 'email name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(query);

    // Get status counts
    const statusCounts = await Application.aggregate([
      { $match: { influencer: mongoose.Types.ObjectId(req.user._id) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const counts = {
      total,
      pending: 0,
      shortlisted: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0
    };

    statusCounts.forEach(item => {
      counts[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      statusCounts: counts
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
};

// ==========================================
// GET APPLICATION BY ID
// ==========================================
exports.getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id)
      .populate({
        path: 'campaign',
        select: 'title description budget deliverables deadline status category platformType eligibilityCriteria',
        populate: {
          path: 'brandProfile',
          select: 'name logo industry website'
        }
      })
      .populate('influencerProfile', 'name avatar bio niche platforms followers engagementRate trustScore verificationStatus')
      .populate('brand', 'email name')
      .populate('influencer', 'email name');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Authorization check: only influencer (owner), brand (campaign owner), or admin can view
    const isInfluencer = application.influencer._id.toString() === req.user._id.toString();
    const isBrand = application.brand._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isInfluencer && !isBrand && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this application'
      });
    }

    res.status(200).json({
      success: true,
      data: application
    });

  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application',
      error: error.message
    });
  }
};

// ==========================================
// UPDATE APPLICATION (Influencer - only pending)
// ==========================================
exports.updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      proposalText,
      quotedPrice,
      deliveryPlan,
      estimatedDeliveryTime,
      coverLetter,
      portfolioSamples
    } = req.body;

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check ownership
    if (application.influencer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own applications'
      });
    }

    // Only pending applications can be edited
    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Applications with status '${application.status}' cannot be edited`
      });
    }

    // Update fields
    if (proposalText) application.proposalText = proposalText;
    if (quotedPrice) application.quotedPrice = quotedPrice;
    if (deliveryPlan) application.deliveryPlan = deliveryPlan;
    if (estimatedDeliveryTime) application.estimatedDeliveryTime = estimatedDeliveryTime;
    if (coverLetter !== undefined) application.coverLetter = coverLetter;
    if (portfolioSamples) application.portfolioSamples = portfolioSamples;

    // Add to status history
    application.statusHistory.push({
      status: 'pending',
      changedAt: new Date(),
      changedBy: req.user._id,
      note: 'Application updated'
    });

    await application.save();

    await application.populate([
      { path: 'campaign', select: 'title description budget deadline' },
      { path: 'influencerProfile', select: 'name avatar niche platforms' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      data: application
    });

  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application',
      error: error.message
    });
  }
};

// ==========================================
// WITHDRAW APPLICATION (Influencer)
// ==========================================
exports.withdrawApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check ownership
    if (application.influencer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only withdraw your own applications'
      });
    }

    // Can only withdraw pending or shortlisted applications
    if (!['pending', 'shortlisted'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: `Applications with status '${application.status}' cannot be withdrawn`
      });
    }

    // Update status
    application.status = 'withdrawn';
    application.withdrawnAt = new Date();

    // Add to status history
    application.statusHistory.push({
      status: 'withdrawn',
      changedAt: new Date(),
      changedBy: req.user._id,
      note: reason || 'Application withdrawn by influencer'
    });

    await application.save();

    // TODO: Send notification to brand

    res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully',
      data: application
    });

  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to withdraw application',
      error: error.message
    });
  }
};

// ==========================================
// GET APPLICATIONS FOR CAMPAIGN (Brand)
// ==========================================
exports.getApplicationsForCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const {
      status,
      sortBy = 'matchScore',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      minMatchScore,
      search
    } = req.query;

    // Check if campaign exists and user is the owner
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (campaign.brandUser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only view applications for your own campaigns'
      });
    }

    // Build query
    const query = { campaign: campaignId };
    
    // Filter by status
    if (status && ['pending', 'shortlisted', 'accepted', 'rejected'].includes(status)) {
      query.status = status;
    }

    // Filter by minimum match score
    if (minMatchScore) {
      query.matchScore = { $gte: parseInt(minMatchScore) };
    }

    // Search in proposal text or influencer name
    if (search) {
      query.$or = [
        { proposalText: { $regex: search, $options: 'i' } },
        { coverLetter: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const applications = await Application.find(query)
      .populate('influencer', 'email name')
      .populate('influencerProfile', 'name avatar bio niche platforms followers engagementRate trustScore verificationStatus pastCollaborations')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(query);

    // Get status counts for this campaign
    const statusCounts = await Application.aggregate([
      { $match: { campaign: mongoose.Types.ObjectId(campaignId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgMatchScore: { $avg: '$matchScore' }
        }
      }
    ]);

    const counts = {
      total: 0,
      pending: 0,
      shortlisted: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
      avgMatchScore: 0
    };

    statusCounts.forEach(item => {
      counts[item._id] = item.count;
      counts.total += item.count;
      if (item._id !== 'rejected' && item._id !== 'withdrawn') {
        counts.avgMatchScore += item.avgMatchScore * item.count;
      }
    });

    if (counts.total - counts.rejected - counts.withdrawn > 0) {
      counts.avgMatchScore = counts.avgMatchScore / (counts.total - counts.rejected - counts.withdrawn);
      counts.avgMatchScore = Math.round(counts.avgMatchScore);
    }

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      statistics: counts
    });

  } catch (error) {
    console.error('Error fetching campaign applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
};

// ==========================================
// UPDATE APPLICATION STATUS (Brand)
// ==========================================
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    // Validate status
    if (!['pending', 'shortlisted', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, shortlisted, accepted, or rejected'
      });
    }

    const application = await Application.findById(id)
      .populate('campaign', 'title brandUser')
      .populate('influencerProfile', 'name');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user is campaign owner
    if (application.campaign.brandUser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only update applications for your own campaigns'
      });
    }

    // Check if application is withdrawn
    if (application.status === 'withdrawn') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update status of withdrawn application'
      });
    }

    // Validate status transitions
    const currentStatus = application.status;
    
    // Accepted applications cannot be changed
    if (currentStatus === 'accepted' && status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Accepted applications cannot be changed to another status'
      });
    }

    // Update status
    const oldStatus = application.status;
    application.status = status;

    // Update timestamp based on status
    switch (status) {
      case 'shortlisted':
        application.shortlistedAt = new Date();
        break;
      case 'accepted':
        application.acceptedAt = new Date();
        break;
      case 'rejected':
        application.rejectedAt = new Date();
        break;
    }

    // Add to status history
    application.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: req.user._id,
      note: note || `Status changed from ${oldStatus} to ${status}`
    });

    await application.save();

    // Update campaign accepted count if status changed to accepted
    if (status === 'accepted' && oldStatus !== 'accepted') {
      await Campaign.findByIdAndUpdate(application.campaign._id, {
        $inc: { acceptedCount: 1 }
      });
      
      // TODO: Create Deal record
      // TODO: Send notification to influencer
    }

    // Populate for response
    await application.populate('influencerProfile', 'name avatar niche platforms followers engagementRate trustScore');

    res.status(200).json({
      success: true,
      message: `Application ${status} successfully`,
      data: application
    });

  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status',
      error: error.message
    });
  }
};

// ==========================================
// GET APPLICATION STATISTICS FOR CAMPAIGN (Brand)
// ==========================================
exports.getCampaignApplicationStats = async (req, res) => {
  try {
    const { campaignId } = req.params;

    // Check if campaign exists and user is the owner
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (campaign.brandUser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only view statistics for your own campaigns'
      });
    }

    // Get detailed statistics
    const stats = await Application.aggregate([
      { $match: { campaign: mongoose.Types.ObjectId(campaignId) } },
      {
        $facet: {
          // Status breakdown
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                avgMatchScore: { $avg: '$matchScore' },
                avgQuotedPrice: { $avg: '$quotedPrice' }
              }
            }
          ],
          // Overall stats
          overall: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                avgMatchScore: { $avg: '$matchScore' },
                avgQuotedPrice: { $avg: '$quotedPrice' },
                minQuotedPrice: { $min: '$quotedPrice' },
                maxQuotedPrice: { $max: '$quotedPrice' }
              }
            }
          ],
          // Applications over time (last 30 days)
          timeline: [
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: '%Y-%m-%d',
                    date: '$createdAt'
                  }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ]);

    const result = {
      byStatus: {},
      overall: {
        total: 0,
        avgMatchScore: 0,
        avgQuotedPrice: 0,
        minQuotedPrice: 0,
        maxQuotedPrice: 0
      },
      timeline: []
    };

    // Process status breakdown
    if (stats[0].byStatus.length > 0) {
      stats[0].byStatus.forEach(item => {
        result.byStatus[item._id] = {
          count: item.count,
          avgMatchScore: Math.round(item.avgMatchScore),
          avgQuotedPrice: Math.round(item.avgQuotedPrice)
        };
      });
    }

    // Process overall stats
    if (stats[0].overall.length > 0) {
      const overall = stats[0].overall[0];
      result.overall = {
        total: overall.total,
        avgMatchScore: Math.round(overall.avgMatchScore),
        avgQuotedPrice: Math.round(overall.avgQuotedPrice),
        minQuotedPrice: overall.minQuotedPrice,
        maxQuotedPrice: overall.maxQuotedPrice
      };
    }

    // Process timeline
    result.timeline = stats[0].timeline;

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching application statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};
