import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import {
  ArrowLeft,
  MapPin,
  CheckCircle,
  Briefcase,
  Link as LinkIcon,
  Loader,
  TrendingUp,
  DollarSign,
  BadgeIndianRupee,
  Star,
  Target
} from 'lucide-react';
import './BrandDetail.css';

const BrandDetail = () => {
  const { id } = useParams();
  const { getBrandById } = useData();
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatBudget = (budget) => {
    if (!budget) return 'Not set';
    if (typeof budget === 'object') {
      const min = budget.min ?? 0;
      const max = budget.max ?? 0;
      if (!min && !max) return 'Not set';
      return `₹${Number(min).toLocaleString()} - ₹${Number(max).toLocaleString()}`;
    }
    return `₹${Number(budget).toLocaleString()}`;
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getBrandById(id);
        if (!cancelled) setBrand(data || null);
      } catch (err) {
        console.error('Failed to load brand profile:', err);
        if (!cancelled) setBrand(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="bdet-not-found">
        <Loader size={48} className="spin-animation" />
        <p>Loading brand profile…</p>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="bdet-not-found">
        <h2>Brand not found</h2>
        <Link to="/brands" className="btn btn-primary">Back to Brands</Link>
      </div>
    );
  }

  const preferredNiches = Array.isArray(brand.preferredNiches) ? brand.preferredNiches : [];
  const preferredPlatforms = Array.isArray(brand.preferredPlatforms) ? brand.preferredPlatforms : [];
  const monthlyBudget = brand.monthlyBudget;
  const contact = brand.contactPerson || {};

  return (
    <div className="bdet-page">
      <div className="bdet-container">
        <Link to="/brands" className="bdet-back-link">
          <ArrowLeft size={18} /> Back to Brands
        </Link>

        <div className="bdet-body">
          <aside className="bdet-sidebar">
            <div className="bdet-sidebar-photo">
              {brand.logo ? (
                <img src={brand.logo} alt={brand.companyName} />
              ) : (
                <div className="bdet-sidebar-photo-placeholder">
                  {brand.companyName?.charAt(0) || '?'}
                </div>
              )}
            </div>

            <h2 className="bdet-sidebar-name">{brand.companyName || 'Brand'}</h2>

            {brand.industry && (
              <div className="bdet-sidebar-meta">
                <Briefcase size={15} />
                <span>{brand.industry}</span>
              </div>
            )}

            {brand.location && (
              <div className="bdet-sidebar-meta">
                <MapPin size={15} />
                <span>{brand.location}</span>
              </div>
            )}

            {brand.isVerified && (
              <div className="bdet-sidebar-meta">
                <CheckCircle size={15} />
                <span>Verified brand</span>
              </div>
            )}

            {brand.websiteUrl && (
              <a href={brand.websiteUrl} target="_blank" rel="noreferrer" className="bdet-contact-btn">
                <LinkIcon size={16} /> Visit Website
              </a>
            )}
          </aside>

          <main className="bdet-main">
            <div className="bdet-stats-bar">
              <div className="bdet-stat-pill">
                <div className="bdet-stat-pill-val">{formatBudget(monthlyBudget)}</div>
                <div className="bdet-stat-pill-lbl">Monthly Budget</div>
                <div className="bdet-stat-pill-icon bdet-budget-icon"><BadgeIndianRupee size={20} /></div>
              </div>
              <div className="bdet-stat-pill bdet-stat-highlight">
                <div className="bdet-stat-pill-val">{brand.activeCampaigns || 0}</div>
                <div className="bdet-stat-pill-lbl">Active Campaigns</div>
                <div className="bdet-stat-pill-icon bdet-active-icon"><TrendingUp size={20} /></div>
              </div>
              <div className="bdet-stat-pill">
                <div className="bdet-stat-pill-val">{brand.completedCampaigns || 0}</div>
                <div className="bdet-stat-pill-lbl">Completed Campaigns</div>
                <div className="bdet-stat-pill-icon bdet-campaign-icon"><Briefcase size={20} /></div>
              </div>
            </div>

            <section className="bdet-section-card bdet-about-card">
              <h3 className="bdet-sec-title">About</h3>
              <p className="bdet-bio-text">{brand.description || 'No description provided.'}</p>
            </section>

            <div className="bdet-twin-row">
              <section className="bdet-section-card bdet-contacts-card">
                <h3 className="bdet-sec-title">Contact</h3>
                <div className="bdet-contact-list">
                  <div className="bdet-contact-row">
                    <span className="bdet-contact-label">Contact Person</span>
                    <span className="bdet-contact-value">{contact.name || 'Not set'}</span>
                  </div>
                  <div className="bdet-contact-row">
                    <span className="bdet-contact-label">Email</span>
                    <span className="bdet-contact-value">{contact.email || 'Not set'}</span>
                  </div>
                  <div className="bdet-contact-row">
                    <span className="bdet-contact-label">Phone</span>
                    <span className="bdet-contact-value">{contact.phone || 'Not set'}</span>
                  </div>
                  <div className="bdet-contact-row">
                    <span className="bdet-contact-label">Website</span>
                    <span className="bdet-contact-value">{brand.websiteUrl || 'Not set'}</span>
                  </div>
                </div>
              </section>

              <section className="bdet-section-card bdet-campaign-card">
                <div className="bdet-campaign-head">
                  <h3 className="bdet-sec-title">Brand Activity</h3>
                  <span className="bdet-campaign-count">{brand.totalReviews || 0}</span>
                </div>
                <div className="bdet-campaign-done">
                  <Target size={28} />
                  <span>{brand.totalReviews || 0} reviews and ratings recorded</span>
                </div>
                <div className="bdet-campaign-empty">
                  <p>{brand.averageRating ? `Average rating ${Number(brand.averageRating).toFixed(1)}` : 'No rating data available yet'}</p>
                </div>
              </section>
            </div>

            <section className="bdet-section-card bdet-commercials">
              <h3 className="bdet-commercials-title">Preferences</h3>
              <div className="bdet-preference-grid">
                <div>
                  <h4>Preferred Niches</h4>
                  <p>{preferredNiches.length > 0 ? preferredNiches.join(', ') : 'Not set'}</p>
                </div>
                <div>
                  <h4>Preferred Platforms</h4>
                  <p>{preferredPlatforms.length > 0 ? preferredPlatforms.join(', ') : 'Not set'}</p>
                </div>
              </div>
            </section>

            <section className="bdet-section-card bdet-summary-card">
              <h3 className="bdet-sec-title">Summary</h3>
              <div className="bdet-summary-grid">
                <div className="bdet-summary-item">
                  <span className="bdet-summary-label">Industry</span>
                  <strong>{brand.industry || 'Not set'}</strong>
                </div>
                <div className="bdet-summary-item">
                  <span className="bdet-summary-label">Location</span>
                  <strong>{brand.location || 'Not set'}</strong>
                </div>
                <div className="bdet-summary-item">
                  <span className="bdet-summary-label">Rating</span>
                  <strong className="bdet-rating"><Star size={14} /> {Number(brand.averageRating || 0).toFixed(1)}</strong>
                </div>
                <div className="bdet-summary-item">
                  <span className="bdet-summary-label">Total Spent</span>
                  <strong>₹{Number(brand.totalSpent || 0).toLocaleString()}</strong>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default BrandDetail;
