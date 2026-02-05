const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(requireAuth);

// Get all notifications with filters & pagination
router.get('/', notificationController.getNotifications);

// Get unread notification count
router.get('/unread-count', notificationController.getUnreadCount);

// Get notification preferences
router.get('/preferences', notificationController.getPreferences);

// Update notification preferences
router.put('/preferences', notificationController.updatePreferences);

// Mark all notifications as read
router.put('/mark-all-read', notificationController.markAllAsRead);

// Mark single notification as read
router.put('/:id/read', notificationController.markAsRead);

// Delete single notification
router.delete('/:id', notificationController.deleteNotification);

// Clear all read notifications
router.delete('/clear-read', notificationController.clearReadNotifications);

module.exports = router;
