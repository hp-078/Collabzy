const Message = require('../models/Message.model');
const Application = require('../models/Application.model');
const Campaign = require('../models/Campaign.model');
const Deal = require('../models/Deal.model');
const User = require('../models/User.model');
const { emitToConversation, emitToUser } = require('../config/socket');
const { createNotification } = require('../services/notification.service');

/**
 * Send a message in application/collaboration context
 * POST /api/messages/application/:applicationId
 */
exports.sendApplicationMessage = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { content, type, attachments } = req.body;
    const senderId = req.user._id;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Get application with campaign and participants
    const application = await Application.findById(applicationId)
      .populate('campaign', 'title brand')
      .populate('influencer', 'name avatar');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify user is part of this collaboration
    const brandId = application.campaign.brand.toString();
    const influencerId = application.influencer._id.toString();
    
    if (senderId.toString() !== brandId && senderId.toString() !== influencerId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send messages in this collaboration'
      });
    }

    // Determine receiver
    const receiverId = senderId.toString() === brandId ? influencerId : brandId;

    // Create conversation ID from application
    const conversationId = `app_${applicationId}`;

    // Get deal if it exists
    const deal = await Deal.findOne({ application: applicationId });

    // Create message
    const message = await Message.create({
      campaign: application.campaign._id,
      application: applicationId,
      deal: deal?._id,
      conversationId,
      sender: senderId,
      receiver: receiverId,
      content,
      type: type || 'text',
      attachments: attachments || []
    });

    await message.populate([
      { path: 'sender', select: 'name avatar role' },
      { path: 'campaign', select: 'title' }
    ]);

    // Emit via Socket.io
    emitToConversation(conversationId, 'message:receive', message);
    
    // Notify receiver
    const senderName = req.user.name;
    const campaignTitle = application.campaign.title;
    emitToUser(receiverId, 'notification:new', {
      type: 'new_message',
      title: `New message about "${campaignTitle}"`,
      message: `${senderName} sent you a message`
    });

    // Persist notification
    try {
      await createNotification({
        userId: receiverId,
        type: 'new_message',
        title: `Message about "${campaignTitle}"`,
        message: `${senderName}: ${content.substring(0, 100)}`,
        actionUrl: `/collaborations?app=${applicationId}`,
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
    console.error('Send application message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

/**
 * Get messages for a specific application/collaboration
 * GET /api/messages/application/:applicationId
 */
exports.getApplicationMessages = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id;

    // Get application to verify access
    const application = await Application.findById(applicationId)
      .populate('campaign', 'brand')
      .populate('influencer', '_id');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify user is part of this collaboration
    const brandId = application.campaign.brand.toString();
    const influencerId = application.influencer._id.toString();
    
    if (userId.toString() !== brandId && userId.toString() !== influencerId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these messages'
      });
    }

    const conversationId = `app_${applicationId}`;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [messages, total] = await Promise.all([
      Message.find({ conversationId })
        .populate('sender', 'name avatar role')
        .populate('campaign', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Message.countDocuments({ conversationId })
    ]);

    // Mark messages as read
    await Message.updateMany(
      { conversationId, receiver: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      data: messages.reverse(), // Chronological order
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get application messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
};

/**
 * Get all collaborations (applications) with messages
 * GET /api/messages/my-collaborations
 */
exports.getMyCollaborations = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // Get all applications where user is involved
    let applications;
    if (userRole === 'brand') {
      // First, get all campaigns owned by this brand
      const campaigns = await Campaign.find({ brand: userId }).select('_id');
      const campaignIds = campaigns.map(c => c._id);
      
      applications = await Application.find({
        campaign: { $in: campaignIds },
        status: { $in: ['shortlisted', 'accepted'] }
      })
        .populate('campaign', 'title brand')
        .populate('influencer', 'name avatar')
        .sort({ updatedAt: -1 });
    } else {
      applications = await Application.find({
        influencer: userId,
        status: { $in: ['shortlisted', 'accepted'] }
      })
        .populate({
          path: 'campaign',
          select: 'title brand',
          populate: { path: 'brand', select: 'name avatar' }
        })
        .sort({ updatedAt: -1 });
    }

    // Get last message and unread count for each application
    const collaborations = await Promise.all(
      applications.map(async (app) => {
        const conversationId = `app_${app._id}`;
        
        const [lastMessage, unreadCount] = await Promise.all([
          Message.findOne({ conversationId })
            .sort({ createdAt: -1 })
            .populate('sender', 'name avatar'),
          Message.countDocuments({
            conversationId,
            receiver: userId,
            isRead: false
          })
        ]);

        // Structure response to match frontend expectations
        return {
          application: {
            _id: app._id,
            status: app.status
          },
          campaign: {
            _id: app.campaign?._id,
            title: app.campaign?.title || 'Campaign'
          },
          otherUser: userRole === 'brand' 
            ? { 
                _id: app.influencer._id, 
                name: app.influencer.name, 
                avatar: app.influencer.avatar, 
                role: 'influencer' 
              }
            : { 
                _id: app.campaign.brand._id, 
                name: app.campaign.brand.name, 
                avatar: app.campaign.brand.avatar, 
                role: 'brand' 
              },
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            isFromMe: lastMessage.sender._id.toString() === userId.toString()
          } : null,
          unreadCount,
          updatedAt: app.updatedAt
        };
      })
    );

    // Sort by last message time or update time
    collaborations.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt || a.updatedAt;
      const timeB = b.lastMessage?.createdAt || b.updatedAt;
      return new Date(timeB) - new Date(timeA);
    });

    res.json({
      success: true,
      data: collaborations
    });
  } catch (error) {
    console.error('Get collaborations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collaborations'
    });
  }
};

/**
 * Legacy: Send a message (user-to-user) - keeping for backward compatibility
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
