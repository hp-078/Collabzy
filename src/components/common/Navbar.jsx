import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings, 
  MessageSquare, 
  Briefcase,
  Home,
  Users,
    Bell,
    ArrowUpRight,
    Sparkles,
    LayoutDashboard
} from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
    const [scrolled, setScrolled] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowDropdown(false);
  };

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const isActive = (path) => location.pathname === path;

  return (
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
          <nav className="navbar-floating">
              <div className="navbar-shimmer-wrapper">
                  <div className="navbar-shimmer"></div>
              </div>
              <div className="navbar-inner">
                  {/* Logo */}
                  <Link to="/" className="navbar-logo" onClick={closeMenu}>
                      <span className="logo-icon">
                          <Sparkles size={20} />
                      </span>
                      <span className="logo-text">Collabzy</span>
                  </Link>

                  {/* Center Navigation */}
                  <div className={`navbar-center ${isOpen ? 'active' : ''}`}>
                      <div className="nav-pills">
                          <Link
                              to="/" 
                              className={`nav-pill ${isActive('/') ? 'active' : ''}`}
                              onClick={closeMenu}
                          >
                              <Home size={16} />
                              <span>Home</span>
                          </Link>
                          <a
                              href="#how-it-works"
                              className="nav-pill"
                              onClick={closeMenu}
                          >
                              <Sparkles size={16} />
                              <span>How it Works</span>
                          </a>
                          <Link
                              to="/influencers" 
                              className={`nav-pill ${isActive('/influencers') ? 'active' : ''}`}
                              onClick={closeMenu}
                          >
                              <Users size={16} />
                              <span>Influencers</span>
                          </Link>
                          {isAuthenticated && (
                              <>
                                  <Link 
                                      to="/dashboard"
                                      className={`nav-pill ${isActive('/dashboard') ? 'active' : ''}`}
                                      onClick={closeMenu}
                                  >
                                      <LayoutDashboard size={16} />
                                      <span>Dashboard</span>
                                  </Link>
                                  <Link 
                                      to="/collaborations"
                                      className={`nav-pill ${isActive('/collaborations') ? 'active' : ''}`}
                                      onClick={closeMenu}
                                  >
                                      <Briefcase size={16} />
                                      <span>Collaborations</span>
                                  </Link>
                              </>
                          )}
                      </div>
                  </div>

                  {/* Right Actions */}
          <div className="navbar-actions">
            {isAuthenticated ? (
                          <div className="user-section">
                              <Link to="/messages" className="icon-btn messages-btn">
                                  <MessageSquare size={18} />
                                  <span className="badge">2</span>
                              </Link>
                              <button className="icon-btn notification-btn">
                                  <Bell size={18} />
                                  <span className="badge">3</span>
                </button>
                <div 
                                  className="user-avatar-container"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="user-avatar" />
                  ) : (
                    <div className="user-avatar-placeholder">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                                  <div className="avatar-ring"></div>
                </div>

                {showDropdown && (
                  <div className="dropdown-menu">
                    <div className="dropdown-header">
                                          <div className="dropdown-avatar">
                                              {user?.name?.charAt(0) || 'U'}
                                          </div>
                                          <div className="dropdown-info">
                                              <span className="dropdown-name">{user?.name}</span>
                                              <span className="dropdown-role">{user?.role}</span>
                                          </div>
                                      </div>
                    <div className="dropdown-divider"></div>
                    <Link 
                      to="/dashboard" 
                      className="dropdown-item"
                      onClick={() => setShowDropdown(false)}
                    >
                                          <LayoutDashboard size={16} />
                      <span>Dashboard</span>
                    </Link>
                    <Link 
                      to="/profile" 
                      className="dropdown-item"
                      onClick={() => setShowDropdown(false)}
                    >
                      <Settings size={16} />
                      <span>Settings</span>
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item logout" onClick={handleLogout}>
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
                              <div className="auth-actions">
                                  <Link to="/login" className="login-link" onClick={closeMenu}>
                  Login
                </Link>
                                  <Link to="/register" className="cta-button" onClick={closeMenu}>
                                      <span>Get Started</span>
                                      <span className="cta-arrow">
                                          <ArrowUpRight size={16} />
                                      </span>
                </Link>
              </div>
            )}
          </div>

                  {/* Mobile Menu Button */}
                  <button className="mobile-toggle" onClick={toggleMenu}>
                      {isOpen ? <X size={22} /> : <Menu size={22} />}
                  </button>
              </div>
          </nav>

          {/* Mobile Menu Overlay */}
          <div className={`mobile-overlay ${isOpen ? 'active' : ''}`} onClick={closeMenu}></div>

          {/* Mobile Menu */}
          <div className={`mobile-menu ${isOpen ? 'active' : ''}`}>
              <div className="mobile-nav-pills">
                  <Link
                      to="/"
                      className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}
                      onClick={closeMenu}
                  >
                      <Home size={20} />
                      <span>Home</span>
                  </Link>
                  <Link
                      to="/influencers"
                      className={`mobile-nav-item ${isActive('/influencers') ? 'active' : ''}`}
                      onClick={closeMenu}
                  >
                      <Users size={20} />
                      <span>Influencers</span>
                  </Link>
                  {isAuthenticated && (
                      <>
                          <Link
                              to="/dashboard"
                              className={`mobile-nav-item ${isActive('/dashboard') ? 'active' : ''}`}
                              onClick={closeMenu}
                          >
                              <LayoutDashboard size={20} />
                              <span>Dashboard</span>
                          </Link>
                          <Link
                              to="/collaborations"
                              className={`mobile-nav-item ${isActive('/collaborations') ? 'active' : ''}`}
                              onClick={closeMenu}
                          >
                              <Briefcase size={20} />
                              <span>Collaborations</span>
                          </Link>
                          <Link
                              to="/messages"
                              className={`mobile-nav-item ${isActive('/messages') ? 'active' : ''}`}
                              onClick={closeMenu}
                          >
                              <MessageSquare size={20} />
                              <span>Messages</span>
                          </Link>
                      </>
                  )}
              </div>
              {!isAuthenticated && (
                  <div className="mobile-auth">
                      <Link to="/login" className="mobile-login" onClick={closeMenu}>
                          Login
                      </Link>
                      <Link to="/register" className="mobile-signup" onClick={closeMenu}>
                          <span>Get Started</span>
                          <ArrowUpRight size={18} />
                      </Link>
                  </div>
              )}
      </div>
      </header>
  );
};

export default Navbar;
