import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Users, Briefcase, TrendingUp, Activity, Eye,
  Search, RefreshCw, BarChart3, Megaphone, DollarSign,
  CheckCircle, Clock, XCircle, Star, Loader, AlertTriangle,
  Zap, Award, Globe
} from 'lucide-react';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user, isAdmin } = useAuth();
  const { influencers, campaigns, fetchInfluencers, fetchCampaigns } = useData();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [allInfluencers, setAllInfluencers] = useState([]);
  const [allCampaigns, setAllCampaigns] = useState([]);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [infls, camps] = await Promise.all([
        fetchInfluencers({}, true),
        fetchCampaigns({}, true),
      ]);
      setAllInfluencers(infls || []);
      setAllCampaigns(camps || []);
    } catch (err) {
      console.error('Admin load error:', err);
    }
    setLoading(false);
  };

  // Platform stats
  const totalInfluencers = allInfluencers.length;
  const totalCampaigns = allCampaigns.length;
  const activeCampaigns = allCampaigns.filter(c => c.status === 'active').length;
  const completedCampaigns = allCampaigns.filter(c => c.status === 'completed').length;
  const totalBudget = allCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
  const avgBudget = totalCampaigns > 0 ? Math.round(totalBudget / totalCampaigns) : 0;
  const verifiedInfluencers = allInfluencers.filter(i => i.isVerified).length;
  const totalFollowers = allInfluencers.reduce((sum, i) => sum + (i.totalFollowers || 0), 0);

  // Category distribution
  const categoryMap = {};
  allCampaigns.forEach(c => {
    const cat = c.category || 'Other';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const topCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Platform distribution
  const platformMap = {};
  allInfluencers.forEach(i => {
    (i.platforms || []).forEach(p => {
      platformMap[p] = (platformMap[p] || 0) + 1;
    });
  });

  // Filter
  const filteredInfluencers = allInfluencers.filter(i =>
    (i.user?.name || i.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.niche || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCampaigns = allCampaigns.filter(c =>
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdmin) return null;

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">
          <div className="admin-loading-spinner">
            <Loader size={40} className="animate-spin" />
          </div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
    { id: 'influencers', label: 'Influencers', icon: <Users size={16} /> },
    { id: 'campaigns', label: 'Campaigns', icon: <Megaphone size={16} /> },
  ];

  return (
    <div className="admin-page">
      <div className="admin-container">
        {/* Header */}
        <div className="admin-header">
          <div className="admin-header-content">
            <div className="admin-header-icon">
              <Shield size={28} />
            </div>
            <div>
              <h1>Admin Panel</h1>
              <p>Platform management & analytics overview</p>
            </div>
          </div>
          <button className="admin-refresh-btn" onClick={loadData}>
            <RefreshCw size={16} />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="admin-overview">
            {/* Platform Stats */}
            <div className="admin-stats-grid">
              <AdminStatCard
                icon={<Users size={24} />}
                label="Total Influencers"
                value={totalInfluencers}
                sub={`${verifiedInfluencers} verified`}
                gradient="mint"
              />
              <AdminStatCard
                icon={<Megaphone size={24} />}
                label="Total Campaigns"
                value={totalCampaigns}
                sub={`${activeCampaigns} active`}
                gradient="sky"
              />
              <AdminStatCard
                icon={<DollarSign size={24} />}
                label="Total Budget"
                value={`$${totalBudget.toLocaleString()}`}
                sub={`$${avgBudget} avg`}
                gradient="lavender"
              />
              <AdminStatCard
                icon={<Globe size={24} />}
                label="Total Reach"
                value={formatNumber(totalFollowers)}
                sub="combined followers"
                gradient="peach"
              />
            </div>

            {/* Charts Row */}
            <div className="admin-charts-row">
              {/* Campaign Status Breakdown */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3><Activity size={18} /> Campaign Status</h3>
                </div>
                <div className="admin-status-bars">
                  <StatusBar label="Active" count={activeCampaigns} total={totalCampaigns} color="#98D8AA" />
                  <StatusBar label="Completed" count={completedCampaigns} total={totalCampaigns} color="#87CEEB" />
                  <StatusBar label="Draft" count={allCampaigns.filter(c => c.status === 'draft').length} total={totalCampaigns} color="#FFD686" />
                  <StatusBar label="Paused" count={allCampaigns.filter(c => c.status === 'paused').length} total={totalCampaigns} color="#FF9B9B" />
                </div>
              </div>

              {/* Top Categories */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3><Zap size={18} /> Top Categories</h3>
                </div>
                <div className="admin-categories-list">
                  {topCategories.length > 0 ? topCategories.map(([cat, count], i) => (
                    <div key={cat} className="admin-category-item">
                      <div className="admin-category-rank">#{i + 1}</div>
                      <div className="admin-category-info">
                        <span className="admin-category-name">{cat}</span>
                        <div className="admin-category-bar-bg">
                          <div
                            className="admin-category-bar-fill"
                            style={{ width: `${(count / (topCategories[0]?.[1] || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="admin-category-count">{count}</span>
                    </div>
                  )) : (
                    <div className="admin-empty">
                      <Briefcase size={32} />
                      <p>No campaigns yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="admin-card">
              <div className="admin-card-header">
                <h3><Clock size={18} /> Recent Campaigns</h3>
                <button className="admin-view-all" onClick={() => setActiveTab('campaigns')}>View All</button>
              </div>
              <div className="admin-recent-list">
                {allCampaigns.slice(0, 5).map((camp, i) => (
                  <div key={camp._id || i} className="admin-recent-item">
                    <div className={`admin-recent-icon admin-icon-${camp.status}`}>
                      {camp.status === 'active' ? <CheckCircle size={16} /> :
                       camp.status === 'completed' ? <Award size={16} /> :
                       <Clock size={16} />}
                    </div>
                    <div className="admin-recent-info">
                      <p className="admin-recent-title">{camp.title}</p>
                      <p className="admin-recent-sub">
                        {camp.brandProfile?.companyName || 'Brand'} &bull; {camp.category || 'General'} &bull; ${camp.budget || 0}
                      </p>
                    </div>
                    <span className={`admin-status-badge admin-badge-${camp.status}`}>{camp.status}</span>
                  </div>
                ))}
                {allCampaigns.length === 0 && (
                  <div className="admin-empty">
                    <Megaphone size={32} />
                    <p>No campaigns found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Influencers Tab */}
        {activeTab === 'influencers' && (
          <div className="admin-list-section">
            <div className="admin-list-toolbar">
              <div className="admin-search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search influencers by name or niche..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <span className="admin-result-count">{filteredInfluencers.length} influencers</span>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Influencer</th>
                    <th>Niche</th>
                    <th>Followers</th>
                    <th>Rating</th>
                    <th>Platforms</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInfluencers.map((inf, i) => (
                    <tr key={inf._id || i} onClick={() => navigate(`/influencer/${inf._id}`)}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-user-avatar">
                            {inf.user?.avatar ? (
                              <img src={inf.user.avatar} alt="" />
                            ) : (
                              <span>{(inf.user?.name || inf.name || 'U').charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <p className="admin-user-name">{inf.user?.name || inf.name || 'Unknown'}</p>
                            <p className="admin-user-email">{inf.user?.email || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className="admin-niche-tag">{inf.niche || 'N/A'}</span></td>
                      <td className="admin-num">{formatNumber(inf.totalFollowers || 0)}</td>
                      <td>
                        <div className="admin-rating-cell">
                          <Star size={14} fill="#FFD686" stroke="#FFD686" />
                          <span>{inf.averageRating?.toFixed(1) || '0.0'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="admin-platforms-cell">
                          {(inf.platforms || []).slice(0, 3).map((p, idx) => (
                            <span key={idx} className="admin-platform-tag">{p}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`admin-status-badge ${inf.isVerified ? 'admin-badge-active' : 'admin-badge-draft'}`}>
                          {inf.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredInfluencers.length === 0 && (
                <div className="admin-empty">
                  <Users size={40} />
                  <p>No influencers found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="admin-list-section">
            <div className="admin-list-toolbar">
              <div className="admin-search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search campaigns by title or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <span className="admin-result-count">{filteredCampaigns.length} campaigns</span>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Brand</th>
                    <th>Category</th>
                    <th>Budget</th>
                    <th>Applicants</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((camp, i) => (
                    <tr key={camp._id || i} onClick={() => navigate(`/campaigns/${camp._id}`)}>
                      <td>
                        <p className="admin-campaign-title">{camp.title}</p>
                        <p className="admin-campaign-sub">{camp.platformType || 'Any platform'}</p>
                      </td>
                      <td>{camp.brandProfile?.companyName || 'N/A'}</td>
                      <td><span className="admin-niche-tag">{camp.category || 'General'}</span></td>
                      <td className="admin-num">${(camp.budget || 0).toLocaleString()}</td>
                      <td className="admin-num">{camp.applicationCount || 0}</td>
                      <td>
                        <span className={`admin-status-badge admin-badge-${camp.status}`}>
                          {camp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCampaigns.length === 0 && (
                <div className="admin-empty">
                  <Megaphone size={40} />
                  <p>No campaigns found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* Stat Card */
const AdminStatCard = ({ icon, label, value, sub, gradient }) => (
  <div className={`admin-stat-card admin-gradient-${gradient}`}>
    <div className="admin-stat-icon">{icon}</div>
    <div className="admin-stat-content">
      <span className="admin-stat-value">{value}</span>
      <span className="admin-stat-label">{label}</span>
    </div>
    <span className="admin-stat-sub">{sub}</span>
  </div>
);

/* Status Bar */
const StatusBar = ({ label, count, total, color }) => {
  const pct = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
  return (
    <div className="admin-status-row">
      <div className="admin-status-info">
        <span className="admin-status-dot" style={{ background: color }} />
        <span className="admin-status-label">{label}</span>
      </div>
      <div className="admin-status-bar-bg">
        <div className="admin-status-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="admin-status-count">{count} ({pct}%)</span>
    </div>
  );
};

/* Format number */
const formatNumber = (num) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export default AdminPanel;
