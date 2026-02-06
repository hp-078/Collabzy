import { useState, useEffect } from 'react';
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
  Calendar,
  Loader
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { user, isInfluencer, isBrand, isAdmin } = useAuth();
  const {
    influencers,
    applications,
    campaigns,
    deals,
    loading,
    error,
    fetchInfluencers,
    fetchMyApplications,
    fetchMyCampaigns,
    fetchMyDeals
  } = useData();
  const [localLoading, setLocalLoading] = useState(true);
  const [myCampaigns, setMyCampaigns] = useState([]);

  // Fetch data on mount - different data based on role
  useEffect(() => {
    const loadData = async () => {
      setLocalLoading(true);
      try {
        if (isInfluencer) {
          await fetchMyApplications();
          await fetchMyDeals();
        } else if (isBrand) {
          const campaignsData = await fetchMyCampaigns();
          setMyCampaigns(campaignsData || []);
          await fetchMyDeals();
        }
        await fetchInfluencers();
      } catch (err) {
        console.error('Dashboard load error:', err);
      }
      setLocalLoading(false);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute stats from actual data
  const pendingApps = applications.filter(a => a.status === 'pending');
  const activeApps = applications.filter(a => a.status === 'shortlisted' || a.status === 'accepted');
  const completedApps = applications.filter(a => a.status === 'accepted');
  const activeDeals = deals.filter(d => d.status === 'in_progress' || d.status === 'confirmed');
  const completedDeals = deals.filter(d => d.status === 'completed');

  const stats = isInfluencer ? [
    { icon: <Briefcase size={24} />, label: 'Active Deals', value: activeDeals.length, color: 'primary' },
    { icon: <Clock size={24} />, label: 'Pending Apps', value: pendingApps.length, color: 'warning' },
    { icon: <CheckCircle size={24} />, label: 'Completed', value: completedDeals.length, color: 'success' },
    { icon: <TrendingUp size={24} />, label: 'Total Applied', value: applications.length, color: 'info' },
  ] : isBrand ? [
    { icon: <Briefcase size={24} />, label: 'My Campaigns', value: myCampaigns.length, color: 'primary' },
    { icon: <Clock size={24} />, label: 'Active Deals', value: activeDeals.length, color: 'warning' },
    { icon: <CheckCircle size={24} />, label: 'Completed', value: completedDeals.length, color: 'success' },
    { icon: <Users size={24} />, label: 'Influencers', value: influencers.length, color: 'info' },
  ] : [
    { icon: <Users size={24} />, label: 'Influencers', value: influencers.length, color: 'primary' },
    { icon: <Briefcase size={24} />, label: 'Campaigns', value: campaigns.length, color: 'warning' },
    { icon: <CheckCircle size={24} />, label: 'Total Apps', value: applications.length, color: 'success' },
    { icon: <TrendingUp size={24} />, label: 'Active', value: activeDeals.length, color: 'info' },
  ];

  // Show loading state
  if (loading || localLoading) {
    return (
      <div className="dash-page">
        <div className="dash-container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '1rem'
        }}>
          <Loader size={48} className="spin-animation" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-page">
      <div className="dash-container">
        {/* Error Message */}
        {error && (
          <div style={{
            background: '#fee',
            color: '#c33',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

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
            {/* Recent Applications (Influencer) or Campaigns (Brand) */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h2>{isInfluencer ? 'Recent Applications' : isBrand ? 'My Campaigns' : 'Recent Activity'}</h2>
                <Link to="/collaborations" className="dash-view-all">
                  View All <ArrowRight size={16} />
                </Link>
              </div>
              <div className="dash-card-body">
                {isInfluencer && applications.length > 0 ? (
                  <div className="dash-collab-list">
                    {applications.slice(0, 5).map((app) => (
                      <div key={app._id} className="dash-collab-item">
                        <div className="dash-collab-info">
                          <h4>{app.campaign?.title || 'Campaign'}</h4>
                          <p>{app.campaign?.brandProfile?.companyName || 'Brand'}</p>
                        </div>
                        <div className="dash-collab-meta">
                          <span className={`dash-status-badge dash-status-${app.status}`}>
                            {app.status}
                          </span>
                          <span className="dash-collab-budget">
                            <DollarSign size={14} />
                            {app.proposedRate || app.campaign?.budget?.min || 'N/A'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : isBrand && myCampaigns.length > 0 ? (
                  <div className="dash-collab-list">
                    {myCampaigns.slice(0, 5).map((campaign) => (
                      <div key={campaign._id} className="dash-collab-item">
                        <div className="dash-collab-info">
                          <h4>{campaign.title}</h4>
                          <p>{campaign.applicationCount || 0} applications</p>
                        </div>
                        <div className="dash-collab-meta">
                          <span className={`dash-status-badge dash-status-${campaign.status}`}>
                            {campaign.status}
                          </span>
                          <span className="dash-collab-budget">
                            <DollarSign size={14} />
                            {campaign.budget?.min || 0} - {campaign.budget?.max || 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dash-empty-state">
                    <Briefcase size={40} />
                    <p>{isInfluencer ? 'No applications yet' : 'No campaigns yet'}</p>
                    {isBrand && (
                      <Link to="/influencers" className="btn btn-primary btn-sm">
                        Find Influencers
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Pending Actions for Influencer */}
            {isInfluencer && pendingApps.length > 0 && (
              <div className="dash-card">
                <div className="dash-card-header">
                  <h2>Pending Applications</h2>
                  <span className="dash-pending-count">{pendingApps.length}</span>
                </div>
                <div className="dash-card-body">
                  <div className="dash-collab-list">
                    {pendingApps.slice(0, 3).map((app) => (
                      <div key={app._id} className="dash-collab-item dash-pending">
                        <div className="dash-collab-info">
                          <h4>{app.campaign?.title || 'Campaign'}</h4>
                          <p>{app.campaign?.brandProfile?.companyName || 'Brand'} &bull; ${app.proposedRate || 0}</p>
                        </div>
                        <div className="dash-collab-actions">
                          <Link to="/collaborations" className="btn btn-primary btn-sm">View</Link>
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
                    <span className="dash-value">{applications.length}</span>
                    <span className="dash-label">Applications</span>
                  </div>
                  <div className="dash-profile-stat">
                    <span className="dash-value">{completedDeals.length}</span>
                    <span className="dash-label">Completed</span>
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
              {isInfluencer && activeApps.length > 0 ? (
                <div className="dash-deadline-list">
                  {activeApps.slice(0, 3).map((app) => (
                    <div key={app._id} className="dash-deadline-item">
                      <Calendar size={16} />
                      <div>
                        <p className="dash-deadline-title">{app.campaign?.title || 'Campaign'}</p>
                        <p className="dash-deadline-date">{app.campaign?.deadline ? new Date(app.campaign.deadline).toLocaleDateString() : 'No deadline set'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : isBrand && myCampaigns.length > 0 ? (
                <div className="dash-deadline-list">
                  {myCampaigns.filter(c => c.deadline).slice(0, 3).map((campaign) => (
                    <div key={campaign._id} className="dash-deadline-item">
                      <Calendar size={16} />
                      <div>
                        <p className="dash-deadline-title">{campaign.title}</p>
                        <p className="dash-deadline-date">{new Date(campaign.deadline).toLocaleDateString()}</p>
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
