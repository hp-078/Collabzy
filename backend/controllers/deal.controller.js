const Deal = require('../models/Deal.model');
const Application = require('../models/Application.model');
const Campaign = require('../models/Campaign.model');
const InfluencerProfile = require('../models/InfluencerProfile.model');
const BrandProfile = require('../models/BrandProfile.model');
const { createNotificationFromTemplate } = require('../services/notification.service');
const trustScoreService = require('../services/trustScore.service');
const paymentService = require('../services/payment.service');

const normalizeHttpUrl = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch (error) {
    return null;
  }
};

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
      deadline: deadline || application.campaign.deadline,
      status: 'pending_payment',
      paymentStatus: 'pending'
    });

    let paymentOrder;
    try {
      // Mandatory rule: payment order must be initialized during deal creation.
      paymentOrder = await paymentService.createOrder(deal, deal.agreedRate);
    } catch (paymentErr) {
      await Deal.findByIdAndDelete(deal._id);
      return res.status(400).json({
        success: false,
        message: paymentErr.message || 'Payment initialization failed. Deal was not created.'
      });
    }

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
      message: 'Deal created and payment initialized successfully',
      data: {
        deal,
        paymentOrder
      }
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
        .populate('paymentId') // Populate payment details
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
    const { status, previewLink, finalContentLink, requestRevision } = req.body;
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

    const userId = req.user._id.toString();
    const isBrandUser = deal.brand.toString() === userId;
    const isInfluencerUser = deal.influencer.toString() === userId;
    const previousStatus = deal.status;

    if (status === 'pending_review') {
      if (!isInfluencerUser) {
        return res.status(403).json({
          success: false,
          message: 'Only influencer can submit work for review'
        });
      }

      const normalizedPreview = normalizeHttpUrl(previewLink);
      if (!normalizedPreview) {
        return res.status(400).json({
          success: false,
          message: 'Valid work preview link is required to submit for review'
        });
      }

      deal.previewLink = normalizedPreview;
      deal.previewSubmittedAt = new Date();
      deal.previewApprovedAt = null;
    }

    if (status === 'in_progress' && previousStatus === 'pending_review') {
      if (!isBrandUser) {
        return res.status(403).json({
          success: false,
          message: 'Only brand can review submitted preview'
        });
      }

      if (requestRevision) {
        deal.previewApprovedAt = null;
      } else {
        deal.previewApprovedAt = new Date();
      }
    }

    if (status === 'completed') {
      if (!isInfluencerUser) {
        return res.status(403).json({
          success: false,
          message: 'Only influencer can submit final posted content'
        });
      }

      if (!deal.previewApprovedAt) {
        return res.status(400).json({
          success: false,
          message: 'Brand approval on preview is required before final submission'
        });
      }

      const normalizedFinal = normalizeHttpUrl(finalContentLink);
      if (!normalizedFinal) {
        return res.status(400).json({
          success: false,
          message: 'Valid final posted content link is required'
        });
      }

      deal.finalContentLink = normalizedFinal;
      deal.finalSubmittedAt = new Date();
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

      // Update trust score for completed deal
      try {
        await trustScoreService.updateTrustScore(
          deal.influencer.toString(),
          'DEAL_COMPLETED',
          { dealId: deal._id, amount: deal.agreedRate }
        );
      } catch (trustErr) {
        console.error('Trust score update error:', trustErr);
      }
    }
    if (status === 'cancelled') {
      deal.cancelledAt = new Date();

      // Penalize trust score for cancelled deal
      try {
        await trustScoreService.updateTrustScore(
          deal.influencer.toString(),
          'DEAL_CANCELLED',
          { dealId: deal._id, amount: deal.agreedRate }
        );
      } catch (trustErr) {
        console.error('Trust score update error:', trustErr);
      }
    }

    await deal.save();

    // Notify the other party about deal status change
    try {
      const otherParty = deal.brand.toString() === req.user._id.toString()
        ? deal.influencer : deal.brand;
      const campaignData = await Campaign.findById(deal.campaign).select('title');
      const templateMap = {
        'pending_review': 'CONTENT_SUBMITTED',
        'completed': 'DEAL_COMPLETED',
        'cancelled': 'DEAL_CANCELLED',
        'in_progress': 'DEAL_STARTED'
      };
      let templateType = templateMap[status];
      if (status === 'in_progress' && previousStatus === 'pending_review' && requestRevision) {
        templateType = 'REVISION_REQUESTED';
      }
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
