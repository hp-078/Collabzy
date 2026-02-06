const Message = require('../models/Message.model');
const User = require('../models/User.model');
const { emitToConversation, emitToUser } = require('../config/socket');
const { createNotification } = require('../services/notification.service');

/**
 * Send a message
 * POST /api/messages
 */
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId, content, type, attachments } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and content are required'
      });
    }

    // Verify receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Create conversation ID
    const conversationId = Message.createConversationId(senderId, receiverId);

    // Create message
    const message = await Message.create({
      conversationId,
      sender: senderId,
      receiver: receiverId,
      content,
      type: type || 'text',
      attachments: attachments || []
    });

    await message.populate('sender', 'name avatar');

    // Emit via Socket.io
    emitToConversation(conversationId, 'message:receive', message);
    emitToUser(receiverId, 'notification:new', {
      type: 'new_message',
      title: 'New Message',
      message: `${req.user.name} sent you a message`
    });

    // Persist notification in DB
    try {
      await createNotification({
        userId: receiverId,
        type: 'new_message',
        title: 'New Message',
        message: `${req.user.name}: ${content.substring(0, 100)}`,
        actionUrl: `/messages?user=${senderId}`,
        relatedId: message._id,
        relatedType: 'message'
      });
    } catch (notifErr) {
      console.error('Message notification error:', notifErr);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

/**
 * Get conversation messages
 * GET /api/messages/conversation/:userId
 */
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const conversationId = Message.createConversationId(req.user._id, userId);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [messages, total] = await Promise.all([
      Message.find({ conversationId })
        .populate('sender', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Message.countDocuments({ conversationId })
    ]);

    // Mark messages as read
    await Message.updateMany(
      { conversationId, receiver: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      data: messages.reverse(), // Return in chronological order
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
};

/**
 * Get all conversations
 * GET /api/messages/conversations
 */
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all unique conversations with last message
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$isRead', false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { 'lastMessage.createdAt': -1 } }
    ]);

    // Populate user info for each conversation
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.lastMessage.sender.toString() === userId.toString()
          ? conv.lastMessage.receiver
          : conv.lastMessage.sender;

        const otherUser = await User.findById(otherUserId).select('name avatar role');

        return {
          conversationId: conv._id,
          otherUser,
          lastMessage: {
            content: conv.lastMessage.content,
            createdAt: conv.lastMessage.createdAt,
            isFromMe: conv.lastMessage.sender.toString() === userId.toString()
          },
          unreadCount: conv.unreadCount
        };
      })
    );

    res.json({
      success: true,
      data: populatedConversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
};

/**
 * Mark messages as read
 * PUT /api/messages/conversation/:userId/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const conversationId = Message.createConversationId(req.user._id, userId);

    await Message.updateMany(
      { conversationId, receiver: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
};

/**
 * Get unread count
 * GET /api/messages/unread-count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      isRead: false
    });

    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count'
    });
  }
};
