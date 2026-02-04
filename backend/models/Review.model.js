const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  deal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal',
    required: true,
  },
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
  },
  
  // Who is reviewing whom
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reviewerRole: {
    type: String,
    enum: ['brand', 'influencer'],
    required: true,
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  revieweeRole: {
    type: String,
    enum: ['brand', 'influencer'],
    required: true,
  },
  
  // Review Content
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
  },
  reviewText: {
    type: String,
    required: [true, 'Review text is required'],
    minlength: [10, 'Review must be at least 10 characters'],
    maxlength: [1000, 'Review cannot exceed 1000 characters'],
  },
  
  // Specific Ratings (for brands reviewing influencers)
  specificRatings: {
    communication: {
      type: Number,
      min: 1,
      max: 5,
    },
    quality: {
      type: Number,
      min: 1,
      max: 5,
    },
    timeliness: {
      type: Number,
      min: 1,
      max: 5,
    },
    professionalism: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  
  // Review Status
  isPublic: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: true, // Auto-verified if from completed deal
  },
  
  // Response
  response: {
    text: String,
    respondedAt: Date,
  },
  
  // Helpful Votes
  helpfulCount: {
    type: Number,
    default: 0,
  },
  notHelpfulCount: {
    type: Number,
    default: 0,
  },
  
  // Flagging
  isFlagged: {
    type: Boolean,
    default: false,
  },
  flagReason: String,
  
}, {
  timestamps: true,
});

// Indexes
reviewSchema.index({ reviewee: 1, isPublic: 1 });
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ deal: 1 }, { unique: true }); // One review per deal
reviewSchema.index({ rating: -1, createdAt: -1 });

// Ensure reviewer and reviewee are different
reviewSchema.pre('save', function(next) {
  if (this.reviewer.equals(this.reviewee)) {
    next(new Error('Reviewer and reviewee cannot be the same'));
  }
  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
