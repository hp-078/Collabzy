import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Star,
  Users,
  MapPin,
  CheckCircle,
  MessageSquare,
  Calendar,
  DollarSign,
  Send,
  X,
  Youtube,
  Instagram,
  TrendingUp,
  Eye,
  Users as UsersIcon,
  Heart,
  MessageCircle
} from 'lucide-react';
import './InfluencerDetail.css';

const InfluencerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { influencers, createCollaboration } = useData();
  const { user, isAuthenticated, isBrand } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [message, setMessage] = useState('');
  const [deadline, setDeadline] = useState('');

  const influencer = influencers.find(i => i._id === id);

  if (!influencer) {
    return (
      <div className="idet-not-found">
        <h2>Influencer not found</h2>
        <Link to="/influencers" className="btn btn-primary">
          Back to Influencers
        </Link>
      </div>
    );
  }

  const handleCollaborate = (service) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedService(service);
    setShowModal(true);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    
    if (!selectedService || !message) {
      alert('Please fill in all required fields');
      return;
    }

    const collaboration = {
      influencerId: influencer._id,
      service: selectedService.name,
      budget: selectedService.price,
      message: message,
      deadline: deadline,
    };

    const result = await createCollaboration(collaboration);
    
    if (result.success) {
      alert('✅ Collaboration request sent successfully! Check Messages to continue the conversation.');
      setShowModal(false);
      setMessage('');
      setDeadline('');
      navigate('/messages');
    } else {
      alert(`❌ Failed to send collaboration request!\n\n${result.error}\n\n✅ Solution:\n1. Open a new terminal\n2. cd backend\n3. npm run dev\n\nSee START_HERE.md for details`);
    }
  };

  return (
    <div className="idet-page">
      <div className="idet-container">
        {/* Back Button */}
        <Link to="/influencers" className="idet-back-link">
          <ArrowLeft size={20} />
          Back to Influencers
        </Link>

        {/* Profile Header */}
        <div className="idet-profile-header">
          <div className="idet-avatar-section">
            <div className="idet-avatar-wrapper">
              {influencer.avatar ? (
                <img 
                  src={influencer.avatar} 
                  alt={influencer.name}
                  className="idet-profile-avatar"
                />
              ) : (
                <div className="idet-profile-avatar" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white'
                }}>
                  {influencer.name?.charAt(0) || '?'}
                </div>
              )}
              {influencer.verified && (
                <span className="idet-verified-badge">
                  <CheckCircle size={24} />
                </span>
              )}
            </div>
          </div>
          
          <div className="idet-profile-info">
            <div className="idet-header-top">
              <div>
                <h1 className="idet-profile-name">{influencer.name}</h1>
                <p className="idet-profile-niche">{influencer.niche}</p>
              </div>
              {isBrand && (
                <button 
                  className="btn btn-primary"
                  onClick={() => handleCollaborate(influencer.services[0])}
                >
                  <MessageSquare size={18} />
                  Collaborate
                </button>
              )}
            </div>
            
            <div className="idet-profile-meta">
              <span className="idet-meta-item">
                <MapPin size={16} />
                {influencer.location}
              </span>
              <span className="idet-meta-item">
                <Calendar size={16} />
                Joined {influencer.joinedDate}
              </span>
            </div>

            <div className="idet-profile-stats">
              <div className="idet-stat-box">
                <Users size={24} />
                <div>
                  <span className="idet-stat-value">{influencer.followers}</span>
                  <span className="idet-stat-label">Followers</span>
                </div>
              </div>
              <div className="idet-stat-box">
                <Star size={24} fill="currentColor" />
                <div>
                  <span className="idet-stat-value">{influencer.rating}</span>
                  <span className="idet-stat-label">Rating</span>
                </div>
              </div>
              <div className="idet-stat-box">
                <CheckCircle size={24} />
                <div>
                  <span className="idet-stat-value">{influencer.pastCollabs?.length || 0}</span>
                  <span className="idet-stat-label">Collabs</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="idet-profile-content">
          <div className="idet-content-main">
            {/* About Section */}
            <section className="idet-section">
              <h2 className="idet-section-title">About</h2>
              <p className="idet-about-text">{influencer.description}</p>
            </section>

            {/* Services Section */}
            <section className="idet-section">
              <h2 className="idet-section-title">Services</h2>
              <div className="idet-services-grid">
                {influencer.services?.map((service) => (
                  <div key={service.id} className="idet-service-card">
                    <div className="idet-service-header">
                      <h3 className="idet-service-name">{service.name}</h3>
                      <span className="idet-service-price">
                        <DollarSign size={18} />
                        {service.price}
                      </span>
                    </div>
                    <p className="idet-service-description">{service.description}</p>
                    {isBrand && (
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => handleCollaborate(service)}
                      >
                        Request Service
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Past Collaborations */}
            {influencer.pastCollabs && influencer.pastCollabs.length > 0 && (
              <section className="idet-section">
                <h2 className="idet-section-title">Past Collaborations</h2>
                <div className="idet-collab-badges">
                  {influencer.pastCollabs.map((brand, index) => (
                    <span key={index} className="idet-collab-badge">{brand}</span>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="idet-sidebar">
            {/* YouTube Stats */}
            {influencer.youtubeStats && influencer.youtubeStats.subscribers > 0 && (
              <div className="idet-sidebar-card idet-youtube-card">
                <div className="idet-youtube-header">
                  <div className="idet-youtube-icon">
                    <Youtube size={22} />
                  </div>
                  <h3 className="idet-youtube-title">YouTube Analytics</h3>
                </div>
                
                <div className="idet-youtube-stats">
                  <div className="idet-youtube-stat">
                    <div className="idet-youtube-stat-left">
                      <div className="idet-youtube-stat-icon">
                        <UsersIcon size={18} />
                      </div>
                      <span className="idet-youtube-stat-label">Subscribers</span>
                    </div>
                    <span className="idet-youtube-stat-value">
                      {influencer.youtubeStats.subscribers?.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="idet-youtube-stat">
                    <div className="idet-youtube-stat-left">
                      <div className="idet-youtube-stat-icon">
                        <Eye size={18} />
                      </div>
                      <span className="idet-youtube-stat-label">Total Views</span>
                    </div>
                    <span className="idet-youtube-stat-value">
                      {influencer.youtubeStats.totalViews?.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="idet-youtube-stat">
                    <div className="idet-youtube-stat-left">
                      <div className="idet-youtube-stat-icon">
                        <Youtube size={18} />
                      </div>
                      <span className="idet-youtube-stat-label">Videos</span>
                    </div>
                    <span className="idet-youtube-stat-value">
                      {influencer.youtubeStats.videoCount}
                    </span>
                  </div>
                  
                  <div className="idet-youtube-stat">
                    <div className="idet-youtube-stat-left">
                      <div className="idet-youtube-stat-icon">
                        <TrendingUp size={18} />
                      </div>
                      <span className="idet-youtube-stat-label">Engagement</span>
                    </div>
                    <span className="idet-youtube-stat-value">
                      {influencer.youtubeStats.engagementRate?.toFixed(2)}%
                    </span>
                  </div>
                </div>
                
                {influencer.youtubeUrl && (
                  <a 
                    href={influencer.youtubeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="idet-youtube-button"
                  >
                    <Youtube size={18} />
                    Visit Channel
                  </a>
                )}
              </div>
            )}

            {/* Instagram Stats */}
            {influencer.instagramStats && influencer.instagramStats.followers > 0 && (
              <div className="idet-sidebar-card idet-instagram-card">
                <div className="idet-instagram-header">
                  <div className="idet-instagram-icon">
                    <Instagram size={22} />
                  </div>
                  <h3 className="idet-instagram-title">Instagram Analytics</h3>
                </div>
                
                <div className="idet-instagram-stats">
                  <div className="idet-instagram-stat">
                    <div className="idet-instagram-stat-left">
                      <div className="idet-instagram-stat-icon">
                        <UsersIcon size={18} />
                      </div>
                      <span className="idet-instagram-stat-label">Followers</span>
                    </div>
                    <span className="idet-instagram-stat-value">
                      {influencer.instagramStats.followers?.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="idet-instagram-stat">
                    <div className="idet-instagram-stat-left">
                      <div className="idet-instagram-stat-icon">
                        <UsersIcon size={18} />
                      </div>
                      <span className="idet-instagram-stat-label">Following</span>
                    </div>
                    <span className="idet-instagram-stat-value">
                      {influencer.instagramStats.following?.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="idet-instagram-stat">
                    <div className="idet-instagram-stat-left">
                      <div className="idet-instagram-stat-icon">
                        <Eye size={18} />
                      </div>
                      <span className="idet-instagram-stat-label">Posts</span>
                    </div>
                    <span className="idet-instagram-stat-value">
                      {influencer.instagramStats.posts}
                    </span>
                  </div>
                  
                  <div className="idet-instagram-stat">
                    <div className="idet-instagram-stat-left">
                      <div className="idet-instagram-stat-icon">
                        <TrendingUp size={18} />
                      </div>
                      <span className="idet-instagram-stat-label">Engagement</span>
                    </div>
                    <span className="idet-instagram-stat-value">
                      {influencer.instagramStats.engagementRate?.toFixed(2)}%
                    </span>
                  </div>

                  {influencer.instagramStats.averageLikes > 0 && (
                    <div className="idet-instagram-stat">
                      <div className="idet-instagram-stat-left">
                        <div className="idet-instagram-stat-icon">
                          <Heart size={18} />
                        </div>
                        <span className="idet-instagram-stat-label">Avg. Likes</span>
                      </div>
                      <span className="idet-instagram-stat-value">
                        {influencer.instagramStats.averageLikes?.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {influencer.instagramStats.averageComments > 0 && (
                    <div className="idet-instagram-stat">
                      <div className="idet-instagram-stat-left">
                        <div className="idet-instagram-stat-icon">
                          <MessageCircle size={18} />
                        </div>
                        <span className="idet-instagram-stat-label">Avg. Comments</span>
                      </div>
                      <span className="idet-instagram-stat-value">
                        {influencer.instagramStats.averageComments?.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                
                {influencer.instagramUrl && (
                  <a 
                    href={influencer.instagramUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="idet-instagram-button"
                  >
                    <Instagram size={18} />
                    Visit Profile
                  </a>
                )}
              </div>
            )}

            {/* Quick Stats */}
            <div className="idet-sidebar-card">
              <h3>Quick Stats</h3>
              <div className="idet-quick-stats">
                <div className="idet-quick-stat">
                  <span className="idet-label">Platform</span>
                  <span className="idet-value">{influencer.platform}</span>
                </div>
                <div className="idet-quick-stat">
                  <span className="idet-label">Niche</span>
                  <span className="idet-value">{influencer.niche}</span>
                </div>
                <div className="idet-quick-stat">
                  <span className="idet-label">Starting Price</span>
                  <span className="idet-value">
                    ${influencer.services ? Math.min(...influencer.services.map(s => s.price)) : 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Card */}
            {!isBrand && (
              <div className="idet-sidebar-card idet-cta-card">
                <h3>Want to Collaborate?</h3>
                <p>Sign up as a brand to send collaboration requests to {influencer.name}.</p>
                <Link to="/register?role=brand" className="btn btn-primary">
                  Sign Up as Brand
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collaboration Modal */}
      {showModal && (
        <div className="idet-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="idet-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="idet-modal-header">
              <h2>Send Collaboration Request</h2>
              <button className="idet-modal-close" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitRequest} className="idet-modal-form">
              <div className="idet-modal-info">
                <div className="idet-info-row">
                  <span className="idet-info-label">Influencer:</span>
                  <span className="idet-info-value">{influencer.name}</span>
                </div>
                <div className="idet-info-row">
                  <span className="idet-info-label">Service:</span>
                  <span className="idet-info-value">{selectedService?.name}</span>
                </div>
                <div className="idet-info-row">
                  <span className="idet-info-label">Budget:</span>
                  <span className="idet-info-value idet-price">${selectedService?.price}</span>
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="deadline">Deadline</label>
                <input
                  type="date"
                  id="deadline"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="input"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="input-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your collaboration requirements..."
                  className="input idet-textarea"
                  rows={5}
                  required
                />
              </div>

              <div className="idet-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Send size={18} />
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfluencerDetail;
