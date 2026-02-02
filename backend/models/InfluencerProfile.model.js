import mongoose from 'mongoose';

const influencerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: ''
    },
    profileImage: {
      type: String,
      default: ''
    },
    niche: {
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
      required: [true, 'Niche/Category is required']
    },
    platformType: {
      type: String,
      enum: ['YouTube', 'Instagram', 'Both'],
      required: [true, 'Platform type is required']
    },
    // YouTube Data
    youtubeChannelUrl: {
      type: String,
      default: ''
    },
    youtubeChannelId: {
      type: String,
      default: ''
    },
    subscriberCount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalViews: {
      type: Number,
      default: 0,
      min: 0
    },
    videoCount: {
      type: Number,
      default: 0,
      min: 0
    },
    averageViews: {
      type: Number,
      default: 0,
      min: 0
    },
    // Instagram Data
    instagramHandle: {
      type: String,
      default: ''
    },
    instagramUrl: {
      type: String,
      default: ''
    },
    followerCount: {
      type: Number,
      default: 0,
      min: 0
    },
    // Calculated Metrics
    engagementRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    reach: {
      type: Number,
      default: 0,
      min: 0
    },
    // Trust & Verification
    trustScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified'
    },
    verifiedBadge: {
      type: Boolean,
      default: false
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    // Portfolio & History
    portfolioLinks: [
      {
        title: String,
        url: String,
        platform: String
      }
    ],
    pastCollaborationsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    // Automation Data
    lastDataFetch: {
      type: Date,
      default: null
    },
    autoUpdateEnabled: {
      type: Boolean,
      default: true
    },
    // Content Types
    contentTypes: [
      {
        type: String,
        enum: ['Reviews', 'Tutorials', 'Vlogs', 'Shorts', 'Reels', 'Stories', 'Unboxing', 'How-to', 'Entertainment', 'Educational']
      }
    ],
    // Statistics
    totalApplications: {
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
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
influencerProfileSchema.index({ userId: 1 });
influencerProfileSchema.index({ niche: 1, platformType: 1 });
influencerProfileSchema.index({ trustScore: -1 });
influencerProfileSchema.index({ verificationStatus: 1 });
influencerProfileSchema.index({ followerCount: 1, subscriberCount: 1 });

// Virtual for total audience
influencerProfileSchema.virtual('totalAudience').get(function () {
  return this.followerCount + this.subscriberCount;
});

// Method to calculate engagement rate
influencerProfileSchema.methods.calculateEngagementRate = function (likes, comments, views) {
  if (views === 0) return 0;
  return ((likes + comments) / views) * 100;
};

// Method to calculate trust score
influencerProfileSchema.methods.calculateTrustScore = function () {
  let score = 50; // Base score

  // Engagement bonus
  if (this.engagementRate > 10) score += 20;
  else if (this.engagementRate > 5) score += 10;
  else if (this.engagementRate < 2) score -= 10;

  // Verification bonus
  if (this.verifiedBadge) score += 10;

  // Profile completion bonus
  if (this.bio && this.profileImage && this.portfolioLinks.length > 0) {
    score += 5;
  } else {
    score -= 15;
  }

  // Past collaborations bonus
  score += Math.min(this.completedDeals * 5, 20);

  // Reviews bonus
  if (this.averageRating >= 4.5) score += 15;
  else if (this.averageRating >= 4.0) score += 10;
  else if (this.averageRating >= 3.5) score += 5;
  else if (this.averageRating < 3.0) score -= 10;

  // Cap score between 0-100
  return Math.max(0, Math.min(100, score));
};

// Pre-save hook to update trust score
influencerProfileSchema.pre('save', function (next) {
  if (this.isModified('engagementRate') || this.isModified('completedDeals') || this.isModified('averageRating')) {
    this.trustScore = this.calculateTrustScore();
  }
  next();
});

const InfluencerProfile = mongoose.model('InfluencerProfile', influencerProfileSchema);

export default InfluencerProfile;
