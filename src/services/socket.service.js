import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  // Connect to Socket.io server
  connect() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found, cannot connect to socket');
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

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

  // Get online users
  getOnlineUsers(callback) {
    this.on('onlineUsers', callback);
  }

  // Send typing indicator
  startTyping(receiverId) {
    this.emit('typing', { receiverId });
  }

  stopTyping(receiverId) {
    this.emit('stopTyping', { receiverId });
  }

  // Listen for typing indicators
  onTyping(callback) {
    this.on('userTyping', callback);
  }

  // Listen for new messages
  onNewMessage(callback) {
    this.on('newMessage', callback);
  }

  // Listen for message updates
  onMessageUpdate(callback) {
    this.on('messageUpdate', callback);
  }

  // Listen for notifications
  onNotification(callback) {
    this.on('notification', callback);
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
