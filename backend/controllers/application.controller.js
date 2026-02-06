const Application = require('../models/Application.model');
const Campaign = require('../models/Campaign.model');
const InfluencerProfile = require('../models/InfluencerProfile.model');
const { createNotificationFromTemplate } = require('../services/notification.service');

/**
 * Submit application (Influencer only)
 * POST /api/applications
 */
exports.submitApplication = async (req, res) => {
  try {
    const influencerId = req.user._id;
    const { campaignId, message, proposedRate, proposedDeliverables, portfolioLinks } = req.body;

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: 'Campaign ID is required'
      });
    }

    // Get campaign
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if campaign is active
    if (campaign.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Campaign is not accepting applications'
      });
    }

    // Check deadline
    if (new Date(campaign.deadline) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Campaign deadline has passed'
      });
    }

    // Check max influencers
    if (campaign.acceptedCount >= campaign.maxInfluencers) {
      return res.status(400).json({
        success: false,
        message: 'Campaign has reached maximum influencers'
      });
    }

    // Get influencer profile
    const influencerProfile = await InfluencerProfile.findOne({ user: influencerId });
    if (!influencerProfile) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your influencer profile first'
      });
    }

    // Check eligibility
    const eligibilityCheck = campaign.isEligible(influencerProfile);
    if (!eligibilityCheck.eligible) {
      return res.status(400).json({
        success: false,
        message: 'You are not eligible for this campaign',
        reasons: eligibilityCheck.reasons
      });
    }

    // Check for existing application
    const existingApplication = await Application.findOne({
      campaign: campaignId,
      influencer: influencerId
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this campaign'
      });
    }

    // Create application
    const application = await Application.create({
      campaign: campaignId,
      influencer: influencerId,
      influencerProfile: influencerProfile._id,
      message: message || '',
      proposedRate: proposedRate || campaign.budget.min,
      proposedDeliverables: proposedDeliverables || [],
      portfolioLinks: portfolioLinks || []
    });

    // Update campaign application count
    campaign.applicationCount += 1;
    await campaign.save();

    await application.populate('campaign', 'title');
    await application.populate('influencerProfile', 'name avatar');

    // Notify brand about new application
    try {
      await createNotificationFromTemplate(campaign.brand, 'APPLICATION_RECEIVED', {
        influencerName: req.user.name,
        campaignTitle: campaign.title,
        applicationId: application._id
      }, { relatedId: application._id, relatedType: 'application' });
    } catch (notifErr) {
      console.error('Notification error:', notifErr);
    }

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });
  } catch (error) {
    console.error('Submit application error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this campaign'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit application'
    });
  }
};

/**
 * Get influencer's applications
 * GET /api/applications/my-applications
 */
exports.getMyApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = { influencer: req.user._id };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate('campaign', 'title status deadline budget')
        .populate({
          path: 'campaign',
          populate: { path: 'brandProfile', select: 'companyName logo' }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Application.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications'
    });
  }
};

/**
 * Get application by ID
 * GET /api/applications/:id
 */
exports.getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('campaign')
      .populate('influencer', 'name email')
      .populate('influencerProfile');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check authorization
    const isOwner = application.influencer._id.toString() === req.user._id.toString();
    const campaign = await Campaign.findById(application.campaign);
    const isBrandOwner = campaign && campaign.brand.toString() === req.user._id.toString();

    if (!isOwner && !isBrandOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this application'
      });
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application'
    });
  }
};

/**
 * Get applications for a campaign (Brand only)
 * GET /api/applications/campaign/:campaignId
 */
exports.getApplicationsForCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    // Verify campaign ownership
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (campaign.brand.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these applications'
      });
    }

    const filter = { campaign: campaignId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate('influencer', 'name email')
        .populate('influencerProfile', 'name avatar niche platformType totalFollowers trustScore')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Application.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get campaign applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications'
    });
  }
};

/**
 * Update application status (Brand only)
 * PUT /api/applications/:id/status
 */
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, message } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['reviewed', 'shortlisted', 'accepted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify campaign ownership
    const campaign = await Campaign.findById(application.campaign);
    if (campaign.brand.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this application'
      });
    }

    // Update status
    const previousStatus = application.status;
    application.status = status;
    application.brandResponse = {
      message: message || '',
      respondedAt: new Date()
    };

    // Set timestamp based on status
    if (status === 'reviewed') application.reviewedAt = new Date();
    if (status === 'accepted') application.acceptedAt = new Date();
    if (status === 'rejected') application.rejectedAt = new Date();

    await application.save();

    // Update campaign counts if accepted
    if (status === 'accepted' && previousStatus !== 'accepted') {
      campaign.acceptedCount += 1;
      await campaign.save();
    }

    // Notify influencer about status change
    try {
      const templateMap = {
        'shortlisted': 'APPLICATION_SHORTLISTED',
        'accepted': 'APPLICATION_ACCEPTED',
        'rejected': 'APPLICATION_REJECTED'
      };
      const templateType = templateMap[status];
      if (templateType) {
        await createNotificationFromTemplate(application.influencer, templateType, {
          campaignTitle: campaign.title,
          applicationId: application._id,
          dealId: application._id
        }, { relatedId: application._id, relatedType: 'application' });
      }
    } catch (notifErr) {
      console.error('Notification error:', notifErr);
    }

    res.json({
      success: true,
      message: `Application ${status}`,
      data: application
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application'
    });
  }
};

/**
 * Withdraw application (Influencer only)
 * PUT /api/applications/:id/withdraw
 */
exports.withdrawApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

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
        message: 'Not authorized to withdraw this application'
      });
    }

    // Can only withdraw pending applications
    if (!['pending', 'reviewed', 'shortlisted'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot withdraw this application'
      });
    }

    application.status = 'withdrawn';
    application.withdrawnAt = new Date();
    await application.save();

    // Update campaign count
    const campaign = await Campaign.findById(application.campaign);
    if (campaign && campaign.applicationCount > 0) {
      campaign.applicationCount -= 1;
      await campaign.save();
    }

    res.json({
      success: true,
      message: 'Application withdrawn successfully'
    });
  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to withdraw application'
    });
  }
};

/**
 * Update application (Influencer only, only if pending)
 * PUT /api/applications/:id
 */
exports.updateApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

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
        message: 'Not authorized to update this application'
      });
    }

    // Can only update pending applications
    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only update pending applications'
      });
    }

    // Update allowed fields
    const { message, proposedRate, proposedDeliverables, portfolioLinks } = req.body;

    if (message !== undefined) application.message = message;
    if (proposedRate !== undefined) application.proposedRate = proposedRate;
    if (proposedDeliverables !== undefined) application.proposedDeliverables = proposedDeliverables;
    if (portfolioLinks !== undefined) application.portfolioLinks = portfolioLinks;

    await application.save();

    res.json({
      success: true,
      message: 'Application updated successfully',
      data: application
    });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application'
    });
  }
};

/**
 * Get application statistics for campaign
 * GET /api/applications/campaign/:campaignId/stats
 */
exports.getCampaignApplicationStats = async (req, res) => {
  try {
    const { campaignId } = req.params;

    // Verify campaign ownership
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.brand.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const stats = await Application.aggregate([
      { $match: { campaign: campaign._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsMap = {
      pending: 0,
      reviewed: 0,
      shortlisted: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0
    };

    stats.forEach(s => {
      statsMap[s._id] = s.count;
    });

    res.json({
      success: true,
      data: {
        total: Object.values(statsMap).reduce((a, b) => a + b, 0),
        ...statsMap
      }
    });
  } catch (error) {
    console.error('Get campaign stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
};
