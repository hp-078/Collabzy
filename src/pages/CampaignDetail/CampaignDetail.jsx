import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  ArrowLeft, Calendar, DollarSign, Users, Eye, Edit3, Save,
  CheckCircle, XCircle, Clock, Star, TrendingUp, Target,
  Briefcase, Tag, X, Send, UserCheck, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import './CampaignDetail.css';

const CATEGORY_OPTIONS = [
  'Fashion', 'Beauty', 'Tech', 'Gaming', 'Fitness', 'Food', 'Travel',
  'Lifestyle', 'Education', 'Entertainment', 'Business', 'Sports', 'Other',
  'Fashion & Lifestyle', 'Tech & Gadgets', 'Fitness & Health',
  'Food & Cooking', 'Beauty & Skincare', 'Travel & Adventure'
];

const PLATFORM_OPTIONS = ['YouTube', 'Instagram', 'TikTok', 'Multiple', 'Any'];

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    getCampaignById, updateCampaign, fetchCampaignApplications,
    updateApplicationStatus, submitApplication, loading
  } = useData();

  const [campaign, setCampaign] = useState(null);
  const [applications, setApplications] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyForm, setApplyForm] = useState({
    message: '',
    proposedRate: '',
    proposedDeliverables: '',
    portfolioLinks: '',
  });

  const isBrand = user?.role === 'brand';
  const isInfluencer = user?.role === 'influencer';
  const isOwner = isBrand && campaign?.brand?._id === user?._id;

  useEffect(() => {
    loadCampaign();
  }, [id]);

  const loadCampaign = async () => {
    setPageLoading(true);
    try {
      const data = await getCampaignById(id);
      if (data) {
        setCampaign(data);
        setEditForm({
          title: data.title || '',
          description: data.description || '',
          category: data.category || '',
          platformType: data.platformType || 'Any',
          budgetMin: data.budget?.min || '',
          budgetMax: data.budget?.max || '',
          deadline: data.deadline ? new Date(data.deadline).toISOString().split('T')[0] : '',
          status: data.status || 'active',
          maxInfluencers: data.maxInfluencers || 10,
          tags: data.tags?.join(', ') || '',
        });

        // Load applications if brand owner
        if (user?.role === 'brand') {
          const apps = await fetchCampaignApplications(data._id);
          setApplications(apps || []);
        }
      }
    } catch (err) {
      console.error('Error loading campaign:', err);
      toast.error('Failed to load campaign');
    } finally {
      setPageLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        platformType: editForm.platformType,
        budget: {
          min: Number(editForm.budgetMin),
          max: Number(editForm.budgetMax),
          currency: 'USD',
        },
        deadline: editForm.deadline,
        status: editForm.status,
        maxInfluencers: Number(editForm.maxInfluencers),
        tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };

      const result = await updateCampaign(id, payload);
      if (result.success) {
        toast.success('Campaign updated!');
        setEditing(false);
        loadCampaign();
      } else {
        toast.error(result.error || 'Update failed');
      }
    } catch (err) {
      toast.error('Failed to update campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplicationAction = async (appId, status) => {
    setSubmitting(true);
    try {
      const result = await updateApplicationStatus(appId, status);
      if (result.success) {
        toast.success(`Application ${status}`);
        // Refresh applications
        const apps = await fetchCampaignApplications(id);
        setApplications(apps || []);
      } else {
        toast.error(result.error || 'Failed to update');
      }
    } catch (err) {
      toast.error('Failed to update application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!applyForm.message) {
      toast.error('Please write a message');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        campaign: id,
        message: applyForm.message,
        proposedRate: applyForm.proposedRate ? Number(applyForm.proposedRate) : undefined,
        proposedDeliverables: applyForm.proposedDeliverables
          ? applyForm.proposedDeliverables.split(',').map(d => d.trim()).filter(Boolean) : [],
        portfolioLinks: applyForm.portfolioLinks
          ? applyForm.portfolioLinks.split(',').map(l => l.trim()).filter(Boolean) : [],
      };
      const result = await submitApplication(payload);
      if (result.success) {
        toast.success('Application submitted!');
        setShowApplyForm(false);
        setApplyForm({ message: '', proposedRate: '', proposedDeliverables: '', portfolioLinks: '' });
      } else {
        toast.error(result.error || 'Failed to apply');
      }
    } catch (err) {
      toast.error('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status) => {
    const map = {
      active: '#10b981', draft: '#94a3b8', paused: '#f59e0b',
      completed: '#3b82f6', cancelled: '#ef4444',
      pending: '#f59e0b', reviewed: '#3b82f6', shortlisted: '#8b5cf6',
      accepted: '#10b981', rejected: '#ef4444', withdrawn: '#94a3b8',
    };
    return map[status] || '#94a3b8';
  };

  if (pageLoading) {
    return (
      <div className="cdetail-page">
        <div className="cdetail-container cdetail-loading">
          <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p>Loading campaign...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="cdetail-page">
        <div className="cdetail-container cdetail-loading">
          <AlertCircle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Campaign Not Found</h3>
          <p>This campaign may have been removed or doesn't exist.</p>
          <button className="cdetail-back" onClick={() => navigate('/campaigns')} style={{ marginTop: '1rem' }}>
            <ArrowLeft size={16} /> Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cdetail-page">
      <div className="cdetail-container">
        <button className="cdetail-back" onClick={() => navigate('/campaigns')}>
          <ArrowLeft size={16} /> Back to Campaigns
        </button>

        {/* Hero Section */}
        <div className="cdetail-hero">
          <div className="cdetail-hero-top">
            <div>
              <h1 className="cdetail-title">{campaign.title}</h1>
              <p className="cdetail-brand">
                by {campaign.brandProfile?.companyName || campaign.brand?.name || 'Brand'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span className="cdetail-status-badge" style={{
                background: `${getStatusColor(campaign.status)}20`,
                color: getStatusColor(campaign.status)
              }}>
                {campaign.status}
              </span>
              {isOwner && !editing && (
                <button onClick={() => setEditing(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e2e8f0', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <Edit3 size={14} /> Edit
                </button>
              )}
            </div>
          </div>

          <div className="cdetail-meta-grid">
            <div className="cdetail-meta-item">
              <span className="cdetail-meta-label"><DollarSign size={13} style={{ verticalAlign: 'middle' }} /> Budget</span>
              <span className="cdetail-meta-value">
                ${campaign.budget?.min?.toLocaleString()} - ${campaign.budget?.max?.toLocaleString()}
              </span>
            </div>
            <div className="cdetail-meta-item">
              <span className="cdetail-meta-label"><Calendar size={13} style={{ verticalAlign: 'middle' }} /> Deadline</span>
              <span className="cdetail-meta-value">{formatDate(campaign.deadline)}</span>
            </div>
            <div className="cdetail-meta-item">
              <span className="cdetail-meta-label"><Users size={13} style={{ verticalAlign: 'middle' }} /> Applications</span>
              <span className="cdetail-meta-value">{campaign.applicationCount || 0} / {campaign.maxInfluencers || 10}</span>
            </div>
            <div className="cdetail-meta-item">
              <span className="cdetail-meta-label"><Eye size={13} style={{ verticalAlign: 'middle' }} /> Views</span>
              <span className="cdetail-meta-value">{campaign.viewCount || 0}</span>
            </div>
          </div>
        </div>

        {/* Influencer Apply Bar */}
        {isInfluencer && campaign.status === 'active' && !showApplyForm && (
          <div className="cdetail-apply-bar">
            <p>Interested in this campaign? Apply now to collaborate!</p>
            <button className="cdetail-apply-action" onClick={() => setShowApplyForm(true)}>
              <Send size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
              Apply Now
            </button>
          </div>
        )}

        {/* Apply Form */}
        {showApplyForm && (
          <div className="cdetail-section">
            <h3><Send size={18} /> Submit Your Application</h3>
            <form onSubmit={handleApply}>
              <div className="cdetail-edit-group">
                <label>Your Message *</label>
                <textarea className="cdetail-edit-textarea" value={applyForm.message}
                  onChange={e => setApplyForm({ ...applyForm, message: e.target.value })}
                  placeholder="Tell the brand why you're a great fit..." required />
              </div>
              <div className="cdetail-edit-row">
                <div className="cdetail-edit-group">
                  <label>Proposed Rate ($)</label>
                  <input type="number" className="cdetail-edit-input" value={applyForm.proposedRate}
                    onChange={e => setApplyForm({ ...applyForm, proposedRate: e.target.value })}
                    placeholder="Your rate" min="0" />
                </div>
                <div className="cdetail-edit-group">
                  <label>Portfolio Links (comma-separated)</label>
                  <input className="cdetail-edit-input" value={applyForm.portfolioLinks}
                    onChange={e => setApplyForm({ ...applyForm, portfolioLinks: e.target.value })}
                    placeholder="https://..." />
                </div>
              </div>
              <div className="cdetail-edit-group">
                <label>Proposed Deliverables (comma-separated)</label>
                <input className="cdetail-edit-input" value={applyForm.proposedDeliverables}
                  onChange={e => setApplyForm({ ...applyForm, proposedDeliverables: e.target.value })}
                  placeholder="e.g. 2 Reels, 3 Stories" />
              </div>
              <div className="cdetail-actions-bar">
                <button type="button" className="cdetail-cancel-btn" onClick={() => setShowApplyForm(false)}>Cancel</button>
                <button type="submit" className="cdetail-save-btn" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Form (Brand Owner) */}
        {editing && isOwner && (
          <div className="cdetail-section">
            <h3><Edit3 size={18} /> Edit Campaign</h3>
            <div className="cdetail-edit-form">
              <div className="cdetail-edit-group">
                <label>Title</label>
                <input className="cdetail-edit-input" value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
              </div>
              <div className="cdetail-edit-group">
                <label>Description</label>
                <textarea className="cdetail-edit-textarea" value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
              <div className="cdetail-edit-row">
                <div className="cdetail-edit-group">
                  <label>Category</label>
                  <select className="cdetail-edit-select" value={editForm.category}
                    onChange={e => setEditForm({ ...editForm, category: e.target.value })}>
                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="cdetail-edit-group">
                  <label>Platform</label>
                  <select className="cdetail-edit-select" value={editForm.platformType}
                    onChange={e => setEditForm({ ...editForm, platformType: e.target.value })}>
                    {PLATFORM_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="cdetail-edit-row">
                <div className="cdetail-edit-group">
                  <label>Budget Min ($)</label>
                  <input type="number" className="cdetail-edit-input" value={editForm.budgetMin}
                    onChange={e => setEditForm({ ...editForm, budgetMin: e.target.value })} />
                </div>
                <div className="cdetail-edit-group">
                  <label>Budget Max ($)</label>
                  <input type="number" className="cdetail-edit-input" value={editForm.budgetMax}
                    onChange={e => setEditForm({ ...editForm, budgetMax: e.target.value })} />
                </div>
              </div>
              <div className="cdetail-edit-row">
                <div className="cdetail-edit-group">
                  <label>Deadline</label>
                  <input type="date" className="cdetail-edit-input" value={editForm.deadline}
                    onChange={e => setEditForm({ ...editForm, deadline: e.target.value })} />
                </div>
                <div className="cdetail-edit-group">
                  <label>Status</label>
                  <select className="cdetail-edit-select" value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="cdetail-edit-row">
                <div className="cdetail-edit-group">
                  <label>Max Influencers</label>
                  <input type="number" className="cdetail-edit-input" value={editForm.maxInfluencers}
                    onChange={e => setEditForm({ ...editForm, maxInfluencers: e.target.value })} />
                </div>
                <div className="cdetail-edit-group">
                  <label>Tags (comma-separated)</label>
                  <input className="cdetail-edit-input" value={editForm.tags}
                    onChange={e => setEditForm({ ...editForm, tags: e.target.value })} />
                </div>
              </div>
              <div className="cdetail-actions-bar">
                <button className="cdetail-cancel-btn" onClick={() => setEditing(false)}>Cancel</button>
                <button className="cdetail-save-btn" onClick={handleSaveEdit} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="cdetail-section">
          <h3><Briefcase size={18} /> About This Campaign</h3>
          <p className="cdetail-desc">{campaign.description}</p>
        </div>

        {/* Deliverables */}
        {campaign.deliverables?.length > 0 && (
          <div className="cdetail-section">
            <h3><CheckCircle size={18} /> Deliverables</h3>
            <ul className="cdetail-deliv-list">
              {campaign.deliverables.map((d, i) => (
                <li key={i} className="cdetail-deliv-item">
                  <CheckCircle size={14} />
                  {d.quantity > 1 ? `${d.quantity}x ` : ''}{d.type}{d.description ? ` — ${d.description}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Eligibility */}
        {campaign.eligibility && (
          <div className="cdetail-section">
            <h3><Target size={18} /> Eligibility Requirements</h3>
            <div className="cdetail-elig-tags">
              {campaign.eligibility.minFollowers > 0 && (
                <span className="cdetail-elig-tag"><Users size={12} /> {campaign.eligibility.minFollowers.toLocaleString()}+ followers</span>
              )}
              {campaign.eligibility.minEngagementRate > 0 && (
                <span className="cdetail-elig-tag"><TrendingUp size={12} /> {campaign.eligibility.minEngagementRate}%+ engagement</span>
              )}
              {campaign.eligibility.minTrustScore > 0 && (
                <span className="cdetail-elig-tag"><Star size={12} /> {campaign.eligibility.minTrustScore}+ trust score</span>
              )}
              {campaign.eligibility.requiredNiches?.map((n, i) => (
                <span key={i} className="cdetail-elig-tag"><Tag size={12} /> {n}</span>
              ))}
              {(!campaign.eligibility.minFollowers && !campaign.eligibility.minEngagementRate && !campaign.eligibility.minTrustScore && !campaign.eligibility.requiredNiches?.length) && (
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No specific requirements — all influencers welcome!</p>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {campaign.tags?.length > 0 && (
          <div className="cdetail-section">
            <h3><Tag size={18} /> Tags</h3>
            <div className="cdetail-elig-tags">
              {campaign.tags.map((tag, i) => (
                <span key={i} className="cdetail-elig-tag">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Applications (Brand only) */}
        {isOwner && (
          <div className="cdetail-section">
            <div className="cdetail-app-header">
              <h3 style={{ margin: 0 }}><Users size={18} /> Applications</h3>
              <span className="cdetail-app-count">{applications.length} received</span>
            </div>

            {applications.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>
                No applications yet. Share your campaign to attract influencers!
              </p>
            ) : (
              applications.map(app => (
                <div key={app._id} className="cdetail-app-card">
                  <div className="cdetail-app-top">
                    <div>
                      <span className="cdetail-app-name">
                        {app.influencerProfile?.name || app.influencer?.name || 'Influencer'}
                      </span>
                    </div>
                    <span className="cdetail-app-status" style={{
                      background: `${getStatusColor(app.status)}20`,
                      color: getStatusColor(app.status)
                    }}>
                      {app.status}
                    </span>
                  </div>

                  <p className="cdetail-app-message">{app.message}</p>

                  <div className="cdetail-app-meta">
                    {app.proposedRate && (
                      <span><DollarSign size={12} /> Rate: <strong>${app.proposedRate.toLocaleString()}</strong></span>
                    )}
                    <span><Clock size={12} /> Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                  </div>

                  {app.portfolioLinks?.length > 0 && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      {app.portfolioLinks.map((link, i) => (
                        <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                          style={{ color: '#818cf8', fontSize: '0.85rem', marginRight: '1rem' }}>
                          Portfolio Link {i + 1}
                        </a>
                      ))}
                    </div>
                  )}

                  {app.status === 'pending' && (
                    <div className="cdetail-app-actions">
                      <button className="cdetail-app-shortlist" onClick={() => handleApplicationAction(app._id, 'shortlisted')} disabled={submitting}>
                        <UserCheck size={12} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
                        Shortlist
                      </button>
                      <button className="cdetail-app-accept" onClick={() => handleApplicationAction(app._id, 'accepted')} disabled={submitting}>
                        <CheckCircle size={12} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
                        Accept
                      </button>
                      <button className="cdetail-app-reject" onClick={() => handleApplicationAction(app._id, 'rejected')} disabled={submitting}>
                        <XCircle size={12} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
                        Reject
                      </button>
                    </div>
                  )}
                  {app.status === 'shortlisted' && (
                    <div className="cdetail-app-actions">
                      <button className="cdetail-app-accept" onClick={() => handleApplicationAction(app._id, 'accepted')} disabled={submitting}>
                        <CheckCircle size={12} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
                        Accept
                      </button>
                      <button className="cdetail-app-reject" onClick={() => handleApplicationAction(app._id, 'rejected')} disabled={submitting}>
                        <XCircle size={12} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignDetail;
