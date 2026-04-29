// backend/models/Payment.model.js
// Payment model for escrow-style payments

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    // Related entities
    dealId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Deal',
        required: true,
        unique: true
    },
    brandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    influencerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application'
    },
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign'
    },
    
    // Payment amounts (in INR)
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    platformFeePercentage: {
        type: Number,
        default: 10, // 10% platform fee
        min: 0,
        max: 100
    },
    platformFee: {
        type: Number,
        required: true,
        min: 0
    },
    influencerAmount: {
        type: Number,
        required: true,
        min: 0
    },
    
    // Razorpay integration
    razorpayOrderId: {
        type: String,
        required: true,
        unique: true
    },
    razorpayPaymentId: String,
    razorpaySignature: String,
    
    // Payment status
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'escrow', 'released', 'refunded', 'failed'],
        default: 'pending'
    },
    
    // Payment details
    currency: {
        type: String,
        default: 'INR'
    },
    paymentMethod: String, // card, netbanking, upi, wallet
    
    // Timestamps
    paidAt: Date,
    releasedAt: Date,
    refundedAt: Date,
    
    // Payout tracking (to influencer)
    payoutId: String,
    payoutStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    payoutMethod: String, // bank_transfer, upi, wallet
    
    // Transaction metadata
    transactionId: String,
    invoiceNumber: String,
    receiptNumber: String,
    
    // Refund information
    refundReason: String,
    refundAmount: Number,
    refundId: String,
    
    // Notes
    brandNotes: String,
    platformNotes: String,
    
    // Audit trail
    statusHistory: [{
        status: String,
        timestamp: Date,
        note: String
    }]
}, {
    timestamps: true
});

// Indexes
paymentSchema.index({ brandId: 1, paymentStatus: 1 });
paymentSchema.index({ influencerId: 1, paymentStatus: 1 });
paymentSchema.index({ paymentStatus: 1, createdAt: -1 });

// Virtual for net platform revenue
paymentSchema.virtual('platformRevenue').get(function() {
    if (this.paymentStatus === 'released') {
        return this.platformFee;
    }
    return 0;
});

// Method to update status with history
paymentSchema.methods.updateStatus = async function(newStatus, note = '') {
    this.statusHistory.push({
        status: this.paymentStatus,
        timestamp: new Date(),
        note
    });
    this.paymentStatus = newStatus;
    
    // Set timestamp based on status
    if (newStatus === 'paid') {
        this.paidAt = new Date();
    } else if (newStatus === 'released') {
        this.releasedAt = new Date();
    } else if (newStatus === 'refunded') {
        this.refundedAt = new Date();
    }
    
    await this.save();
};

// Calculate amounts before saving
paymentSchema.pre('save', function(next) {
    if (this.isModified('totalAmount') || this.isModified('platformFeePercentage')) {
        this.platformFee = Math.round(this.totalAmount * (this.platformFeePercentage / 100));
        this.influencerAmount = this.totalAmount - this.platformFee;
    }
    next();
});

module.exports = mongoose.model('Payment', paymentSchema);
