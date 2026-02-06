const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Notification content
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },

  // Type
  type: {
    type: String,
    enum: [
      'application_received',
      'application_accepted',
      'application_rejected',
      'new_message',
      'deal_created',
      'deal_completed',
      'payment_received',
      'review_received',
      'campaign_started',
      'campaign_ended',
      'system'
    ],
    default: 'system'
  },

  // Related entities
  relatedId: {
    type: mongoose.Schema.Types.ObjectId
  },
  relatedType: {
    type: String,
    enum: ['campaign', 'application', 'deal', 'message', 'review']
  },

  // Action URL
  actionUrl: {
    type: String,
    default: ''
  },

  // Status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: { type: Date }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
