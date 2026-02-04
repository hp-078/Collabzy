const mongoose = require('mongoose');

const brandProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  // Company Info
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
  },
  logo: {
    type: String,
    default: 'https://via.placeholder.com/150',
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  industry: {
    type: String,
    enum: ['Technology', 'Fashion', 'Beauty', 'Food & Beverage', 'Fitness', 
           'Travel', 'Entertainment', 'Education', 'E-commerce', 'Healthcare', 
           'Finance', 'Real Estate', 'Automotive', 'Sports', 'Other'],
  },
  location: {
    type: String,
  },
  
  // Contact Info
  contactPerson: {
    name: String,
    email: String,
    phone: String,
  },
  websiteUrl: {
    type: String,
  },
  
  // Social Media
  instagramUrl: String,
  twitterUrl: String,
  linkedinUrl: String,
  facebookUrl: String,
  
  // Company Size & Budget
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
  },
  monthlyBudget: {
    min: Number,
    max: Number,
  },
  
  // Statistics
  activeCampaigns: {
    type: Number,
    default: 0,
  },
  completedCampaigns: {
    type: Number,
    default: 0,
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
  
  // Preferences
  preferredNiches: [{
    type: String,
    enum: ['Fashion', 'Beauty', 'Tech', 'Gaming', 'Fitness', 'Food', 'Travel', 
           'Lifestyle', 'Education', 'Entertainment', 'Business', 'Sports', 'Other'],
  }],
  preferredPlatforms: [{
    type: String,
    enum: ['YouTube', 'Instagram', 'TikTok'],
  }],
  
  // Verification
  isVerified: {
    type: Boolean,
    default: false,
  },
  verifiedAt: {
    type: Date,
  },
  
  // Rating
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
}, {
  timestamps: true,
});

// Index for searching
brandProfileSchema.index({ companyName: 'text', description: 'text' });
brandProfileSchema.index({ industry: 1 });

const BrandProfile = mongoose.model('BrandProfile', brandProfileSchema);

module.exports = BrandProfile;
