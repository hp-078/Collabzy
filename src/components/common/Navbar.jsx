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
      <header className={`nav-header ${scrolled ? 'nav-scrolled' : ''}`}>
          <nav className="nav-floating">
              <div className="nav-shimmer-wrapper">
                  <div className="nav-shimmer"></div>
              </div>
              <div className="nav-inner">
                  {/* Logo */}
                  <Link to="/" className="nav-logo" onClick={closeMenu}>
                      <span className="nav-logo-icon">
                          <Sparkles size={20} />
                      </span>
                      <span className="nav-logo-text">Collabzy</span>
                  </Link>

                  {/* Center Navigation */}
                  <div className={`nav-center ${isOpen ? 'nav-active' : ''}`}>
                      <div className="nav-pills">
                          <Link
                              to="/" 
                              className={`nav-pill ${isActive('/') ? 'nav-active' : ''}`}
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
                              className={`nav-pill ${isActive('/influencers') ? 'nav-active' : ''}`}
                              onClick={closeMenu}
                          >
                              <Users size={16} />
                              <span>Influencers</span>
                          </Link>
                          {isAuthenticated && (
                              <>
                                  <Link 
                                      to="/dashboard"
                                      className={`nav-pill ${isActive('/dashboard') ? 'nav-active' : ''}`}
                                      onClick={closeMenu}
                                  >
                                      <LayoutDashboard size={16} />
                                      <span>Dashboard</span>
                                  </Link>
                                  <Link 
                                      to="/collaborations"
                                      className={`nav-pill ${isActive('/collaborations') ? 'nav-active' : ''}`}
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
          <div className="nav-actions">
            {isAuthenticated ? (
                          <div className="nav-user-section">
                              <Link to="/messages" className="nav-icon-btn nav-messages-btn">
                                  <MessageSquare size={18} />
                                  <span className="nav-badge">2</span>
                              </Link>
                              <button className="nav-icon-btn nav-notification-btn">
                                  <Bell size={18} />
                                  <span className="nav-badge">3</span>
                </button>
                <div 
                                  className="nav-user-avatar-container"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="nav-user-avatar" />
                  ) : (
                    <div className="nav-user-avatar-placeholder">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                                  <div className="nav-avatar-ring"></div>
                </div>

                {showDropdown && (
                  <div className="nav-dropdown-menu">
                    <div className="nav-dropdown-header">
                                          <div className="nav-dropdown-avatar">
                                              {user?.name?.charAt(0) || 'U'}
                                          </div>
                                          <div className="nav-dropdown-info">
                                              <span className="nav-dropdown-name">{user?.name}</span>
                                              <span className="nav-dropdown-role">{user?.role}</span>
                                          </div>
                                      </div>
                    <div className="nav-dropdown-divider"></div>
                    <Link 
                      to="/dashboard" 
                      className="nav-dropdown-item"
                      onClick={() => setShowDropdown(false)}
                    >
                                          <LayoutDashboard size={16} />
                      <span>Dashboard</span>
                    </Link>
                    <Link 
                      to="/profile" 
                      className="nav-dropdown-item"
                      onClick={() => setShowDropdown(false)}
                    >
                      <Settings size={16} />
                      <span>Settings</span>
                    </Link>
                    <div className="nav-dropdown-divider"></div>
                    <button className="nav-dropdown-item nav-logout" onClick={handleLogout}>
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
                              <div className="nav-auth-actions">
                                  <Link to="/login" className="nav-login-link" onClick={closeMenu}>
                  Login
                </Link>
                                  <Link to="/register" className="nav-cta-button" onClick={closeMenu}>
                                      <span>Get Started</span>
                                      <span className="nav-cta-arrow">
                                          <ArrowUpRight size={16} />
                                      </span>
                </Link>
              </div>
            )}
          </div>

                  {/* Mobile Menu Button */}
                  <button className="nav-mobile-toggle" onClick={toggleMenu}>
                      {isOpen ? <X size={22} /> : <Menu size={22} />}
                  </button>
              </div>
          </nav>

          {/* Mobile Menu Overlay */}
          <div className={`nav-mobile-overlay ${isOpen ? 'nav-active' : ''}`} onClick={closeMenu}></div>

          {/* Mobile Menu */}
          <div className={`nav-mobile-menu ${isOpen ? 'nav-active' : ''}`}>
              <div className="nav-mobile-pills">
                  <Link
                      to="/"
                      className={`nav-mobile-item ${isActive('/') ? 'nav-active' : ''}`}
                      onClick={closeMenu}
                  >
                      <Home size={20} />
                      <span>Home</span>
                  </Link>
                  <Link
                      to="/influencers"
                      className={`nav-mobile-item ${isActive('/influencers') ? 'nav-active' : ''}`}
                      onClick={closeMenu}
                  >
                      <Users size={20} />
                      <span>Influencers</span>
                  </Link>
                  {isAuthenticated && (
                      <>
                          <Link
                              to="/dashboard"
                              className={`nav-mobile-item ${isActive('/dashboard') ? 'nav-active' : ''}`}
                              onClick={closeMenu}
                          >
                              <LayoutDashboard size={20} />
                              <span>Dashboard</span>
                          </Link>
                          <Link
                              to="/collaborations"
                              className={`nav-mobile-item ${isActive('/collaborations') ? 'nav-active' : ''}`}
                              onClick={closeMenu}
                          >
                              <Briefcase size={20} />
                              <span>Collaborations</span>
                          </Link>
                          <Link
                              to="/messages"
                              className={`nav-mobile-item ${isActive('/messages') ? 'nav-active' : ''}`}
                              onClick={closeMenu}
                          >
                              <MessageSquare size={20} />
                              <span>Messages</span>
                          </Link>
                      </>
                  )}
              </div>
              {!isAuthenticated && (
                  <div className="nav-mobile-auth">
                      <Link to="/login" className="nav-mobile-login" onClick={closeMenu}>
                          Login
                      </Link>
                      <Link to="/register" className="nav-mobile-signup" onClick={closeMenu}>
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
