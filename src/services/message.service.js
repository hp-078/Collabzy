import api from './api';

const messageService = {
  // Send a message
  sendMessage: async (receiverId, content) => {
    const response = await api.post('/message', { receiverId, content });
    return response.data;
  },

  // Get conversation with a user
  getConversation: async (userId, page = 1, limit = 50) => {
    const response = await api.get(`/message/conversation/${userId}`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Get all conversations
  getAllConversations: async () => {
    const response = await api.get('/message/conversations');
    return response.data;
  },

  // Mark messages as read
  markAsRead: async (senderId) => {
    const response = await api.put(`/message/read/${senderId}`);
    return response.data;
  },

  // Get unread message count
  getUnreadCount: async () => {
    const response = await api.get('/message/unread-count');
    return response.data;
  },

  // Delete a message
  deleteMessage: async (messageId) => {
    const response = await api.delete(`/message/${messageId}`);
    return response.data;
  },
};

export default messageService;
