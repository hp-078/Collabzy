const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true,
    unique: true,
  },
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
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Deal Terms
  agreedPrice: {
    type: Number,
    required: true,
  },
  deliverables: [{
    type: {
      type: String,
      enum: ['Video', 'Post', 'Reel', 'Story', 'Short', 'Review', 'Unboxing', 'Tutorial', 'Other'],
    },
    description: String,
    quantity: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'submitted', 'approved', 'revision-requested'],
      default: 'pending',
    },
  }],
  deadline: {
    type: Date,
    required: true,
  },
  
  // Deal Status
  status: {
    type: String,
    enum: ['confirmed', 'in-progress', 'content-submitted', 'approved', 'completed', 'cancelled', 'disputed'],
    default: 'confirmed',
  },
  
  // Milestones
  milestones: [{
    title: String,
    description: String,
    dueDate: Date,
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: Date,
  }],
  
  // Content Submission
  submissions: [{
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    contentLinks: [{
      type: String,
    }],
    description: String,
    proofOfWork: [{
      type: String, // URLs to screenshots, videos, etc.
    }],
    status: {
      type: String,
      enum: ['pending-review', 'approved', 'revision-requested'],
      default: 'pending-review',
    },
    feedback: String,
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  }],
  
  // Revision Requests
  revisionRequests: [{
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    reason: String,
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    resolvedAt: Date,
  }],
  
  // Payment Status
  payment: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'refunded', 'disputed'],
      default: 'pending',
    },
    method: String,
    transactionId: String,
    paidAt: Date,
  },
  
  // Notes & Communication
  notes: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Completion
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  
}, {
  timestamps: true,
});

// Indexes
dealSchema.index({ influencer: 1, status: 1 });
dealSchema.index({ brand: 1, status: 1 });
dealSchema.index({ campaign: 1 });
dealSchema.index({ status: 1, deadline: 1 });

// Pre-save middleware to update timestamps
dealSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const now = new Date();
    switch (this.status) {
      case 'completed':
        this.completedAt = now;
        break;
      case 'cancelled':
        this.cancelledAt = now;
        break;
    }
  }
  next();
});

// Method to check if deal is overdue
dealSchema.methods.isOverdue = function() {
  if (this.status === 'completed' || this.status === 'cancelled') {
    return false;
  }
  return this.deadline < new Date();
};

// Method to calculate progress
dealSchema.methods.getProgress = function() {
  if (this.deliverables.length === 0) return 0;
  
  const completedDeliverables = this.deliverables.filter(
    d => d.status === 'approved'
  ).length;
  
  return Math.round((completedDeliverables / this.deliverables.length) * 100);
};

const Deal = mongoose.model('Deal', dealSchema);

module.exports = Deal;
