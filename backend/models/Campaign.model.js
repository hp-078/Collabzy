import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    brandUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Campaign title is required'],
      trim: true,
      minlength: [10, 'Title must be at least 10 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Campaign description is required'],
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    category: {
      type: String,
      enum: [
        'Fashion & Lifestyle',
        'Beauty & Makeup',
        'Tech & Gadgets',
        'Fitness & Wellness',
        'Food & Cooking',
        'Travel & Adventure',
        'Gaming & Esports',
        'Business & Finance',
        'Education & Learning',
        'Parenting & Family',
        'Entertainment & Comedy',
        'Art & Design',
        'Music & Audio',
        'Photography & Videography',
        'Sports & Athletics',
        'Health & Medicine',
        'Automotive',
        'Real Estate',
        'Other'
      ],
      required: [true, 'Campaign category is required']
    },
    platformType: {
      type: String,
      enum: ['YouTube', 'Instagram', 'Both'],
      required: [true, 'Platform type is required']
    },
    budget: {
      min: {
        type: Number,
        required: [true, 'Minimum budget is required'],
        min: [0, 'Budget cannot be negative']
      },
      max: {
        type: Number,
        required: [true, 'Maximum budget is required'],
        min: [0, 'Budget cannot be negative']
      }
    },
    deliverables: [
      {
        type: {
          type: String,
          enum: ['Reel', 'Video', 'Post', 'Story', 'Short', 'Review', 'Unboxing', 'Tutorial'],
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        description: String
      }
    ],
    timeline: {
      startDate: {
        type: Date,
        default: Date.now
      },
      endDate: {
        type: Date,
        required: [true, 'Campaign deadline is required']
      }
    },
    eligibilityCriteria: {
      minFollowers: {
        type: Number,
        default: 0,
        min: 0
      },
      maxFollowers: {
        type: Number,
        default: null
      },
      minEngagementRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      requiredNiche: {
        type: String,
        default: ''
      },
      minTrustScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      requiredPlatform: {
        type: String,
        enum: ['YouTube', 'Instagram', 'Both', 'Any'],
        default: 'Any'
      }
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'closed', 'completed', 'cancelled'],
      default: 'active'
    },
    totalApplications: {
      type: Number,
      default: 0
    },
    shortlistedCount: {
      type: Number,
      default: 0
    },
    acceptedDeals: {
      type: Number,
      default: 0
    },
    completedDeals: {
      type: Number,
      default: 0
    },
    // Campaign visibility
    isPublic: {
      type: Boolean,
      default: true
    },
    // Campaign metadata
    views: {
      type: Number,
      default: 0
    },
    expiresAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
campaignSchema.index({ brandUserId: 1, status: 1 });
campaignSchema.index({ category: 1, platformType: 1 });
campaignSchema.index({ status: 1, expiresAt: 1 });
campaignSchema.index({ 'eligibilityCriteria.minFollowers': 1 });

// Virtual for brand profile
campaignSchema.virtual('brand', {
  ref: 'User',
  localField: 'brandUserId',
  foreignField: '_id',
  justOne: true
});

// Set expiry date before saving
campaignSchema.pre('save', function (next) {
  if (this.isNew || this.isModified('timeline.endDate')) {
    this.expiresAt = this.timeline.endDate;
  }
  next();
});

// Method to check if campaign is active
campaignSchema.methods.isActive = function () {
  return this.status === 'active' && new Date() < this.expiresAt;
};

// Method to check influencer eligibility
campaignSchema.methods.checkEligibility = function (influencerProfile) {
  const criteria = this.eligibilityCriteria;
  const reasons = [];

  // Determine follower count based on platform
  let followerCount = 0;
  if (this.platformType === 'YouTube' || this.platformType === 'Both') {
    followerCount = Math.max(followerCount, influencerProfile.subscriberCount);
  }
  if (this.platformType === 'Instagram' || this.platformType === 'Both') {
    followerCount = Math.max(followerCount, influencerProfile.followerCount);
  }

  // Check minimum followers
  if (followerCount < criteria.minFollowers) {
    reasons.push(`Requires minimum ${criteria.minFollowers} followers`);
  }

  // Check maximum followers (if set)
  if (criteria.maxFollowers && followerCount > criteria.maxFollowers) {
    reasons.push(`Exceeds maximum ${criteria.maxFollowers} followers`);
  }

  // Check engagement rate
  if (influencerProfile.engagementRate < criteria.minEngagementRate) {
    reasons.push(`Requires minimum ${criteria.minEngagementRate}% engagement rate`);
  }

  // Check niche match
  if (criteria.requiredNiche && influencerProfile.niche !== criteria.requiredNiche) {
    reasons.push(`Requires ${criteria.requiredNiche} niche`);
  }

  // Check trust score
  if (influencerProfile.trustScore < criteria.minTrustScore) {
    reasons.push(`Requires minimum ${criteria.minTrustScore} trust score`);
  }

  // Check platform type
  if (criteria.requiredPlatform !== 'Any') {
    if (
      criteria.requiredPlatform === 'YouTube' &&
      influencerProfile.platformType !== 'YouTube' &&
      influencerProfile.platformType !== 'Both'
    ) {
      reasons.push('Requires YouTube presence');
    }
    if (
      criteria.requiredPlatform === 'Instagram' &&
      influencerProfile.platformType !== 'Instagram' &&
      influencerProfile.platformType !== 'Both'
    ) {
      reasons.push('Requires Instagram presence');
    }
  }

  return {
    isEligible: reasons.length === 0,
    reasons: reasons
  };
};

const Campaign = mongoose.model('Campaign', campaignSchema);

export default Campaign;
