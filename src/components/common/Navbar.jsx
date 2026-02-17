import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import notificationService from '../../services/notification.service';
import messageService from '../../services/message.service';
import socketService from '../../services/socket.service';
import { 
  Menu, 
  X, 
  LogOut, 
  Settings, 
  MessageSquare, 
  Briefcase,
  Home,
  Users,
    Bell,
    ArrowUpRight,
    Sparkles,
    LayoutDashboard,
    Megaphone,
    CheckCheck,
    BarChart3,
    Shield,
    Sun,
    Moon
} from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
    const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const notifRef = useRef(null);
    const { user, logout, isAuthenticated, isInfluencer, isBrand, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (location.pathname !== '/') {
            setActiveSection('');
            return;
        }

        const observerOptions = {
            root: null,
            rootMargin: '-10% 0px -70% 0px',
            threshold: 0
        };

        const observerCallback = (entries) => {
            // Sort entries by their position on the page
            const sortedEntries = entries.sort((a, b) => {
                return a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top;
            });

            // Find the first intersecting entry (topmost on screen)
            const activeEntry = sortedEntries.find(entry => entry.isIntersecting);
            
            if (activeEntry) {
                setActiveSection(activeEntry.target.id);
            }
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);
        const sections = ['hero', 'how-it-works', 'top-brands', 'top-influencers'];
        
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [location.pathname]);

  // Fetch notification count + message count
  const fetchCounts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [notifRes, msgRes] = await Promise.all([
        notificationService.getUnreadCount().catch(() => ({ data: { unreadCount: 0 } })),
        messageService.getUnreadCount().catch(() => ({ data: { unreadCount: 0 } })),
      ]);
      setUnreadNotifCount(notifRes.data?.unreadCount ?? 0);
      setUnreadMsgCount(msgRes.data?.unreadCount ?? 0);
    } catch (e) {
      console.error('Failed to fetch counts', e);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCounts();
    // Poll as a fallback only — real-time updates come via sockets
    const interval = setInterval(fetchCounts, 120000); // refresh every 2 min (fallback)
    return () => clearInterval(interval);
  }, [fetchCounts]);

  // Listen for real-time notifications via socket
  useEffect(() => {
    if (!isAuthenticated || !socketService.socket) return;
    const notifHandler = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadNotifCount(prev => prev + 1);
    };
    // Real-time message count: increment badge when a new message arrives
    const msgHandler = () => {
      // Only increment if user is NOT on the messages page
      if (!window.location.pathname.startsWith('/messages')) {
        setUnreadMsgCount(prev => prev + 1);
      }
    };
    socketService.socket.on('notification:new', notifHandler);
    socketService.socket.on('message:receive', msgHandler);
    return () => {
      socketService.socket?.off('notification:new', notifHandler);
      socketService.socket?.off('message:receive', msgHandler);
    };
  }, [isAuthenticated]);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load notifications when dropdown opens
  const toggleNotifications = async () => {
    const willShow = !showNotifications;
    setShowNotifications(willShow);
    if (willShow && isAuthenticated) {
      try {
        const res = await notificationService.getNotifications(1, 15);
        setNotifications(res.data || []);
      } catch (e) {
        console.error('Failed to load notifications', e);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadNotifCount(0);
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  };

  const handleMarkOneRead = async (notifId) => {
    try {
      await notificationService.markAsRead(notifId);
      setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, isRead: true } : n));
      setUnreadNotifCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  };

  const handleDeleteNotif = async (notifId) => {
    try {
      await notificationService.deleteNotification(notifId);
      const wasUnread = notifications.find(n => n._id === notifId && !n.isRead);
      setNotifications(prev => prev.filter(n => n._id !== notifId));
      if (wasUnread) setUnreadNotifCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Failed to delete notification', e);
    }
  };

  const getTimeSince = (date) => {
    if (!date) return '';
    const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (secs < 60) return 'just now';
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowDropdown(false);
  };

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const isActive = (path) => location.pathname === path;

  const scrollToSection = (sectionId) => {
    closeMenu();
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleHomeClick = () => {
    closeMenu();
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById('hero');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      const element = document.getElementById('hero');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

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
                              className={`nav-pill ${activeSection === 'hero' ? 'nav-active' : ''}`}
                              onClick={handleHomeClick}
                          >
                              <Home size={16} />
                              <span>Home</span>
                          </Link>
                          {!isAuthenticated && (
                              <>
                                  <button
                                      className={`nav-pill ${activeSection === 'how-it-works' ? 'nav-active' : ''}`}
                                      onClick={() => scrollToSection('how-it-works')}
                                  >
                                      <Sparkles size={16} />
                                      <span>How it Works</span>
                                  </button>
                                  <button
                                      className={`nav-pill ${activeSection === 'top-brands' ? 'nav-active' : ''}`}
                                      onClick={() => scrollToSection('top-brands')}
                                  >
                                      <Briefcase size={16} />
                                      <span>Top Brands</span>
                                  </button>
                                  <button
                                      className={`nav-pill ${activeSection === 'top-influencers' ? 'nav-active' : ''}`}
                                      onClick={() => scrollToSection('top-influencers')}
                                  >
                                      <Users size={16} />
                                      <span>Top Influencers</span>
                                  </button>
                              </>
                          )}
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
                                      to="/campaigns"
                                      className={`nav-pill ${isActive('/campaigns') ? 'nav-active' : ''}`}
                                      onClick={closeMenu}
                                  >
                                      <Megaphone size={16} />
                                      <span>Campaigns</span>
                                  </Link>
                                  <Link 
                                      to="/collaborations"
                                      className={`nav-pill ${isActive('/collaborations') ? 'nav-active' : ''}`}
                                      onClick={closeMenu}
                                  >
                                      <Briefcase size={16} />
                                      <span>Collaborations</span>
                                  </Link>
                                  {isBrand && (
                                      <Link 
                                          to="/influencers"
                                          className={`nav-pill ${isActive('/influencers') ? 'nav-active' : ''}`}
                                          onClick={closeMenu}
                                      >
                                          <Users size={16} />
                                          <span>Influencers</span>
                                      </Link>
                                  )}
                                  <Link 
                                      to="/analytics"
                                      className={`nav-pill ${isActive('/analytics') ? 'nav-active' : ''}`}
                                      onClick={closeMenu}
                                  >
                                      <BarChart3 size={16} />
                                      <span>Analytics</span>
                                  </Link>
                              </>
                          )}
                      </div>
                  </div>

                  {/* Right Actions */}
          <div className="nav-actions">
            {/* Dark Mode Toggle */}
            <button 
              className="nav-theme-toggle" 
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              <span className="nav-theme-icon-wrapper">
                <Sun size={16} className={`nav-theme-icon nav-theme-sun ${!isDark ? 'nav-theme-active' : ''}`} />
                <Moon size={16} className={`nav-theme-icon nav-theme-moon ${isDark ? 'nav-theme-active' : ''}`} />
              </span>
            </button>

            {isAuthenticated ? (
                          <div className="nav-user-section">
                              <Link to="/messages" className="nav-icon-btn nav-messages-btn">
                                  <MessageSquare size={18} />
                                  {unreadMsgCount > 0 && <span className="nav-badge">{unreadMsgCount > 9 ? '9+' : unreadMsgCount}</span>}
                              </Link>
                              <div className="nav-notif-wrapper" ref={notifRef}>
                                <button className="nav-icon-btn nav-notification-btn" onClick={toggleNotifications}>
                                    <Bell size={18} />
                                    {unreadNotifCount > 0 && <span className="nav-badge">{unreadNotifCount > 9 ? '9+' : unreadNotifCount}</span>}
                                </button>
                                {showNotifications && (
                                  <div className="nav-notif-dropdown">
                                    <div className="nav-notif-header">
                                      <span className="nav-notif-title">Notifications</span>
                                      {unreadNotifCount > 0 && (
                                        <button className="nav-notif-mark-all" onClick={handleMarkAllRead}>
                                          <CheckCheck size={14} /> Mark all read
                                        </button>
                                      )}
                                    </div>
                                    <div className="nav-notif-list">
                                      {notifications.length === 0 ? (
                                        <div className="nav-notif-empty">
                                          <Bell size={24} style={{ opacity: 0.3 }} />
                                          <p>No notifications yet</p>
                                        </div>
                                      ) : (
                                        notifications.map(n => (
                                          <div key={n._id} className={`nav-notif-item ${!n.isRead ? 'nav-notif-unread' : ''}`}
                                            onClick={() => { if (!n.isRead) handleMarkOneRead(n._id); if (n.actionUrl) { navigate(n.actionUrl); setShowNotifications(false); } }}>
                                            <div className="nav-notif-content">
                                              <span className="nav-notif-text">{n.title || n.message}</span>
                                              {n.message && n.title && <span className="nav-notif-sub">{n.message}</span>}
                                              <span className="nav-notif-time">{getTimeSince(n.createdAt)}</span>
                                            </div>
                                            <button className="nav-notif-del" onClick={(e) => { e.stopPropagation(); handleDeleteNotif(n._id); }}>
                                              <X size={14} />
                                            </button>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
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
                      to="/analytics" 
                      className="nav-dropdown-item"
                      onClick={() => setShowDropdown(false)}
                    >
                      <BarChart3 size={16} />
                      <span>Analytics</span>
                    </Link>
                    <Link 
                      to="/profile" 
                      className="nav-dropdown-item"
                      onClick={() => setShowDropdown(false)}
                    >
                      <Settings size={16} />
                      <span>Settings</span>
                    </Link>
                    {isAdmin && (
                      <Link 
                        to="/admin" 
                        className="nav-dropdown-item"
                        onClick={() => setShowDropdown(false)}
                      >
                        <Shield size={16} />
                        <span>Admin Panel</span>
                      </Link>
                    )}
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
                              to="/campaigns"
                              className={`nav-mobile-item ${isActive('/campaigns') ? 'nav-active' : ''}`}
                              onClick={closeMenu}
                          >
                              <Megaphone size={20} />
                              <span>Campaigns</span>
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
                          <Link
                              to="/analytics"
                              className={`nav-mobile-item ${isActive('/analytics') ? 'nav-active' : ''}`}
                              onClick={closeMenu}
                          >
                              <BarChart3 size={20} />
                              <span>Analytics</span>
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
