import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Search, Briefcase, Users, TrendingUp, Loader, Star, MapPin
} from 'lucide-react';
import './Brands.css';

const Brands = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { fetchBrands } = useData();

  const [loading, setLoading] = useState(true);
  const [allBrands, setAllBrands] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadBrands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const loadBrands = async () => {
    setLoading(true);
    try {
      const brands = await (fetchBrands ? fetchBrands({}) : []);
      setAllBrands(Array.isArray(brands) ? brands : []);
    } catch (err) {
      console.error('Error loading brands:', err);
      setAllBrands([]);
    }
    setLoading(false);
  };

  const filteredBrands = allBrands.filter(brand =>
    ((brand.companyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (brand.description || '').toLowerCase().includes(searchQuery.toLowerCase())) &&
    (!selectedIndustry || brand.industry === selectedIndustry) &&
    (!selectedPlatform || (brand.preferredPlatforms || []).includes(selectedPlatform))
  );

  if (loading) {
    return (
      <div className="brd-page">
        <div className="brd-container">
          <div className="brd-loading">
            <Loader size={48} className="spin-animation" />
            <p>Loading brands...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="brd-page">
      <div className="brd-container">
        {/* Header */}
        <div className="brd-header">
          <div className="brd-header-content">
            <h1>Discover Brands</h1>
            <p>Find and manage brands for collaborations</p>
          </div>
          <div className="brd-header-stats">
            <div className="brd-stat-badge">
              <Briefcase size={18} />
              <span>{allBrands.length} Brands</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="brd-filters-section">
          <div className="brd-search-bar">
            <Search size={20} className="brd-search-icon" />
            <input
              type="text"
              placeholder="Search brands by name or niche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="brd-search-input"
            />
          </div>

          <button
            className="brd-filter-toggle btn btn-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="brd-filters-panel">
            <div className="brd-filter-group">
              <label>Industry</label>
              <select value={selectedIndustry} onChange={(e) => setSelectedIndustry(e.target.value)} className="brd-filter-select">
                <option value="">All Industries</option>
                {[...new Set(allBrands.map(b => b.industry).filter(Boolean))].map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div className="brd-filter-group">
              <label>Preferred Platform</label>
              <select value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value)} className="brd-filter-select">
                <option value="">All Platforms</option>
                {[...new Set(allBrands.flatMap(b => b.preferredPlatforms || []))].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedIndustry(''); setSelectedPlatform(''); setSearchQuery(''); }}>
              Clear Filters
            </button>
          </div>
        )}

        <div className="brd-results-info">
          <span>Showing {filteredBrands.length} brands</span>
          {(searchQuery || selectedIndustry || selectedPlatform) && (
            <button className="brd-clear-btn" onClick={() => { setSearchQuery(''); setSelectedIndustry(''); setSelectedPlatform(''); }}>
              Clear all filters
            </button>
          )}
        </div>

        {/* Brands Grid (use influencer card styling) */}
        <div className="brd-grid">
          {filteredBrands.map((brand) => (
            <Link key={brand._id} to={`/brand/${brand._id}`} className="brd-card">
              <div className="brd-card-header">
                <div className="brd-avatar-wrapper">
                  {brand.logo ? (
                    <img src={brand.logo} alt={brand.companyName} className="brd-avatar" />
                  ) : (
                    <div className="brd-avatar-placeholder">{(brand.companyName || 'B').charAt(0)}</div>
                  )}
                </div>
                <div className="brd-platform-badge">Brand</div>
              </div>

              <div className="brd-card-body">
                <h3 className="brd-name">{brand.companyName || 'Unknown Brand'}</h3>
                <p className="brd-niche">{brand.industry || 'Industry not set'}</p>

                {brand.location && (
                  <div className="brd-location">
                    <MapPin size={14} />
                    <span>{brand.location}</span>
                  </div>
                )}

                {brand.description && (
                  <p className="brd-description">{brand.description.slice(0, 120)}{brand.description.length > 120 ? '...' : ''}</p>
                )}

                <div className="brd-stats">
                  <div className="brd-stat">
                    <Users size={16} />
                    <span>{brand.activeCampaigns || 0} active</span>
                  </div>
                  <div className="brd-stat">
                    <TrendingUp size={16} />
                    <span>{brand.completedCampaigns || 0} completed</span>
                  </div>
                  <div className="brd-stat brd-trust-score">
                    <Star size={16} />
                    <span>{brand.averageRating?.toFixed(1) || '0.0'}</span>
                  </div>
                </div>
              </div>

              <div className="brd-card-footer">
                <span className="brd-view-profile">View Brand →</span>
              </div>
            </Link>
          ))}
        </div>

        {filteredBrands.length === 0 && (
          <div className="brd-no-results">
            <Briefcase size={48} />
            <h3>No brands found</h3>
            <p>Try adjusting your search or filters</p>
            <button className="btn btn-primary" onClick={() => { setSearchQuery(''); setSelectedIndustry(''); setSelectedPlatform(''); }}>
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Brands;
