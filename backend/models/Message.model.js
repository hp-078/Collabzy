const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Conversation participants
  conversationId: {
    type: String,
    required: true,
    index: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Message Content
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [5000, 'Message cannot exceed 5000 characters'],
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'link'],
    default: 'text',
  },
  
  // Attachments
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'video', 'document', 'audio', 'other'],
    },
    url: String,
    filename: String,
    size: Number, // in bytes
    mimeType: String,
  }],
  
  // Message Status
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
  isDelivered: {
    type: Boolean,
    default: false,
  },
  deliveredAt: {
    type: Date,
  },
  
  // Related to deal/campaign
  relatedDeal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal',
  },
  relatedCampaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
  },
  
  // Message Actions
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
  deletedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  
  // Reply to another message
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  
}, {
  timestamps: true,
});

// Indexes
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ recipient: 1, isRead: 1 });

// Static method to create conversation ID
messageSchema.statics.createConversationId = function(userId1, userId2) {
  // Sort IDs to ensure consistent conversation ID regardless of order
  const ids = [userId1.toString(), userId2.toString()].sort();
  return `${ids[0]}_${ids[1]}`;
};

// Pre-save middleware to set conversation ID
messageSchema.pre('save', function(next) {
  if (!this.conversationId) {
    this.conversationId = messageSchema.statics.createConversationId(
      this.sender,
      this.recipient
    );
  }
  next();
});

// Method to mark as read
messageSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
  }
  return this.save();
};

// Method to mark as delivered
messageSchema.methods.markAsDelivered = function() {
  if (!this.isDelivered) {
    this.isDelivered = true;
    this.deliveredAt = new Date();
  }
  return this.save();
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
