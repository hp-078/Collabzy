const Deal = require('../models/Deal.model');
const Application = require('../models/Application.model');
const Campaign = require('../models/Campaign.model');
const InfluencerProfile = require('../models/InfluencerProfile.model');
const Review = require('../models/Review.model');
const mongoose = require('mongoose');

// ==========================================
// CREATE DEAL (Called internally when application accepted)
// ==========================================
exports.createDealFromApplication = async (applicationId) => {
  try {
    const application = await Application.findById(applicationId)
      .populate('campaign')
      .populate('influencerProfile');

    if (!application) {
      throw new Error('Application not found');
    }

    if (application.status !== 'accepted') {
      throw new Error('Only accepted applications can create deals');
    }

    // Check if deal already exists
    const existingDeal = await Deal.findOne({ application: applicationId });
    if (existingDeal) {
      return existingDeal;
    }

    // Create deal
    const deal = new Deal({
      application: application._id,
      campaign: application.campaign._id,
      influencer: application.influencer,
      brand: application.brand,
      agreedPrice: application.quotedPrice,
      deliverables: application.campaign.deliverables.map(d => ({
        type: d.type,
        description: d.description,
        quantity: d.quantity,
        status: 'pending'
      })),
      deadline: application.campaign.deadline,
      status: 'confirmed'
    });

    await deal.save();
    return deal;

  } catch (error) {
    console.error('Error creating deal:', error);
    throw error;
  }
};

// ==========================================
// GET MY DEALS
// ==========================================
exports.getMyDeals = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build query based on user role
    const query = {
      $or: [
        { influencer: req.user._id },
        { brand: req.user._id }
      ]
    };

    // Filter by status
    if (status && ['confirmed', 'in-progress', 'content-submitted', 'approved', 'completed', 'cancelled', 'disputed'].includes(status)) {
      query.status = status;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const deals = await Deal.find(query)
      .populate('campaign', 'title description category platformType')
      .populate('influencer', 'email name')
      .populate('brand', 'email name')
      .populate({
        path: 'campaign',
        populate: {
          path: 'brandProfile',
          select: 'name logo'
        }
      })
      .populate({
        path: 'influencer',
        populate: {
          path: 'influencerProfile',
          select: 'name avatar'
        }
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Deal.countDocuments(query);

    // Get status counts
    const statusCounts = await Deal.aggregate([
      {
        $match: {
          $or: [
            { influencer: mongoose.Types.ObjectId(req.user._id) },
            { brand: mongoose.Types.ObjectId(req.user._id) }
          ]
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const counts = {
      total,
      confirmed: 0,
      'in-progress': 0,
      'content-submitted': 0,
      approved: 0,
      completed: 0,
      cancelled: 0,
      disputed: 0
    };

    statusCounts.forEach(item => {
      counts[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      data: deals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      statusCounts: counts
    });

  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deals',
      error: error.message
    });
  }
};

// ==========================================
// GET DEAL BY ID
// ==========================================
exports.getDealById = async (req, res) => {
  try {
    const { id } = req.params;

    const deal = await Deal.findById(id)
      .populate('application')
      .populate('campaign', 'title description category platformType deliverables budget')
      .populate('influencer', 'email name')
      .populate('brand', 'email name')
      .populate({
        path: 'campaign',
        populate: {
          path: 'brandProfile',
          select: 'name logo industry website'
        }
      })
      .populate({
        path: 'application',
        populate: {
          path: 'influencerProfile',
          select: 'name avatar bio niche platforms followers engagementRate trustScore'
        }
      })
      .populate('submissions.reviewedBy', 'name email')
      .populate('notes.author', 'name email');

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    // Authorization check
    const isInfluencer = deal.influencer._id.toString() === req.user._id.toString();
    const isBrand = deal.brand._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isInfluencer && !isBrand && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this deal'
      });
    }

    res.status(200).json({
      success: true,
      data: deal
    });

  } catch (error) {
    console.error('Error fetching deal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deal',
      error: error.message
    });
  }
};

// ==========================================
// UPDATE DEAL STATUS
// ==========================================
exports.updateDealStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['confirmed', 'in-progress', 'content-submitted', 'approved', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
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
    const isParticipant = 
      deal.influencer.toString() === req.user._id.toString() ||
      deal.brand.toString() === req.user._id.toString();

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this deal'
      });
    }

    // Update status
    const oldStatus = deal.status;
    deal.status = status;

    // Add note if provided
    if (note) {
      deal.notes.push({
        author: req.user._id,
        text: `Status changed from ${oldStatus} to ${status}: ${note}`,
        createdAt: new Date()
      });
    }

    // Mark completion timestamp
    if (status === 'completed' && !deal.completedAt) {
      deal.completedAt = new Date();
    }

    await deal.save();

    res.status(200).json({
      success: true,
      message: `Deal status updated to ${status}`,
      data: deal
    });

  } catch (error) {
    console.error('Error updating deal status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update deal status',
      error: error.message
    });
  }
};

