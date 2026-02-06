const Notification = require('../models/Notification.model');
const { emitToUser } = require('../config/socket');

/**
 * Create a new notification
 * Fields match the Notification model: user, title, message, type, relatedId, relatedType, actionUrl
 */
const createNotification = async ({ 
  userId, 
  type = 'system', 
  title, 
  message, 
  actionUrl = '',
  relatedId = null,
  relatedType = null
}) => {
  try {
    const notificationData = {
      user: userId,
      type,
      title,
      message,
      actionUrl
    };

    if (relatedId) notificationData.relatedId = relatedId;
    if (relatedType) notificationData.relatedType = relatedType;

    const notification = await Notification.create(notificationData);

    // Emit via Socket.io if user is online
    try {
      emitToUser(userId.toString(), 'notification:new', notification);
    } catch (socketError) {
      // Socket may not be initialized yet, silently ignore
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

/**
 * Create bulk notifications
 */
const createBulkNotifications = async (notifications) => {
  try {
    // Map to match model fields
    const mapped = notifications.map(n => ({
      user: n.userId,
      type: n.type || 'system',
      title: n.title,
      message: n.message,
      actionUrl: n.actionUrl || '',
      relatedId: n.relatedId || undefined,
      relatedType: n.relatedType || undefined
    }));

    const created = await Notification.insertMany(mapped);

    // Emit via Socket.io
    for (const notification of created) {
      try {
        emitToUser(notification.user.toString(), 'notification:new', notification);
      } catch (e) { /* ignore */ }
    }

    return created;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    return [];
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
 * Maps template types to the Notification model's type enum: 
 *   application, campaign, deal, message, review, system, payment
 */
const TYPE_MAP = {
  'campaign_match': 'campaign',
  'application_received': 'application',
  'application_shortlisted': 'application',
  'application_accepted': 'application',
  'application_rejected': 'application',
  'deal_confirmed': 'deal',
  'deal_started': 'deal',
  'content_submitted': 'deal',
  'content_approved': 'deal',
  'revision_requested': 'deal',
  'deal_completed': 'deal',
  'deal_cancelled': 'deal',
  'new_review': 'review',
  'review_response': 'review',
  'new_message': 'message',
  'profile_verified': 'system',
  'trust_score_updated': 'system'
};

const createNotificationFromTemplate = async (userId, templateType, data, options = {}) => {
  const template = NOTIFICATION_TEMPLATES[templateType];
  
  if (!template) {
    throw new Error(`Unknown notification template: ${templateType}`);
  }

  const mappedType = TYPE_MAP[templateType.toLowerCase()] || 'system';
  
  return createNotification({
    userId,
    type: mappedType,
    title: template.title,
    message: template.getMessage(data),
    actionUrl: template.getLink(data),
    relatedId: options.relatedId || null,
    relatedType: options.relatedType || null
  });
};

module.exports = {
  createNotification,
  createBulkNotifications,
  createNotificationFromTemplate,
  NOTIFICATION_TEMPLATES
};
