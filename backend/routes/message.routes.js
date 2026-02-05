const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(requireAuth);

// ==========================================
// MESSAGE ROUTES
// ==========================================

// POST /api/messages - Send a new message
router.post('/', messageController.sendMessage);

// GET /api/messages/conversations - Get all conversations
router.get('/conversations', messageController.getAllConversations);

// GET /api/messages/unread-count - Get unread message count
router.get('/unread-count', messageController.getUnreadCount);

// GET /api/messages/conversation/:otherUserId - Get conversation with specific user
router.get('/conversation/:otherUserId', messageController.getConversation);

// PUT /api/messages/read/:otherUserId - Mark messages as read
router.put('/read/:otherUserId', messageController.markAsRead);

// DELETE /api/messages/conversation/:otherUserId - Delete entire conversation
router.delete('/conversation/:otherUserId', messageController.deleteConversation);

module.exports = router;