// ==========================================
// SUBMIT CONTENT (Influencer)
// ==========================================
exports.submitContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { contentLinks, description, proofOfWork } = req.body;

    if (!contentLinks || contentLinks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one content link is required'
      });
    }

    const deal = await Deal.findById(id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    // Check if user is the influencer
    if (deal.influencer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the influencer can submit content'
      });
    }

    // Check deal status
    if (!['confirmed', 'in-progress'].includes(deal.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot submit content for deal with status: ${deal.status}`
      });
    }

    // Add submission
    deal.submissions.push({
      submittedAt: new Date(),
      contentLinks,
      description,
      proofOfWork: proofOfWork || [],
      status: 'pending-review'
    });

    // Update deal status
    deal.status = 'content-submitted';

    // Add note
    deal.notes.push({
      author: req.user._id,
      text: 'Content submitted for review',
      createdAt: new Date()
    });

    await deal.save();

    // TODO: Send notification to brand

    res.status(200).json({
      success: true,
      message: 'Content submitted successfully',
      data: deal
    });

  } catch (error) {
    console.error('Error submitting content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit content',
      error: error.message
    });
  }
};

// ==========================================
// APPROVE CONTENT (Brand)
// ==========================================
exports.approveContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { submissionIndex, feedback } = req.body;

    const deal = await Deal.findById(id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    // Check if user is the brand
    if (deal.brand.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the brand can approve content'
      });
    }

    // Get latest submission if index not provided
    const index = submissionIndex !== undefined ? submissionIndex : deal.submissions.length - 1;

    if (index < 0 || index >= deal.submissions.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid submission index'
      });
    }

    // Update submission
    deal.submissions[index].status = 'approved';
    deal.submissions[index].reviewedAt = new Date();
    deal.submissions[index].reviewedBy = req.user._id;
    deal.submissions[index].feedback = feedback || 'Content approved';

    // Update deal status
    deal.status = 'approved';

    // Add note
    deal.notes.push({
      author: req.user._id,
      text: `Content approved${feedback ? `: ${feedback}` : ''}`,
      createdAt: new Date()
    });

    await deal.save();

    // TODO: Send notification to influencer
    // TODO: Trigger review prompt

    res.status(200).json({
      success: true,
      message: 'Content approved successfully',
      data: deal
    });

  } catch (error) {
    console.error('Error approving content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve content',
      error: error.message
    });
  }
};

// ==========================================
// REQUEST REVISION (Brand)
// ==========================================
exports.requestRevision = async (req, res) => {
  try {
    const { id } = req.params;
    const { submissionIndex, reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason for revision is required'
      });
    }

    const deal = await Deal.findById(id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    // Check if user is the brand
    if (deal.brand.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the brand can request revisions'
      });
    }

    // Get latest submission if index not provided
    const index = submissionIndex !== undefined ? submissionIndex : deal.submissions.length - 1;

    if (index < 0 || index >= deal.submissions.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid submission index'
      });
    }

    // Update submission
    deal.submissions[index].status = 'revision-requested';
    deal.submissions[index].reviewedAt = new Date();
    deal.submissions[index].reviewedBy = req.user._id;
    deal.submissions[index].feedback = reason;

    // Add revision request
    deal.revisionRequests.push({
      requestedAt: new Date(),
      reason,
      requestedBy: req.user._id,
      resolved: false
    });

    // Update deal status back to in-progress
    deal.status = 'in-progress';

    // Add note
    deal.notes.push({
      author: req.user._id,
      text: `Revision requested: ${reason}`,
      createdAt: new Date()
    });

    await deal.save();

    // TODO: Send notification to influencer

    res.status(200).json({
      success: true,
      message: 'Revision requested successfully',
      data: deal
    });

  } catch (error) {
    console.error('Error requesting revision:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request revision',
      error: error.message
    });
  }
};

// ==========================================
// RESUBMIT CONTENT (Influencer after revision)
// ==========================================
exports.resubmitContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { contentLinks, description, proofOfWork, revisionIndex } = req.body;

    const deal = await Deal.findById(id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    // Check if user is the influencer
    if (deal.influencer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the influencer can resubmit content'
      });
    }

    // Mark revision as resolved if index provided
    if (revisionIndex !== undefined && deal.revisionRequests[revisionIndex]) {
      deal.revisionRequests[revisionIndex].resolved = true;
      deal.revisionRequests[revisionIndex].resolvedAt = new Date();
    }

    // Add new submission
    deal.submissions.push({
      submittedAt: new Date(),
      contentLinks,
      description,
      proofOfWork: proofOfWork || [],
      status: 'pending-review'
    });

    // Update deal status
    deal.status = 'content-submitted';

    // Add note
    deal.notes.push({
      author: req.user._id,
      text: 'Revised content submitted for review',
      createdAt: new Date()
    });

    await deal.save();

    res.status(200).json({
      success: true,
      message: 'Revised content submitted successfully',
      data: deal
    });

  } catch (error) {
    console.error('Error resubmitting content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resubmit content',
      error: error.message
    });
  }
};

// ==========================================
// MARK DEAL AS COMPLETE (Brand)
// ==========================================
exports.markComplete = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const deal = await Deal.findById(id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    // Check if user is the brand
    if (deal.brand.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the brand can mark deal as complete'
      });
    }

    // Check if content was approved
    if (deal.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Content must be approved before marking deal as complete'
      });
    }

    // Update status
    deal.status = 'completed';
    deal.completedAt = new Date();

    // Add note
    deal.notes.push({
      author: req.user._id,
      text: note || 'Deal marked as complete',
      createdAt: new Date()
    });

    await deal.save();

    // Update influencer past collaborations count
    await InfluencerProfile.findOneAndUpdate(
      { userId: deal.influencer },
      { $inc: { pastCollaborations: 1 } }
    );

    // TODO: Trigger review prompt for brand
    // TODO: Send notification to influencer

    res.status(200).json({
      success: true,
      message: 'Deal marked as complete',
      data: deal
    });

  } catch (error) {
    console.error('Error marking deal complete:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark deal as complete',
      error: error.message
    });
  }
};

// ==========================================
// CANCEL DEAL
// ==========================================
exports.cancelDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason is required'
      });
    }

    const deal = await Deal.findById(id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    // Check if user is participant
    const isParticipant = 
      deal.influencer.toString() === req.user._id.toString() ||
      deal.brand.toString() === req.user._id.toString();

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to cancel this deal'
      });
    }

    // Check if already completed
    if (deal.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed deal'
      });
    }

    // Update status
    deal.status = 'cancelled';
    deal.cancelledAt = new Date();
    deal.cancellationReason = reason;

    // Add note
    deal.notes.push({
      author: req.user._id,
      text: `Deal cancelled: ${reason}`,
      createdAt: new Date()
    });

    await deal.save();

    // TODO: Send notifications to both parties

    res.status(200).json({
      success: true,
      message: 'Deal cancelled successfully',
      data: deal
    });

  } catch (error) {
    console.error('Error cancelling deal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel deal',
      error: error.message
    });
  }
};

// ==========================================
// ADD NOTE TO DEAL
// ==========================================
exports.addNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Note text is required'
      });
    }

    const deal = await Deal.findById(id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    // Check if user is participant
    const isParticipant = 
      deal.influencer.toString() === req.user._id.toString() ||
      deal.brand.toString() === req.user._id.toString();

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add notes to this deal'
      });
    }

    // Add note
    deal.notes.push({
      author: req.user._id,
      text,
      createdAt: new Date()
    });

    await deal.save();

    // Populate the new note
    await deal.populate('notes.author', 'name email');

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: deal.notes[deal.notes.length - 1]
    });

  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add note',
      error: error.message
    });
  }
};

// ==========================================
// GET DEAL STATISTICS
// ==========================================
exports.getDealStats = async (req, res) => {
  try {
    const query = {
      $or: [
        { influencer: req.user._id },
        { brand: req.user._id }
      ]
    };

    // Overall stats
    const totalDeals = await Deal.countDocuments(query);
    const completedDeals = await Deal.countDocuments({ ...query, status: 'completed' });
    const activeDeals = await Deal.countDocuments({ 
      ...query, 
      status: { $in: ['confirmed', 'in-progress', 'content-submitted', 'approved'] }
    });

    // Calculate total earnings (for influencers) or spending (for brands)
    const isInfluencer = req.user.role === 'influencer';
    const financialStats = await Deal.aggregate([
      {
        $match: isInfluencer 
          ? { influencer: mongoose.Types.ObjectId(req.user._id), status: 'completed' }
          : { brand: mongoose.Types.ObjectId(req.user._id), status: 'completed' }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$agreedPrice' },
          avgAmount: { $avg: '$agreedPrice' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get average completion time
    const completionStats = await Deal.aggregate([
      {
        $match: { ...query, status: 'completed', completedAt: { $exists: true } }
      },
      {
        $project: {
          completionTime: {
            $divide: [
              { $subtract: ['$completedAt', '$createdAt'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgCompletionDays: { $avg: '$completionTime' }
        }
      }
    ]);

    // Status breakdown
    const statusBreakdown = await Deal.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = {};
    statusBreakdown.forEach(item => {
      statusCounts[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalDeals,
          activeDeals,
          completedDeals,
          cancelledDeals: statusCounts.cancelled || 0
        },
        financial: {
          total: financialStats[0]?.totalAmount || 0,
          average: Math.round(financialStats[0]?.avgAmount || 0),
          completedCount: financialStats[0]?.count || 0
        },
        performance: {
          avgCompletionDays: Math.round(completionStats[0]?.avgCompletionDays || 0),
          completionRate: totalDeals > 0 ? Math.round((completedDeals / totalDeals) * 100) : 0
        },
        statusBreakdown: statusCounts
      }
    });

  } catch (error) {
    console.error('Error fetching deal statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};
