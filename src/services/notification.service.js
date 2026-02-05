import api from './api';

const notificationService = {
  // Get all notifications for current user
  getNotifications: async (page = 1, limit = 20) => {
    const response = await api.get('/notification', {
      params: { page, limit }
    });
    return response.data;
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const response = await api.get('/notification/unread-count');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await api.patch(`/notification/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.patch('/notification/read-all');
    return response.data;
  },

  // Delete a notification
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notification/${notificationId}`);
    return response.data;
  },

  // Clear all read notifications
  clearReadNotifications: async () => {
    const response = await api.delete('/notification/clear-read');
    return response.data;
  },

  // Get notification preferences
  getPreferences: async () => {
    const response = await api.get('/notification/preferences');
    return response.data;
  },

  // Update notification preferences
  updatePreferences: async (preferences) => {
    const response = await api.put('/notification/preferences', preferences);
    return response.data;
  },
};

export default notificationService;
