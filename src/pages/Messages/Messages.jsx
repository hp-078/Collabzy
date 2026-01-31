import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Search,
  Send,
  MoreVertical,
  Phone,
  Video,
  Image,
  Paperclip,
  Smile,
  ChevronLeft
} from 'lucide-react';
import './Messages.css';

const Messages = () => {
  const { user } = useAuth();
  const { collaborations, messages, sendMessage, getMessagesByUser } = useData();
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  // Get unique conversations
  const userMessages = getMessagesByUser(user?.id);
  const conversations = [];
  
  userMessages.forEach(msg => {
    const partnerId = msg.senderId === user?.id ? msg.receiverId : msg.senderId;
    const partnerName = msg.senderId === user?.id ? msg.receiverName : msg.senderName;
    
    if (!conversations.find(c => c.partnerId === partnerId)) {
      conversations.push({
        partnerId,
        partnerName,
        lastMessage: msg.content,
        timestamp: msg.timestamp,
        collaborationId: msg.collaborationId,
      });
    }
  });

  // Also add conversations from collaborations without messages
  collaborations.forEach(collab => {
    const isUserInfluencer = collab.influencerId === user?.id;
    const partnerId = isUserInfluencer ? collab.brandId : collab.influencerId;
    const partnerName = isUserInfluencer ? collab.brandName : collab.influencerName;
    
    if (!conversations.find(c => c.partnerId === partnerId)) {
      conversations.push({
        partnerId,
        partnerName,
        lastMessage: 'No messages yet',
        timestamp: collab.createdAt,
        collaborationId: collab.id,
      });
    }
  });

  const filteredConversations = conversations.filter(c =>
    c.partnerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedConversation = selectedChat 
    ? conversations.find(c => c.partnerId === selectedChat)
    : null;

  const chatMessages = selectedChat
    ? userMessages.filter(m => 
        (m.senderId === selectedChat && m.receiverId === user?.id) ||
        (m.receiverId === selectedChat && m.senderId === user?.id)
      ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    sendMessage({
      collaborationId: selectedConversation?.collaborationId,
      senderId: user.id,
      senderName: user.name,
      receiverId: selectedChat,
      receiverName: selectedConversation?.partnerName,
      content: newMessage,
    });

    setNewMessage('');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    return date.toLocaleDateString();
  };

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
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <div
                  key={conv.partnerId}
                  className={`msg-conversation-item ${selectedChat === conv.partnerId ? 'msg-active' : ''}`}
                  onClick={() => setSelectedChat(conv.partnerId)}
                >
                  <div className="msg-conversation-avatar">
                    {conv.partnerName.charAt(0)}
                  </div>
                  <div className="msg-conversation-info">
                    <div className="msg-conversation-header">
                      <h4>{conv.partnerName}</h4>
                      <span className="msg-conversation-time">
                        {formatTime(conv.timestamp)}
                      </span>
                    </div>
                    <p className="msg-conversation-preview">{conv.lastMessage}</p>
                  </div>
                </div>
              ))
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
                    {selectedConversation?.partnerName.charAt(0)}
                  </div>
                  <div className="msg-chat-user-info">
                    <h3>{selectedConversation?.partnerName}</h3>
                    <span className="msg-online-status">Online</span>
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
                {chatMessages.length > 0 ? (
                  chatMessages.map((msg, index) => {
                    const isOwn = msg.senderId === user?.id;
                    const showDate = index === 0 || 
                      formatDate(msg.timestamp) !== formatDate(chatMessages[index - 1].timestamp);
                    
                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="msg-message-date">
                            {formatDate(msg.timestamp)}
                          </div>
                        )}
                        <div className={`msg-message ${isOwn ? 'msg-own' : 'msg-other'}`}>
                          <div className="msg-message-bubble">
                            <p>{msg.content}</p>
                            <span className="msg-message-time">
                              {formatTime(msg.timestamp)}
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
                  onChange={(e) => setNewMessage(e.target.value)}
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
