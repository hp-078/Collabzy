import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  // Connect to Socket.io server
  connect(userId) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found, cannot connect to socket');
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `http://${window.location.hostname}:5000`;

    this.socket = io(SOCKET_URL, {
      auth: {
        token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to Socket.io server');
      // Tell backend who we are so it can track online status
      if (userId) {
        this.socket.emit('user:join', userId);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from socket:', reason);
    });

    return this.socket;
  }

  // Disconnect from server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      console.log('Disconnected from Socket.io server');
    }
  }

  // Emit event to server
  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    } else {
      console.error('Socket not connected');
    }
  }

  // Listen to server events
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      
      // Store listener for cleanup
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }
  }

  // Remove event listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      
      // Remove from stored listeners
      if (this.listeners.has(event)) {
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  // Remove all listeners for an event
  removeAllListeners(event) {
    if (this.socket) {
      this.socket.removeAllListeners(event);
      this.listeners.delete(event);
    }
  }

  // Check if socket is connected
  isConnected() {
    return this.socket && this.socket.connected;
  }

  // Join a conversation room (matches backend 'conversation:join')
  joinConversation(conversationId) {
    this.emit('conversation:join', conversationId);
  }

  // Leave a conversation room
  leaveConversation(conversationId) {
    this.emit('conversation:leave', conversationId);
  }

  // Send a message through socket (matches backend 'message:send')
  sendMessage(conversationId, message) {
    this.emit('message:send', { conversationId, message });
  }

  // Listen for online users (matches backend 'user:online' / 'user:offline')
  onUserOnline(callback) {
    this.on('user:online', callback);
  }

  onUserOffline(callback) {
    this.on('user:offline', callback);
  }

  // Send typing indicator (matches backend 'typing:start' / 'typing:stop')
  startTyping(conversationId) {
    this.emit('typing:start', { conversationId });
  }

  stopTyping(conversationId) {
    this.emit('typing:stop', { conversationId });
  }

  // Listen for typing indicators (matches backend 'typing:start' / 'typing:stop')
  onTypingStart(callback) {
    this.on('typing:start', callback);
  }

  onTypingStop(callback) {
    this.on('typing:stop', callback);
  }

  // Listen for new messages (matches backend 'message:receive')
  onNewMessage(callback) {
    this.on('message:receive', callback);
  }

  // Listen for notifications (matches backend 'notification:new')
  onNotification(callback) {
    this.on('notification:new', callback);
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
