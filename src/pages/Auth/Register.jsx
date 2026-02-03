import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Eye, EyeOff, Mail, Lock, User, Building, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

const Register = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: searchParams.get('role') || 'influencer',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const { addInfluencer, addBrand } = useData();
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

    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      let newUser;
      if (formData.role === 'influencer') {
        newUser = addInfluencer({
          name: formData.name,
          email: formData.email,
          role: 'influencer',
          niche: '',
          description: '',
          followers: '0',
          platform: 'Instagram',
          location: '',
          services: [],
          pastCollabs: [],
        });
      } else {
        newUser = addBrand({
          name: formData.name,
          email: formData.email,
          role: 'brand',
          industry: '',
          description: '',
          website: '',
          location: '',
        });
      }

      login(newUser);
      toast.success(`Welcome to Collabzy, ${newUser.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error('Registration failed. Please try again.');
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
            <h1 className="auth-welcome">Join the Community</h1>
            <p className="auth-tagline">
              Connect with thousands of influencers and brands. Start collaborating today.
            </p>
            <div className="auth-features">
              <div className="auth-feature">
                <span className="auth-feature-icon">✓</span>
                <span>Free to join</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">✓</span>
                <span>Verified profiles</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">✓</span>
                <span>Direct messaging</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">✓</span>
                <span>Collaboration tracking</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-form-container">
            <h2 className="auth-title">Create your account</h2>
            <p className="auth-subtitle">
              Already have an account?{' '}
              <Link to="/login" className="auth-link">Sign in</Link>
            </p>

            {error && <div className="auth-error">{error}</div>}

            <div className="auth-role-selector">
              <button
                type="button"
                className={`auth-role-btn ${formData.role === 'influencer' ? 'auth-active' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'influencer' })}
              >
                <User size={20} />
                <span>Influencer</span>
              </button>
              <button
                type="button"
                className={`auth-role-btn ${formData.role === 'brand' ? 'auth-active' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'brand' })}
              >
                <Building size={20} />
                <span>Brand</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="input-group">
                <label htmlFor="name">
                  {formData.role === 'influencer' ? 'Full Name' : 'Brand Name'}
                </label>
                <div className="auth-input-wrapper">
                  <User size={20} className="auth-input-icon" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={formData.role === 'influencer' ? 'John Doe' : 'Acme Inc'}
                    className="input"
                  />
                </div>
              </div>

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
                <label htmlFor="password">Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={20} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
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

              <div className="input-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={20} className="auth-input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className="input"
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

              <div className="auth-terms-checkbox">
                <input type="checkbox" id="terms" required />
                <label htmlFor="terms">
                  I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                </label>
              </div>

              <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
                <ArrowRight size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
