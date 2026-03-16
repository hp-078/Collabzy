const mongoose = require('mongoose');
const { CATEGORY_OPTIONS } = require('../constants/categories');

const campaignSchema = new mongoose.Schema({
  // Brand who created the campaign
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Brand is required']
  },
  brandProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BrandProfile'
  },

  // Campaign Details
  title: {
    type: String,
    required: [true, 'Campaign title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Campaign description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: CATEGORY_OPTIONS
  },
  platformType: {
    type: String,
    enum: ['YouTube', 'Instagram', 'Both', 'Any', 'Multiple'],
    default: 'Any'
  },

  // Budget
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

  // Deliverables
  deliverables: [{
    type: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Deliverable type cannot exceed 100 characters']
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    description: {
      type: String,
      maxlength: 500
    }
  }],

  // Dates
  startDate: {
    type: Date,
    default: Date.now
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required']
  },

  // Eligibility Criteria
  eligibility: {
    minFollowers: {
      type: Number,
      default: 0,
      min: [0, 'Minimum followers cannot be negative']
    },
    minEngagementRate: {
      type: Number,
      default: 0,
      min: [0, 'Engagement rate cannot be negative'],
      max: [100, 'Engagement rate cannot exceed 100']
    },
    requiredNiches: {
      type: [String],
      default: []
    },
    minTrustScore: {
      type: Number,
      default: 0,
      min: [0, 'Trust score cannot be negative'],
      max: [100, 'Trust score cannot exceed 100']
    },
    requiredPlatforms: {
      type: [String],
      enum: ['youtube', 'instagram', 'both'],
      default: []
    }
  },

  // Campaign Status
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled', 'expired'],
    default: 'active'
  },

  // Additional Info
  termsAndConditions: {
    type: String,
    maxlength: [10000, 'Terms cannot exceed 10000 characters']
  },
  tags: {
    type: [String],
    default: []
  },
  maxInfluencers: {
    type: Number,
    default: 10,
    min: [1, 'Maximum influencers must be at least 1']
  },

  // Statistics (computed)
  totalApplications: {
    type: Number,
    default: 0
  },
  acceptedApplications: {
    type: Number,
    default: 0
  },
  activeDeals: {
    type: Number,
    default: 0
  },
  completedDeals: {
    type: Number,
    default: 0
  },

  // Views
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
campaignSchema.index({ brand: 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ category: 1 });
campaignSchema.index({ platformType: 1 });
campaignSchema.index({ deadline: 1 });
campaignSchema.index({ 'budget.min': 1, 'budget.max': 1 });
campaignSchema.index({ 'eligibility.minFollowers': 1 });
campaignSchema.index({ createdAt: -1 });

// Text search index
campaignSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text'
});

// Virtual for checking if campaign is expired
campaignSchema.virtual('isExpired').get(function() {
  return this.deadline < new Date();
});

// Virtual for checking if campaign can accept more influencers
campaignSchema.virtual('canAcceptMore').get(function() {
  return this.acceptedApplications < this.maxInfluencers;
});

// Virtual for backwards compatibility (some code uses acceptedCount)
campaignSchema.virtual('acceptedCount').get(function() {
  return this.acceptedApplications;
});

// Methods
campaignSchema.methods.incrementViews = async function() {
  this.views += 1;
  await this.save();
};

campaignSchema.methods.updateStats = async function() {
  const Application = mongoose.model('Application');
  const Deal = mongoose.model('Deal');

  const [applications, deals] = await Promise.all([
    Application.countDocuments({ campaign: this._id }),
    Deal.find({ campaign: this._id })
  ]);

  this.totalApplications = applications;
  this.acceptedApplications = await Application.countDocuments({
    campaign: this._id,
    status: 'accepted'
  });
  
  const activeDeals = deals.filter(d => ['active', 'pending_payment'].includes(d.status)).length;
  const completedDeals = deals.filter(d => d.status === 'completed').length;

  this.activeDeals = activeDeals;
  this.completedDeals = completedDeals;

  await this.save();
};

const formatNumber = (value) => Number(value || 0).toLocaleString();

