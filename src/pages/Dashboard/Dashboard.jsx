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
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-content">
            <h1>Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
            <p>Here's what's happening with your collaborations today.</p>
          </div>
          <div className="welcome-actions">
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
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className={`stat-card stat-${stat.color}`}>
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-info">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="dashboard-content">
          <div className="content-main">
            {/* Recent Collaborations */}
            <div className="dashboard-card">
              <div className="card-header">
                <h2>Recent Collaborations</h2>
                <Link to="/collaborations" className="view-all">
                  View All <ArrowRight size={16} />
                </Link>
              </div>
              <div className="card-body">
                {userCollabs.length > 0 ? (
                  <div className="collab-list">
                    {userCollabs.slice(0, 5).map((collab) => (
                      <div key={collab.id} className="collab-item">
                        <div className="collab-info">
                          <h4>{isInfluencer ? collab.brandName : collab.influencerName}</h4>
                          <p>{collab.service}</p>
                        </div>
                        <div className="collab-meta">
                          <span className={`status-badge status-${collab.status}`}>
                            {collab.status}
                          </span>
                          <span className="collab-budget">
                            <DollarSign size={14} />
                            {collab.budget}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
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
              <div className="dashboard-card">
                <div className="card-header">
                  <h2>Pending Requests</h2>
                  <span className="pending-count">{pendingCollabs.length}</span>
                </div>
                <div className="card-body">
                  <div className="collab-list">
                    {pendingCollabs.slice(0, 3).map((collab) => (
                      <div key={collab.id} className="collab-item pending">
                        <div className="collab-info">
                          <h4>{collab.brandName}</h4>
                          <p>{collab.service} • ${collab.budget}</p>
                        </div>
                        <div className="collab-actions">
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

          <div className="content-sidebar">
            {/* Profile Card */}
            <div className="profile-card">
              <div className="profile-header">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="profile-avatar" />
                ) : (
                  <div className="profile-avatar-placeholder">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <h3>{user?.name}</h3>
                <p className="profile-role">{user?.role}</p>
              </div>
              {isInfluencer && (
                <div className="profile-stats">
                  <div className="profile-stat">
                    <span className="value">{user?.followers || '0'}</span>
                    <span className="label">Followers</span>
                  </div>
                  <div className="profile-stat">
                    <span className="value">{user?.rating || '0'}</span>
                    <span className="label">Rating</span>
                  </div>
                </div>
              )}
              <Link to="/profile" className="btn btn-secondary">
                View Profile
              </Link>
            </div>

            {/* Quick Links */}
            <div className="quick-links-card">
              <h3>Quick Links</h3>
              <div className="quick-links">
                <Link to="/collaborations" className="quick-link">
                  <Briefcase size={20} />
                  <span>Collaborations</span>
                </Link>
                <Link to="/messages" className="quick-link">
                  <MessageSquare size={20} />
                  <span>Messages</span>
                </Link>
                {isBrand && (
                  <Link to="/influencers" className="quick-link">
                    <Users size={20} />
                    <span>Find Influencers</span>
                  </Link>
                )}
                <Link to="/profile" className="quick-link">
                  <Star size={20} />
                  <span>Settings</span>
                </Link>
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="deadlines-card">
              <h3>Upcoming Deadlines</h3>
              {activeCollabs.length > 0 ? (
                <div className="deadline-list">
                  {activeCollabs.slice(0, 3).map((collab) => (
                    <div key={collab.id} className="deadline-item">
                      <Calendar size={16} />
                      <div>
                        <p className="deadline-title">{collab.service}</p>
                        <p className="deadline-date">{collab.deadline || 'No deadline set'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-deadlines">No upcoming deadlines</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
