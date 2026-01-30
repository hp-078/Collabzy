import { useState } from 'react';
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
  Twitter
} from 'lucide-react';
import './Influencers.css';

const platformIcons = {
  Instagram: <Instagram size={16} />,
  YouTube: <Youtube size={16} />,
  Twitter: <Twitter size={16} />,
  TikTok: <span>📱</span>,
};

const Influencers = () => {
  const { influencers } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const niches = [...new Set(influencers.map(i => i.niche))];
  const platforms = [...new Set(influencers.map(i => i.platform))];

  const filteredInfluencers = influencers.filter(influencer => {
    const matchesSearch = influencer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         influencer.niche.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNiche = !selectedNiche || influencer.niche === selectedNiche;
    const matchesPlatform = !selectedPlatform || influencer.platform === selectedPlatform;
    
    return matchesSearch && matchesNiche && matchesPlatform;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedNiche('');
    setSelectedPlatform('');
  };

  return (
    <div className="influencers-page">
      <div className="influencers-container">
        {/* Header */}
        <div className="influencers-header">
          <div className="header-content">
            <h1>Discover Influencers</h1>
            <p>Find the perfect influencer for your brand collaboration</p>
          </div>
          <div className="header-stats">
            <div className="stat-badge">
              <Users size={18} />
              <span>{influencers.length} Influencers</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="filters-section">
          <div className="search-bar">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name or niche..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <button 
            className="filter-toggle btn btn-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filter-group">
              <label>Niche</label>
              <select 
                value={selectedNiche}
                onChange={(e) => setSelectedNiche(e.target.value)}
                className="filter-select"
              >
                <option value="">All Niches</option>
                {niches.map(niche => (
                  <option key={niche} value={niche}>{niche}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Platform</label>
              <select 
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="filter-select"
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
        <div className="results-info">
          <span>Showing {filteredInfluencers.length} influencers</span>
          {(searchTerm || selectedNiche || selectedPlatform) && (
            <button className="clear-btn" onClick={clearFilters}>
              Clear all filters
            </button>
          )}
        </div>

        {/* Influencer Grid */}
        <div className="influencer-grid">
          {filteredInfluencers.map((influencer) => (
            <Link 
              key={influencer.id} 
              to={`/influencer/${influencer.id}`}
              className="influencer-card"
            >
              <div className="card-header">
                <div className="avatar-wrapper">
                  <img 
                    src={influencer.avatar} 
                    alt={influencer.name}
                    className="influencer-avatar"
                  />
                  {influencer.verified && (
                    <span className="verified-badge">
                      <CheckCircle size={16} />
                    </span>
                  )}
                </div>
                <div className="platform-badge">
                  {platformIcons[influencer.platform] || influencer.platform}
                </div>
              </div>
              
              <div className="card-body">
                <h3 className="influencer-name">{influencer.name}</h3>
                <p className="influencer-niche">{influencer.niche}</p>
                
                <div className="influencer-location">
                  <MapPin size={14} />
                  <span>{influencer.location}</span>
                </div>

                <p className="influencer-description">
                  {influencer.description.slice(0, 100)}...
                </p>

                <div className="influencer-stats">
                  <div className="stat">
                    <Users size={16} />
                    <span>{influencer.followers}</span>
                  </div>
                  <div className="stat">
                    <Star size={16} fill="currentColor" />
                    <span>{influencer.rating}</span>
                  </div>
                </div>

                {influencer.services && influencer.services.length > 0 && (
                  <div className="price-range">
                    Starting from <strong>${Math.min(...influencer.services.map(s => s.price))}</strong>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <span className="view-profile">View Profile →</span>
              </div>
            </Link>
          ))}
        </div>

        {filteredInfluencers.length === 0 && (
          <div className="no-results">
            <Users size={48} />
            <h3>No influencers found</h3>
            <p>Try adjusting your search or filters</p>
            <button className="btn btn-primary" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Influencers;
