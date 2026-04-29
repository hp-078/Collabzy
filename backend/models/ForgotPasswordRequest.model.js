const mongoose = require('mongoose');

const forgotPasswordRequestSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'] },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  otp: { type: String },
  otpExpiry: { type: Date },
}, {
  timestamps: true
});

// Index to auto-remove old password reset requests after 30 minutes
forgotPasswordRequestSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1800 });

const ForgotPasswordRequest = mongoose.model('ForgotPasswordRequest', forgotPasswordRequestSchema);
module.exports = ForgotPasswordRequest;
