const Review = require('../models/Review.model');
const Deal = require('../models/Deal.model');
const InfluencerProfile = require('../models/InfluencerProfile.model');
const mongoose = require('mongoose');

// ==========================================
// SUBMIT REVIEW (Brand reviews Influencer)
// ==========================================
exports.submitReview = async (req, res) => {
  try {
    const {
      dealId,
      rating,
      reviewText,
      specificRatings
    } = req.body;

    // Validation
    if (!dealId || !rating || !reviewText) {
      return res.status(400).json({
        success: false,
        message: 'Deal ID, rating, and review text are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Get deal
    const deal = await Deal.findById(dealId)
      .populate('campaign');

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
        message: 'Only the brand can review the influencer'
      });
    }

    // Check if deal is completed
    if (deal.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed deals'
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ deal: dealId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Review already submitted for this deal',
        reviewId: existingReview._id
      });
    }

    // Create review
    const review = new Review({
      deal: dealId,
      campaign: deal.campaign._id,
      reviewer: req.user._id,
      reviewerRole: 'brand',
      reviewee: deal.influencer,
      revieweeRole: 'influencer',
      rating,
      reviewText,
      specificRatings: specificRatings || {},
      isPublic: true,
      isVerified: true // Auto-verified because it's from a completed deal
    });

    await review.save();

    // Update influencer profile with new review
    const influencerProfile = await InfluencerProfile.findOne({ userId: deal.influencer });
    
    if (influencerProfile) {
      // Recalculate average rating
      const allReviews = await Review.find({ 
        reviewee: deal.influencer,
        revieweeRole: 'influencer'
      });

      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      influencerProfile.averageRating = Math.round(avgRating * 10) / 10; // Round to 1 decimal
      influencerProfile.reviewCount = allReviews.length;

      // Recalculate trust score (reviews affect trust score)
      influencerProfile.trustScore = await influencerProfile.calculateTrustScore();
      
      await influencerProfile.save();
    }

    // Populate review for response
    await review.populate([
      { path: 'reviewer', select: 'name email' },
      { path: 'reviewee', select: 'name email' },
      { path: 'deal', select: 'agreedPrice completedAt' },
      { path: 'campaign', select: 'title' }
    ]);

    // TODO: Send notification to influencer

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });

  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: error.message
    });
  }
};

// ==========================================
// GET REVIEWS FOR INFLUENCER (Public)
// ==========================================
exports.getInfluencerReviews = async (req, res) => {
  try {
    const { influencerId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      minRating,
      verified
    } = req.query;

    // Build query
    const query = {
      reviewee: influencerId,
      revieweeRole: 'influencer',
      isPublic: true
    };

    if (minRating) {
      query.rating = { $gte: parseInt(minRating) };
    }

    if (verified === 'true') {
      query.isVerified = true;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find(query)
      .populate('reviewer', 'name')
      .populate({
        path: 'deal',
        select: 'agreedPrice completedAt',
        populate: {
          path: 'campaign',
          select: 'title category'
        }
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(query);

    // Calculate rating distribution
    const ratingDistribution = await Review.aggregate([
      { 
        $match: { 
          reviewee: mongoose.Types.ObjectId(influencerId),
          revieweeRole: 'influencer',
          isPublic: true
        }
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    const distribution = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    };

    ratingDistribution.forEach(item => {
      distribution[item._id] = item.count;
    });

    // Calculate average ratings
    const avgStats = await Review.aggregate([
      { 
        $match: { 
          reviewee: mongoose.Types.ObjectId(influencerId),
          revieweeRole: 'influencer',
          isPublic: true
        }
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          avgCommunication: { $avg: '$specificRatings.communication' },
          avgQuality: { $avg: '$specificRatings.quality' },
          avgTimeliness: { $avg: '$specificRatings.timeliness' },
          avgProfessionalism: { $avg: '$specificRatings.professionalism' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      statistics: {
        averageRating: avgStats[0] ? Math.round(avgStats[0].avgRating * 10) / 10 : 0,
        totalReviews: total,
        ratingDistribution: distribution,
        specificAverages: avgStats[0] ? {
          communication: Math.round((avgStats[0].avgCommunication || 0) * 10) / 10,
          quality: Math.round((avgStats[0].avgQuality || 0) * 10) / 10,
          timeliness: Math.round((avgStats[0].avgTimeliness || 0) * 10) / 10,
          professionalism: Math.round((avgStats[0].avgProfessionalism || 0) * 10) / 10
        } : {}
      }
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

// ==========================================
// GET MY RECEIVED REVIEWS (Influencer)
// ==========================================
exports.getMyReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({
      reviewee: req.user._id,
      revieweeRole: 'influencer'
    })
      .populate('reviewer', 'name email')
      .populate({
        path: 'deal',
        select: 'agreedPrice completedAt',
        populate: {
          path: 'campaign',
          select: 'title category'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({
      reviewee: req.user._id,
      revieweeRole: 'influencer'
    });

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

// ==========================================
// GET REVIEWS I'VE GIVEN (Brand)
// ==========================================
exports.getReviewsGiven = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({
      reviewer: req.user._id,
      reviewerRole: 'brand'
    })
      .populate('reviewee', 'name email')
      .populate({
        path: 'deal',
        select: 'agreedPrice completedAt',
        populate: [
          {
            path: 'campaign',
            select: 'title'
          },
          {
            path: 'application',
            populate: {
              path: 'influencerProfile',
              select: 'name avatar'
            }
          }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({
      reviewer: req.user._id,
      reviewerRole: 'brand'
    });

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

// ==========================================
// GET REVIEW BY ID
// ==========================================
exports.getReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id)
      .populate('reviewer', 'name email')
      .populate('reviewee', 'name email')
      .populate({
        path: 'deal',
        select: 'agreedPrice completedAt',
        populate: {
          path: 'campaign',
          select: 'title description category'
        }
      });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      data: review
    });

  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review',
      error: error.message
    });
  }
};

// ==========================================
// RESPOND TO REVIEW (Influencer)
// ==========================================
exports.respondToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Response text is required'
      });
    }

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user is the reviewee
    if (review.reviewee.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the reviewee can respond to this review'
      });
    }

    // Check if already responded
    if (review.response && review.response.text) {
      return res.status(400).json({
        success: false,
        message: 'You have already responded to this review'
      });
    }

    // Add response
    review.response = {
      text,
      respondedAt: new Date()
    };

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Response added successfully',
      data: review
    });

  } catch (error) {
    console.error('Error responding to review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to review',
      error: error.message
    });
  }
};

