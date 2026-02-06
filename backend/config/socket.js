const { Server } = require('socket.io');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Track online users
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`✅ Socket connected: ${socket.id}`);

    // User joins with their ID
    socket.on('user:join', (userId) => {
      if (userId) {
        onlineUsers.set(userId, socket.id);
        socket.userId = userId;
        console.log(`👤 User ${userId} is online`);

        // Broadcast online status
        io.emit('user:online', userId);
      }
    });

    // Join a conversation room
    socket.on('conversation:join', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`💬 User joined conversation: ${conversationId}`);
    });

    // Leave a conversation room
    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Handle new message
    socket.on('message:send', (data) => {
      const { conversationId, message } = data;
      socket.to(`conversation:${conversationId}`).emit('message:receive', message);
    });

    // Typing indicators
    socket.on('typing:start', (data) => {
      socket.to(`conversation:${data.conversationId}`).emit('typing:start', {
        userId: socket.userId,
        conversationId: data.conversationId
      });
    });

    socket.on('typing:stop', (data) => {
      socket.to(`conversation:${data.conversationId}`).emit('typing:stop', {
        userId: socket.userId,
        conversationId: data.conversationId
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit('user:offline', socket.userId);
        console.log(`❌ User ${socket.userId} disconnected`);
      }
    });
  });

  console.log('✅ Socket.io initialized successfully');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Emit to specific user
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

// Emit to conversation
const emitToConversation = (conversationId, event, data) => {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(event, data);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitToConversation
};
