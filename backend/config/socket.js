const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message.model');
const User = require('../models/User.model');
const { filterContent } = require('../controllers/message.controller');

// Online users tracking
const onlineUsers = new Map(); // userId -> socketId

/**
 * Initialize Socket.io server
 */
const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
  });

  // ==========================================
  // MIDDLEWARE - JWT Authentication
  // ==========================================
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // ==========================================
  // CONNECTION EVENT
  // ==========================================
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`✅ User connected: ${socket.user.name} (${userId})`);

    // Add user to online users
    onlineUsers.set(userId, socket.id);

    // Emit online status to all users
    io.emit('user-online', { userId });

    // Send current online users list to the connected user
    socket.emit('online-users', Array.from(onlineUsers.keys()));

    // ==========================================
    // JOIN CONVERSATION ROOM
    // ==========================================
    socket.on('join-conversation', ({ otherUserId }) => {
      const conversationId = [userId, otherUserId].sort().join('_');
      socket.join(conversationId);
      console.log(`User ${userId} joined conversation: ${conversationId}`);
    });

    // ==========================================
    // LEAVE CONVERSATION ROOM
    // ==========================================
    socket.on('leave-conversation', ({ otherUserId }) => {
      const conversationId = [userId, otherUserId].sort().join('_');
      socket.leave(conversationId);
      console.log(`User ${userId} left conversation: ${conversationId}`);
    });

    // ==========================================
    // SEND MESSAGE
    // ==========================================
    socket.on('send-message', async ({ receiverId, content }) => {
      try {
        if (!receiverId || !content) {
          socket.emit('error', { message: 'Receiver ID and content are required' });
          return;
        }

        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
          socket.emit('error', { message: 'Receiver not found' });
          return;
        }

        // Check if users have an active deal (for content filtering)
        const Deal = require('../models/Deal.model');
        const hasDeal = await Deal.findOne({
          $or: [
            { influencer: userId, brand: receiverId },
            { influencer: receiverId, brand: userId }
          ],
          status: { $in: ['confirmed', 'in-progress', 'content-submitted', 'approved', 'completed'] }
        });

        // Filter content
        const filterResult = filterContent(content, !!hasDeal);
        if (filterResult.filtered) {
          console.warn(`Content filtering triggered by user ${userId}:`, filterResult.violations);
          socket.emit('message-filtered', {
            message: filterResult.message,
            violations: filterResult.violations
          });
          return;
        }

        // Generate conversation ID
        const conversationId = [userId, receiverId].sort().join('_');

        // Create and save message
        const message = new Message({
          conversationId,
          sender: userId,
          recipient: receiverId,
          content: content.trim(),
          isRead: false
        });

        await message.save();

        // Populate sender and recipient
        await message.populate([
          { path: 'sender', select: 'name email role' },
          { path: 'recipient', select: 'name email role' }
        ]);

        // Emit to conversation room
        io.to(conversationId).emit('new-message', message);

        // If receiver is online, emit notification
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('new-message-notification', {
            from: socket.user.name,
            preview: content.substring(0, 50),
            conversationId
          });
        }

        // Confirm to sender
        socket.emit('message-sent', { messageId: message._id });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message', error: error.message });
      }
    });

    // ==========================================
    // TYPING INDICATOR
    // ==========================================
    socket.on('typing', ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user-typing', {
          userId,
          userName: socket.user.name
        });
      }
    });

    socket.on('stop-typing', ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user-stopped-typing', { userId });
      }
    });

    // ==========================================
    // MESSAGE READ
    // ==========================================
    socket.on('mark-read', async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId);
        
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Only recipient can mark as read
        if (message.recipient.toString() !== userId) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        // Mark as read
        if (!message.isRead) {
          message.isRead = true;
          message.readAt = new Date();
          await message.save();

          // Notify sender
          const senderSocketId = onlineUsers.get(message.sender.toString());
          if (senderSocketId) {
            io.to(senderSocketId).emit('message-read', {
              messageId,
              readAt: message.readAt
            });
          }
        }

      } catch (error) {
        console.error('Error marking message as read:', error);
        socket.emit('error', { message: 'Failed to mark as read' });
      }
    });

    // ==========================================
    // DISCONNECT EVENT
    // ==========================================
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.name} (${userId})`);
      
      // Remove from online users
      onlineUsers.delete(userId);
      
      // Emit offline status
      io.emit('user-offline', { userId });
    });

    // ==========================================
    // ERROR HANDLING
    // ==========================================
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================
  
  /**
   * Check if user is online
   */
  io.isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  /**
   * Get online users count
   */
  io.getOnlineUsersCount = () => {
    return onlineUsers.size;
  };

  /**
   * Emit notification to specific user
   */
  io.emitToUser = (userId, event, data) => {
    const socketId = onlineUsers.get(userId);
    if (socketId) {
      io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  };

  console.log('✅ Socket.io initialized successfully');
  return io;
};

module.exports = initializeSocket;
