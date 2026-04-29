// backend/services/otp.service.js
const crypto = require('crypto');

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate OTP with expiry time (1 minute)
 */
const generateOTPWithExpiry = () => {
  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 60 * 1000); // 1 minute expiry
  
  return {
    otp,
    otpExpiry,
    expiresIn: 60 // seconds
  };
};

/**
 * Verify if OTP is valid and not expired
 */
const verifyOTP = (storedOTP, providedOTP, otpExpiry) => {
  // Check if OTP is provided
  if (!providedOTP) {
    return {
      valid: false,
      message: 'OTP is required'
    };
  }

  // Check if OTP exists
  if (!storedOTP) {
    return {
      valid: false,
      message: 'No OTP found. Please request a new one.'
    };
  }

  // Check if OTP is expired
  if (new Date() > otpExpiry) {
    return {
      valid: false,
      message: 'OTP has expired. Please request a new one.'
    };
  }

  // Check if OTP matches
  if (storedOTP !== providedOTP) {
    return {
      valid: false,
      message: 'Invalid OTP. Please try again.'
    };
  }

  return {
    valid: true,
    message: 'OTP verified successfully'
  };
};

/**
 * Hash OTP for storage (optional security layer)
 */
const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

module.exports = {
  generateOTP,
  generateOTPWithExpiry,
  verifyOTP,
  hashOTP
};
