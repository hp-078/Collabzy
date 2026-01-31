import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Users,
  Briefcase,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  ArrowRight,
  Star,
  Calendar
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { user, isInfluencer, isBrand, isAdmin } = useAuth();
  const { influencers, brands, collaborations, messages } = useData();

  // Get user-specific data
  const userCollabs = collaborations.filter(c => 
    isInfluencer ? c.influencerId === user?.id : c.brandId === user?.id
  );
  const userMessages = messages.filter(m => 
    m.senderId === user?.id || m.receiverId === user?.id
  );

  const pendingCollabs = userCollabs.filter(c => c.status === 'pending');
  const activeCollabs = userCollabs.filter(c => c.status === 'active');
  const completedCollabs = userCollabs.filter(c => c.status === 'completed');

  const stats = isInfluencer ? [
    { icon: <Briefcase size={24} />, label: 'Active Collabs', value: activeCollabs.length, color: 'primary' },
    { icon: <Clock size={24} />, label: 'Pending Requests', value: pendingCollabs.length, color: 'warning' },
    { icon: <CheckCircle size={24} />, label: 'Completed', value: completedCollabs.length, color: 'success' },
    { icon: <MessageSquare size={24} />, label: 'Messages', value: userMessages.length, color: 'info' },
  ] : isBrand ? [
    { icon: <Briefcase size={24} />, label: 'Active Collabs', value: activeCollabs.length, color: 'primary' },
    { icon: <Clock size={24} />, label: 'Pending', value: pendingCollabs.length, color: 'warning' },
    { icon: <CheckCircle size={24} />, label: 'Completed', value: completedCollabs.length, color: 'success' },
    { icon: <Users size={24} />, label: 'Influencers', value: influencers.length, color: 'info' },
  ] : [
    { icon: <Users size={24} />, label: 'Influencers', value: influencers.length, color: 'primary' },
    { icon: <Briefcase size={24} />, label: 'Brands', value: brands.length, color: 'warning' },
    { icon: <CheckCircle size={24} />, label: 'Total Collabs', value: collaborations.length, color: 'success' },
    { icon: <TrendingUp size={24} />, label: 'Active', value: collaborations.filter(c => c.status === 'active').length, color: 'info' },
  ];

  return (
    <div className="dash-page">
      <div className="dash-container">
        {/* Welcome Section */}
        <div className="dash-welcome-section">
          <div className="dash-welcome-content">
            <h1>Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
            <p>Here's what's happening with your collaborations today.</p>
          </div>
          <div className="dash-welcome-actions">
            {isInfluencer && (
              <Link to="/profile" className="btn btn-primary">
                Edit Profile
              </Link>
            )}
            {isBrand && (
              <Link to="/influencers" className="btn btn-primary">
                Find Influencers
              </Link>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="dash-stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className={`dash-stat-card dash-stat-${stat.color}`}>
              <div className="dash-stat-icon">{stat.icon}</div>
              <div className="dash-stat-info">
                <span className="dash-stat-value">{stat.value}</span>
                <span className="dash-stat-label">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="dash-content">
          <div className="dash-content-main">
            {/* Recent Collaborations */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h2>Recent Collaborations</h2>
                <Link to="/collaborations" className="dash-view-all">
                  View All <ArrowRight size={16} />
                </Link>
              </div>
              <div className="dash-card-body">
                {userCollabs.length > 0 ? (
                  <div className="dash-collab-list">
                    {userCollabs.slice(0, 5).map((collab) => (
                      <div key={collab.id} className="dash-collab-item">
                        <div className="dash-collab-info">
                          <h4>{isInfluencer ? collab.brandName : collab.influencerName}</h4>
                          <p>{collab.service}</p>
                        </div>
                        <div className="dash-collab-meta">
                          <span className={`dash-status-badge dash-status-${collab.status}`}>
                            {collab.status}
                          </span>
                          <span className="dash-collab-budget">
                            <DollarSign size={14} />
                            {collab.budget}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dash-empty-state">
                    <Briefcase size={40} />
                    <p>No collaborations yet</p>
                    {isBrand && (
                      <Link to="/influencers" className="btn btn-primary btn-sm">
                        Find Influencers
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Pending Actions */}
            {pendingCollabs.length > 0 && isInfluencer && (
              <div className="dash-card">
                <div className="dash-card-header">
                  <h2>Pending Requests</h2>
                  <span className="dash-pending-count">{pendingCollabs.length}</span>
                </div>
                <div className="dash-card-body">
                  <div className="dash-collab-list">
                    {pendingCollabs.slice(0, 3).map((collab) => (
                      <div key={collab.id} className="dash-collab-item dash-pending">
                        <div className="dash-collab-info">
                          <h4>{collab.brandName}</h4>
                          <p>{collab.service} • ${collab.budget}</p>
                        </div>
                        <div className="dash-collab-actions">
                          <button className="btn btn-primary btn-sm">Accept</button>
                          <button className="btn btn-secondary btn-sm">Decline</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="dash-content-sidebar">
            {/* Profile Card */}
            <div className="dash-profile-card">
              <div className="dash-profile-header">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="dash-profile-avatar" />
                ) : (
                  <div className="dash-profile-avatar-placeholder">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <h3>{user?.name}</h3>
                <p className="dash-profile-role">{user?.role}</p>
              </div>
              {isInfluencer && (
                <div className="dash-profile-stats">
                  <div className="dash-profile-stat">
                    <span className="dash-value">{user?.followers || '0'}</span>
                    <span className="dash-label">Followers</span>
                  </div>
                  <div className="dash-profile-stat">
                    <span className="dash-value">{user?.rating || '0'}</span>
                    <span className="dash-label">Rating</span>
                  </div>
                </div>
              )}
              <Link to="/profile" className="btn btn-secondary">
                View Profile
              </Link>
            </div>

            {/* Quick Links */}
            <div className="dash-quick-links-card">
              <h3>Quick Links</h3>
              <div className="dash-quick-links">
                <Link to="/collaborations" className="dash-quick-link">
                  <Briefcase size={20} />
                  <span>Collaborations</span>
                </Link>
                <Link to="/messages" className="dash-quick-link">
                  <MessageSquare size={20} />
                  <span>Messages</span>
                </Link>
                {isBrand && (
                  <Link to="/influencers" className="dash-quick-link">
                    <Users size={20} />
                    <span>Find Influencers</span>
                  </Link>
                )}
                <Link to="/profile" className="dash-quick-link">
                  <Star size={20} />
                  <span>Settings</span>
                </Link>
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="dash-deadlines-card">
              <h3>Upcoming Deadlines</h3>
              {activeCollabs.length > 0 ? (
                <div className="dash-deadline-list">
                  {activeCollabs.slice(0, 3).map((collab) => (
                    <div key={collab.id} className="dash-deadline-item">
                      <Calendar size={16} />
                      <div>
                        <p className="dash-deadline-title">{collab.service}</p>
                        <p className="dash-deadline-date">{collab.deadline || 'No deadline set'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="dash-no-deadlines">No upcoming deadlines</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
