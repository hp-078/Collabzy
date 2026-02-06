const Review = require('../models/Review.model');
const Deal = require('../models/Deal.model');
const InfluencerProfile = require('../models/InfluencerProfile.model');
const BrandProfile = require('../models/BrandProfile.model');

/**
 * Create review
 * POST /api/reviews
 */
exports.createReview = async (req, res) => {
  try {
    const { dealId, rating, title, content, detailedRatings } = req.body;

    if (!dealId || !rating || !content) {
      return res.status(400).json({
        success: false,
        message: 'Deal ID, rating, and content are required'
      });
    }

    // Get deal
    const deal = await Deal.findById(dealId).populate('campaign');

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    // Check if deal is completed
    if (deal.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed deals'
      });
    }

    // Determine reviewer and reviewee
    const isBrand = deal.brand.toString() === req.user._id.toString();
    const isInfluencer = deal.influencer.toString() === req.user._id.toString();

    if (!isBrand && !isInfluencer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to review this deal'
      });
    }

    const reviewType = isBrand ? 'brand_to_influencer' : 'influencer_to_brand';
    const reviewee = isBrand ? deal.influencer : deal.brand;

    // Check for existing review
    const existingReview = await Review.findOne({
      deal: dealId,
      reviewer: req.user._id
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this deal'
      });
    }

    // Create review
    const review = await Review.create({
      deal: dealId,
      campaign: deal.campaign._id,
      reviewer: req.user._id,
      reviewee,
      reviewType,
      rating: Math.min(5, Math.max(1, rating)),
      title: title || '',
      content,
      detailedRatings: detailedRatings || {}
    });

    // Update reviewee's average rating
    if (reviewType === 'brand_to_influencer') {
      const influencerProfile = await InfluencerProfile.findOne({ user: reviewee });
      if (influencerProfile) {
        const allReviews = await Review.find({ reviewee, reviewType: 'brand_to_influencer' });
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        influencerProfile.averageRating = Math.round(avgRating * 10) / 10;
        influencerProfile.totalReviews = allReviews.length;
        await influencerProfile.save();
      }
    } else {
      const brandProfile = await BrandProfile.findOne({ user: reviewee });
      if (brandProfile) {
        const allReviews = await Review.find({ reviewee, reviewType: 'influencer_to_brand' });
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        brandProfile.averageRating = Math.round(avgRating * 10) / 10;
        brandProfile.totalReviews = allReviews.length;
        await brandProfile.save();
      }
    }

    await review.populate('reviewer', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review'
    });
  }
};

/**
 * Get reviews for user
 * GET /api/reviews/user/:userId
 */
exports.getReviewsForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find({ reviewee: userId, isPublic: true })
        .populate('reviewer', 'name avatar')
        .populate('campaign', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments({ reviewee: userId, isPublic: true })
    ]);

    // Calculate stats
    const stats = await Review.aggregate([
      { $match: { reviewee: require('mongoose').Types.ObjectId(userId), isPublic: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingCounts: {
            $push: '$rating'
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: reviews,
      stats: stats[0] || { averageRating: 0, totalReviews: 0 },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
};

/**
 * Get review by ID
 * GET /api/reviews/:id
 */
exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('reviewer', 'name avatar')
      .populate('reviewee', 'name')
      .populate('campaign', 'title');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review'
    });
  }
};

/**
 * Respond to review
 * PUT /api/reviews/:id/respond
 */
exports.respondToReview = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Response content is required'
      });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Only reviewee can respond
    if (review.reviewee.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the reviewee can respond'
      });
    }

    review.response = {
      content,
      respondedAt: new Date()
    };
    await review.save();

    res.json({
      success: true,
      message: 'Response added',
      data: review
    });
  } catch (error) {
    console.error('Respond to review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add response'
    });
  }
};

/**
 * Get my reviews (reviews I've written)
 * GET /api/reviews/my-reviews
 */
exports.getMyReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find({ reviewer: req.user._id })
        .populate('reviewee', 'name')
        .populate('campaign', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments({ reviewer: req.user._id })
    ]);

    res.json({
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
    console.error('Get my reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
};
