const mongoose = require('mongoose');

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
    enum: [
      'Fashion',
      'Fashion & Lifestyle',
      'Beauty',
      'Food',
      'Food & Beverage',
      'Travel',
      'Technology',
      'Tech & Gadgets',
      'Gaming',
      'Fitness',
      'Fitness & Health',
      'Lifestyle',
      'Education',
      'Entertainment',
      'Business',
      'Health',
      'Sports',
      'Music',
      'Art',
      'Photography',
      'Finance',
      'Parenting',
      'Home & Garden',
      'Automotive',
      'Pet & Animals',
      'Other'
    ]
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

/**
 * Check if an influencer is eligible for this campaign
 * @param {Object} influencerProfile - The influencer profile to check
 * @returns {Object} { eligible: boolean, reasons: string[] }
 */
campaignSchema.methods.isEligible = function(influencerProfile) {
  const reasons = [];

  // Check follower count (only minimum, no maximum)
  const totalFollowers = (influencerProfile.youtubeStats?.subscriberCount || 0) + 
                        (influencerProfile.instagramStats?.followerCount || 0);
  
  if (this.eligibility.minFollowers && this.eligibility.minFollowers > 0) {
    if (totalFollowers < this.eligibility.minFollowers) {
      reasons.push(`Minimum ${this.eligibility.minFollowers.toLocaleString()} followers required`);
    }
  }

  // Check engagement rate
  if (this.eligibility.minEngagementRate && this.eligibility.minEngagementRate > 0) {
    const engagementRate = influencerProfile.youtubeStats?.engagementRate || 
                           influencerProfile.instagramStats?.engagementRate || 0;
    
    if (engagementRate < this.eligibility.minEngagementRate) {
      reasons.push(`Minimum ${this.eligibility.minEngagementRate}% engagement rate required`);
    }
  }

  // Check trust score
  if (this.eligibility.minTrustScore && this.eligibility.minTrustScore > 0) {
    if (influencerProfile.trustScore < this.eligibility.minTrustScore) {
      reasons.push(`Minimum trust score of ${this.eligibility.minTrustScore} required`);
    }
  }

  // Check required niches (more flexible matching)
  if (this.eligibility.requiredNiches && this.eligibility.requiredNiches.length > 0) {
    const influencerNiches = influencerProfile.niche ? 
      (Array.isArray(influencerProfile.niche) ? influencerProfile.niche : [influencerProfile.niche]) : [];
    
    const hasRequiredNiche = this.eligibility.requiredNiches.some(requiredNiche => 
      influencerNiches.some(influencerNiche => 
        influencerNiche.toLowerCase().includes(requiredNiche.toLowerCase()) ||
        requiredNiche.toLowerCase().includes(influencerNiche.toLowerCase())
      )
    );
    
    if (!hasRequiredNiche) {
      reasons.push(`Must be in one of these niches: ${this.eligibility.requiredNiches.join(', ')}`);
    }
  }

  // Check required platforms
  if (this.eligibility.requiredPlatforms && this.eligibility.requiredPlatforms.length > 0) {
    const platforms = [];
    if (influencerProfile.youtubeChannel) platforms.push('youtube');
    if (influencerProfile.instagramProfile) platforms.push('instagram');
    
    const hasRequiredPlatform = this.eligibility.requiredPlatforms.some(platform => {
      if (platform === 'both') {
        return platforms.includes('youtube') && platforms.includes('instagram');
      }
      return platforms.includes(platform);
    });
    
    if (!hasRequiredPlatform) {
      reasons.push(`Required platform(s): ${this.eligibility.requiredPlatforms.join(', ')}`);
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons: reasons
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