// ==========================================
// MARK REVIEW AS HELPFUL
// ==========================================
exports.markHelpful = async (req, res) => {
  try {
    const { id } = req.params;
    const { helpful } = req.body; // true for helpful, false for not helpful

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Update count
    if (helpful) {
      review.helpfulCount += 1;
    } else {
      review.notHelpfulCount += 1;
    }

    await review.save();

    res.status(200).json({
      success: true,
      message: `Marked as ${helpful ? 'helpful' : 'not helpful'}`,
      data: {
        helpfulCount: review.helpfulCount,
        notHelpfulCount: review.notHelpfulCount
      }
    });

  } catch (error) {
    console.error('Error marking review as helpful:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message
    });
  }
};

// ==========================================
// FLAG REVIEW
// ==========================================
exports.flagReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Flag reason is required'
      });
    }

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Add flag
    if (!review.flags) {
      review.flags = [];
    }

    review.flags.push({
      flaggedBy: req.user._id,
      reason,
      flaggedAt: new Date()
    });

    review.isFlagged = true;

    await review.save();

    // TODO: Notify admin about flagged review

    res.status(200).json({
      success: true,
      message: 'Review flagged for review by admin'
    });

  } catch (error) {
    console.error('Error flagging review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to flag review',
      error: error.message
    });
  }
};

// ==========================================
// GET INFLUENCER REVIEW STATISTICS
// ==========================================
exports.getInfluencerReviewStats = async (req, res) => {
  try {
    const { influencerId } = req.params;

    // Overall stats
    const totalReviews = await Review.countDocuments({
      reviewee: influencerId,
      revieweeRole: 'influencer',
      isPublic: true
    });

    // Rating distribution and averages
    const stats = await Review.aggregate([
      { 
        $match: { 
          reviewee: mongoose.Types.ObjectId(influencerId),
          revieweeRole: 'influencer',
          isPublic: true
        }
      },
      {
        $facet: {
          ratingDistribution: [
            {
              $group: {
                _id: '$rating',
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: -1 } }
          ],
          averages: [
            {
              $group: {
                _id: null,
                avgRating: { $avg: '$rating' },
                avgCommunication: { $avg: '$specificRatings.communication' },
                avgQuality: { $avg: '$specificRatings.quality' },
                avgTimeliness: { $avg: '$specificRatings.timeliness' },
                avgProfessionalism: { $avg: '$specificRatings.professionalism' }
              }
            }
          ],
          recentTrend: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $group: {
                _id: null,
                recentAvg: { $avg: '$rating' }
              }
            }
          ]
        }
      }
    ]);

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    if (stats[0].ratingDistribution) {
      stats[0].ratingDistribution.forEach(item => {
        distribution[item._id] = item.count;
      });
    }

    const averages = stats[0].averages[0] || {};

    res.status(200).json({
      success: true,
      data: {
        totalReviews,
        averageRating: Math.round((averages.avgRating || 0) * 10) / 10,
        recentAverageRating: Math.round((stats[0].recentTrend[0]?.recentAvg || 0) * 10) / 10,
        ratingDistribution: distribution,
        specificAverages: {
          communication: Math.round((averages.avgCommunication || 0) * 10) / 10,
          quality: Math.round((averages.avgQuality || 0) * 10) / 10,
          timeliness: Math.round((averages.avgTimeliness || 0) * 10) / 10,
          professionalism: Math.round((averages.avgProfessionalism || 0) * 10) / 10
        },
        percentageByRating: {
          5: totalReviews > 0 ? Math.round((distribution[5] / totalReviews) * 100) : 0,
          4: totalReviews > 0 ? Math.round((distribution[4] / totalReviews) * 100) : 0,
          3: totalReviews > 0 ? Math.round((distribution[3] / totalReviews) * 100) : 0,
          2: totalReviews > 0 ? Math.round((distribution[2] / totalReviews) * 100) : 0,
          1: totalReviews > 0 ? Math.round((distribution[1] / totalReviews) * 100) : 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching review statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};
