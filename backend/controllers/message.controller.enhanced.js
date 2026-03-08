// backend/controllers/message.controller.enhanced.js
// Enhanced message controller with filtering and limits

const Message = require('../models/Message.model');
const Deal = require('../models/Deal.model');
const Violation = require('../models/Violation.model');
const messageFilterService = require('../services/messageFilter.service');const trustScoreService = require('../services/trustScore.service');const notificationService = require('../services/notification.service');

/**
 * Send message with filtering and limits
 */
exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.userId;

        if (!receiverId || !content) {
            return res.status(400).json({
                success: false,
                error: 'Receiver ID and message content are required'
            });
        }

        if (senderId.toString() === receiverId.toString()) {
            return res.status(400).json({
                success: false,
                error: 'Cannot send message to yourself'
            });
        }

        // Sanitize message
        const sanitizedContent = messageFilterService.sanitizeMessage(content);

        if (!sanitizedContent) {
            return res.status(400).json({
                success: false,
                error: 'Message content is invalid'
            });
        }

        // Create conversation ID (consistent ordering)
        const conversationId = [senderId, receiverId].sort().join('_');

        // Check if deal exists between users with confirmed payment
        const deal = await Deal.findOne({
            $or: [
                { brandId: senderId, influencerId: receiverId },
                { brandId: receiverId, influencerId: senderId }
            ],
            status: { $in: ['active', 'in_review', 'completed'] }
        }).populate('paymentId');

        const isDealConfirmed = deal && deal.paymentId && deal.paymentId.paymentStatus === 'paid';

        // If no confirmed deal, check message limits
        if (!isDealConfirmed) {
            // Count existing messages in conversation
            const messageCount = await Message.countDocuments({ conversationId });

            const limitStatus = messageFilterService.getMessageLimitStatus(messageCount, false);

            if (!limitStatus.allowed) {
                return res.status(403).json({
                    success: false,
                    error: limitStatus.message,
                    code: 'MESSAGE_LIMIT_EXCEEDED',
                    remaining: 0
                });
            }

            // Check message content for restricted information
            const filterResult = messageFilterService.checkMessage(sanitizedContent);

            if (filterResult.isViolation) {
                // Log violation
                await Violation.create({
                    userId: senderId,
                    violationType: filterResult.type,
                    message: sanitizedContent,
                    detectedPattern: filterResult.detectedPattern,
                    conversationId,
                    receiverId,
                    actionTaken: 'blocked',
                    trustScorePenalty: -2,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent']
                });

                // Decrease trust score
                try {
                    await trustScoreService.updateTrustScore(
                        senderId.toString(),
                        'CONTACT_VIOLATION',
                        { 
                            conversationId, 
                            violationType: filterResult.type,
                            detectedPattern: filterResult.detectedPattern 
                        }
                    );
                } catch (trustErr) {
                    console.error('Trust score update error:', trustErr);
                }

                // Notify admins if multiple violations
                const violationCount = await Violation.countDocuments({
                    userId: senderId,
                    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
                });

                if (violationCount >= 3) {
                    // Flag user for admin review with repeated violations penalty
                    console.log(`User ${senderId} has ${violationCount} violations - flagging for review`);
                    try {
                        await trustScoreService.updateTrustScore(
                            senderId.toString(),
                            'REPEATED_VIOLATIONS',
                            { violationCount }
                        );
                    } catch (trustErr) {
                        console.error('Trust score update error:', trustErr);
                    }
                }

                return res.status(403).json({
                    success: false,
                    error: filterResult.reason,
                    code: 'CONTENT_BLOCKED',
                    type: filterResult.type,
                    hint: 'Create a deal to enable unrestricted communication'
                });
            }
        }

        // Create message
        const message = await Message.create({
            senderId,
            receiverId,
            content: sanitizedContent,
            conversationId,
            isRead: false
        });

        // Emit real-time event if receiver is online
        if (req.io && req.onlineUsers && req.onlineUsers.has(receiverId)) {
            req.io.to(req.onlineUsers.get(receiverId)).emit('message:new', {
                ...message.toObject(),
                sender: {
                    id: senderId,
                    // Include basic sender info
                }
            });
        }

        // Create notification
        await notificationService.create(receiverId, 'NEW_MESSAGE', {
            senderId,
            messagePreview: sanitizedContent.substring(0, 50)
        });

        // Get remaining messages if deal not confirmed
        let remaining = null;
        if (!isDealConfirmed) {
            const newMessageCount = await Message.countDocuments({ conversationId });
            const limitStatus = messageFilterService.getMessageLimitStatus(newMessageCount, false);
            remaining = limitStatus.remaining;
        }

        return res.status(201).json({
            success: true,
            message: message,
            remaining: remaining,
            dealConfirmed: isDealConfirmed
        });
    } catch (error) {
        console.error('Send message error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to send message'
        });
    }
};

