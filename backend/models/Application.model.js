import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true
    },
    influencerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    proposalText: {
      type: String,
      required: [true, 'Proposal text is required'],
      minlength: [50, 'Proposal must be at least 50 characters'],
      maxlength: [1000, 'Proposal cannot exceed 1000 characters']
    },
    quotedPrice: {
      type: Number,
      required: [true, 'Quoted price is required'],
      min: [0, 'Price cannot be negative']
    },
    deliveryPlan: {
      type: String,
      required: [true, 'Delivery plan is required'],
      maxlength: [500, 'Delivery plan cannot exceed 500 characters']
    },
    estimatedCompletionDate: {
      type: Date,
      required: true
    },
    portfolioSamples: [
      {
        title: String,
        url: String,
        platform: String
      }
    ],
    status: {
      type: String,
      enum: ['pending', 'shortlisted', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending'
    },
    matchScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    // Status timestamps
    shortlistedAt: {
      type: Date,
      default: null
    },
    acceptedAt: {
      type: Date,
      default: null
    },
    rejectedAt: {
      type: Date,
      default: null
    },
    withdrawnAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    // Brand actions
    viewedByBrand: {
      type: Boolean,
      default: false
    },
    viewedAt: {
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
applicationSchema.index({ campaignId: 1, influencerId: 1 }, { unique: true }); // Prevent duplicate applications
applicationSchema.index({ campaignId: 1, status: 1, matchScore: -1 });
applicationSchema.index({ influencerId: 1, status: 1 });
applicationSchema.index({ brandId: 1, status: 1 });

// Virtual for campaign
applicationSchema.virtual('campaign', {
  ref: 'Campaign',
  localField: 'campaignId',
  foreignField: '_id',
  justOne: true
});

// Virtual for influencer
applicationSchema.virtual('influencer', {
  ref: 'User',
  localField: 'influencerId',
  foreignField: '_id',
  justOne: true
});

// Virtual for brand
applicationSchema.virtual('brand', {
  ref: 'User',
  localField: 'brandId',
  foreignField: '_id',
  justOne: true
});

// Pre-save hook to update status timestamps
applicationSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    const now = new Date();
    switch (this.status) {
      case 'shortlisted':
        this.shortlistedAt = now;
        break;
      case 'accepted':
        this.acceptedAt = now;
        break;
      case 'rejected':
        this.rejectedAt = now;
        break;
      case 'withdrawn':
        this.withdrawnAt = now;
        break;
    }
  }
  next();
});

// Static method to calculate match score
applicationSchema.statics.calculateMatchScore = async function (campaignId, influencerProfileId) {
  const Campaign = mongoose.model('Campaign');
  const InfluencerProfile = mongoose.model('InfluencerProfile');

  const campaign = await Campaign.findById(campaignId);
  const influencer = await InfluencerProfile.findById(influencerProfileId);

  if (!campaign || !influencer) return 0;

  let score = 0;

  // Niche match (40 points)
  if (campaign.category === influencer.niche) {
    score += 40;
  } else if (campaign.eligibilityCriteria.requiredNiche === influencer.niche) {
    score += 20;
  }

  // Follower range fit (20 points)
  const followerCount =
    campaign.platformType === 'YouTube'
      ? influencer.subscriberCount
      : campaign.platformType === 'Instagram'
      ? influencer.followerCount
      : Math.max(influencer.subscriberCount, influencer.followerCount);

  if (
    followerCount >= campaign.eligibilityCriteria.minFollowers &&
    (!campaign.eligibilityCriteria.maxFollowers || followerCount <= campaign.eligibilityCriteria.maxFollowers)
  ) {
    score += 20;
  } else if (followerCount >= campaign.eligibilityCriteria.minFollowers) {
    score += 10;
  }

  // Engagement match (15 points)
  if (influencer.engagementRate > campaign.eligibilityCriteria.minEngagementRate + 5) {
    score += 15;
  } else if (influencer.engagementRate >= campaign.eligibilityCriteria.minEngagementRate) {
    score += 10;
  }

  // Trust score (10 points)
  if (influencer.trustScore >= 80) {
    score += 10;
  } else if (influencer.trustScore >= 60) {
    score += 5;
  }

  // Platform match (15 points)
  if (
    campaign.platformType === influencer.platformType ||
    campaign.platformType === 'Both' ||
    influencer.platformType === 'Both'
  ) {
    score += 15;
  }

  return Math.min(100, score);
};

const Application = mongoose.model('Application', applicationSchema);

export default Application;