const getInfluencerFollowers = (influencerProfile) => {
  if (typeof influencerProfile.totalFollowers === 'number') {
    return influencerProfile.totalFollowers;
  }

  const youtubeSubscribers = influencerProfile.youtubeStats?.subscribers || 0;
  const instagramFollowers = influencerProfile.instagramStats?.followers || 0;

  return youtubeSubscribers + instagramFollowers;
};

const getInfluencerEngagementRate = (influencerProfile) => {
  if (typeof influencerProfile.averageEngagementRate === 'number' && influencerProfile.averageEngagementRate > 0) {
    return influencerProfile.averageEngagementRate;
  }

  const rates = [
    influencerProfile.youtubeStats?.engagementRate,
    influencerProfile.instagramStats?.engagementRate
  ].filter(rate => typeof rate === 'number' && rate > 0);

  if (rates.length === 0) {
    return 0;
  }

  return rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
};

const getInfluencerNiches = (influencerProfile) => {
  if (!influencerProfile.niche) {
    return [];
  }

  return Array.isArray(influencerProfile.niche)
    ? influencerProfile.niche.filter(Boolean)
    : [influencerProfile.niche].filter(Boolean);
};

const getInfluencerPlatforms = (influencerProfile) => {
  const platforms = new Set();

  const hasYouTube = Boolean(
    influencerProfile.youtubeUrl ||
    influencerProfile.youtubeChannelId ||
    (influencerProfile.youtubeStats?.subscribers || 0) > 0 ||
    influencerProfile.platformType === 'YouTube' ||
    influencerProfile.platformType === 'Multiple' ||
    influencerProfile.platforms?.some(platform => platform?.type === 'YouTube')
  );

  const hasInstagram = Boolean(
    influencerProfile.instagramUrl ||
    influencerProfile.instagramUsername ||
    (influencerProfile.instagramStats?.followers || 0) > 0 ||
    influencerProfile.platformType === 'Instagram' ||
    influencerProfile.platformType === 'Multiple' ||
    influencerProfile.platforms?.some(platform => platform?.type === 'Instagram')
  );

  if (hasYouTube) platforms.add('youtube');
  if (hasInstagram) platforms.add('instagram');

  return Array.from(platforms);
};

/**
 * Check if an influencer is eligible for this campaign
 * @param {Object} influencerProfile - The influencer profile to check
 * @returns {Object} { eligible: boolean, reasons: string[], criteria: Object[] }
 */