/**
 * Get conversation between two users
 */
exports.getConversation = async (req, res) => {
    try {
        const { otherUserId } = req.params;
        const userId = req.userId;

        const conversationId = [userId, otherUserId].sort().join('_');

        const messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 })
            .populate('senderId', 'email role')
            .populate('receiverId', 'email role')
            .limit(100); // Limit to last 100 messages

        // Mark messages as read
        await Message.updateMany(
            {
                conversationId,
                receiverId: userId,
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        // Check deal status and message limits
        const deal = await Deal.findOne({
            $or: [
                { brandId: userId, influencerId: otherUserId },
                { brandId: otherUserId, influencerId: userId }
            ],
            status: { $in: ['active', 'in_review', 'completed'] }
        }).populate('paymentId');

        const isDealConfirmed = deal && deal.paymentId && deal.paymentId.paymentStatus === 'paid';
        const messageCount = messages.length;
        const limitStatus = messageFilterService.getMessageLimitStatus(messageCount, isDealConfirmed);

        return res.json({
            success: true,
            messages,
            conversation: {
                conversationId,
                messageCount,
                dealConfirmed: isDealConfirmed,
                messagesRemaining: limitStatus.remaining,
                limitMessage: limitStatus.message
            }
        });
    } catch (error) {
        console.error('Get conversation error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch conversation'
        });
    }
};

/**
 * Get all conversations for a user
 */
exports.getConversations = async (req, res) => {
    try {
        const userId = req.userId;

        // Get unique conversation IDs
        const messages = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: userId },
                        { receiverId: userId }
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
                                { $and: [{ $eq: ['$receiverId', userId] }, { $eq: ['$isRead', false] }] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        // Populate user details
        const conversations = await Promise.all(
            messages.map(async (conv) => {
                const msg = conv.lastMessage;
                const otherUserId = msg.senderId.toString() === userId.toString() 
                    ? msg.receiverId 
                    : msg.senderId;

                const otherUser = await User.findById(otherUserId).select('email role');

                return {
                    conversationId: conv._id,
                    otherUser,
                    lastMessage: msg,
                    unreadCount: conv.unreadCount
                };
            })
        );

        return res.json({
            success: true,
            conversations
        });
    } catch (error) {
        console.error('Get conversations error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch conversations'
        });
    }
};

/**
 * Get unread message count
 */
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.userId;

        const unreadCount = await Message.countDocuments({
            receiverId: userId,
            isRead: false
        });

        return res.json({
            success: true,
            unreadCount
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get unread count'
        });
    }
};

/**
 * Mark message as read
 */
exports.markAsRead = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.userId;

        const message = await Message.findOneAndUpdate(
            {
                _id: messageId,
                receiverId: userId
            },
            {
                isRead: true,
                readAt: new Date()
            },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({
                success: false,
                error: 'Message not found'
            });
        }

        return res.json({
            success: true,
            message
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to mark message as read'
        });
    }
};
