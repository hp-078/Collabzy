const Deal = require('../models/Deal.model');
const Application = require('../models/Application.model');
const Campaign = require('../models/Campaign.model');
const InfluencerProfile = require('../models/InfluencerProfile.model');
const BrandProfile = require('../models/BrandProfile.model');
const { createNotificationFromTemplate } = require('../services/notification.service');

/**
 * Create deal from accepted application (Brand only)
 * POST /api/deals
 */
exports.createDeal = async (req, res) => {
  try {
    const { applicationId, agreedRate, deliverables, deadline } = req.body;

    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: 'Application ID is required'
      });
    }

    // Get application
    const application = await Application.findById(applicationId)
      .populate('campaign');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify brand owns the campaign
    if (application.campaign.brand.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if application is accepted
    if (application.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Application must be accepted first'
      });
    }

    // Check if deal already exists
    const existingDeal = await Deal.findOne({ application: applicationId });
    if (existingDeal) {
      return res.status(400).json({
        success: false,
        message: 'Deal already exists for this application'
      });
    }

    // Create deal
    const deal = await Deal.create({
      campaign: application.campaign._id,
      application: applicationId,
      brand: req.user._id,
      influencer: application.influencer,
      agreedRate: agreedRate || application.proposedRate,
      deliverables: deliverables || application.campaign.deliverables,
      deadline: deadline || application.campaign.deadline
    });

    await deal.populate('influencer', 'name email');
    await deal.populate('campaign', 'title');

    // Notify influencer about new deal
    try {
      await createNotificationFromTemplate(application.influencer, 'DEAL_CONFIRMED', {
        campaignTitle: application.campaign.title,
        dealId: deal._id
      }, { relatedId: deal._id, relatedType: 'deal' });
    } catch (notifErr) {
      console.error('Notification error:', notifErr);
    }

    res.status(201).json({
      success: true,
      message: 'Deal created successfully',
      data: deal
    });
  } catch (error) {
    console.error('Create deal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create deal'
    });
  }
};

/**
 * Get my deals
 * GET /api/deals/my-deals
 */
exports.getMyDeals = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user._id;
    const role = req.user.role;

    const filter = role === 'brand'
      ? { brand: userId }
      : { influencer: userId };

    if (status && status !== 'all') {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [deals, total] = await Promise.all([
      Deal.find(filter)
        .populate('campaign', 'title')
        .populate('brand', 'name')
        .populate('influencer', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Deal.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: deals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get my deals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deals'
    });
  }
};

/**
 * Get deal by ID
 * GET /api/deals/:id
 */
exports.getDealById = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id)
      .populate('campaign')
      .populate('brand', 'name email')
      .populate('influencer', 'name email')
      .populate('application');

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    // Check authorization
    const isParty = deal.brand._id.toString() === req.user._id.toString() ||
      deal.influencer._id.toString() === req.user._id.toString();

    if (!isParty) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.json({
      success: true,
      data: deal
    });
  } catch (error) {
    console.error('Get deal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deal'
    });
  }
};

/**
 * Update deal status
 * PUT /api/deals/:id/status
 */
exports.updateDealStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'in_progress', 'pending_review', 'completed', 'cancelled', 'disputed'];

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const deal = await Deal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    // Check authorization
    const isParty = deal.brand.toString() === req.user._id.toString() ||
      deal.influencer.toString() === req.user._id.toString();

    if (!isParty) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    deal.status = status;
    if (status === 'completed') {
      deal.completedAt = new Date();

      // Update influencer stats
      await InfluencerProfile.findOneAndUpdate(
        { user: deal.influencer },
        {
          $inc: {
            campaignsCompleted: 1,
            totalEarnings: deal.agreedRate
          }
        }
      );

      // Update brand stats
      await BrandProfile.findOneAndUpdate(
        { user: deal.brand },
        {
          $inc: { completedCampaigns: 1, totalSpent: deal.agreedRate, activeCampaigns: -1 }
        }
      );
    }
    if (status === 'cancelled') {
      deal.cancelledAt = new Date();
    }

    await deal.save();

    // Notify the other party about deal status change
    try {
      const otherParty = deal.brand.toString() === req.user._id.toString()
        ? deal.influencer : deal.brand;
      const campaignData = await Campaign.findById(deal.campaign).select('title');
      const templateMap = {
        'completed': 'DEAL_COMPLETED',
        'cancelled': 'DEAL_CANCELLED',
        'in_progress': 'DEAL_STARTED'
      };
      const templateType = templateMap[status];
      if (templateType) {
        await createNotificationFromTemplate(otherParty, templateType, {
          campaignTitle: campaignData?.title || 'Campaign',
          dealId: deal._id
        }, { relatedId: deal._id, relatedType: 'deal' });
      }
    } catch (notifErr) {
      console.error('Notification error:', notifErr);
    }

    res.json({
      success: true,
      message: `Deal ${status}`,
      data: deal
    });
  } catch (error) {
    console.error('Update deal status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update deal'
    });
  }
};

/**
 * Update deliverable status
 * PUT /api/deals/:id/deliverables/:deliverableIndex
 */
exports.updateDeliverable = async (req, res) => {
  try {
    const { id, deliverableIndex } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'submitted', 'approved', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const deal = await Deal.findById(id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    // Check authorization
    const isParty = deal.brand.toString() === req.user._id.toString() ||
      deal.influencer.toString() === req.user._id.toString();

    if (!isParty) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const index = parseInt(deliverableIndex);
    if (isNaN(index) || index < 0 || index >= deal.deliverables.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid deliverable index'
      });
    }

    deal.deliverables[index].status = status;
    if (status === 'submitted') deal.deliverables[index].submittedAt = new Date();
    if (status === 'approved') deal.deliverables[index].approvedAt = new Date();

    await deal.save();

    res.json({
      success: true,
      message: 'Deliverable updated',
      data: deal
    });
  } catch (error) {
    console.error('Update deliverable error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update deliverable'
    });
  }
};
