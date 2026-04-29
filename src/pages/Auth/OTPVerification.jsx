import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowRight, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './OTPVerification.css';

const OTPVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  // Get email and name from location state
  useEffect(() => {
    const state = location.state;
    if (state && state.email && state.name) {
      setEmail(state.email);
      setUserName(state.name);
    } else {
      // Redirect to register if no state
      navigate('/register');
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
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
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

  // Verify OTP
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    const otpCode = otp.join('');

    // Validate OTP
    if (otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/verify-otp', { email, otp: otpCode });

      const data = res.data;

      // Save token and user data
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      toast.success('🎉 Email verified! Welcome to Collabzy!');

      // Small delay for better UX
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err) {
      console.error('❌ OTP verification error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to verify OTP. Please try again.';
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
      const res = await api.post('/auth/resend-otp', { email });
      const data = res.data;

      // Reset timer
      setTimeLeft(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);

      toast.success(data.message || '✅ OTP resent to your email');
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
            <div className="auth-logo">
              <span className="auth-logo-icon">C</span>
            </div>
            <h1 className="auth-welcome">Verify Your Email</h1>
            <p className="auth-tagline">
              We've sent a 6-digit verification code to your email. This code will expire in 1 minute.
            </p>
            <div className="auth-features">
              <div className="auth-feature">
                <span className="auth-feature-icon">✓</span>
                <span>Secure email verification</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">✓</span>
                <span>Quick and easy process</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">✓</span>
                <span>1-minute expiration for security</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">✓</span>
                <span>Resend code anytime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - OTP Form */}
        <div className="auth-right">
          <div className="auth-form-container">
            <h2 className="auth-title">Enter Verification Code</h2>
            <p className="auth-subtitle">
              Check your email at{' '}
              <span style={{ color: '#667eea', fontWeight: '600' }}>
                {email}
              </span>
            </p>

            {error && (
              <div
                className="auth-error"
                style={{
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  backgroundColor: '#fee',
                  border: '1px solid #fcc',
                  borderRadius: '0.5rem',
                  color: '#c33',
                  fontSize: '0.875rem',
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleVerify} className="auth-form">
              {/* OTP Input Fields */}
              <div className="otp-input-group">
                <label htmlFor="otp-0" style={{ marginBottom: '1.5rem', display: 'block' }}>
                  Enter 6-digit code:
                </label>
                <div className="otp-inputs">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOTPChange(e.target.value, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className={`otp-input ${loading ? 'disabled' : ''}`}
                      disabled={loading}
                      placeholder="•"
                    />
                  ))}
                </div>
              </div>

              {/* Timer and Resend */}
              <div className="otp-timer-section">
                <div className="otp-timer-info">
                  <Clock size={16} />
                  <span>
                    {timeLeft > 0 ? (
                      <>
                        Expires in: <strong>{formatTime(timeLeft)}</strong>
                      </>
                    ) : (
                      'Code expired. Please resend.'
                    )}
                  </span>
                </div>

                {canResend && (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="otp-resend-btn"
                  >
                    {loading ? 'Resending...' : 'Resend Code'}
                  </button>
                )}
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || otp.some((digit) => !digit)}
                className="auth-btn"
                style={{
                  marginTop: '2rem',
                  opacity: loading || otp.some((digit) => !digit) ? 0.6 : 1,
                  cursor:
                    loading || otp.some((digit) => !digit) ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Email
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              {/* Change Email */}
              <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#666' }}>
                Wrong email?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#667eea',
                    cursor: 'pointer',
                    fontWeight: '600',
                    textDecoration: 'underline',
                  }}
                >
                  Go back
                </button>
              </p>
            </form>

            {/* Security Note */}
            <div
              style={{
                background: '#e8f4f8',
                border: '1px solid #b3e5fc',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginTop: '1.5rem',
                fontSize: '0.75rem',
                color: '#01579b',
                lineHeight: '1.5',
              }}
            >
              🔒 <strong>Security Tip:</strong> We'll never ask for your verification code anywhere else. 
              Check your spam/promotions folder if you don't see the email.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
