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
  Eye,
  FileText,
  Play,
  Upload,
  AlertCircle,
  Handshake,
  Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Collaborations.css';

const Collaborations = () => {
  const { user, isInfluencer, isBrand } = useAuth();
  const {
    applications,
    deals,
    loading,
    error,
    fetchMyApplications,
    fetchMyCampaigns,
    fetchCampaignApplications,
    updateApplicationStatus,
    fetchMyDeals,
    createDeal,
    updateDealStatus,
    createReview
  } = useData();
  
  // Tabs: 'applications' or 'deals'
  const [activeTab, setActiveTab] = useState('applications');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [localLoading, setLocalLoading] = useState(true);
  const [brandApplications, setBrandApplications] = useState([]);
  const [myDeals, setMyDeals] = useState([]);
  const [dealFilter, setDealFilter] = useState('all');
  const [showCreateDealModal, setShowCreateDealModal] = useState(null); // holds application to create deal from
  const [dealForm, setDealForm] = useState({ agreedRate: '', deadline: '' });
  const [submitting, setSubmitting] = useState(false);
  
  // Review state
  const [showReviewModal, setShowReviewModal] = useState(null); // holds deal to review
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', content: '' });

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      setLocalLoading(true);
      try {
        // Load applications
        if (isInfluencer) {
          await fetchMyApplications();
        } else if (isBrand) {
          const campaigns = await fetchMyCampaigns();
          if (campaigns && campaigns.length > 0) {
            const allApps = [];
            for (const campaign of campaigns) {
              const apps = await fetchCampaignApplications(campaign._id);
              allApps.push(...apps.map(app => ({ ...app, campaign: app.campaign || campaign })));
            }
            setBrandApplications(allApps);
          }
        }
        
        // Load deals
        const dealsData = await fetchMyDeals(true);
        setMyDeals(dealsData || []);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLocalLoading(false);
      }
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
    } else {
      alert(`❌ Failed to update application status!\n\n${result.error}\n\n✅ Solution:\n1. Open a new terminal\n2. cd backend\n3. npm run dev\n\nSee START_HERE.md for details`);
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

  // Filter deals
  const filteredDeals = myDeals.filter(deal => {
    const matchesFilter = dealFilter === 'all' || deal.status === dealFilter;
    const campaignTitle = deal.campaign?.title || '';
    const otherPartyName = isBrand 
      ? (deal.influencer?.name || '') 
      : (deal.brand?.name || '');
    const matchesSearch = !searchTerm ||
      campaignTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      otherPartyName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const dealStatusCounts = {
    all: myDeals.length,
    active: myDeals.filter(d => d.status === 'active' || d.status === 'in_progress').length,
    pending_review: myDeals.filter(d => d.status === 'pending_review').length,
    completed: myDeals.filter(d => d.status === 'completed').length,
  };

  // Open create deal modal
  const openCreateDealModal = (application) => {
    setShowCreateDealModal(application);
    setDealForm({
      agreedRate: application.proposedRate || '',
      deadline: application.campaign?.deadline 
        ? new Date(application.campaign.deadline).toISOString().split('T')[0] 
        : ''
    });
  };

  // Handle create deal
  const handleCreateDeal = async () => {
    if (!showCreateDealModal) return;
    if (!dealForm.agreedRate || !dealForm.deadline) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createDeal({
        applicationId: showCreateDealModal._id,
        agreedRate: Number(dealForm.agreedRate),
        deadline: dealForm.deadline
      });
      if (result.success) {
        toast.success('Deal created successfully!');
        setShowCreateDealModal(null);
        // Refresh deals
        const dealsData = await fetchMyDeals(true);
        setMyDeals(dealsData || []);
      } else {
        toast.error(result.error || 'Failed to create deal');
      }
    } catch (err) {
      toast.error('Failed to create deal');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle deal status update
  const handleDealStatusChange = async (dealId, newStatus) => {
    setSubmitting(true);
    try {
      const result = await updateDealStatus(dealId, { status: newStatus });
      if (result.success) {
        toast.success(`Deal ${newStatus === 'completed' ? 'completed' : 'updated'} successfully!`);
        // Refresh deals
        const dealsData = await fetchMyDeals(true);
        setMyDeals(dealsData || []);
      } else {
        toast.error(result.error || 'Failed to update deal');
      }
    } catch (err) {
      toast.error('Failed to update deal');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle submit review
  const handleSubmitReview = async () => {
    if (!showReviewModal) return;
    if (!reviewForm.content) {
      toast.error('Please write a review');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createReview({
        dealId: showReviewModal._id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        content: reviewForm.content
      });
      if (result.success) {
        toast.success('Review submitted successfully!');
        setShowReviewModal(null);
        setReviewForm({ rating: 5, title: '', content: '' });
        // Refresh deals to update reviewed status
        const dealsData = await fetchMyDeals(true);
        setMyDeals(dealsData || []);
      } else {
        toast.error(result.error || 'Failed to submit review');
      }
    } catch (err) {
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  // Star rating component
  const StarRating = ({ rating, onRate }) => {
    return (
      <div className="collab-star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`collab-star ${star <= rating ? 'active' : ''}`}
            onClick={() => onRate(star)}
          >
            <Star size={24} fill={star <= rating ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
    );
  };

  // Get deal status icon
  const getDealStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <Play size={16} />;
      case 'in_progress':
        return <Clock size={16} />;
      case 'pending_review':
        return <Eye size={16} />;
      case 'completed':
        return <CheckCircle size={16} />;
      case 'cancelled':
        return <XCircle size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Days until deadline
  const getDaysUntil = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const end = new Date(deadline);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
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
            <p>{isInfluencer ? 'Your applications & active deals' : 'Manage applications & deals'}</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="collab-error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Main Tabs: Applications / Deals */}
        <div className="collab-main-tabs">
          <button 
            className={`collab-main-tab ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => setActiveTab('applications')}
          >
            <FileText size={18} />
            Applications
            <span className="collab-tab-count">{items.length}</span>
          </button>
          <button 
            className={`collab-main-tab ${activeTab === 'deals' ? 'active' : ''}`}
            onClick={() => setActiveTab('deals')}
          >
            <Handshake size={18} />
            Deals
            <span className="collab-tab-count">{myDeals.length}</span>
          </button>
        </div>

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <>
            {/* Filters */}
            <div className="collab-filters-bar">
              <div className="collab-search-box">
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search applications..."
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

            {/* Applications List */}
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
                      {/* Brand: create deal from accepted application */}
                      {isBrand && app.status === 'accepted' && (
                        <div className="collab-action-buttons">
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => openCreateDealModal(app)}
                          >
                            <Handshake size={16} />
                            Create Deal
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
                      {isInfluencer && app.status === 'accepted' && (
                        <div className="collab-completed-info collab-success">
                          <CheckCircle size={18} />
                          <span>Accepted! Waiting for deal confirmation.</span>
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
                  <h3>No applications found</h3>
                  <p>
                    {filter !== 'all' 
                      ? `You don't have any ${filter} applications.` 
                      : isInfluencer 
                        ? 'Apply to campaigns to start collaborating!'
                        : 'Create campaigns to receive applications.'}
                  </p>
                  {isInfluencer && (
                    <Link to="/campaigns" className="btn btn-primary">
                      Browse Campaigns
                    </Link>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Deals Tab */}
        {activeTab === 'deals' && (
          <>
            {/* Deal Filters */}
            <div className="collab-filters-bar">
              <div className="collab-search-box">
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search deals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="collab-filter-tabs">
                {['all', 'active', 'pending_review', 'completed'].map(status => (
                  <button
                    key={status}
                    className={`collab-filter-tab ${dealFilter === status ? 'collab-active' : ''}`}
                    onClick={() => setDealFilter(status)}
                  >
                    {status === 'pending_review' ? 'In Review' : status.charAt(0).toUpperCase() + status.slice(1)}
                    <span className="collab-count">{dealStatusCounts[status]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Deals List */}
            <div className="collab-list">
              {filteredDeals.length > 0 ? (
                filteredDeals.map((deal) => {
                  const daysLeft = getDaysUntil(deal.deadline);
                  return (
                    <div key={deal._id} className="collab-card collab-deal-card">
                      <div className="collab-header">
                        <div className="collab-title">
                          <h3>
                            {isBrand 
                              ? (deal.influencer?.name || 'Influencer')
                              : (deal.brand?.name || 'Brand')}
                          </h3>
                          <span className={`collab-status-badge collab-deal-status-${deal.status}`}>
                            {getDealStatusIcon(deal.status)}
                            {deal.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="collab-service">
                          <Briefcase size={16} />
                          {deal.campaign?.title || 'Campaign'}
                        </div>
                      </div>

                      <div className="collab-body">
                        <div className="collab-deal-stats">
                          <div className="collab-deal-stat">
                            <DollarSign size={20} />
                            <div>
                              <span className="stat-label">Agreed Rate</span>
                              <span className="stat-value">${deal.agreedRate?.toLocaleString() || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="collab-deal-stat">
                            <Calendar size={20} />
                            <div>
                              <span className="stat-label">Deadline</span>
                              <span className="stat-value">{formatDate(deal.deadline)}</span>
                            </div>
                          </div>
                          {daysLeft !== null && (
                            <div className={`collab-deal-stat ${daysLeft < 3 ? 'urgent' : ''}`}>
                              <Clock size={20} />
                              <div>
                                <span className="stat-label">Time Left</span>
                                <span className="stat-value">
                                  {daysLeft > 0 ? `${daysLeft} days` : daysLeft === 0 ? 'Today' : 'Overdue'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Deliverables Progress */}
                        {deal.deliverables && deal.deliverables.length > 0 && (
                          <div className="collab-deliverables">
                            <h4>Deliverables</h4>
                            <div className="collab-deliverables-list">
                              {deal.deliverables.map((d, idx) => (
                                <div key={idx} className={`collab-deliverable collab-deliverable-${d.status}`}>
                                  {d.status === 'approved' ? <CheckCircle size={14} /> : 
                                   d.status === 'submitted' ? <Upload size={14} /> : 
                                   <Clock size={14} />}
                                  <span>{d.description || d.type}</span>
                                  <span className="deliverable-status">{d.status}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="collab-footer">
                        {/* Influencer actions */}
                        {isInfluencer && (deal.status === 'active' || deal.status === 'in_progress') && (
                          <div className="collab-action-buttons">
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => handleDealStatusChange(deal._id, 'pending_review')}
                              disabled={submitting}
                            >
                              <Upload size={16} />
                              Submit for Review
                            </button>
                          </div>
                        )}
                        {/* Brand actions */}
                        {isBrand && deal.status === 'pending_review' && (
                          <div className="collab-action-buttons">
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => handleDealStatusChange(deal._id, 'completed')}
                              disabled={submitting}
                            >
                              <CheckCircle size={16} />
                              Approve & Complete
                            </button>
                            <button 
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleDealStatusChange(deal._id, 'in_progress')}
                              disabled={submitting}
                            >
                              Request Revision
                            </button>
                          </div>
                        )}
                        {deal.status === 'completed' && (
                          <div className="collab-deal-completed-section">
                            <div className="collab-completed-info collab-success">
                              <CheckCircle size={18} />
                              <span>Deal completed{deal.completedAt ? ` on ${formatDate(deal.completedAt)}` : ''}</span>
                            </div>
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                setShowReviewModal(deal);
                                setReviewForm({ rating: 5, title: '', content: '' });
                              }}
                            >
                              <Star size={16} />
                              Leave Review
                            </button>
                          </div>
                        )}
                        {deal.status === 'cancelled' && (
                          <div className="collab-completed-info">
                            <XCircle size={18} />
                            <span>Deal cancelled</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="collab-empty-state">
                  <Handshake size={48} />
                  <h3>No deals found</h3>
                  <p>
                    {dealFilter !== 'all' 
                      ? `You don't have any ${dealFilter.replace('_', ' ')} deals.` 
                      : 'Deals will appear here once applications are accepted and confirmed.'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Create Deal Modal */}
        {showCreateDealModal && (
          <div className="collab-modal-overlay" onClick={() => setShowCreateDealModal(null)}>
            <div className="collab-modal" onClick={e => e.stopPropagation()}>
              <div className="collab-modal-header">
                <h2>Create Deal</h2>
                <button className="collab-modal-close" onClick={() => setShowCreateDealModal(null)}>
                  <XCircle size={20} />
                </button>
              </div>
              <div className="collab-modal-body">
                <p className="collab-modal-info">
                  Creating deal with <strong>{showCreateDealModal.influencer?.name || showCreateDealModal.influencerProfile?.name || 'Influencer'}</strong> for campaign <strong>{showCreateDealModal.campaign?.title || 'Campaign'}</strong>
                </p>
                <div className="collab-form-group">
                  <label>Agreed Rate ($)</label>
                  <input
                    type="number"
                    value={dealForm.agreedRate}
                    onChange={(e) => setDealForm(prev => ({ ...prev, agreedRate: e.target.value }))}
                    placeholder="Enter agreed rate"
                    min="0"
                  />
                </div>
                <div className="collab-form-group">
                  <label>Deadline</label>
                  <input
                    type="date"
                    value={dealForm.deadline}
                    onChange={(e) => setDealForm(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>
              </div>
              <div className="collab-modal-footer">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowCreateDealModal(null)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleCreateDeal}
                  disabled={submitting || !dealForm.agreedRate || !dealForm.deadline}
                >
                  {submitting ? <Loader size={16} className="spin-animation" /> : <Handshake size={16} />}
                  Create Deal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && (
          <div className="collab-modal-overlay" onClick={() => setShowReviewModal(null)}>
            <div className="collab-modal collab-review-modal" onClick={e => e.stopPropagation()}>
              <div className="collab-modal-header">
                <h2>Leave a Review</h2>
                <button className="collab-modal-close" onClick={() => setShowReviewModal(null)}>
                  <XCircle size={20} />
                </button>
              </div>
              <div className="collab-modal-body">
                <p className="collab-modal-info">
                  Rate your experience with <strong>{isBrand ? (showReviewModal.influencer?.name || 'Influencer') : (showReviewModal.brand?.name || 'Brand')}</strong> for <strong>{showReviewModal.campaign?.title || 'this campaign'}</strong>
                </p>
                
                <div className="collab-form-group collab-rating-group">
                  <label>Rating</label>
                  <StarRating 
                    rating={reviewForm.rating} 
                    onRate={(r) => setReviewForm(prev => ({ ...prev, rating: r }))}
                  />
                  <span className="collab-rating-text">{reviewForm.rating}/5 stars</span>
                </div>

                <div className="collab-form-group">
                  <label>Title (optional)</label>
                  <input
                    type="text"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Summarize your experience"
                    maxLength={100}
                  />
                </div>

                <div className="collab-form-group">
                  <label>Your Review *</label>
                  <textarea
                    value={reviewForm.content}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Share your experience working on this campaign..."
                    rows={4}
                    maxLength={1000}
                  />
                  <span className="collab-char-count">{reviewForm.content.length}/1000</span>
                </div>
              </div>
              <div className="collab-modal-footer">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowReviewModal(null)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleSubmitReview}
                  disabled={submitting || !reviewForm.content}
                >
                  {submitting ? <Loader size={16} className="spin-animation" /> : <Star size={16} />}
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Collaborations;