campaignSchema.methods.isEligible = function(influencerProfile) {
  const criteria = [];
  const reasons = [];
  const totalFollowers = getInfluencerFollowers(influencerProfile);
  const engagementRate = getInfluencerEngagementRate(influencerProfile);
  const trustScore = influencerProfile.trustScore || 0;
  const influencerNiches = getInfluencerNiches(influencerProfile);
  const influencerPlatforms = getInfluencerPlatforms(influencerProfile);

  // Check follower count (only minimum, no maximum)
  if (this.eligibility.minFollowers && this.eligibility.minFollowers > 0) {
    const meetsFollowers = totalFollowers >= this.eligibility.minFollowers;
    const criterion = {
      key: 'minFollowers',
      label: 'Followers',
      met: meetsFollowers,
      required: this.eligibility.minFollowers,
      actual: totalFollowers,
      requiredDisplay: `${formatNumber(this.eligibility.minFollowers)}+ followers`,
      actualDisplay: `${formatNumber(totalFollowers)} followers`,
      message: meetsFollowers
        ? `Follower requirement met: ${formatNumber(totalFollowers)} followers available.`
        : `Followers mismatch: requires at least ${formatNumber(this.eligibility.minFollowers)} total followers, but your profile has ${formatNumber(totalFollowers)}.`
    };

    criteria.push(criterion);

    if (!criterion.met) {
      reasons.push(criterion.message);
    }
  }

  // Check engagement rate
  if (this.eligibility.minEngagementRate && this.eligibility.minEngagementRate > 0) {
    const meetsEngagement = engagementRate >= this.eligibility.minEngagementRate;
    const criterion = {
      key: 'minEngagementRate',
      label: 'Engagement Rate',
      met: meetsEngagement,
      required: this.eligibility.minEngagementRate,
      actual: Number(engagementRate.toFixed(2)),
      requiredDisplay: `${this.eligibility.minEngagementRate}%+ engagement rate`,
      actualDisplay: `${Number(engagementRate.toFixed(2))}% engagement rate`,
      message: meetsEngagement
        ? `Engagement requirement met: ${Number(engagementRate.toFixed(2))}% engagement rate.`
        : `Engagement mismatch: requires at least ${this.eligibility.minEngagementRate}% engagement rate, but your profile is at ${Number(engagementRate.toFixed(2))}%.`
    };

    criteria.push(criterion);

    if (!criterion.met) {
      reasons.push(criterion.message);
    }
  }

  // Check trust score
  if (this.eligibility.minTrustScore && this.eligibility.minTrustScore > 0) {
    const meetsTrustScore = trustScore >= this.eligibility.minTrustScore;
    const criterion = {
      key: 'minTrustScore',
      label: 'Trust Score',
      met: meetsTrustScore,
      required: this.eligibility.minTrustScore,
      actual: trustScore,
      requiredDisplay: `${this.eligibility.minTrustScore}+ trust score`,
      actualDisplay: `${trustScore} trust score`,
      message: meetsTrustScore
        ? `Trust score requirement met: trust score is ${trustScore}.`
        : `Trust score mismatch: requires at least ${this.eligibility.minTrustScore}, but your profile has ${trustScore}.`
    };

    criteria.push(criterion);

    if (!criterion.met) {
      reasons.push(criterion.message);
    }
  }

  // Check required niches (more flexible matching)
  if (this.eligibility.requiredNiches && this.eligibility.requiredNiches.length > 0) {
    const hasRequiredNiche = this.eligibility.requiredNiches.some(requiredNiche => 
      influencerNiches.some(influencerNiche => 
        influencerNiche.toLowerCase().includes(requiredNiche.toLowerCase()) ||
        requiredNiche.toLowerCase().includes(influencerNiche.toLowerCase())
      )
    );

    const criterion = {
      key: 'requiredNiches',
      label: 'Niche',
      met: hasRequiredNiche,
      required: this.eligibility.requiredNiches,
      actual: influencerNiches,
      requiredDisplay: this.eligibility.requiredNiches.join(', '),
      actualDisplay: influencerNiches.length > 0 ? influencerNiches.join(', ') : 'No niche set on profile',
      message: hasRequiredNiche
        ? `Niche requirement met: your profile overlaps with the required niches.`
        : `Niche mismatch: campaign requires one of ${this.eligibility.requiredNiches.join(', ')}, but your profile lists ${influencerNiches.length > 0 ? influencerNiches.join(', ') : 'no niches'}.`
    };

    criteria.push(criterion);

    if (!criterion.met) {
      reasons.push(criterion.message);
    }
  }

  // Check required platforms
  if (this.eligibility.requiredPlatforms && this.eligibility.requiredPlatforms.length > 0) {
    const hasRequiredPlatform = this.eligibility.requiredPlatforms.some(platform => {
      if (platform === 'both') {
        return influencerPlatforms.includes('youtube') && influencerPlatforms.includes('instagram');
      }
      return influencerPlatforms.includes(platform);
    });

    const criterion = {
      key: 'requiredPlatforms',
      label: 'Platform',
      met: hasRequiredPlatform,
      required: this.eligibility.requiredPlatforms,
      actual: influencerPlatforms,
      requiredDisplay: this.eligibility.requiredPlatforms.join(', '),
      actualDisplay: influencerPlatforms.length > 0 ? influencerPlatforms.join(', ') : 'No connected platform detected',
      message: hasRequiredPlatform
        ? `Platform requirement met: required platform is connected.`
        : `Platform mismatch: campaign requires ${this.eligibility.requiredPlatforms.join(', ')}, but your profile currently has ${influencerPlatforms.length > 0 ? influencerPlatforms.join(', ') : 'no eligible platforms connected'}.`
    };

    criteria.push(criterion);

    if (!criterion.met) {
      reasons.push(criterion.message);
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    criteria
  };
};

// Auto-update status based on deadline
campaignSchema.pre('save', function(next) {
  if (this.deadline < new Date() && this.status === 'active') {
    this.status = 'expired';
  }
  next();
});

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;
