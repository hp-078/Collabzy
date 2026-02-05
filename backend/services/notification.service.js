const Notification = require('../models/Notification.model');
const User = require('../models/User.model');

/**
 * Create a new notification
 * This function is used by other services to create notifications
 */
const createNotification = async ({ 
  userId, 
  type, 
  title, 
  message, 
  actionUrl = null, 
  actionText = null,
  sender = null,
  priority = 'medium',
  expiresAt = null,
  relatedCampaign = null,
  relatedApplication = null,
  relatedDeal = null,
  relatedReview = null,
  relatedMessage = null
}) => {
  try {
    const notification = new Notification({
      recipient: userId,
      sender,
      type,
      title,
      message,
      actionUrl,
      actionText,
      priority,
      expiresAt,
      relatedCampaign,
      relatedApplication,
      relatedDeal,
      relatedReview,
      relatedMessage
    });

    await notification.save();

    // Populate sender info if exists
    if (sender) {
      await notification.populate('sender', 'name email role');
    }

    // Emit Socket.io notification if user is online
    const io = global.io;
    if (io) {
      const success = io.emitToUser(userId.toString(), 'new-notification', notification);
      if (success) {
        console.log(`📬 Notification sent to user ${userId} via Socket.io`);
      }
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create bulk notifications
 */
const createBulkNotifications = async (notifications) => {
  try {
    const createdNotifications = await Notification.insertMany(notifications);

    // Emit Socket.io notifications for online users
    const io = global.io;
    if (io) {
      for (const notification of createdNotifications) {
        io.emitToUser(notification.recipient.toString(), 'new-notification', notification);
      }
    }

    return createdNotifications;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
};

/**
 * Notification type templates
 */
const NOTIFICATION_TEMPLATES = {
  // Campaign notifications
  CAMPAIGN_MATCH: {
    title: 'New Campaign Match',
    getMessage: (data) => `A new campaign "${data.campaignTitle}" matches your profile!`,
    getLink: (data) => `/influencer/campaigns/${data.campaignId}`
  },
  
  // Application notifications
  APPLICATION_RECEIVED: {
    title: 'New Application',
    getMessage: (data) => `${data.influencerName} applied to your campaign "${data.campaignTitle}"`,
    getLink: (data) => `/brand/applications/${data.applicationId}`
  },
  APPLICATION_SHORTLISTED: {
    title: 'Application Shortlisted',
    getMessage: (data) => `Your application for "${data.campaignTitle}" has been shortlisted!`,
    getLink: (data) => `/influencer/applications/${data.applicationId}`
  },
  APPLICATION_ACCEPTED: {
    title: 'Application Accepted! 🎉',
    getMessage: (data) => `Congratulations! Your application for "${data.campaignTitle}" has been accepted.`,
    getLink: (data) => `/influencer/deals/${data.dealId}`
  },
  APPLICATION_REJECTED: {
    title: 'Application Update',
    getMessage: (data) => `Your application for "${data.campaignTitle}" was not selected this time.`,
    getLink: (data) => `/influencer/applications/${data.applicationId}`
  },
  
  // Deal notifications
  DEAL_CONFIRMED: {
    title: 'Deal Confirmed',
    getMessage: (data) => `Deal confirmed for campaign "${data.campaignTitle}"`,
    getLink: (data) => `/deals/${data.dealId}`
  },
  DEAL_STARTED: {
    title: 'Deal Started',
    getMessage: (data) => `Deal for "${data.campaignTitle}" has started. Good luck!`,
    getLink: (data) => `/deals/${data.dealId}`
  },
  CONTENT_SUBMITTED: {
    title: 'Content Submitted',
    getMessage: (data) => `${data.influencerName} submitted content for "${data.campaignTitle}"`,
    getLink: (data) => `/brand/deals/${data.dealId}`
  },
  CONTENT_APPROVED: {
    title: 'Content Approved ✓',
    getMessage: (data) => `Your content for "${data.campaignTitle}" has been approved!`,
    getLink: (data) => `/influencer/deals/${data.dealId}`
  },
  REVISION_REQUESTED: {
    title: 'Revision Requested',
    getMessage: (data) => `${data.brandName} requested revisions for "${data.campaignTitle}"`,
    getLink: (data) => `/influencer/deals/${data.dealId}`
  },
  DEAL_COMPLETED: {
    title: 'Deal Completed! 🎉',
    getMessage: (data) => `Deal for "${data.campaignTitle}" has been completed successfully.`,
    getLink: (data) => `/deals/${data.dealId}`
  },
  DEAL_CANCELLED: {
    title: 'Deal Cancelled',
    getMessage: (data) => `Deal for "${data.campaignTitle}" has been cancelled.`,
    getLink: (data) => `/deals/${data.dealId}`
  },
  
  // Review notifications
  NEW_REVIEW: {
    title: 'New Review Received',
    getMessage: (data) => `${data.brandName} left you a ${data.rating}-star review!`,
    getLink: (data) => `/influencer/reviews/${data.reviewId}`
  },
  REVIEW_RESPONSE: {
    title: 'Review Response',
    getMessage: (data) => `${data.influencerName} responded to your review`,
    getLink: (data) => `/brand/reviews/${data.reviewId}`
  },
  
  // Message notifications
  NEW_MESSAGE: {
    title: 'New Message',
    getMessage: (data) => `${data.senderName}: ${data.preview}`,
    getLink: (data) => `/messages?user=${data.senderId}`
  },
  
  // Profile notifications
  PROFILE_VERIFIED: {
    title: 'Profile Verified ✓',
    getMessage: () => 'Congratulations! Your profile has been verified.',
    getLink: () => '/profile'
  },
  TRUST_SCORE_UPDATED: {
    title: 'Trust Score Updated',
    getMessage: (data) => `Your trust score has been updated to ${data.trustScore}/100`,
    getLink: () => '/profile'
  }
};

/**
 * Helper function to create notification from template
 */
const createNotificationFromTemplate = async (userId, templateType, data, options = {}) => {
  const template = NOTIFICATION_TEMPLATES[templateType];
  
  if (!template) {
    throw new Error(`Unknown notification template: ${templateType}`);
  }
  
  return createNotification({
    userId,
    type: templateType.toLowerCase(),
    title: template.title,
    message: template.getMessage(data),
    actionUrl: template.getLink(data),
    actionText: 'View Details',
    sender: options.sender || null,
    priority: options.priority || 'medium',
    relatedCampaign: options.relatedCampaign || null,
    relatedApplication: options.relatedApplication || null,
    relatedDeal: options.relatedDeal || null,
    relatedReview: options.relatedReview || null,
    relatedMessage: options.relatedMessage || null
  });
};

module.exports = {
  createNotification,
  createBulkNotifications,
  createNotificationFromTemplate,
  NOTIFICATION_TEMPLATES
};
