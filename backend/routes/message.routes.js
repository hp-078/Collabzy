const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(requireAuth);

// Application-based messaging (primary routes)
router.post('/application/:applicationId', messageController.sendApplicationMessage);
router.get('/application/:applicationId', messageController.getApplicationMessages);
router.get('/my-collaborations', messageController.getMyCollaborations);

// Legacy user-to-user messaging (for backward compatibility)
router.post('/', messageController.sendMessage);
router.get('/conversations', messageController.getConversations);
router.get('/unread-count', messageController.getUnreadCount);
router.get('/conversation/:userId', messageController.getConversation);
router.put('/conversation/:userId/read', messageController.markAsRead);

module.exports = router;
