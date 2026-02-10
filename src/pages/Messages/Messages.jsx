import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import socketService from '../../services/socket.service';
import {
  Search,
  Send,
  MoreVertical,
  Phone,
  Video,
  Image,
  Paperclip,
  Smile,
  ChevronLeft,
  Loader,
  Circle
} from 'lucide-react';
import './Messages.css';

const Messages = () => {
  const { user } = useAuth();
  const { conversations, fetchConversations, getMessagesByUser, sendMessage, markMessagesAsRead } = useData();
  const [selectedChat, setSelectedChat] = useState(null); // otherUser._id
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load conversations on mount
  useEffect(() => {
    const load = async () => {
      setLoadingConvs(true);
      await fetchConversations();
      setLoadingConvs(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for online/offline users
  useEffect(() => {
    const handleUserOnline = (userId) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    };

    const handleUserOffline = (userId) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    socketService.onUserOnline(handleUserOnline);
    socketService.onUserOffline(handleUserOffline);

    return () => {
      socketService.off('user:online', handleUserOnline);
      socketService.off('user:offline', handleUserOffline);
    };
  }, []);

  // Listen for typing indicators
  useEffect(() => {
    const handleTypingStart = ({ userId }) => {
      if (userId !== user?._id) {
        setTypingUsers(prev => new Set([...prev, userId]));
      }
    };

    const handleTypingStop = ({ userId }) => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    socketService.onTypingStart(handleTypingStart);
    socketService.onTypingStop(handleTypingStop);

    return () => {
      socketService.off('typing:start', handleTypingStart);
      socketService.off('typing:stop', handleTypingStop);
    };
  }, [user?._id]);

  // Listen for new messages via socket
  useEffect(() => {
    const handleNewMessage = (msg) => {
      // If the message is in the currently open conversation, add it
      const senderId = msg.sender?._id || msg.sender;
      if (selectedChat && (senderId === selectedChat || msg.receiver === selectedChat)) {
        setChatMessages(prev => [...prev, msg]);
      }
      // Refresh conversations to update last message
      fetchConversations(true);
    };

    socketService.onNewMessage(handleNewMessage);

    return () => {
      socketService.off('message:receive', handleNewMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat]);

  // Load messages when selecting a chat
  const handleSelectChat = useCallback(async (otherUserId) => {
    setSelectedChat(otherUserId);
    setLoadingMessages(true);
    const msgs = await getMessagesByUser(otherUserId);
    setChatMessages(msgs);
    setLoadingMessages(false);
    // Mark as read
    markMessagesAsRead(otherUserId);
    // Join socket conversation room
    if (user?._id) {
      const convId = [user._id, otherUserId].sort().join('_');
      socketService.joinConversation(convId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle typing indicator
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (selectedChat && user?._id) {
      const convId = [user._id, selectedChat].sort().join('_');
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Start typing
      socketService.startTyping(convId);
      
      // Stop typing after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        socketService.stopTyping(convId);
      }, 2000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    // Stop typing indicator
    if (user?._id && selectedChat) {
      const convId = [user._id, selectedChat].sort().join('_');
      socketService.stopTyping(convId);
    }

    const content = newMessage.trim();
    setNewMessage('');

    const result = await sendMessage(selectedChat, content);
    if (result.success && result.data) {
      setChatMessages(prev => [...prev, result.data]);
      // Also emit via socket for real-time
      if (user?._id) {
        const convId = [user._id, selectedChat].sort().join('_');
        socketService.sendMessage(convId, result.data);
      }
    } else {
      // Show error message
      alert(`❌ Failed to send message!\n\n${result.error || 'Backend server may not be running'}\n\n✅ Solution:\n1. Open a new terminal\n2. Run: cd backend\n3. Run: npm run dev\n\nThen try sending the message again.`);
      // Restore the message
      setNewMessage(content);
    }
    // Refresh conversation list
    fetchConversations(true);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter(c =>
    (c.otherUser?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Find selected conversation info
  const selectedConversation = selectedChat
    ? conversations.find(c => c.otherUser?._id === selectedChat)
    : null;

  return (
    <div className="msg-page">
      <div className="msg-container">
        {/* Sidebar */}
        <div className={`msg-sidebar ${selectedChat ? 'msg-hidden-mobile' : ''}`}>
          <div className="msg-sidebar-header">
            <h2>Messages</h2>
          </div>

          <div className="msg-sidebar-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="msg-conversations-list">
            {loadingConvs ? (
              <div className="msg-loading-container">
                <Loader size={24} className="spin-animation" />
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const isOnline = onlineUsers.has(conv.otherUser?._id);
                return (
                  <div
                    key={conv.otherUser?._id || conv.conversationId}
                    className={`msg-conversation-item ${selectedChat === conv.otherUser?._id ? 'msg-active' : ''}`}
                    onClick={() => handleSelectChat(conv.otherUser?._id)}
                  >
                    <div className="msg-conversation-avatar">
                      {conv.otherUser?.avatar ? (
                        <img src={conv.otherUser.avatar} alt={conv.otherUser.name} />
                      ) : (
                        conv.otherUser?.name?.charAt(0) || '?'
                      )}
                      {isOnline && <span className="msg-online-dot" />}
                    </div>
                  <div className="msg-conversation-info">
                    <div className="msg-conversation-header">
                      <h4>{conv.otherUser?.name || 'Unknown'}</h4>
                      <span className="msg-conversation-time">
                        {conv.lastMessage?.createdAt ? formatTime(conv.lastMessage.createdAt) : ''}
                      </span>
                    </div>
                    <p className="msg-conversation-preview">
                      {conv.lastMessage?.isFromMe ? 'You: ' : ''}
                      {conv.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="msg-unread-badge">{conv.unreadCount}</span>
                  )}
                </div>
                );
              })
            ) : (
              <div className="msg-no-conversations">
                <p>No conversations yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`msg-chat ${!selectedChat ? 'msg-hidden-mobile' : ''}`}>
          {selectedChat ? (
            <>
              <div className="msg-chat-header">
                <button 
                  className="msg-back-btn msg-mobile-only"
                  onClick={() => setSelectedChat(null)}
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="msg-chat-user">
                  <div className="msg-chat-avatar">
                    {selectedConversation?.otherUser?.name?.charAt(0) || '?'}
                    {onlineUsers.has(selectedChat) && <span className="msg-online-dot" />}
                  </div>
                  <div className="msg-chat-user-info">
                    <h3>{selectedConversation?.otherUser?.name || 'Unknown'}</h3>
                    <span className="msg-online-status">
                      {typingUsers.has(selectedChat) ? (
                        <span className="msg-typing-indicator">typing...</span>
                      ) : onlineUsers.has(selectedChat) ? (
                        <span className="msg-status-online">Online</span>
                      ) : (
                        selectedConversation?.otherUser?.role || 'Offline'
                      )}
                    </span>
                  </div>
                </div>
                <div className="msg-chat-actions">
                  <button className="msg-action-btn">
                    <Phone size={20} />
                  </button>
                  <button className="msg-action-btn">
                    <Video size={20} />
                  </button>
                  <button className="msg-action-btn">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>

              <div className="msg-chat-messages">
                {loadingMessages ? (
                  <div className="msg-loading-container">
                    <Loader size={24} className="spin-animation" />
                  </div>
                ) : chatMessages.length > 0 ? (
                  chatMessages.map((msg, index) => {
                    const senderId = msg.sender?._id || msg.sender;
                    const isOwn = senderId === user?._id;
                    const msgTime = msg.createdAt || msg.timestamp;
                    const showDate = index === 0 || 
                      formatDate(msgTime) !== formatDate(chatMessages[index - 1].createdAt || chatMessages[index - 1].timestamp);
                    
                    return (
                      <div key={msg._id || index}>
                        {showDate && (
                          <div className="msg-message-date">
                            {formatDate(msgTime)}
                          </div>
                        )}
                        <div className={`msg-message ${isOwn ? 'msg-own' : 'msg-other'}`}>
                          <div className="msg-message-bubble">
                            <p>{msg.content}</p>
                            <span className="msg-message-time">
                              {formatTime(msgTime)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="msg-no-messages">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="msg-chat-input" onSubmit={handleSendMessage}>
                <div className="msg-input-actions">
                  <button type="button" className="msg-input-action">
                    <Paperclip size={20} />
                  </button>
                  <button type="button" className="msg-input-action">
                    <Image size={20} />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={handleTyping}
                />
                <button type="button" className="msg-input-action">
                  <Smile size={20} />
                </button>
                <button type="submit" className="msg-send-btn" disabled={!newMessage.trim()}>
                  <Send size={20} />
                </button>
              </form>
            </>
          ) : (
            <div className="msg-no-chat-selected">
              <div className="msg-no-chat-content">
                <div className="msg-no-chat-icon">💬</div>
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
