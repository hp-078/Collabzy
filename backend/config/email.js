// backend/config/email.js
const nodemailer = require('nodemailer');

// Create transporter with Gmail credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service error:', error.message);
    console.error('   Make sure EMAIL_USER and EMAIL_PASSWORD are set in .env');
    console.error('   Gmail app password should NOT have spaces');
  } else {
    console.log('✅ Email service ready to send messages');
  }
});

/**
 * Send OTP Email
 */
const sendOTPEmail = async (email, otp, userName) => {
  try {
    const mailOptions = {
    from: `Collabzy <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Collabzy Verification Code',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 20px;
                    margin: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 40px 20px;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: 600;
                }
                .content {
                    padding: 40px 30px;
                }
                .greeting {
                    font-size: 16px;
                    color: #333;
                    margin-bottom: 20px;
                }
                .greeting strong {
                    color: #667eea;
                }
                .message {
                    font-size: 15px;
                    color: #555;
                    line-height: 1.6;
                    margin-bottom: 30px;
                }
                .otp-section {
                    background: #f8f9fa;
                    border-left: 4px solid #667eea;
                    padding: 20px;
                    border-radius: 6px;
                    margin-bottom: 30px;
                    text-align: center;
                }
                .otp-label {
                    font-size: 12px;
                    text-transform: uppercase;
                    color: #888;
                    letter-spacing: 1px;
                    margin-bottom: 10px;
                }
                .otp-code {
                    font-size: 32px;
                    font-weight: 700;
                    color: #667eea;
                    letter-spacing: 3px;
                    font-family: 'Courier New', monospace;
                    word-break: break-all;
                }
                .expiry-notice {
                    background: #fff3cd;
                    border: 1px solid #ffc107;
                    color: #856404;
                    padding: 12px;
                    border-radius: 6px;
                    font-size: 13px;
                    margin-bottom: 30px;
                    text-align: center;
                }
                .security-note {
                    background: #e8f4f8;
                    border: 1px solid #b3e5fc;
                    color: #01579b;
                    padding: 15px;
                    border-radius: 6px;
                    font-size: 13px;
                    line-height: 1.5;
                    margin-bottom: 20px;
                }
                .footer {
                    background: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    border-top: 1px solid #e0e0e0;
                    font-size: 12px;
                    color: #888;
                }
                .footer p {
                    margin: 5px 0;
                }
                .logo {
                    font-size: 24px;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">C</div>
                    <h1>Collabzy Verification</h1>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        Hello <strong>${userName || 'there'}</strong>! 👋
                    </div>
                    
                    <div class="message">
                        Thank you for signing up with Collabzy! To complete your registration and verify your email address, please use the verification code below:
                    </div>
                    
                    <div class="otp-section">
                        <div class="otp-label">Your Verification Code</div>
                        <div class="otp-code">${otp}</div>
                    </div>
                    
                    <div class="expiry-notice">
                        ⏱️ This code will expire in <strong>1 minute</strong>. Please enter it soon.
                    </div>
                    
                    <div class="security-note">
                        🔒 <strong>Security Tip:</strong> Never share this code with anyone. Collabzy staff will never ask for your verification code.
                    </div>
                    
                    <div class="message" style="font-style: italic; color: #888;">
                        If you didn't request this code, you can ignore this email or contact our support team.
                    </div>
                </div>
                
                <div class="footer">
                    <p>© 2024 Collabzy. All rights reserved.</p>
                    <p>This is an automated message, please do not reply.</p>
                    <p><a href="#" style="color: #667eea; text-decoration: none;">Privacy Policy</a> | <a href="#" style="color: #667eea; text-decoration: none;">Contact Us</a></p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent to:', email);
    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('❌ Email send error:', error);
    throw new Error('Failed to send OTP email: ' + error.message);
  }
};

module.exports = {
  transporter,
  sendOTPEmail,
};
