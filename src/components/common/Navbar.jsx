import { useState } from 'react';
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
  Bell
} from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowDropdown(false);
  };

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <span className="logo-icon">C</span>
          <span className="logo-text">Collabzy</span>
        </Link>

        <button className="mobile-menu-btn" onClick={toggleMenu}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`navbar-menu ${isOpen ? 'active' : ''}`}>
          <div className="navbar-links">
            <Link 
              to="/" 
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              <Home size={18} />
              <span>Home</span>
            </Link>
            <Link 
              to="/influencers" 
              className={`nav-link ${isActive('/influencers') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              <Users size={18} />
              <span>Influencers</span>
            </Link>
            {isAuthenticated && (
              <>
                <Link 
                  to="/collaborations" 
                  className={`nav-link ${isActive('/collaborations') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <Briefcase size={18} />
                  <span>Collaborations</span>
                </Link>
                <Link 
                  to="/messages" 
                  className={`nav-link ${isActive('/messages') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <MessageSquare size={18} />
                  <span>Messages</span>
                </Link>
              </>
            )}
          </div>

          <div className="navbar-actions">
            {isAuthenticated ? (
              <div className="user-menu">
                <button className="notification-btn">
                  <Bell size={20} />
                  <span className="notification-badge">3</span>
                </button>
                <div 
                  className="user-avatar-wrapper"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="user-avatar" />
                  ) : (
                    <div className="user-avatar-placeholder">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                {showDropdown && (
                  <div className="dropdown-menu">
                    <div className="dropdown-header">
                      <span className="dropdown-name">{user?.name}</span>
                      <span className="dropdown-role">{user?.role}</span>
                    </div>
                    <div className="dropdown-divider"></div>
                    <Link 
                      to="/dashboard" 
                      className="dropdown-item"
                      onClick={() => setShowDropdown(false)}
                    >
                      <User size={16} />
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
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-secondary" onClick={closeMenu}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary" onClick={closeMenu}>
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
