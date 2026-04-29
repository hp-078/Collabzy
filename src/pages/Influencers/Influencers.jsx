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
  ShieldCheck,
  ArrowRight,
  BadgeCheck
} from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import './Influencers.css';

const platformIcons = {
  Instagram: <Instagram size={18} />,
  YouTube: <Youtube size={18} />,
  TikTok: <span className="tiktok-icon">📱</span>,
  Multiple: <><Youtube size={16} /><Instagram size={16} /></>,
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
            <div
              key={influencer._id}
              className="inf-card"
            >
              <div className="inf-card-content-wrapper">
                {/* Left Panel - Avatar & Platform */}
                <div className="inf-card-left">
                  <div className="inf-platform-badge">
                    {platformIcons[influencer.platformType] || influencer.platformType}
                  </div>
                  <div className="inf-avatar-wrapper">
                    <Avatar
                      src={influencer.avatar}
                      alt={influencer.name}
                      name={influencer.name}
                      size="sm"
                      className="inf-avatar"
                    />
                  </div>
                </div>

                {/* Right Panel - Info */}
                <div className="inf-card-right">
                  <div className="inf-title-section">
                    <div className="inf-name-row">
                      <h3 className="inf-name">{influencer.name}</h3>
                      {influencer.isVerified && (
                        <span className="inf-verified-badge">
                          <BadgeCheck size={22} fill="#FF6B8A" color="white" />
                        </span>
                      )}
                    </div>
                    <span className="inf-handle-line">
                      @{influencer.instagramData?.username || influencer.instagramUsername || influencer.name?.split(' ')[0]?.toLowerCase()}
                    </span>
                  </div>

                  {influencer.bio && (
                    <p className="inf-bio">{influencer.bio.slice(0, 80)}{influencer.bio.length > 80 ? '...' : ''}</p>
                  )}

                  {/* Stats Row - Posts | Followers | Following */}
                  <div className="inf-row-stats">
                    <div className="inf-row-stat">
                      <strong>{influencer.instagramStats?.posts ?? influencer.instagramData?.recentMedia?.length ?? 0}</strong>
                      <span>Posts</span>
                    </div>
                    <div className="inf-stat-divider"></div>
                    <div className="inf-row-stat">
                      <strong>{formatFollowers(influencer.instagramStats?.followers ?? influencer.totalFollowers)}</strong>
                      <span>Followers</span>
                    </div>
                    <div className="inf-stat-divider"></div>
                    <div className="inf-row-stat">
                      <strong>{influencer.instagramStats?.following ?? '-'}</strong>
                      <span>Following</span>
                    </div>
                  </div>

                  {/* Meta Row - Location, Growth, Trust */}
                  <div className="inf-meta-row">
                    {influencer.location && (
                      <>
                        <span className="inf-meta-item">
                          <MapPin size={16} className="inf-meta-icon location" />
                          <span>{influencer.location}</span>
                        </span>
                        {(influencer.averageEngagementRate != null || influencer.trustScore != null) && <div className="inf-meta-divider"></div>}
                      </>
                    )}
                    {influencer.averageEngagementRate != null && (
                      <>
                        <span className="inf-meta-item">
                          <TrendingUp size={16} className="inf-meta-icon growth" />
                          <span className="inf-meta-value">{influencer.averageEngagementRate?.toFixed(1)}%</span>
                          <span className="inf-meta-label">Growth</span>
                        </span>
                        {influencer.trustScore != null && <div className="inf-meta-divider"></div>}
                      </>
                    )}
                    <span className="inf-meta-item">
                      <ShieldCheck size={16} className="inf-meta-icon trust" />
                      <span className="inf-meta-value">{influencer.trustScore ?? 50}</span>
                      <span className="inf-meta-label">Trust Score</span>
                    </span>
                  </div>
                  
                  {/* Footer - View Profile Button */}
                  <div className="inf-card-footer">
                    <Link
                      to={`/influencer/${influencer._id}`}
                      className="inf-view-profile"
                    >
                      View Profile <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
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
