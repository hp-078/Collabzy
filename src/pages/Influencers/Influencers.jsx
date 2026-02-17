import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { 
  Search, 
  Filter, 
  Users, 
  Star, 
  CheckCircle,
  MapPin,
  Instagram,
  Youtube,
  TrendingUp,
  Loader,
  X
} from 'lucide-react';
import './Influencers.css';

const platformIcons = {
  Instagram: <Instagram size={16} />,
  YouTube: <Youtube size={16} />,
  TikTok: <span className="tiktok-icon">📱</span>,
  Multiple: <><Youtube size={14} /><Instagram size={14} /></>,
};

const formatFollowers = (count) => {
  if (!count || count === 0) return 'N/A';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

const Influencers = () => {
  const { influencers, loading, error, fetchInfluencers } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);

  // Fetch influencers on mount
  useEffect(() => {
    const loadInfluencers = async () => {
      setLocalLoading(true);
      await fetchInfluencers();
      setLocalLoading(false);
    };
    loadInfluencers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const niches = [...new Set(influencers.flatMap(i => {
    if (Array.isArray(i.niche)) return i.niche;
    if (i.niche) return [i.niche];
    return [];
  }))].filter(Boolean);
  const platforms = [...new Set(influencers.map(i => i.platformType))].filter(Boolean);

  const filteredInfluencers = influencers.filter(influencer => {
    const nicheStr = Array.isArray(influencer.niche) ? influencer.niche.join(' ') : (influencer.niche || '');
    const matchesSearch = influencer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         nicheStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         influencer.bio?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNiche = !selectedNiche || (
      Array.isArray(influencer.niche)
        ? influencer.niche.includes(selectedNiche)
        : influencer.niche === selectedNiche
    );
    const matchesPlatform = !selectedPlatform || influencer.platformType === selectedPlatform;
    
    return matchesSearch && matchesNiche && matchesPlatform;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedNiche('');
    setSelectedPlatform('');
  };

  return (
    <div className="inf-page">
      <div className="inf-container">
        {/* Header */}
        <div className="inf-header">
          <div className="inf-header-content">
            <h1>Discover Influencers</h1>
            <p>Find the perfect influencer for your brand collaboration</p>
          </div>
          <div className="inf-header-stats">
            <div className="inf-stat-badge">
              <Users size={18} />
              <span>{influencers.length} Influencers</span>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="inf-error-message">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {(loading || localLoading) && (
          <div className="inf-loading">
            <Loader size={48} className="spin-animation" />
            <p>Loading influencers...</p>
          </div>
        )}

        {/* Content - only show when not loading */}
        {!loading && !localLoading && (
          <>
            {/* Search and Filters */}
            <div className="inf-filters-section">
          <div className="inf-search-bar">
            <Search size={20} className="inf-search-icon" />
            <input
              type="text"
              placeholder="Search by name or niche..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="inf-search-input"
            />
          </div>
          
          <button 
            className="inf-filter-toggle btn btn-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="inf-filters-panel">
            <div className="inf-filter-group">
              <label>Niche</label>
              <select 
                value={selectedNiche}
                onChange={(e) => setSelectedNiche(e.target.value)}
                className="inf-filter-select"
              >
                <option value="">All Niches</option>
                {niches.map(niche => (
                  <option key={niche} value={niche}>{niche}</option>
                ))}
              </select>
            </div>

            <div className="inf-filter-group">
              <label>Platform</label>
              <select 
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="inf-filter-select"
              >
                <option value="">All Platforms</option>
                {platforms.map(platform => (
                  <option key={platform} value={platform}>{platform}</option>
                ))}
              </select>
            </div>

            <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        )}

        {/* Results Info */}
        <div className="inf-results-info">
          <span>Showing {filteredInfluencers.length} influencers</span>
          {(searchTerm || selectedNiche || selectedPlatform) && (
            <button className="inf-clear-btn" onClick={clearFilters}>
              Clear all filters
            </button>
          )}
        </div>

        {/* Influencer Grid */}
        <div className="inf-grid">
          {filteredInfluencers.map((influencer) => (
            <Link 
              key={influencer._id} 
              to={`/influencer/${influencer._id}`}
              className="inf-card"
            >
              <div className="inf-card-header">
                <div className="inf-avatar-wrapper">
                  {influencer.avatar ? (
                    <img 
                      src={influencer.avatar} 
                      alt={influencer.name}
                      className="inf-avatar"
                    />
                  ) : (
                    <div className="inf-avatar-placeholder">
                      {influencer.name?.charAt(0) || 'I'}
                    </div>
                  )}
                  {influencer.isVerified && (
                    <span className="inf-verified-badge">
                      <CheckCircle size={16} />
                    </span>
                  )}
                </div>
                <div className="inf-platform-badge">
                  {platformIcons[influencer.platformType] || influencer.platformType}
                </div>
              </div>
              
              <div className="inf-card-body">
                <h3 className="inf-name">{influencer.name}</h3>
                <p className="inf-niche">
                  {Array.isArray(influencer.niche) ? influencer.niche.join(', ') : influencer.niche || 'No niche specified'}
                </p>
                
                {influencer.location && (
                  <div className="inf-location">
                    <MapPin size={14} />
                    <span>{influencer.location}</span>
                  </div>
                )}

                {/* Social Media Handles */}
                <div className="inf-social-handles">
                  {influencer.instagramUsername && (
                    <span className="inf-handle">
                      <Instagram size={12} />
                      @{influencer.instagramUsername}
                    </span>
                  )}
                  {influencer.youtubeUrl && (
                    <span className="inf-handle">
                      <Youtube size={12} />
                      YouTube
                    </span>
                  )}
                </div>

                {influencer.bio && (
                  <p className="inf-description">
                    {influencer.bio.slice(0, 100)}
                    {influencer.bio.length > 100 ? '...' : ''}
                  </p>
                )}

                <div className="inf-stats">
                  <div className="inf-stat">
                    <Users size={16} />
                    <span>{formatFollowers(influencer.totalFollowers)}</span>
                  </div>
                  <div className="inf-stat">
                    <TrendingUp size={16} />
                    <span>{influencer.averageEngagementRate?.toFixed(1) || '0'}%</span>
                  </div>
                  <div className="inf-stat inf-trust-score">
                    <Star size={16} fill="currentColor" />
                    <span>{influencer.trustScore || 50}</span>
                  </div>
                </div>

                {influencer.services && influencer.services.length > 0 && (
                  <div className="inf-price-range">
                    Starting from <strong>${Math.min(...influencer.services.map(s => s.price)).toLocaleString()}</strong>
                  </div>
                )}
              </div>

              <div className="inf-card-footer">
                <span className="inf-view-profile">View Profile →</span>
              </div>
            </Link>
          ))}
        </div>

        {filteredInfluencers.length === 0 && (
          <div className="inf-no-results">
            <Users size={48} />
            <h3>No influencers found</h3>
            <p>Try adjusting your search or filters</p>
            <button className="btn btn-primary" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default Influencers;
