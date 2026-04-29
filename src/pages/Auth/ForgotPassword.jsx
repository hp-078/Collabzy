import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../../services/auth.service';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate email
    if (!email) {
      setError('Please enter your email');
      toast.error('Please enter your email');
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.forgotPassword(email);
      
      toast.success('✅ OTP sent to your email');

      // Navigate to reset password page after a short delay
      setTimeout(() => {
        navigate('/reset-password', { state: { email } });
      }, 500);
    } catch (err) {
      console.error('❌ Forgot password error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to process request. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
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
              <img src="/logo.png" alt="Collabzy Logo" style={{ height: '56px', width: 'auto', marginRight: '16px', transform: 'scale(1.4)', transformOrigin: 'left center' }} />
              <span className="auth-logo-text">Collabzy</span>
            </Link>
            <h1 className="auth-welcome">Forgot Password?</h1>
            <p className="auth-tagline">
              No worries! We'll help you reset your password. Simply enter your email and we'll send you a verification code.
            </p>
            <div className="auth-features">
              <div className="auth-feature">
                <span className="auth-feature-icon">✓</span>
                <span>Secure password recovery</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">✓</span>
                <span>Email verification code</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">✓</span>
                <span>Fast and secure reset</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">✓</span>
                <span>Instant account access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-right">
          <div className="auth-form-container">
            <h2 className="auth-title">Reset Password</h2>
            <p className="auth-subtitle">
              Enter your email address and we'll send you a verification code
            </p>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-input-group">
                <label className="auth-label">Email Address</label>
                <div className="auth-input-wrapper">
                  <Mail size={20} className="auth-input-icon" />
                  <input
                    type="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="auth-submit"
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              <div className="auth-footer">
                <p>
                  Remember your password?{' '}
                  <Link to="/login" className="auth-link">
                    Login
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

export default ForgotPassword;
