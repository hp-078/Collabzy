const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // References
  deal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal',
    required: true
  },
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },

  // Reviewer and reviewee
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Review type (brand reviewing influencer or vice versa)
  reviewType: {
    type: String,
    enum: ['brand_to_influencer', 'influencer_to_brand'],
    required: true
  },

  // Rating
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },

  // Detailed ratings
  detailedRatings: {
    communication: { type: Number, min: 1, max: 5 },
    quality: { type: Number, min: 1, max: 5 },
    timeliness: { type: Number, min: 1, max: 5 },
    professionalism: { type: Number, min: 1, max: 5 }
  },

  // Review content
  title: {
    type: String,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: true,
    maxlength: [2000, 'Review cannot exceed 2000 characters']
  },

  // Response from reviewee
  response: {
    content: { type: String },
    respondedAt: { type: Date }
  },

  // Status
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Prevent duplicate reviews
reviewSchema.index({ deal: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1, rating: -1 });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
