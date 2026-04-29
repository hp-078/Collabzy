const mongoose = require('mongoose');

const pendingUserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'] },
  password: { type: String, required: true }, // temporarily stored until verification; short-lived
  role: { type: String, enum: ['influencer', 'brand'], required: true },
  otp: { type: String },
  otpExpiry: { type: Date },
}, {
  timestamps: true
});

// Optional: index to auto-remove old pending users after some time (e.g., 1 day)
pendingUserSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const PendingUser = mongoose.model('PendingUser', pendingUserSchema);
module.exports = PendingUser;
