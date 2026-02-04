const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
  },
  influencer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  influencerProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InfluencerProfile',
    required: true,
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Application Details
  proposalText: {
    type: String,
    required: [true, 'Proposal text is required'],
  },
  quotedPrice: {
    type: Number,
    required: [true, 'Quoted price is required'],
  },
  deliveryPlan: {
    type: String,
  },
  estimatedDeliveryTime: {
    type: Number, // Days
  },
  
  // Application Status
  status: {
    type: String,
    enum: ['pending', 'shortlisted', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending',
  },
  
  // Match Score
  matchScore: {
    type: Number,
    min: 0,
    max: 100,
  },
  
  // Additional Info
  coverLetter: {
    type: String,
  },
  portfolioSamples: [{
    title: String,
    url: String,
    thumbnail: String,
  }],
  
  // Status History
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'shortlisted', 'accepted', 'rejected', 'withdrawn'],
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    note: String,
  }],
  
  // Timestamps for status changes
  shortlistedAt: Date,
  acceptedAt: Date,
  rejectedAt: Date,
  withdrawnAt: Date,
  
}, {
  timestamps: true,
});

// Indexes
applicationSchema.index({ campaign: 1, influencer: 1 }, { unique: true }); // Prevent duplicate applications
applicationSchema.index({ campaign: 1, status: 1, matchScore: -1 });
applicationSchema.index({ influencer: 1, status: 1 });
applicationSchema.index({ brand: 1, status: 1 });

// Pre-save middleware to update status timestamps
applicationSchema.pre('save', function(next) {
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

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
