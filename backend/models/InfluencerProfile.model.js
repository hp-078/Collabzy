const mongoose = require('mongoose');

const influencerProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  // Basic Info
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
  },
  avatar: {
    type: String,
    default: 'https://via.placeholder.com/150',
  },
  location: {
    type: String,
  },
  
  // Niche & Platform
  niche: {
    type: [String],
    enum: ['Fashion', 'Beauty', 'Tech', 'Gaming', 'Fitness', 'Food', 'Travel', 
           'Lifestyle', 'Education', 'Entertainment', 'Business', 'Sports', 'Other'],
    default: [],
  },
  platformType: {
    type: String,
    enum: ['YouTube', 'Instagram', 'TikTok', 'Multiple'],
    required: true,
  },
  
  // Social Media Links
  youtubeUrl: {
    type: String,
  },
  youtubeChannelId: {
    type: String,
  },
  instagramUrl: {
    type: String,
  },
  instagramUsername: {
    type: String,
  },
  tiktokUrl: {
    type: String,
  },
  websiteUrl: {
    type: String,
  },
  
  // Platform-Specific Stats
  youtubeStats: {
    subscribers: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    videoCount: { type: Number, default: 0 },
    averageViews: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    lastFetched: { type: Date },
  },
  instagramStats: {
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    posts: { type: Number, default: 0 },
    averageLikes: { type: Number, default: 0 },
    averageComments: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    lastFetched: { type: Date },
  },
  
  // Combined Statistics (for backward compatibility & easy querying)
  followers: {
    type: Number,
    default: 0,
  },
  totalViews: {
    type: Number,
    default: 0,
  },
  videoCount: {
    type: Number,
    default: 0,
  },
  averageViews: {
    type: Number,
    default: 0,
  },
  engagementRate: {
    type: Number, // Percentage (0-100)
    default: 0,
  },
  
  // Trust Score & Verification
  trustScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verifiedAt: {
    type: Date,
  },
  
  // Services Offered
  services: [{
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
  }],
  
  // Portfolio & Past Work
  portfolioLinks: [{
    title: String,
    url: String,
    thumbnail: String,
  }],
  
  // Statistics
  completedCollaborations: {
    type: Number,
    default: 0,
  },
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  
  // Last data fetch
  lastDataFetch: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Index for searching
influencerProfileSchema.index({ name: 'text', bio: 'text' });
influencerProfileSchema.index({ niche: 1, platformType: 1 });
influencerProfileSchema.index({ trustScore: -1, followers: -1 });

// Method to calculate trust score
influencerProfileSchema.methods.calculateTrustScore = function() {
  let score = 50; // Base score
  
  // Engagement rate bonus
  if (this.engagementRate >= 5) score += 20;
  else if (this.engagementRate >= 3) score += 10;
  else if (this.engagementRate < 1) score -= 10;
  
  // Verification bonus
  if (this.isVerified) score += 10;
  
  // Past collaborations bonus
  score += Math.min(this.completedCollaborations * 2, 20);
  
  // Rating bonus
  if (this.averageRating >= 4.5) score += 10;
  else if (this.averageRating >= 4) score += 5;
  else if (this.averageRating < 3 && this.totalReviews > 0) score -= 10;
  
  // Profile completeness
  const hasServices = this.services && this.services.length > 0;
  const hasSocialLinks = this.youtubeUrl || this.instagramUrl || this.tiktokUrl;
  const hasPortfolio = this.portfolioLinks && this.portfolioLinks.length > 0;
  
  if (!hasServices || !hasSocialLinks) score -= 15;
  if (hasPortfolio) score += 5;
  
  // Cap between 0-100
  this.trustScore = Math.max(0, Math.min(100, score));
  return this.trustScore;
};

const InfluencerProfile = mongoose.model('InfluencerProfile', influencerProfileSchema);

module.exports = InfluencerProfile;
