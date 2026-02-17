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
  Briefcase,
  Tag
} from 'lucide-react';
import './Messages.css';

const Messages = () => {
  const { user } = useAuth();
  const { conversations, fetchCollaborations, getApplicationMessages, sendApplicationMessage } = useData();
  const [selectedCollaboration, setSelectedCollaboration] = useState(null); // collaboration object {application, campaign, otherUser, etc.}
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingCollaborations, setLoadingCollaborations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load collaborations on mount
  useEffect(() => {
    const load = async () => {
      setLoadingCollaborations(true);
      await fetchCollaborations();
      setLoadingCollaborations(false);
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
    const handleTypingStart = ({ userId, applicationId }) => {
      if (userId !== user?._id && selectedCollaboration?.application._id === applicationId) {
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
  }, [user?._id, selectedCollaboration]);

  // Listen for new messages via socket
  useEffect(() => {
    const handleNewMessage = (msg) => {
      // If the message is in the currently open collaboration, add it to chat
      if (selectedCollaboration && msg.application === selectedCollaboration.application?._id) {
        setChatMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
      // Update the sidebar locally instead of re-fetching the entire list
      // This avoids an API call on every single incoming message
    };

    socketService.onNewMessage(handleNewMessage);

    return () => {
      socketService.off('message:receive', handleNewMessage);
    };
  }, [selectedCollaboration]);

  // Load messages when selecting a collaboration
  const handleSelectCollaboration = useCallback(async (collaboration) => {
    if (!collaboration?.application?._id) return;
    setSelectedCollaboration(collaboration);
    setLoadingMessages(true);
    const msgs = await getApplicationMessages(collaboration.application._id);
    setChatMessages(msgs);
    setLoadingMessages(false);
    // Join socket conversation room for this application
    const roomId = `app_${collaboration.application._id}`;
    socketService.joinConversation(roomId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }, 100);
    }
  }, [chatMessages]);

  // Handle typing indicator
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (selectedCollaboration?.application?._id && user?._id) {
      const roomId = `app_${selectedCollaboration.application._id}`;
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Start typing
      socketService.startTyping(roomId);
      
      // Stop typing after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        socketService.stopTyping(roomId);
      }, 2000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedCollaboration) return;

    // Stop typing indicator
    if (selectedCollaboration?.application?._id) {
      const roomId = `app_${selectedCollaboration.application._id}`;
      socketService.stopTyping(roomId);
    }

    const content = newMessage.trim();
    setNewMessage('');

    const result = await sendApplicationMessage(selectedCollaboration.application._id, content);
    if (result.success && result.data) {
      // Add the sent message to chat immediately (optimistic update)
      setChatMessages(prev => {
        if (prev.some(m => m._id === result.data._id)) return prev;
        return [...prev, result.data];
      });
    } else {
      // Show error message
      alert(`❌ Failed to send message!\n\n${result.error || 'Backend server may not be running'}\n\n✅ Solution:\n1. Open a new terminal\n2. Run: cd backend\n3. Run: npm run dev\n\nThen try sending the message again.`);
      // Restore the message
      setNewMessage(content);
    }
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

  // Filter collaborations by search (search by campaign title or other user name)
  const filteredCollaborations = conversations.filter(collab => {
    const campaignTitle = collab.campaign?.title || '';
    const otherUserName = collab.otherUser?.name || '';
    return campaignTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      otherUserName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="msg-page">
      <div className="msg-container">
        {/* Sidebar - Show Collaborations */}
        <div className={`msg-sidebar ${selectedCollaboration ? 'msg-hidden-mobile' : ''}`}>
          <div className="msg-sidebar-header">
            <h2>Collaborations</h2>
            <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px' }}>
              Campaign-based chats
            </p>
          </div>

          <div className="msg-sidebar-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by campaign or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="msg-conversations-list">
            {loadingCollaborations ? (
              <div className="msg-loading-container">
                <Loader size={24} className="spin-animation" />
              </div>
            ) : filteredCollaborations.length > 0 ? (
              filteredCollaborations.map((collab) => {
                if (!collab?.application?._id) return null;
                const isOnline = onlineUsers.has(collab.otherUser?._id);
                const isSelected = selectedCollaboration?.application?._id === collab.application._id;
                return (
                  <div
                    key={collab.application._id}
                    className={`msg-conversation-item ${isSelected ? 'msg-active' : ''}`}
                    onClick={() => handleSelectCollaboration(collab)}
                  >
                    <div className="msg-conversation-avatar">
                      {collab.otherUser?.avatar ? (
                        <img src={collab.otherUser.avatar} alt={collab.otherUser.name} />
                      ) : (
                        collab.otherUser?.name?.charAt(0) || '?'
                      )}
                      {isOnline && <span className="msg-online-dot" />}
                    </div>
                    <div className="msg-conversation-info">
                      <div className="msg-conversation-header">
                        <h4>{collab.campaign?.title || 'Unknown Campaign'}</h4>
                        <span className="msg-conversation-time">
                          {collab.lastMessage?.createdAt ? formatTime(collab.lastMessage.createdAt) : ''}
                        </span>
                      </div>
                      <p className="msg-conversation-subtitle" style={{ 
                        fontSize: '0.75rem', 
                        color: '#666', 
                        marginBottom: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Tag size={12} />
                        {collab.otherUser?.name || 'Unknown'}
                      </p>
                      <p className="msg-conversation-preview">
                        {collab.lastMessage?.isFromMe ? 'You: ' : ''}
                        {collab.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                    {collab.unreadCount > 0 && (
                      <span className="msg-unread-badge">{collab.unreadCount}</span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="msg-no-conversations">
                <Briefcase size={48} style={{ color: '#ccc', marginBottom: '12px' }} />
                <p style={{ fontWeight: '500', marginBottom: '4px' }}>No collaborations yet</p>
                <p style={{ fontSize: '0.85rem', color: '#888' }}>
                  Apply to campaigns to start collaborating
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`msg-chat ${!selectedCollaboration ? 'msg-hidden-mobile' : ''}`}>
          {selectedCollaboration ? (
            <>
              <div className="msg-chat-header">
                <button 
                  className="msg-back-btn msg-mobile-only"
                  onClick={() => setSelectedCollaboration(null)}
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="msg-chat-user">
                  <div className="msg-chat-avatar">
                    {selectedCollaboration.otherUser?.name?.charAt(0) || '?'}
                    {onlineUsers.has(selectedCollaboration.otherUser?._id) && <span className="msg-online-dot" />}
                  </div>
                  <div className="msg-chat-user-info">
                    <h3>{selectedCollaboration.campaign?.title || 'Unknown Campaign'}</h3>
                    <span className="msg-online-status" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {typingUsers.has(selectedCollaboration.otherUser?._id) ? (
                        <span className="msg-typing-indicator">
                          {selectedCollaboration.otherUser?.name} is typing...
                        </span>
                      ) : (
                        <>
                          <Tag size={12} />
                          {selectedCollaboration.otherUser?.name || 'Unknown'}
                          {onlineUsers.has(selectedCollaboration.otherUser?._id) && (
                            <span style={{ color: '#10b981' }}>• Online</span>
                          )}
                        </>
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
                    <p>No messages yet. Start the collaboration discussion!</p>
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
                  placeholder={`Message about ${selectedCollaboration.campaign?.title || 'this campaign'}...`}
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
                <h3>Select a collaboration</h3>
                <p>Choose a collaboration to discuss campaign details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
