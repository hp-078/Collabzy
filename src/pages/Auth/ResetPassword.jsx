import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowRight, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../../services/auth.service';
import './Auth.css';
import './OTPVerification.css';

const ResetPassword = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  // Get email from location state
  useEffect(() => {
    const state = location.state;
    if (state && state.email) {
      setEmail(state.email);
    } else {
      navigate('/forgot-password');
    }
  }, [location, navigate]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  // Handle OTP input
  const handleOTPChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  // Verify OTP and Reset Password
  const handleReset = async (e) => {
    e.preventDefault();
    setError('');

    const otpCode = otp.join('');

    // Validate OTP
    if (otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    // Validate password
    if (!newPassword) {
      setError('Please enter a new password');
      toast.error('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      toast.error('Password must be at least 6 characters');
      return;
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.verifyForgotOTP(email, otpCode, newPassword);

      toast.success('🎉 Password reset successfully!');

      // Small delay for better UX
      setTimeout(() => {
        navigate('/login');
      }, 500);
    } catch (err) {
      console.error('❌ Reset password error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to reset password. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (!canResend) return;

    setLoading(true);
    setError('');

    try {
      const result = await authService.resendForgotOTP(email);

      // Reset timer
      setTimeLeft(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);

      toast.success(result.message || '✅ OTP resent to your email');
      document.getElementById('otp-0')?.focus();
    } catch (err) {
      console.error('❌ Resend OTP error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to resend OTP. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="auth-page">
      {/* Animated Particles */}
      <div className="auth-particles">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="auth-particle"></div>
        ))}
      </div>

      <div className="auth-container">
        {/* Left Side */}
        <div className="auth-left">
          <div className="auth-left-content">
            <Link to="/" className="auth-logo">
              <span className="auth-logo-icon">C</span>
              <span className="auth-logo-text">Collabzy</span>
            </Link>
            <h1 className="auth-welcome">Reset Your Password</h1>
            <p className="auth-tagline">
              Enter the verification code we sent to your email and set a new password.
            </p>
            <div className="auth-features">
              <div className="auth-feature">
                <span className="auth-feature-icon">✓</span>
                <span>Verify with OTP code</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">✓</span>
                <span>Create a strong password</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">✓</span>
                <span>Secure password reset</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">✓</span>
                <span>Instant login access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-right">
          <div className="auth-form-container">
            <h2 className="auth-title">Verify & Reset Password</h2>
            <p className="auth-subtitle">
              We've sent a code to{' '}
              <span style={{ color: '#667eea', fontWeight: '600' }}>
                {email}
              </span>
            </p>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <form onSubmit={handleReset} className="auth-form">
              {/* OTP Input */}
              <div className="auth-input-group">
                <label className="auth-label">Verification Code</label>
                <div className="otp-input-group">
                  {otp.map((value, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength="1"
                      value={value}
                      onChange={(e) => handleOTPChange(e.target.value, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="otp-input"
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>

              {/* Timer and Resend */}
              <div className="otp-timer">
                <Clock size={16} />
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="auth-link"
                    style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    Resend OTP
                  </button>
                ) : (
                  <span>Resend in {formatTime(timeLeft)}</span>
                )}
              </div>

              {/* New Password */}
              <div className="auth-input-group">
                <label className="auth-label">New Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={20} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password (min. 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="auth-input-group">
                <label className="auth-label">Confirm Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={20} className="auth-input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6 || !newPassword || !confirmPassword}
                className="auth-submit"
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Resetting Password...
                  </>
                ) : (
                  <>
                    Reset Password
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              <div className="auth-footer">
                <p>
                  <Link to="/login" className="auth-link">
                    Back to Login
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
