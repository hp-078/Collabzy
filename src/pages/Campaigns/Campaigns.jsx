import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Search, Plus, Filter, Calendar, DollarSign, Users, Eye,
  Briefcase, ChevronDown, X, CheckCircle, Clock, Tag, MapPin,
  TrendingUp, Star, Megaphone, Target
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Campaigns.css';

const CATEGORY_OPTIONS = [
  'Fashion', 'Beauty', 'Tech', 'Gaming', 'Fitness', 'Food', 'Travel',
  'Lifestyle', 'Education', 'Entertainment', 'Business', 'Sports', 'Other',
  'Fashion & Lifestyle', 'Tech & Gadgets', 'Fitness & Health',
  'Food & Cooking', 'Beauty & Skincare', 'Travel & Adventure'
];

const PLATFORM_OPTIONS = ['YouTube', 'Instagram', 'TikTok', 'Multiple', 'Any'];

const STATUS_OPTIONS = ['active', 'draft', 'paused', 'completed', 'cancelled'];

const Campaigns = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    fetchCampaigns, fetchMyCampaigns, fetchEligibleCampaigns,
    fetchRecommendedCampaigns, createCampaign, submitApplication, loading
  } = useData();

  const isBrand = user?.role === 'brand';
  const isInfluencer = user?.role === 'influencer';

  // State
  const [campaignList, setCampaignList] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [activeTab, setActiveTab] = useState(isBrand ? 'my' : 'browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Create form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    platformType: 'Any',
    budgetMin: '',
    budgetMax: '',
    deadline: '',
    startDate: new Date().toISOString().split('T')[0],
    deliverables: [{ type: '', quantity: 1, description: '' }],
    eligibility: {
      minFollowers: 0,
      maxFollowers: 10000000,
      minEngagementRate: 0,
      requiredNiches: [],
      minTrustScore: 0,
    },
    tags: '',
    maxInfluencers: 10,
    status: 'active',
  });

  // Apply form state
  const [applyForm, setApplyForm] = useState({
    message: '',
    proposedRate: '',
    proposedDeliverables: '',
    portfolioLinks: '',
  });

  // Load campaigns
  const loadCampaigns = useCallback(async () => {
    setPageLoading(true);
    try {
      const filters = {};
      if (filterCategory) filters.category = filterCategory;
      if (filterPlatform) filters.platformType = filterPlatform;
      if (filterStatus) filters.status = filterStatus;
      if (searchQuery) filters.search = searchQuery;

      let data = [];
      if (isBrand && activeTab === 'my') {
        data = await fetchMyCampaigns(filters);
      } else if (isInfluencer && activeTab === 'eligible') {
        data = await fetchEligibleCampaigns(filters);
      } else {
        data = await fetchCampaigns(filters, true);
      }
      setCampaignList(data || []);

      // Load recommended for influencers
      if (isInfluencer && activeTab === 'browse') {
        const rec = await fetchRecommendedCampaigns(6);
        setRecommended(rec || []);
      }
    } catch (err) {
      console.error('Error loading campaigns:', err);
    } finally {
      setPageLoading(false);
    }
  }, [activeTab, filterCategory, filterPlatform, filterStatus, searchQuery, isBrand, isInfluencer]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  // Filter campaigns by search client-side too
  const displayCampaigns = campaignList.filter(c => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Handle create campaign
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.category || !form.budgetMin || !form.budgetMax || !form.deadline) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        platformType: form.platformType,
        budget: {
          min: Number(form.budgetMin),
          max: Number(form.budgetMax),
          currency: 'INR',
        },
        startDate: form.startDate || new Date().toISOString(),
        deadline: form.deadline,
        deliverables: form.deliverables.filter(d => d.type),
        eligibility: form.eligibility,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        maxInfluencers: Number(form.maxInfluencers) || 10,
        status: form.status,
      };

      const result = await createCampaign(payload);
      if (result.success) {
        toast.success('Campaign created successfully!');
        setShowCreateModal(false);
        resetForm();
        loadCampaigns();
      } else {
        toast.error(result.error || 'Failed to create campaign');
      }
    } catch (err) {
      toast.error('Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle apply
  const handleApply = async (e) => {
    e.preventDefault();
    if (!showApplyModal) return;
    if (!applyForm.message) {
      toast.error('Please write a message');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        campaignId: showApplyModal._id,
        message: applyForm.message,
        proposedRate: applyForm.proposedRate ? Number(applyForm.proposedRate) : undefined,
        proposedDeliverables: applyForm.proposedDeliverables
          ? applyForm.proposedDeliverables.split(',').map(d => d.trim()).filter(Boolean).map(desc => ({
              description: desc
            }))
          : [],
        portfolioLinks: applyForm.portfolioLinks
          ? applyForm.portfolioLinks.split(',').map(l => l.trim()).filter(Boolean).map(link => ({
              url: link
            }))
          : [],
      };

      const result = await submitApplication(payload);
      if (result.success) {
        toast.success('Application submitted!');
        setShowApplyModal(null);
        setApplyForm({ message: '', proposedRate: '', proposedDeliverables: '', portfolioLinks: '' });
        loadCampaigns();
      } else {
        toast.error(result.error || 'Failed to apply');
        alert(`❌ Failed to submit application!\n\n${result.error}\n\n✅ Solution:\n1. Open a new terminal\n2. cd backend\n3. npm run dev\n\nSee START_HERE.md for details`);
      }
    } catch (err) {
      toast.error('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: '', description: '', category: '', platformType: 'Any',
      budgetMin: '', budgetMax: '', deadline: '', startDate: new Date().toISOString().split('T')[0],
      deliverables: [{ type: '', quantity: 1, description: '' }],
      eligibility: { minFollowers: 0, maxFollowers: 10000000, minEngagementRate: 0, requiredNiches: [], minTrustScore: 0 },
      tags: '', maxInfluencers: 10, status: 'active',
    });
  };

  const addDeliverable = () => {
    setForm(prev => ({
      ...prev,
      deliverables: [...prev.deliverables, { type: '', quantity: 1, description: '' }]
    }));
  };

  const removeDeliverable = (index) => {
    setForm(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index)
    }));
  };

  const updateDeliverable = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      deliverables: prev.deliverables.map((d, i) => i === index ? { ...d, [field]: value } : d)
    }));
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatBudget = (budget) => {
    if (!budget) return 'N/A';
    const min = budget.min?.toLocaleString() || '0';
    const max = budget.max?.toLocaleString() || '0';
    return `₹${min} - ₹${max}`;
  };

  return (
    <div className="camp-page">
      <div className="camp-container">
        {/* Header */}
        <div className="camp-header">
          <div>
            <h1>{isBrand ? 'My Campaigns' : 'Discover Campaigns'}</h1>
            <p>{isBrand ? 'Create and manage your influencer campaigns' : 'Find campaigns that match your profile'}</p>
          </div>
          {isBrand && (
            <button className="camp-create-btn" onClick={() => setShowCreateModal(true)}>
              <Plus size={18} /> Create Campaign
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="camp-tabs">
          {isBrand ? (
            <>
              <button className={`camp-tab ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>
                My Campaigns
              </button>
              <button className={`camp-tab ${activeTab === 'browse' ? 'active' : ''}`} onClick={() => setActiveTab('browse')}>
                All Campaigns
              </button>
            </>
          ) : (
            <>
              <button className={`camp-tab ${activeTab === 'browse' ? 'active' : ''}`} onClick={() => setActiveTab('browse')}>
                Browse All
              </button>
              <button className={`camp-tab ${activeTab === 'eligible' ? 'active' : ''}`} onClick={() => setActiveTab('eligible')}>
                Eligible For Me
              </button>
            </>
          )}
        </div>

        {/* Filters */}
        <div className="camp-filters">
          <div className="camp-search-input" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
            <Search size={16} style={{ opacity: 0.5 }} />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize: '0.9rem' }}
            />
          </div>
          <select className="camp-filter-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORY_OPTIONS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select className="camp-filter-select" value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}>
            <option value="">All Platforms</option>
            {PLATFORM_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {isBrand && (
            <select className="camp-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          )}
        </div>

        {/* Recommended Section (Influencer) */}
        {isInfluencer && activeTab === 'browse' && recommended.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Star size={18} style={{ color: '#f59e0b' }} /> Recommended For You
            </h3>
            <div className="camp-grid">
              {recommended.slice(0, 3).map(campaign => (
                <CampaignCard
                  key={campaign._id}
                  campaign={campaign}
                  isBrand={false}
                  onView={() => setShowDetailModal(campaign)}
                  onApply={() => setShowApplyModal(campaign)}
                  isRecommended
                />
              ))}
            </div>
          </div>
        )}

        {/* Campaign List */}
        {pageLoading ? (
          <div className="camp-empty">
            <div className="loading-spinner" style={{ margin: '3rem auto', width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p>Loading campaigns...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : displayCampaigns.length === 0 ? (
          <div className="camp-empty">
            <Megaphone size={48} />
            <h3>No campaigns found</h3>
            <p>{isBrand ? 'Create your first campaign to get started!' : 'Check back later for new opportunities.'}</p>
          </div>
        ) : (
          <>
            <p style={{ color: '#94a3b8', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Showing {displayCampaigns.length} campaign{displayCampaigns.length !== 1 ? 's' : ''}
            </p>
            <div className="camp-grid">
              {displayCampaigns.map(campaign => (
                <CampaignCard
                  key={campaign._id}
                  campaign={campaign}
                  isBrand={isBrand}
                  onView={() => setShowDetailModal(campaign)}
                  onApply={() => setShowApplyModal(campaign)}
                  onEdit={() => navigate(`/campaigns/${campaign._id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="camp-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="camp-modal" onClick={e => e.stopPropagation()}>
            <h2>Create New Campaign</h2>
            <form onSubmit={handleCreate}>
              <div className="camp-form-group">
                <label>Campaign Title *</label>
                <input className="camp-form-input" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Summer Fashion Collection Launch" required />
              </div>

              <div className="camp-form-group">
                <label>Description *</label>
                <textarea className="camp-form-textarea" value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe your campaign goals, requirements, and expectations..." required />
              </div>

              <div className="camp-form-row">
                <div className="camp-form-group">
                  <label>Category *</label>
                  <select className="camp-form-select" value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })} required>
                    <option value="">Select Category</option>
                    {CATEGORY_OPTIONS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="camp-form-group">
                  <label>Platform</label>
                  <select className="camp-form-select" value={form.platformType}
                    onChange={e => setForm({ ...form, platformType: e.target.value })}>
                    {PLATFORM_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="camp-form-row">
                <div className="camp-form-group">
                  <label>Budget Min (₹) *</label>
                  <input type="number" className="camp-form-input" value={form.budgetMin}
                    onChange={e => setForm({ ...form, budgetMin: e.target.value })}
                    placeholder="500" min="0" required />
                </div>
                <div className="camp-form-group">
                  <label>Budget Max (₹) *</label>
                  <input type="number" className="camp-form-input" value={form.budgetMax}
                    onChange={e => setForm({ ...form, budgetMax: e.target.value })}
                    placeholder="5000" min="0" required />
                </div>
              </div>

              <div className="camp-form-row">
                <div className="camp-form-group">
                  <label>Start Date *</label>
                  <input type="date" className="camp-form-input" value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value, deadline: '' })}
                    min={new Date().toISOString().split('T')[0]}
                    required />
                </div>
                {form.startDate && (
                  <div className="camp-form-group">
                    <label>Deadline *</label>
                    <input type="date" className="camp-form-input" value={form.deadline}
                      onChange={e => setForm({ ...form, deadline: e.target.value })}
                      min={form.startDate}
                      required />
                  </div>
                )}
              </div>

              {/* Deliverables */}
              <div className="camp-form-group">
                <label>Deliverables</label>
                {form.deliverables.map((d, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <input className="camp-form-input" value={d.type}
                      onChange={e => updateDeliverable(i, 'type', e.target.value)}
                      placeholder="e.g. Instagram Reel" style={{ flex: 2 }} />
                    <input type="number" className="camp-form-input" value={d.quantity}
                      onChange={e => updateDeliverable(i, 'quantity', Number(e.target.value))}
                      min="1" style={{ flex: 0.5 }} />
                    <input className="camp-form-input" value={d.description}
                      onChange={e => updateDeliverable(i, 'description', e.target.value)}
                      placeholder="Description" style={{ flex: 2 }} />
                    {form.deliverables.length > 1 && (
                      <button type="button" onClick={() => removeDeliverable(i)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}>
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addDeliverable}
                  style={{ background: 'none', border: '1px dashed rgba(255,255,255,0.2)', color: '#94a3b8', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  + Add Deliverable
                </button>
              </div>

              <div className="camp-form-row">
                <div className="camp-form-group">
                  <label>Tags (comma-separated)</label>
                  <input className="camp-form-input" value={form.tags}
                    onChange={e => setForm({ ...form, tags: e.target.value })}
                    placeholder="fashion, summer, launch" />
                </div>
                <div className="camp-form-group">
                  <label>Max Influencers</label>
                  <input type="number" className="camp-form-input" value={form.maxInfluencers}
                    onChange={e => setForm({ ...form, maxInfluencers: e.target.value })}
                    min="1" max="100" />
                </div>
              </div>

              <div className="camp-form-row">
                <div className="camp-form-group">
                  <label>Min Followers Required</label>
                  <input type="number" className="camp-form-input" value={form.eligibility.minFollowers}
                    onChange={e => setForm({ ...form, eligibility: { ...form.eligibility, minFollowers: Number(e.target.value) } })}
                    min="0" />
                </div>
                <div className="camp-form-group">
                  <label>Min Engagement Rate (%)</label>
                  <input type="number" className="camp-form-input" value={form.eligibility.minEngagementRate}
                    onChange={e => setForm({ ...form, eligibility: { ...form.eligibility, minEngagementRate: Number(e.target.value) } })}
                    min="0" step="0.1" />
                </div>
              </div>

              <div className="camp-form-group">
                <label>Status</label>
                <select className="camp-form-select" value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active (Visible)</option>
                  <option value="draft">Draft (Hidden)</option>
                </select>
              </div>

              <div className="camp-form-actions">
                <button type="button" className="camp-form-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="camp-form-submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="camp-modal-overlay" onClick={() => setShowApplyModal(null)}>
          <div className="camp-modal camp-apply-modal" onClick={e => e.stopPropagation()}>
            <h3>Apply to Campaign</h3>
            <div className="camp-apply-campaign-info">
              <strong>{showApplyModal.title}</strong>
              <br />Budget: {formatBudget(showApplyModal.budget)} &bull; Deadline: {formatDate(showApplyModal.deadline)}
            </div>
            <form onSubmit={handleApply}>
              <div className="camp-form-group">
                <label>Your Message *</label>
                <textarea className="camp-form-textarea" value={applyForm.message}
                  onChange={e => setApplyForm({ ...applyForm, message: e.target.value })}
                  placeholder="Tell the brand why you're a great fit for this campaign..." required />
              </div>
              <div className="camp-form-group">
                <label>Proposed Rate (₹)</label>
                <input type="number" className="camp-form-input" value={applyForm.proposedRate}
                  onChange={e => setApplyForm({ ...applyForm, proposedRate: e.target.value })}
                  placeholder="Your rate for this campaign" min="0" />
              </div>
              <div className="camp-form-group">
                <label>Proposed Deliverables (comma-separated)</label>
                <input className="camp-form-input" value={applyForm.proposedDeliverables}
                  onChange={e => setApplyForm({ ...applyForm, proposedDeliverables: e.target.value })}
                  placeholder="e.g. 2 Reels, 3 Stories, 1 Post" />
              </div>
              <div className="camp-form-group">
                <label>Portfolio Links (comma-separated)</label>
                <input className="camp-form-input" value={applyForm.portfolioLinks}
                  onChange={e => setApplyForm({ ...applyForm, portfolioLinks: e.target.value })}
                  placeholder="https://instagram.com/yourwork" />
              </div>
              <div className="camp-form-actions">
                <button type="button" className="camp-form-cancel" onClick={() => setShowApplyModal(null)}>Cancel</button>
                <button type="submit" className="camp-form-submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Campaign Detail Modal */}
      {showDetailModal && (
        <CampaignDetailModal
          campaign={showDetailModal}
          onClose={() => setShowDetailModal(null)}
          onApply={() => { setShowDetailModal(null); setShowApplyModal(showDetailModal); }}
          isBrand={isBrand}
          isInfluencer={isInfluencer}
          navigate={navigate}
        />
      )}
    </div>
  );
};

/* ============= Campaign Card Component ============= */
const CampaignCard = ({ campaign, isBrand, onView, onApply, onEdit, isRecommended }) => {
  const statusClass = `camp-card-status camp-status-${campaign.status || 'active'}`;

  return (
    <div className="camp-card" onClick={onView}>
      {isRecommended && <span className="camp-match-badge"><Star size={12} /> Recommended</span>}
      <div className="camp-card-header">
        <div>
          <h3 className="camp-card-title">{campaign.title}</h3>
          {campaign.brand?.name || campaign.brandProfile?.companyName ? (
            <p className="camp-card-brand">
              by {campaign.brandProfile?.companyName || campaign.brand?.name}
            </p>
          ) : null}
        </div>
        <span className={statusClass}>{campaign.status}</span>
      </div>

      <p className="camp-card-desc">{campaign.description}</p>

      <div className="camp-card-tags">
        {campaign.category && <span className="camp-tag"><Tag size={10} /> {campaign.category}</span>}
        {campaign.platformType && campaign.platformType !== 'Any' && (
          <span className="camp-tag">{campaign.platformType}</span>
        )}
        {campaign.tags?.slice(0, 2).map((tag, i) => (
          <span key={i} className="camp-tag">{tag}</span>
        ))}
      </div>

      <div className="camp-card-meta">
        <span className="camp-card-budget">
          <DollarSign size={14} />
          {campaign.budget ? `₹${campaign.budget.min?.toLocaleString()} - ₹${campaign.budget.max?.toLocaleString()}` : 'N/A'}
        </span>
        <span className="camp-card-deadline">
          <Calendar size={14} />
          {campaign.deadline ? new Date(campaign.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
        </span>
      </div>

      {(campaign.applicationCount !== undefined || campaign.viewCount !== undefined) && (
        <div className="camp-card-stats">
          {campaign.applicationCount !== undefined && (
            <span className="camp-card-stat"><Users size={12} /> <strong>{campaign.applicationCount}</strong> applicants</span>
          )}
          {campaign.viewCount !== undefined && (
            <span className="camp-card-stat"><Eye size={12} /> <strong>{campaign.viewCount}</strong> views</span>
          )}
        </div>
      )}

      <div className="camp-card-actions" onClick={e => e.stopPropagation()}>
        <button className="camp-view-btn" onClick={onView}>View Details</button>
        {isBrand ? (
          <button className="camp-apply-btn" onClick={onEdit}>Edit</button>
        ) : (
          <button className="camp-apply-btn" onClick={onApply}
            disabled={campaign.status !== 'active'}>
            Apply Now
          </button>
        )}
      </div>
    </div>
  );
};

/* ============= Campaign Detail Modal ============= */
const CampaignDetailModal = ({ campaign, onClose, onApply, isBrand, isInfluencer, navigate }) => {
  return (
    <div className="camp-modal-overlay" onClick={onClose}>
      <div className="camp-modal camp-detail-modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <h2 className="camp-detail-title">{campaign.title}</h2>
            <p className="camp-detail-brand">
              by {campaign.brandProfile?.companyName || campaign.brand?.name || 'Brand'}
              <span className={`camp-card-status camp-status-${campaign.status}`} style={{ marginLeft: '0.75rem' }}>
                {campaign.status}
              </span>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div className="camp-detail-grid">
          <div className="camp-detail-item">
            <span className="label">Budget</span>
            <span className="value">
              {campaign.budget ? `₹${campaign.budget.min?.toLocaleString()} - ₹${campaign.budget.max?.toLocaleString()}` : 'N/A'}
            </span>
          </div>
          <div className="camp-detail-item">
            <span className="label">Deadline</span>
            <span className="value">
              {campaign.deadline ? new Date(campaign.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
            </span>
          </div>
          <div className="camp-detail-item">
            <span className="label">Category</span>
            <span className="value">{campaign.category || 'N/A'}</span>
          </div>
          <div className="camp-detail-item">
            <span className="label">Platform</span>
            <span className="value">{campaign.platformType || 'Any'}</span>
          </div>
          <div className="camp-detail-item">
            <span className="label">Applications</span>
            <span className="value">{campaign.applicationCount || 0} / {campaign.maxInfluencers || 10}</span>
          </div>
          <div className="camp-detail-item">
            <span className="label">Status</span>
            <span className="value" style={{ textTransform: 'capitalize' }}>{campaign.status}</span>
          </div>
        </div>

        <div className="camp-detail-section">
          <h4>Description</h4>
          <p>{campaign.description}</p>
        </div>

        {campaign.deliverables?.length > 0 && (
          <div className="camp-detail-section">
            <h4>Deliverables</h4>
            <ul className="camp-deliverables-list">
              {campaign.deliverables.map((d, i) => (
                <li key={i}>
                  <CheckCircle size={14} />
                  {d.quantity > 1 ? `${d.quantity}x ` : ''}{d.type}{d.description ? ` — ${d.description}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        {campaign.eligibility && (
          <div className="camp-detail-section">
            <h4>Eligibility Requirements</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {campaign.eligibility.minFollowers > 0 && (
                <span className="camp-tag"><Users size={10} /> {campaign.eligibility.minFollowers.toLocaleString()}+ followers</span>
              )}
              {campaign.eligibility.minEngagementRate > 0 && (
                <span className="camp-tag"><TrendingUp size={10} /> {campaign.eligibility.minEngagementRate}%+ engagement</span>
              )}
              {campaign.eligibility.minTrustScore > 0 && (
                <span className="camp-tag"><Star size={10} /> {campaign.eligibility.minTrustScore}+ trust score</span>
              )}
              {campaign.eligibility.requiredNiches?.map((n, i) => (
                <span key={i} className="camp-tag">{n}</span>
              ))}
            </div>
          </div>
        )}

        {campaign.tags?.length > 0 && (
          <div className="camp-detail-section">
            <h4>Tags</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {campaign.tags.map((tag, i) => <span key={i} className="camp-tag">{tag}</span>)}
            </div>
          </div>
        )}

        <div className="camp-form-actions">
          <button className="camp-form-cancel" onClick={onClose}>Close</button>
          {isInfluencer && campaign.status === 'active' && (
            <button className="camp-form-submit" onClick={onApply}>Apply Now</button>
          )}
          {isBrand && (
            <button className="camp-form-submit" onClick={() => { onClose(); navigate(`/campaigns/${campaign._id}`); }}>
              Manage Campaign
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Campaigns;
