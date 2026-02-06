const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  // References
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  influencer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  influencerProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InfluencerProfile'
  },

  // Application Details
  message: {
    type: String,
    maxlength: [2000, 'Message cannot exceed 2000 characters'],
    default: ''
  },
  proposedRate: {
    type: Number,
    default: 0
  },
  proposedDeliverables: [{
    type: { type: String },
    quantity: { type: Number },
    description: { type: String }
  }],

  // Portfolio links for this application
  portfolioLinks: [{
    title: { type: String },
    url: { type: String }
  }],

  // Status
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'shortlisted', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending'
  },

  // Brand response
  brandResponse: {
    message: { type: String, default: '' },
    respondedAt: { type: Date }
  },

  // Timestamps for tracking
  reviewedAt: { type: Date },
  acceptedAt: { type: Date },
  rejectedAt: { type: Date },
  withdrawnAt: { type: Date }
}, {
  timestamps: true
});

// Prevent duplicate applications
applicationSchema.index({ campaign: 1, influencer: 1 }, { unique: true });
applicationSchema.index({ influencer: 1 });
applicationSchema.index({ campaign: 1 });
applicationSchema.index({ status: 1 });

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
