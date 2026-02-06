import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { register, isAuthenticated } = useAuth();
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
    // Clear errors when user starts typing
    if (error) setError('');
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    setFieldErrors({});

    // Detailed validation
    const errors = {};

    // Name validation
    if (!formData.name || formData.name.trim().length === 0) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      errors.name = 'Name must be less than 50 characters';
    }

    // Email validation
    if (!formData.email || formData.email.trim().length === 0) {
      errors.email = 'Email is required';
    } else if (!formData.email.includes('@')) {
      errors.email = 'Please enter a valid email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (formData.password.length > 50) {
      errors.password = 'Password must be less than 50 characters';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      errors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*[0-9])/.test(formData.password)) {
      errors.password = 'Password must contain at least one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // If there are validation errors, display them
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = Object.values(errors)[0];
      setError(firstError);
      toast.error(firstError);
      return;
    }

    setLoading(true);

    try {
      const registerData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
      };

      // Add role-specific fields
      // Backend now accepts both 'name' (for influencers) and 'companyName' (for brands)
      if (formData.role === 'influencer') {
        registerData.name = formData.name.trim();
      } else if (formData.role === 'brand') {
        registerData.companyName = formData.name.trim();
      }

      console.log('📝 Submitting registration:', { ...registerData, password: '***' });

      const result = await register(registerData);

      console.log('📨 Registration result:', result);

      if (result && result.success) {
        const userName = formData.role === 'brand' 
          ? formData.name 
          : (result.user?.name || formData.name || 'there');
        
        toast.success(`Welcome to Collabzy, ${userName}!`);
        
        // Small delay for better UX
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      } else {
        // Handle specific backend errors
        const errorMsg = result?.error || 'Registration failed. Please try again.';
        
        console.error('❌ Registration failed:', errorMsg);
        
        // Check for specific error types
        if (errorMsg.toLowerCase().includes('email') && errorMsg.toLowerCase().includes('exist')) {
          setFieldErrors({ email: 'This email is already registered' });
          setError('This email is already registered. Please use a different email or try logging in.');
        } else if (errorMsg.toLowerCase().includes('email') && errorMsg.toLowerCase().includes('already')) {
          setFieldErrors({ email: 'This email is already registered' });
          setError('This email is already registered. Please use a different email or try logging in.');
        } else if (errorMsg.toLowerCase().includes('email') && errorMsg.toLowerCase().includes('invalid')) {
          setFieldErrors({ email: 'Invalid email address' });
          setError('Invalid email address. Please check and try again.');
        } else if (errorMsg.toLowerCase().includes('password')) {
          setFieldErrors({ password: errorMsg });
          setError(errorMsg);
        } else if (errorMsg.toLowerCase().includes('name') || errorMsg.toLowerCase().includes('companyname')) {
          setFieldErrors({ name: errorMsg });
          setError(errorMsg);
        } else {
          setError(errorMsg);
        }
        
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('❌ Registration exception:', err);
      
      // Handle network and server errors
      let errorMsg = 'An unexpected error occurred. Please try again.';
      
      if (err.code === 'ERR_NETWORK') {
        errorMsg = 'Network error. Please check your internet connection and try again.';
      } else if (err.response) {
        const statusCode = err.response.status;
        const backendMsg = err.response.data?.message || '';
        
        if (statusCode === 400) {
          errorMsg = backendMsg || 'Invalid registration data. Please check your information.';
          
          // Parse backend validation errors if available
          if (err.response.data?.errors) {
            const backendErrors = {};
            err.response.data.errors.forEach(e => {
              backendErrors[e.field] = e.message;
            });
            setFieldErrors(backendErrors);
          }
        } else if (statusCode === 409 || statusCode === 400) {
          if (backendMsg.toLowerCase().includes('email')) {
            errorMsg = 'Email already exists. Please use a different email or try logging in.';
            setFieldErrors({ email: 'This email is already registered' });
          } else {
            errorMsg = backendMsg;
          }
        } else if (statusCode === 500) {
          errorMsg = 'Server error. Please try again later.';
        } else if (backendMsg) {
          errorMsg = backendMsg;
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      
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

            {error && (
              <div className="auth-error" style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '0.5rem', color: '#c33' }}>
                {error}
              </div>
            )}

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
                    className={`input ${fieldErrors.name ? 'input-error' : ''}`}
                  />
                </div>
                {fieldErrors.name && (
                  <span style={{ color: '#c33', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                    {fieldErrors.name}
                  </span>
                )}
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
                    className={`input ${fieldErrors.email ? 'input-error' : ''}`}
                  />
                </div>
                {fieldErrors.email && (
                  <span style={{ color: '#c33', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                    {fieldErrors.email}
                  </span>
                )}
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
                    className={`input ${fieldErrors.password ? 'input-error' : ''}`}
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <span style={{ color: '#c33', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                    {fieldErrors.password}
                  </span>
                )}
                <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                  Must contain at least 8 characters with uppercase, lowercase, and number
                </p>
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
                    className={`input ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <span style={{ color: '#c33', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                    {fieldErrors.confirmPassword}
                  </span>
                )}
              </div>

              <div className="auth-terms-checkbox">
                <input type="checkbox" id="terms" required />
                <label htmlFor="terms">
                  I agree to the <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a> and <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
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
