import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  MessageSquare,
  Filter,
  Search,
  Loader,
  Eye
} from 'lucide-react';
import './Collaborations.css';

const Collaborations = () => {
  const { user, isInfluencer, isBrand } = useAuth();
  const {
    applications,
    loading,
    error,
    fetchMyApplications,
    fetchMyCampaigns,
    fetchCampaignApplications,
    updateApplicationStatus
  } = useData();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [localLoading, setLocalLoading] = useState(true);
  const [brandApplications, setBrandApplications] = useState([]);

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      setLocalLoading(true);
      if (isInfluencer) {
        await fetchMyApplications();
      } else if (isBrand) {
        // Brands: get their campaigns, then fetch applications for each
        const campaigns = await fetchMyCampaigns();
        if (campaigns && campaigns.length > 0) {
          const allApps = [];
          for (const campaign of campaigns) {
            const apps = await fetchCampaignApplications(campaign._id);
            // Attach campaign info to each application
            allApps.push(...apps.map(app => ({ ...app, campaign: app.campaign || campaign })));
          }
          setBrandApplications(allApps);
        }
      }
      setLocalLoading(false);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Use the right data source based on role
  const items = isInfluencer ? applications : brandApplications;

  const filteredItems = items.filter(app => {
    // Status filter
    let matchesFilter = filter === 'all';
    if (filter === 'pending') matchesFilter = app.status === 'pending' || app.status === 'reviewed';
    else if (filter === 'active') matchesFilter = app.status === 'shortlisted' || app.status === 'accepted';
    else if (filter === 'completed') matchesFilter = app.status === 'accepted';
    else if (filter === 'rejected') matchesFilter = app.status === 'rejected' || app.status === 'withdrawn';
    else if (filter === 'all') matchesFilter = true;

    // Search filter
    const campaignTitle = app.campaign?.title || '';
    const brandName = app.campaign?.brandProfile?.companyName || '';
    const influencerName = app.influencer?.name || app.influencerProfile?.name || '';
    const matchesSearch = !searchTerm ||
      campaignTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      influencerName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleStatusChange = async (appId, newStatus) => {
    const result = await updateApplicationStatus(appId, newStatus);
    if (result.success) {
      // Refresh data
      if (isInfluencer) {
        fetchMyApplications({}, true);
      } else {
        // Reload brand applications
        const campaigns = await fetchMyCampaigns();
        if (campaigns && campaigns.length > 0) {
          const allApps = [];
          for (const campaign of campaigns) {
            const apps = await fetchCampaignApplications(campaign._id);
            allApps.push(...apps.map(a => ({ ...a, campaign: a.campaign || campaign })));
          }
          setBrandApplications(allApps);
        }
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
      case 'reviewed':
        return <Clock size={16} />;
      case 'shortlisted':
        return <Eye size={16} />;
      case 'accepted':
        return <CheckCircle size={16} />;
      case 'rejected':
      case 'withdrawn':
        return <XCircle size={16} />;
      default:
        return null;
    }
  };

  const statusCounts = {
    all: items.length,
    pending: items.filter(a => a.status === 'pending' || a.status === 'reviewed').length,
    active: items.filter(a => a.status === 'shortlisted' || a.status === 'accepted').length,
    completed: items.filter(a => a.status === 'accepted').length,
  };

  // Show loading state
  if (loading || localLoading) {
    return (
      <div className="collab-page">
        <div className="collab-container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '1rem'
        }}>
          <Loader size={48} className="spin-animation" />
          <p>Loading collaborations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="collab-page">
      <div className="collab-container">
        <div className="collab-page-header">
          <div>
            <h1>Collaborations</h1>
            <p>{isInfluencer ? 'Your campaign applications' : 'Applications to your campaigns'}</p>
          </div>
        </div>

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

        {/* Filters */}
        <div className="collab-filters-bar">
          <div className="collab-search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search collaborations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="collab-filter-tabs">
            {['all', 'pending', 'active', 'completed'].map(status => (
              <button
                key={status}
                className={`collab-filter-tab ${filter === status ? 'collab-active' : ''}`}
                onClick={() => setFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                <span className="collab-count">{statusCounts[status]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Collaborations List */}
        <div className="collab-list">
          {filteredItems.length > 0 ? (
            filteredItems.map((app) => (
              <div key={app._id} className="collab-card">
                <div className="collab-header">
                  <div className="collab-title">
                    <h3>
                      {isInfluencer
                        ? (app.campaign?.brandProfile?.companyName || 'Brand')
                        : (app.influencer?.name || app.influencerProfile?.name || 'Influencer')}
                    </h3>
                    <span className={`collab-status-badge collab-status-${app.status}`}>
                      {getStatusIcon(app.status)}
                      {app.status}
                    </span>
                  </div>
                  <div className="collab-service">
                    <Briefcase size={16} />
                    {app.campaign?.title || 'Campaign'}
                  </div>
                </div>

                <div className="collab-body">
                  <p className="collab-message">{app.message || 'No message'}</p>
                  
                  <div className="collab-details">
                    <div className="collab-detail-item">
                      <DollarSign size={16} />
                      <span>Proposed Rate: <strong>${app.proposedRate || 'N/A'}</strong></span>
                    </div>
                    {app.campaign?.deadline && (
                      <div className="collab-detail-item">
                        <Calendar size={16} />
                        <span>Deadline: <strong>{new Date(app.campaign.deadline).toLocaleDateString()}</strong></span>
                      </div>
                    )}
                    <div className="collab-detail-item">
                      <Clock size={16} />
                      <span>Applied: <strong>{new Date(app.createdAt).toLocaleDateString()}</strong></span>
                    </div>
                    {app.campaign?.budget && (
                      <div className="collab-detail-item">
                        <DollarSign size={16} />
                        <span>Campaign Budget: <strong>${app.campaign.budget.min} - ${app.campaign.budget.max}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="collab-footer">
                  {/* Brand actions: can shortlist, accept, or reject pending applications */}
                  {isBrand && (app.status === 'pending' || app.status === 'reviewed') && (
                    <div className="collab-action-buttons">
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleStatusChange(app._id, 'shortlisted')}
                      >
                        Shortlist
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleStatusChange(app._id, 'rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {isBrand && app.status === 'shortlisted' && (
                    <div className="collab-action-buttons">
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleStatusChange(app._id, 'accepted')}
                      >
                        <CheckCircle size={16} />
                        Accept
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleStatusChange(app._id, 'rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {/* Influencer: can withdraw pending applications */}
                  {isInfluencer && app.status === 'pending' && (
                    <div className="collab-action-buttons">
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleStatusChange(app._id, 'withdrawn')}
                      >
                        Withdraw
                      </button>
                    </div>
                  )}
                  {app.status === 'accepted' && (
                    <div className="collab-completed-info">
                      <CheckCircle size={18} />
                      <span>Accepted{app.acceptedAt ? ` on ${new Date(app.acceptedAt).toLocaleDateString()}` : ''}</span>
                    </div>
                  )}
                  {(app.status === 'rejected' || app.status === 'withdrawn') && (
                    <div className="collab-completed-info">
                      <XCircle size={18} />
                      <span>{app.status === 'withdrawn' ? 'Withdrawn' : 'Rejected'}{app.brandResponse?.message ? `: ${app.brandResponse.message}` : ''}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="collab-empty-state">
              <Briefcase size={48} />
              <h3>No collaborations found</h3>
              <p>
                {filter !== 'all' 
                  ? `You don't have any ${filter} collaborations.` 
                  : isInfluencer 
                    ? 'Apply to campaigns to start collaborating!'
                    : 'Create campaigns to receive applications.'}
              </p>
              {isBrand && (
                <Link to="/influencers" className="btn btn-primary">
                  Find Influencers
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Collaborations;
