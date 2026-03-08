// backend/models/Violation.model.js
// Model to track contact information violation attempts

const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    violationType: {
        type: String,
        enum: ['phone', 'email', 'url', 'social_handle', 'messaging_app', 'keyword', 'message_limit'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    detectedPattern: String,
    conversationId: String,
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // Action taken
    actionTaken: {
        type: String,
        enum: ['blocked', 'warning', 'trust_score_penalty'],
        default: 'blocked'
    },
    
    // Trust score impact
    trustScorePenalty: {
        type: Number,
        default: -2
    },
    
    // Admin review
    reviewStatus: {
        type: String,
        enum: ['pending', 'reviewed', 'dismissed'],
        default: 'pending'
    },
    adminNotes: String,
    
    // Metadata
    ipAddress: String,
    userAgent: String
}, {
    timestamps: true
});

// Indexes
violationSchema.index({ userId: 1, createdAt: -1 });
violationSchema.index({ reviewStatus: 1, createdAt: -1 });
violationSchema.index({ violationType: 1 });

module.exports = mongoose.model('Violation', violationSchema);
