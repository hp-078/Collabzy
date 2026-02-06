const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  // Brand info
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  brandProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BrandProfile'
  },

  // Basic Info
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

  // Category & Platform
  category: {
    type: String,
    enum: [
      'Fashion', 'Beauty', 'Tech', 'Gaming', 'Fitness', 'Food', 'Travel',
      'Lifestyle', 'Education', 'Entertainment', 'Business', 'Sports', 'Other',
      'Fashion & Lifestyle', 'Tech & Gadgets', 'Fitness & Health',
      'Food & Cooking', 'Beauty & Skincare', 'Travel & Adventure'
    ],
    required: true
  },
  platformType: {
    type: String,
    enum: ['YouTube', 'Instagram', 'TikTok', 'Multiple', 'Any'],
    default: 'Any'
  },

  // Budget
  budget: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    currency: { type: String, default: 'USD' }
  },

  // Deliverables
  deliverables: [{
    type: { type: String },
    quantity: { type: Number, default: 1 },
    description: { type: String }
  }],

  // Timeline
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
    minFollowers: { type: Number, default: 0 },
    maxFollowers: { type: Number, default: 10000000 },
    minEngagementRate: { type: Number, default: 0 },
    requiredNiches: [{ type: String }],
    minTrustScore: { type: Number, default: 0 },
    requiredPlatforms: [{ type: String }]
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'active'
  },

  // Additional Info
  termsAndConditions: { type: String, default: '' },
  tags: [{ type: String }],

  // Statistics
  viewCount: { type: Number, default: 0 },
  applicationCount: { type: Number, default: 0 },
  acceptedCount: { type: Number, default: 0 },
  maxInfluencers: { type: Number, default: 10 }
}, {
  timestamps: true
});

// Check if influencer is eligible for campaign
campaignSchema.methods.isEligible = function (influencerProfile) {
  const reasons = [];
  const elig = this.eligibility;

  // Check followers
  const followers = influencerProfile.totalFollowers || 0;
  if (followers < elig.minFollowers) {
    reasons.push(`Minimum ${elig.minFollowers} followers required`);
  }
  if (followers > elig.maxFollowers) {
    reasons.push(`Maximum ${elig.maxFollowers} followers allowed`);
  }

  // Check engagement rate
  if (influencerProfile.averageEngagementRate < elig.minEngagementRate) {
    reasons.push(`Minimum ${elig.minEngagementRate}% engagement rate required`);
  }

  // Check trust score
  if (influencerProfile.trustScore < elig.minTrustScore) {
    reasons.push(`Minimum trust score of ${elig.minTrustScore} required`);
  }

  // Check platform
  if (elig.requiredPlatforms && elig.requiredPlatforms.length > 0) {
    if (!elig.requiredPlatforms.includes(influencerProfile.platformType)) {
      reasons.push(`Platform must be one of: ${elig.requiredPlatforms.join(', ')}`);
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons
  };
};

// Calculate match score between campaign and influencer
campaignSchema.methods.calculateMatchScore = function (influencerProfile) {
  let score = 0;

  // Niche match (+40)
  const campaignNiche = this.category;
  const influencerNiches = influencerProfile.niche || [];
  if (influencerNiches.includes(campaignNiche)) {
    score += 40;
  }

  // Platform match (+20)
  if (this.platformType === 'Any' ||
    this.platformType === influencerProfile.platformType ||
    this.platformType === 'Multiple') {
    score += 20;
  }

  // Trust score bonus (+20 max)
  score += Math.min(20, influencerProfile.trustScore / 5);

  // Engagement rate bonus (+20 max)
  score += Math.min(20, influencerProfile.averageEngagementRate * 4);

  return Math.round(score);
};

// Indexes
campaignSchema.index({ brand: 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ category: 1 });
campaignSchema.index({ deadline: 1 });
campaignSchema.index({ createdAt: -1 });
campaignSchema.index({ 'title': 'text', 'description': 'text' });

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;
