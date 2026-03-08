// backend/models/User.model.enhanced.js
// Enhanced User model with refresh token support and additional security fields

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    role: {
        type: String,
        enum: ['influencer', 'brand', 'admin'],
        required: true
    },
    
    // Email verification
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    
    // Token versioning for refresh token revocation
    tokenVersion: {
        type: Number,
        default: 0
    },
    
    // Account status
    status: {
        type: String,
        enum: ['active', 'suspended', 'banned', 'pending_verification'],
        default: 'active'
    },
    
    // Suspension details
    suspensionReason: String,
    suspendedAt: Date,
    suspensionEnd: Date,
    
    // Password reset
    passwordResetToken: String,
    passwordResetExpires: Date,
    
    // Two-factor authentication (optional future feature)
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: String,
    
    // Login tracking
    lastLogin: Date,
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    accountLockedUntil: Date,
    
    // Security metadata
    ipAddress: String,
    userAgent: String
}, {
    timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

// Method to increment token version (revoke all refresh tokens)
userSchema.methods.revokeTokens = async function() {
    this.tokenVersion += 1;
    await this.save();
};

// Method to check if account is locked
userSchema.methods.isLocked = function() {
    return this.accountLockedUntil && this.accountLockedUntil > Date.now();
};

// Method to increment failed login attempts
userSchema.methods.incrementLoginAttempts = async function() {
    this.failedLoginAttempts += 1;
    
    // Lock account after 5 failed attempts for 15 minutes
    if (this.failedLoginAttempts >= 5) {
        this.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    
    await this.save();
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
    this.failedLoginAttempts = 0;
    this.accountLockedUntil = undefined;
    this.lastLogin = new Date();
    await this.save();
};

module.exports = mongoose.model('User', userSchema);
