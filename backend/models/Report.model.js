// backend/models/Report.model.js
// User report model for admin moderation

const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Reporter
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Reported user
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Report type
  reportType: {
    type: String,
    enum: [
      'spam',
      'harassment',
      'inappropriate_content',
      'fake_profile',
      'scam',
      'contact_info_sharing',
      'payment_dispute',
      'quality_issue',
      'other'
    ],
    required: true
  },

  // Report category
  category: {
    type: String,
    enum: ['user', 'campaign', 'deal', 'review', 'message'],
    required: true
  },

  // Related resource
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  relatedType: {
    type: String,
    enum: ['campaign', 'deal', 'review', 'message', 'profile'],
    required: false
  },

  // Report details
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },

  // Evidence
  evidence: {
    screenshots: [String],
    urls: [String],
    additionalContext: String
  },

  // Severity (auto-calculated or admin-set)
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'under_review', 'resolved', 'dismissed', 'escalated'],
    default: 'pending'
  },

  // Admin handling
  assignedAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adminNotes: [{
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Resolution
  resolution: {
    action: {
      type: String,
      enum: ['no_action', 'warning', 'content_removed', 'user_suspended', 'user_banned', 'account_restricted']
    },
    reason: String,
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Priority
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },

  // Metadata
  ipAddress: String,
  userAgent: String,

  // Reporter anonymity
  isAnonymous: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
reportSchema.index({ reportedUser: 1, status: 1 });
reportSchema.index({ reporter: 1 });
reportSchema.index({ status: 1, severity: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ assignedAdmin: 1, status: 1 });

// Auto-calculate severity based on report type
reportSchema.pre('save', function(next) {
  if (this.isNew) {
    const criticalTypes = ['scam', 'payment_dispute', 'harassment'];
    const highTypes = ['fake_profile', 'contact_info_sharing', 'inappropriate_content'];
    
    if (criticalTypes.includes(this.reportType)) {
      this.severity = 'critical';
      this.priority = 5;
    } else if (highTypes.includes(this.reportType)) {
      this.severity = 'high';
      this.priority = 4;
    } else {
      this.severity = 'medium';
      this.priority = 3;
    }
  }
  next();
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
