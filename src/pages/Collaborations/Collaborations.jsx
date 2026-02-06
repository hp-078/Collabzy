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
  Loader
} from 'lucide-react';
import './Collaborations.css';

const Collaborations = () => {
  const { user, isInfluencer } = useAuth();
  const { collaborations, loading, error, fetchMyApplications, updateApplicationStatus } = useData();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [localLoading, setLocalLoading] = useState(true);

  // Fetch applications on mount
  useEffect(() => {
    const loadApplications = async () => {
      setLocalLoading(true);
      await fetchMyApplications();
      setLocalLoading(false);
    };
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userCollabs = collaborations.filter(c => 
    isInfluencer ? (c.influencer?._id === user?._id || c.influencerId === user?._id) : (c.brand?._id === user?._id || c.brandId === user?._id)
  );

  const filteredCollabs = userCollabs.filter(c => {
    const matchesFilter = filter === 'all' || c.status === filter;
    const partnerName = isInfluencer ? (c.brand?.name || c.brandName) : (c.influencer?.name || c.influencerName);
    const serviceName = c.campaign?.title || c.service || '';
    const matchesSearch = 
      (partnerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      serviceName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleStatusChange = async (collabId, newStatus) => {
    const result = await updateApplicationStatus(collabId, newStatus);
    if (result.success) {
      // Refresh applications
      fetchMyApplications(null, true);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} />;
      case 'active':
        return <Briefcase size={16} />;
      case 'completed':
        return <CheckCircle size={16} />;
      case 'rejected':
        return <XCircle size={16} />;
      default:
        return null;
    }
  };

  const statusCounts = {
    all: userCollabs.length,
    pending: userCollabs.filter(c => c.status === 'pending').length,
    active: userCollabs.filter(c => c.status === 'active' || c.status === 'shortlisted').length,
    completed: userCollabs.filter(c => c.status === 'completed' || c.status === 'accepted').length,
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
            <p>Manage all your collaboration requests and projects</p>
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
          {filteredCollabs.length > 0 ? (
            filteredCollabs.map((collab) => (
              <div key={collab._id || collab.id} className="collab-card">
                <div className="collab-header">
                  <div className="collab-title">
                    <h3>{isInfluencer ? (collab.brand?.name || collab.brandName) : (collab.influencer?.name || collab.influencerName)}</h3>
                    <span className={`collab-status-badge collab-status-${collab.status}`}>
                      {getStatusIcon(collab.status)}
                      {collab.status}
                    </span>
                  </div>
                  <div className="collab-service">
                    <Briefcase size={16} />
                    {collab.campaign?.title || collab.service || 'Application'}
                  </div>
                </div>

                <div className="collab-body">
                  <p className="collab-message">{collab.proposal || collab.message || 'No message'}</p>
                  
                  <div className="collab-details">
                    <div className="collab-detail-item">
                      <DollarSign size={16} />
                      <span>Budget: <strong>${collab.quotedPrice || collab.budget || 'N/A'}</strong></span>
                    </div>
                    {(collab.campaign?.deadline || collab.deadline) && (
                      <div className="collab-detail-item">
                        <Calendar size={16} />
                        <span>Deadline: <strong>{new Date(collab.campaign?.deadline || collab.deadline).toLocaleDateString()}</strong></span>
                      </div>
                    )}
                    <div className="collab-detail-item">
                      <Clock size={16} />
                      <span>Created: <strong>{new Date(collab.createdAt || collab.appliedAt).toLocaleDateString()}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="collab-footer">
                  {collab.status === 'pending' && isInfluencer && (
                    <div className="collab-action-buttons">
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleStatusChange(collab.id, 'active')}
                      >
                        Accept
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleStatusChange(collab.id, 'rejected')}
                      >
                        Decline
                      </button>
                    </div>
                  )}
                  {collab.status === 'active' && (
                    <div className="collab-action-buttons">
                      <Link to="/messages" className="btn btn-secondary btn-sm">
                        <MessageSquare size={16} />
                        Message
                      </Link>
                      {isInfluencer && (
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleStatusChange(collab.id, 'completed')}
                        >
                          <CheckCircle size={16} />
                          Mark Complete
                        </button>
                      )}
                    </div>
                  )}
                  {collab.status === 'completed' && (
                    <div className="collab-completed-info">
                      <CheckCircle size={18} />
                      <span>Completed on {collab.completedAt || 'recently'}</span>
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
                  : 'Start connecting with brands or influencers to create collaborations.'}
              </p>
              {!isInfluencer && (
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
