const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Collaboration Context - messages are tied to campaigns/applications
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
    index: true
  },
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true,
    index: true
  },
  deal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal'
  },

  // Conversation ID (for backward compatibility and grouping)
  conversationId: {
    type: String,
    required: true,
    index: true
  },

  // Participants
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Message content
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [5000, 'Message cannot exceed 5000 characters']
  },

  // Message type
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },

  // Attachments
  attachments: [{
    name: { type: String },
    url: { type: String },
    type: { type: String },
    size: { type: Number }
  }],

  // Status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: { type: Date }
}, {
  timestamps: true
});

// Create conversation ID from two user IDs (sorted for consistency)
messageSchema.statics.createConversationId = function (userId1, userId2) {
  const sorted = [userId1.toString(), userId2.toString()].sort();
  return `${sorted[0]}_${sorted[1]}`;
};

// Indexes
messageSchema.index({ sender: 1 });
messageSchema.index({ receiver: 1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
