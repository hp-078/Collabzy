import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
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
  const { influencers, brands } = useData();
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
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if user exists (simplified auth)
      const influencer = influencers.find(i => i.email === formData.email);
      const brand = brands.find(b => b.email === formData.email);
      
      const user = influencer || brand;
      
      if (user) {
        login(user);
        navigate('/dashboard');
      } else {
        // For demo, create a demo user
        const demoUser = {
          id: 'demo-user',
          name: 'Demo User',
          email: formData.email,
          role: 'influencer',
          niche: 'Lifestyle',
          followers: '50K',
          platform: 'Instagram',
        };
        login(demoUser);
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    if (role === 'influencer') {
      login(influencers[0]);
    } else if (role === 'brand') {
      login(brands[0]);
    } else {
      login({
        id: 'admin',
        name: 'Admin User',
        email: 'admin@collabzy.com',
        role: 'admin',
      });
    }
    navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-left-content">
            <Link to="/" className="auth-logo">
              <span className="logo-icon">C</span>
              <span className="logo-text">Collabzy</span>
            </Link>
            <h1 className="auth-welcome">Welcome Back!</h1>
            <p className="auth-tagline">
              Sign in to continue managing your collaborations and growing your network.
            </p>
            <div className="auth-features">
              <div className="auth-feature">
                <span className="feature-icon">✓</span>
                <span>Track your collaborations</span>
              </div>
              <div className="auth-feature">
                <span className="feature-icon">✓</span>
                <span>Message partners</span>
              </div>
              <div className="auth-feature">
                <span className="feature-icon">✓</span>
                <span>Manage your profile</span>
              </div>
              <div className="auth-feature">
                <span className="feature-icon">✓</span>
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

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <Mail size={20} className="input-icon" />
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
                <div className="label-row">
                  <label htmlFor="password">Password</label>
                  <a href="#" className="forgot-link">Forgot password?</a>
                </div>
                <div className="input-wrapper">
                  <Lock size={20} className="input-icon" />
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
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="remember-checkbox">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Remember me for 30 days</label>
              </div>

              <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
                <ArrowRight size={20} />
              </button>
            </form>

            <div className="demo-login">
              <p className="demo-title">Quick Demo Access</p>
              <div className="demo-buttons">
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleDemoLogin('influencer')}
                >
                  Login as Influencer
                </button>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleDemoLogin('brand')}
                >
                  Login as Brand
                </button>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleDemoLogin('admin')}
                >
                  Login as Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
