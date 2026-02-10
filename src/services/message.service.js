import api from './api';

const messageService = {
  // ============ APPLICATION-BASED MESSAGING (Primary) ============
  
  // Send message in application/collaboration context
  sendApplicationMessage: async (applicationId, content) => {
    const response = await api.post(`/messages/application/${applicationId}`, { content });
    return response.data;
  },

  // Get all messages for a specific application/collaboration
  getApplicationMessages: async (applicationId, page = 1, limit = 50) => {
    const response = await api.get(`/messages/application/${applicationId}`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Get all collaborations (applications) with their last messages
  getMyCollaborations: async () => {
    const response = await api.get('/messages/my-collaborations');
    return response.data;
  },

  // ============ LEGACY USER-TO-USER MESSAGING ============
  
  // Send a message (legacy)
  sendMessage: async (receiverId, content) => {
    const response = await api.post('/messages', { receiverId, content });
    return response.data;
  },

  // Get conversation with a user (legacy)
  getConversation: async (userId, page = 1, limit = 50) => {
    const response = await api.get(`/messages/conversation/${userId}`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Get all conversations (legacy)
  getAllConversations: async () => {
    const response = await api.get('/messages/conversations');
    return response.data;
  },

  // Mark messages as read (legacy)
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
