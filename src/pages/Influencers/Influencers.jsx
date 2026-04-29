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
  Loader
} from 'lucide-react';
import Avatar from '../../components/common/Avatar';
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
              <div className="inf-card-left">
                <div className="inf-avatar-wrapper">
                <Avatar
                  src={influencer.avatar}
                  alt={influencer.name}
                  name={influencer.name}
                  size="md"
                  className="inf-avatar"
                />
                {influencer.isVerified && (
                  <span className="inf-verified-badge">
                    <CheckCircle size={14} />
                  </span>
                )}
                </div>
                <div className="inf-platform-badge">
                  {platformIcons[influencer.platformType] || influencer.platformType}
                </div>
              </div>

              <div className="inf-card-right">
                <div className="inf-title-row">
                  <h3 className="inf-name">{influencer.name}</h3>
                  <span className="inf-handle-line">
                    @{influencer.instagramData?.username || influencer.instagramUsername || influencer.name?.split(' ')[0]}
                  </span>
                </div>

                {influencer.bio && (
                  <p className="inf-description small">{influencer.bio.slice(0, 120)}{influencer.bio.length > 120 ? '...' : ''}</p>
                )}

                <div className="inf-row-stats">
                  <div className="inf-row-stat">
                    <strong>{influencer.instagramStats?.posts ?? influencer.instagramData?.recentMedia?.length ?? 0}</strong>
                    <span>posts</span>
                  </div>
                  <div className="inf-row-stat">
                    <strong>{formatFollowers(influencer.instagramStats?.followers ?? influencer.totalFollowers)}</strong>
                    <span>followers</span>
                  </div>
                  <div className="inf-row-stat">
                    <strong>{influencer.instagramStats?.following ?? '-'}</strong>
                    <span>following</span>
                  </div>
                </div>

                <div className="inf-meta-row">
                  {influencer.location && <span className="inf-meta-item"><MapPin size={12} /> {influencer.location}</span>}
                  {influencer.averageEngagementRate != null && <span className="inf-meta-item"><TrendingUp size={12} /> {influencer.averageEngagementRate?.toFixed(1)}%</span>}
                  <span className="inf-meta-item">Trust: {influencer.trustScore ?? 50}</span>
                </div>

                <div className="inf-card-footer">
                  <span className="inf-view-profile">View Profile →</span>
                </div>
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
