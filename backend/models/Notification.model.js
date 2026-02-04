const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  // Notification Type
  type: {
    type: String,
    enum: [
      'new_application',
      'application_accepted',
      'application_rejected',
      'application_shortlisted',
      'new_message',
      'deal_created',
      'deal_completed',
      'content_submitted',
      'content_approved',
      'revision_requested',
      'payment_received',
      'payment_sent',
      'new_review',
      'campaign_expiring',
      'deadline_approaching',
      'system_announcement',
      'verification_approved',
      'verification_rejected',
      'other',
    ],
    required: true,
  },
  
  // Notification Content
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  
  // Related Entities
  relatedCampaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
  },
  relatedApplication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
  },
  relatedDeal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal',
  },
  relatedReview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
  },
  relatedMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  
  // Action URL
  actionUrl: {
    type: String,
  },
  actionText: {
    type: String,
  },
  
  // Status
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  
  // Expiration
  expiresAt: {
    type: Date,
  },
  
  // For grouping similar notifications
  groupKey: {
    type: String,
  },
  
}, {
  timestamps: true,
});

// Indexes
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }); // For cleanup of expired notifications

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
  }
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  
  // TODO: In future, emit socket event here for real-time notification
  // io.to(data.recipient.toString()).emit('new_notification', notification);
  
  return notification;
};

// Static method to mark all as read for a user
notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ recipient: userId, isRead: false });
};

// Static method to delete expired notifications
notificationSchema.statics.deleteExpired = async function() {
  return await this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
