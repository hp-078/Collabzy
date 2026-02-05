import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');

    // Validation
    if (!formData.email || !formData.password) {
      const errorMsg = 'Please fill in all fields';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!formData.email.includes('@')) {
      const errorMsg = 'Please enter a valid email address';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result && result.success) {
        toast.success(`Welcome back, ${result.user.name}!`);
        navigate('/dashboard');
      } else {
        const errorMsg = result?.error || 'Invalid email or password';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMsg = err.response?.data?.message || 'An unexpected error occurred. Please try again.';
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
              <div className="auth-particle"></div>
              <div className="auth-particle"></div>
              <div className="auth-particle"></div>
              <div className="auth-particle"></div>
              <div className="auth-particle"></div>
              <div className="auth-particle"></div>
              <div className="auth-particle"></div>
              <div className="auth-particle"></div>
          </div>

      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-left-content">
            <Link to="/" className="auth-logo">
              <span className="auth-logo-icon">C</span>
              <span className="auth-logo-text">Collabzy</span>
            </Link>
            <h1 className="auth-welcome">Welcome Back!</h1>
            <p className="auth-tagline">
              Sign in to continue managing your collaborations and growing your network.
            </p>
            <div className="auth-features">
              <div className="auth-feature">
                <span className="auth-feature-icon">✓</span>
                <span>Track your collaborations</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">✓</span>
                <span>Message partners</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">✓</span>
                <span>Manage your profile</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">✓</span>
                <span>Discover new opportunities</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-form-container">
            <h2 className="auth-title">Sign in to your account</h2>
            <p className="auth-subtitle">
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">Create one</Link>
            </p>

            {error && (
              <div className="auth-error" style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '0.5rem', color: '#c33' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <div className="auth-input-wrapper">
                  <Mail size={20} className="auth-input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="input"
                  />
                </div>
              </div>

              <div className="input-group">
                <div className="auth-label-row">
                  <label htmlFor="password">Password</label>
                  <a href="#" className="auth-forgot-link" onClick={(e) => e.preventDefault()}>Forgot password?</a>
                </div>
                <div className="auth-input-wrapper">
                  <Lock size={20} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="input"
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

              <div className="auth-remember-checkbox">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Remember me for 30 days</label>
              </div>

              <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
                <ArrowRight size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
