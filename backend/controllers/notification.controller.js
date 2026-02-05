const Notification = require('../models/Notification.model');

/**
 * Get all notifications for the authenticated user
 * GET /api/notifications
 * Query params: page, limit, isRead (filter)
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, isRead } = req.query;
    
    // Build filter
    const filter = { recipient: userId };
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }
    
    // Check for expired notifications and delete them
    await Notification.deleteMany({
      recipient: userId,
      expiresAt: { $lt: new Date() }
    });
    
    const skip = (page - 1) * limit;
    
    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .populate('sender', 'name email role')
        .populate('relatedCampaign', 'title')
        .populate('relatedApplication', 'status')
        .populate('relatedDeal', 'status')
        .populate('relatedReview', 'rating')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          hasMore: skip + notifications.length < total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });
    
    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count',
      error: error.message
    });
  }
};

/**
 * Mark a notification as read
 * PUT /api/notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      data: notification,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/mark-all-read
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    
    res.json({
      success: true,
      data: { modifiedCount: result.modifiedCount },
      message: `${result.modifiedCount} notifications marked as read`
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message
    });
  }
};

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: userId
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
};

/**
 * Delete all read notifications
 * DELETE /api/notifications/clear-read
 */
exports.clearReadNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await Notification.deleteMany({
      recipient: userId,
      isRead: true
    });
    
    res.json({
      success: true,
      data: { deletedCount: result.deletedCount },
      message: `${result.deletedCount} read notifications cleared`
    });
  } catch (error) {
    console.error('Error clearing read notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing read notifications',
      error: error.message
    });
  }
};

/**
 * Get notification preferences/settings
 * GET /api/notifications/preferences
 */
exports.getPreferences = async (req, res) => {
  try {
    const user = await require('../models/User.model').findById(req.user.userId);
    
    res.json({
      success: true,
      data: user.notificationPreferences || {
        email: true,
        push: true,
        sms: false,
        categories: {
          applications: true,
          deals: true,
          messages: true,
          reviews: true,
          campaigns: true,
          system: true
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notification preferences',
      error: error.message
    });
  }
};

/**
 * Update notification preferences
 * PUT /api/notifications/preferences
 */
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user.userId;
    const preferences = req.body;
    
    const user = await require('../models/User.model').findByIdAndUpdate(
      userId,
      { notificationPreferences: preferences },
      { new: true }
    );
    
    res.json({
      success: true,
      data: user.notificationPreferences,
      message: 'Notification preferences updated'
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification preferences',
      error: error.message
    });
  }
};
