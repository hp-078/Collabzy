const mongoose = require('mongoose');

const influencerProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Basic Info
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  bio: {
    type: String,
    maxlength: [1000, 'Bio cannot exceed 1000 characters'],
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },

  // Niche & Platform
  niche: {
    type: [String],
    enum: [
      // Single-word niches
      'Fashion', 'Beauty', 'Tech', 'Gaming', 'Fitness', 'Food', 'Travel',
      'Lifestyle', 'Education', 'Entertainment', 'Business', 'Sports', 'Other',
      // Composite niches (from frontend)
      'Fashion & Lifestyle', 'Tech & Gadgets', 'Fitness & Health',
      'Food & Cooking', 'Beauty & Skincare', 'Travel & Adventure'
    ],
    default: []
  },
  platformType: {
    type: String,
    enum: ['YouTube', 'Instagram', 'TikTok', 'Multiple'],
    default: 'Instagram'
  },

  // Social Media Links
  youtubeUrl: { type: String, default: '' },
  youtubeChannelId: { type: String, default: '' },
  instagramUrl: { type: String, default: '' },
  instagramUsername: { type: String, default: '' },
  tiktokUrl: { type: String, default: '' },

  // Connected Platforms (from Add Platform modal)
  platforms: [{
    type: { type: String, enum: ['YouTube', 'Instagram', 'TikTok', 'Other'] },
    url: { type: String },
    stats: {
      subscribers: Number,
      views: Number,
      videos: Number,
      followers: Number,
      following: Number,
      posts: Number,
      engagementRate: Number
    },
    lastFetched: { type: String },
    channelId: { type: String },
    channelTitle: { type: String },
    username: { type: String },
    addedAt: { type: String }
  }],

  // YouTube Stats
  youtubeStats: {
    subscribers: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    videoCount: { type: Number, default: 0 },
    averageViews: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    lastFetched: { type: Date }
  },

  // YouTube Detailed Data (stored from API fetch)
  youtubeData: {
    title: { type: String },
    description: { type: String },
    thumbnail: { type: String },
    customUrl: { type: String },
    country: { type: String },
    publishedAt: { type: Date },
    recentVideos: [{
      videoId: String,
      title: String,
      thumbnail: String,
      publishedAt: Date,
      views: Number,
      likes: Number,
      comments: Number,
      duration: String
    }],
    fetchedAt: { type: Date }
  },

  // Instagram Stats
  instagramStats: {
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    posts: { type: Number, default: 0 },
    averageLikes: { type: Number, default: 0 },
    averageComments: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    lastFetched: { type: Date }
  },

  // Instagram Detailed Data (stored from API fetch)
  instagramData: {
    username: { type: String },
    name: { type: String },
    biography: { type: String },
    profilePicture: { type: String },
    isVerified: { type: Boolean },
    isBusinessAccount: { type: Boolean },
    recentMedia: [{
      mediaId: String,
      caption: String,
      mediaType: String,
      mediaUrl: String,
      thumbnail: String,
      permalink: String,
      timestamp: Date,
      likes: Number,
      comments: Number
    }],
    fetchedAt: { type: Date }
  },

  // Combined Statistics
  totalFollowers: { type: Number, default: 0 },
  totalEngagement: { type: Number, default: 0 },
  averageEngagementRate: { type: Number, default: 0 },

  // Trust Score (0-100)
  trustScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },

  // Verification
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date },

  // Services offered
  services: [{
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    currency: { type: String, default: 'USD' }
  }],

  // Portfolio
  portfolio: [{
    title: String,
    description: String,
    imageUrl: String,
    link: String,
    platform: String
  }],

  // Statistics
  campaignsCompleted: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  averageRating: { type: Number, min: 0, max: 5, default: 0 },
  totalReviews: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Calculate trust score based on profile data
influencerProfileSchema.methods.calculateTrustScore = function () {
  let score = 50; // Base score

  // Profile completeness (+20 max)
  if (this.bio && this.bio.length > 50) score += 5;
  if (this.avatar) score += 3;
  if (this.location) score += 2;
  if (this.niche && this.niche.length > 0) score += 5;
  if (this.services && this.services.length > 0) score += 5;

  // Social proof (+20 max)
  if (this.totalFollowers > 1000) score += 5;
  if (this.totalFollowers > 10000) score += 5;
  if (this.totalFollowers > 100000) score += 5;
  if (this.averageEngagementRate > 2) score += 5;

  // Verification (+10)
  if (this.isVerified) score += 10;

  // Experience (+10 max)
  if (this.campaignsCompleted > 0) score += 3;
  if (this.campaignsCompleted > 5) score += 3;
  if (this.campaignsCompleted > 10) score += 4;

  // Rating (+10 max)
  score += Math.min(10, this.averageRating * 2);

  return Math.min(100, Math.max(0, Math.round(score)));
};

// Update combined stats
influencerProfileSchema.methods.updateCombinedStats = function () {
  const ytSubs = this.youtubeStats?.subscribers || 0;
  const igFollowers = this.instagramStats?.followers || 0;

  this.totalFollowers = ytSubs + igFollowers;

  const ytEng = this.youtubeStats?.engagementRate || 0;
  const igEng = this.instagramStats?.engagementRate || 0;
  const count = (ytEng > 0 ? 1 : 0) + (igEng > 0 ? 1 : 0);

  this.averageEngagementRate = count > 0 ? (ytEng + igEng) / count : 0;
  this.trustScore = this.calculateTrustScore();
};

// Indexes
influencerProfileSchema.index({ user: 1 });
influencerProfileSchema.index({ niche: 1 });
influencerProfileSchema.index({ platformType: 1 });
influencerProfileSchema.index({ totalFollowers: -1 });
influencerProfileSchema.index({ trustScore: -1 });
influencerProfileSchema.index({ 'name': 'text', 'bio': 'text' });

const InfluencerProfile = mongoose.model('InfluencerProfile', influencerProfileSchema);

module.exports = InfluencerProfile;
