import mongoose from 'mongoose';

const brandProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      minlength: [2, 'Company name must be at least 2 characters'],
      maxlength: [200, 'Company name cannot exceed 200 characters']
    },
    companyLogo: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: ''
    },
    industry: {
      type: String,
      enum: [
        'Fashion & Apparel',
        'Beauty & Cosmetics',
        'Technology & Electronics',
        'Food & Beverage',
        'Health & Wellness',
        'Travel & Hospitality',
        'Entertainment & Media',
        'Education & E-learning',
        'Finance & Banking',
        'Automotive',
        'Real Estate',
        'Gaming',
        'Sports & Fitness',
        'Home & Living',
        'Jewelry & Accessories',
        'Pet Care',
        'Sustainability & Eco-friendly',
        'Other'
      ],
      default: 'Other'
    },
    website: {
      type: String,
      default: ''
    },
    contactEmail: {
      type: String,
      default: ''
    },
    contactPhone: {
      type: String,
      default: ''
    },
    location: {
      country: { type: String, default: '' },
      city: { type: String, default: '' }
    },
    // Statistics
    totalCampaigns: {
      type: Number,
      default: 0
    },
    activeCampaigns: {
      type: Number,
      default: 0
    },
    completedCampaigns: {
      type: Number,
      default: 0
    },
    totalApplicationsReceived: {
      type: Number,
      default: 0
    },
    totalCollaborations: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    // Verification
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
brandProfileSchema.index({ userId: 1 });
brandProfileSchema.index({ industry: 1 });
brandProfileSchema.index({ isVerified: 1 });

// Virtual for reputation score
brandProfileSchema.virtual('reputationScore').get(function () {
  let score = 50; // Base score

  // Completed campaigns bonus
  score += Math.min(this.completedCampaigns * 2, 20);

  // Rating bonus
  if (this.averageRating >= 4.5) score += 20;
  else if (this.averageRating >= 4.0) score += 15;
  else if (this.averageRating >= 3.5) score += 10;
  else if (this.averageRating < 3.0) score -= 10;

  // Verification bonus
  if (this.isVerified) score += 10;

  return Math.max(0, Math.min(100, score));
});

const BrandProfile = mongoose.model('BrandProfile', brandProfileSchema);

export default BrandProfile;
