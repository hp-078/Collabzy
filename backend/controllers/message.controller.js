const Message = require('../models/Message.model');
const User = require('../models/User.model');
const Deal = require('../models/Deal.model');

// Content filtering regex patterns
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const EXTERNAL_URL_REGEX = /(whatsapp|telegram|skype|discord|slack|wechat|viber|line|signal|kik|snapchat|messenger)\.com|wa\.me|t\.me/gi;

/**
 * Check if content contains filtered patterns
 */
const filterContent = (content, hasDeal = false) => {
  const violations = [];
  
  // Check for phone numbers
  if (PHONE_REGEX.test(content)) {
    violations.push('phone numbers');
  }
  
  // Check for emails
  if (EMAIL_REGEX.test(content)) {
    violations.push('email addresses');
  }
  
  // Check for external messaging URLs (only restrict if no deal confirmed)
  if (!hasDeal && EXTERNAL_URL_REGEX.test(content)) {
    violations.push('external messaging links');
  }
  
  return {
    filtered: violations.length > 0,
    violations,
    message: violations.length > 0 
      ? `Your message contains restricted content: ${violations.join(', ')}. This is not allowed ${!hasDeal ? 'before deal confirmation' : ''}.`
      : null
  };
};

// ==========================================
// SEND MESSAGE
// ==========================================
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and message content are required'
      });
    }

    if (!content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content cannot be empty'
      });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Check if users have an active deal
    const hasDeal = await Deal.findOne({
      $or: [
        { influencer: senderId, brand: receiverId },
        { influencer: receiverId, brand: senderId }
      ],
      status: { $in: ['confirmed', 'in-progress', 'content-submitted', 'approved', 'completed'] }
    });

    // Filter content
    const filterResult = filterContent(content, !!hasDeal);
    if (filterResult.filtered) {
      // Log the attempt
      console.warn(`Content filtering triggered by user ${senderId}:`, filterResult.violations);
      
      return res.status(400).json({
        success: false,
        message: filterResult.message,
        violations: filterResult.violations
      });
    }

    // Generate conversation ID (consistent between two users)
    const conversationId = [senderId.toString(), receiverId.toString()].sort().join('_');

    // Create message
    const message = new Message({
      conversationId,
      sender: senderId,
      recipient: receiverId,
      content: content.trim(),
      isRead: false
    });

    await message.save();

    // Populate sender and recipient info
    await message.populate([
      { path: 'sender', select: 'name email role' },
      { path: 'recipient', select: 'name email role' }
    ]);

    // TODO: Emit Socket.io event to receiver
    // io.to(receiverId).emit('new-message', message);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

// ==========================================
// GET CONVERSATION HISTORY
// ==========================================
exports.getConversation = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    // Generate conversation ID
    const conversationId = [userId.toString(), otherUserId].sort().join('_');

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch messages
    const messages = await Message.find({ conversationId })
      .populate('sender', 'name email role')
      .populate('recipient', 'name email role')
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({ conversationId });

    // Mark messages as read (where current user is recipient)
    await Message.updateMany(
      {
        conversationId,
        recipient: userId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      data: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation',
      error: error.message
    });
  }
};

// ==========================================
// GET ALL CONVERSATIONS
// ==========================================
exports.getAllConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all conversations where user is sender or receiver
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId },
            { receiver: userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipient', userId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    // Populate user details
    await Message.populate(messages, [
      { path: 'lastMessage.sender', select: 'name email role' },
      { path: 'lastMessage.recipient', select: 'name email role' }
    ]);

    // Format conversations
    const conversations = messages.map(conv => {
      const lastMsg = conv.lastMessage;
      const otherUser = lastMsg.sender._id.toString() === userId.toString()
        ? lastMsg.recipient
        : lastMsg.sender;

      return {
        conversationId: conv._id,
        otherUser,
        lastMessage: {
          content: lastMsg.content,
          createdAt: lastMsg.createdAt,
          isSentByMe: lastMsg.sender._id.toString() === userId.toString(),
          isRead: lastMsg.isRead
        },
        unreadCount: conv.unreadCount
      };
    });

    res.status(200).json({
      success: true,
      data: conversations
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: error.message
    });
  }
};

// ==========================================
// MARK MESSAGES AS READ
// ==========================================
exports.markAsRead = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user._id;

    // Generate conversation ID
    const conversationId = [userId.toString(), otherUserId].sort().join('_');

    // Update all unread messages from other user
    const result = await Message.updateMany(
      {
        conversationId,
        recipient: userId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
      data: {
        markedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
      error: error.message
    });
  }
};

// ==========================================
// DELETE CONVERSATION
// ==========================================
exports.deleteConversation = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user._id;

    // Generate conversation ID
    const conversationId = [userId.toString(), otherUserId].sort().join('_');

    // Delete all messages in conversation
    const result = await Message.deleteMany({ conversationId });

    res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully',
      data: {
        deletedCount: result.deletedCount
      }
    });

  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete conversation',
      error: error.message
    });
  }
};

// ==========================================
// GET UNREAD COUNT
// ==========================================
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const unreadCount = await Message.countDocuments({
      recipient: userId,
      isRead: false
    });

    res.status(200).json({
      success: true,
      data: {
        unreadCount
      }
    });

  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
};

// Export filter function for use in Socket.io
exports.filterContent = filterContent;
