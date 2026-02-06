const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  // References
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  influencer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Deal Terms
  agreedRate: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  deliverables: [{
    type: { type: String },
    quantity: { type: Number },
    description: { type: String },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'submitted', 'approved', 'rejected'],
      default: 'pending'
    },
    submittedAt: { type: Date },
    approvedAt: { type: Date }
  }],

  // Timeline
  startDate: {
    type: Date,
    default: Date.now
  },
  deadline: {
    type: Date,
    required: true
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'in_progress', 'pending_review', 'completed', 'cancelled', 'disputed'],
    default: 'active'
  },

  // Payment
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'refunded'],
    default: 'pending'
  },
  paidAt: { type: Date },

  // Notes
  brandNotes: { type: String, default: '' },
  influencerNotes: { type: String, default: '' },

  // Completion
  completedAt: { type: Date },
  cancelledAt: { type: Date }
}, {
  timestamps: true
});

// Indexes
dealSchema.index({ campaign: 1 });
dealSchema.index({ brand: 1 });
dealSchema.index({ influencer: 1 });
dealSchema.index({ status: 1 });

const Deal = mongoose.model('Deal', dealSchema);

module.exports = Deal;
