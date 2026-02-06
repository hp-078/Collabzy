import api from './api';

const messageService = {
  // Send a message
  sendMessage: async (receiverId, content) => {
    const response = await api.post('/messages', { receiverId, content });
    return response.data;
  },

  // Get conversation with a user
  getConversation: async (userId, page = 1, limit = 50) => {
    const response = await api.get(`/messages/conversation/${userId}`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Get all conversations
  getAllConversations: async () => {
    const response = await api.get('/messages/conversations');
    return response.data;
  },

  // Mark messages as read
  markAsRead: async (userId) => {
    const response = await api.put(`/messages/conversation/${userId}/read`);
    return response.data;
  },

  // Get unread message count
  getUnreadCount: async () => {
    const response = await api.get('/messages/unread-count');
    return response.data;
  },
};

export default messageService;
