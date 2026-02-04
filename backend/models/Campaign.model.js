const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  brandProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BrandProfile',
    required: true,
  },
  
  // Campaign Details
  title: {
    type: String,
    required: [true, 'Campaign title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Campaign description is required'],
  },
  category: {
    type: String,
    enum: ['Fashion', 'Beauty', 'Tech', 'Gaming', 'Fitness', 'Food', 'Travel', 
           'Lifestyle', 'Education', 'Entertainment', 'Business', 'Sports', 'Other'],
    required: true,
  },
  
  // Platform Requirements
  platformType: {
    type: String,
    enum: ['YouTube', 'Instagram', 'TikTok', 'Multiple'],
    required: true,
  },
  
  // Budget
  budget: {
    min: {
      type: Number,
      required: true,
    },
    max: {
      type: Number,
      required: true,
    },
  },
  
  // Deliverables
  deliverables: [{
    type: {
      type: String,
      enum: ['Video', 'Post', 'Reel', 'Story', 'Short', 'Review', 'Unboxing', 'Tutorial', 'Other'],
    },
    quantity: {
      type: Number,
      default: 1,
    },
    description: String,
  }],
  
  // Timeline
  startDate: {
    type: Date,
  },
  deadline: {
    type: Date,
    required: [true, 'Campaign deadline is required'],
  },
  
  // Eligibility Criteria
  eligibility: {
    minFollowers: {
      type: Number,
      default: 0,
    },
    maxFollowers: {
      type: Number,
      default: 10000000, // 10M
    },
    minEngagementRate: {
      type: Number, // Percentage
      default: 0,
    },
    requiredNiches: [{
      type: String,
      enum: ['Fashion', 'Beauty', 'Tech', 'Gaming', 'Fitness', 'Food', 'Travel', 
             'Lifestyle', 'Education', 'Entertainment', 'Business', 'Sports', 'Other'],
    }],
    minTrustScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    requiredPlatforms: [{
      type: String,
      enum: ['YouTube', 'Instagram', 'TikTok'],
    }],
  },
  
  // Campaign Status
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'closed', 'completed'],
    default: 'active',
  },
  
  // Statistics
  applicationCount: {
    type: Number,
    default: 0,
  },
  acceptedCount: {
    type: Number,
    default: 0,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  
  // Additional Info
  termsAndConditions: {
    type: String,
  },
  tags: [String],
  
}, {
  timestamps: true,
});

// Indexes
campaignSchema.index({ brand: 1, status: 1 });
campaignSchema.index({ category: 1, platformType: 1 });
campaignSchema.index({ 'eligibility.minFollowers': 1, 'eligibility.maxFollowers': 1 });
campaignSchema.index({ deadline: 1, status: 1 });

// Method to check if influencer is eligible
campaignSchema.methods.isEligible = function(influencerProfile) {
  const { eligibility } = this;
  
  // Check follower count
  if (influencerProfile.followers < eligibility.minFollowers ||
      influencerProfile.followers > eligibility.maxFollowers) {
    return { eligible: false, reason: 'Follower count not in range' };
  }
  
  // Check engagement rate
  if (influencerProfile.engagementRate < eligibility.minEngagementRate) {
    return { eligible: false, reason: 'Engagement rate too low' };
  }
  
  // Check trust score
  if (influencerProfile.trustScore < eligibility.minTrustScore) {
    return { eligible: false, reason: 'Trust score too low' };
  }
  
  // Check niche match
  if (eligibility.requiredNiches && eligibility.requiredNiches.length > 0) {
    const hasMatchingNiche = influencerProfile.niche.some(n => 
      eligibility.requiredNiches.includes(n)
    );
    if (!hasMatchingNiche) {
      return { eligible: false, reason: 'Niche does not match' };
    }
  }
  
  // Check platform match
  if (eligibility.requiredPlatforms && eligibility.requiredPlatforms.length > 0) {
    const platformMatches = influencerProfile.platformType === 'Multiple' ||
      eligibility.requiredPlatforms.includes(influencerProfile.platformType);
    if (!platformMatches) {
      return { eligible: false, reason: 'Platform type does not match' };
    }
  }
  
  return { eligible: true };
};

// Method to calculate match score
campaignSchema.methods.calculateMatchScore = function(influencerProfile) {
  let score = 0;
  
  // Niche match (0-40 points)
  const hasExactNicheMatch = influencerProfile.niche.includes(this.category);
  if (hasExactNicheMatch) score += 40;
  else if (this.eligibility.requiredNiches?.some(n => influencerProfile.niche.includes(n))) {
    score += 20;
  }
  
  // Follower range fit (0-20 points)
  const followerMidpoint = (this.eligibility.minFollowers + this.eligibility.maxFollowers) / 2;
  const followerDiff = Math.abs(influencerProfile.followers - followerMidpoint);
  const followerRange = this.eligibility.maxFollowers - this.eligibility.minFollowers;
  const followerFitRatio = 1 - (followerDiff / followerRange);
  score += Math.max(0, Math.round(followerFitRatio * 20));
  
  // Engagement rate (0-15 points)
  if (influencerProfile.engagementRate >= 5) score += 15;
  else if (influencerProfile.engagementRate >= 3) score += 10;
  else if (influencerProfile.engagementRate >= 2) score += 5;
  
  // Trust score (0-10 points)
  if (influencerProfile.trustScore >= 80) score += 10;
  else if (influencerProfile.trustScore >= 60) score += 5;
  
  // Platform match (0-15 points)
  if (influencerProfile.platformType === this.platformType) score += 15;
  else if (influencerProfile.platformType === 'Multiple') score += 10;
  
  return Math.min(100, score);
};

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;
