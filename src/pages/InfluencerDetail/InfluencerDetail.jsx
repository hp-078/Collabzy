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
  X
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

  const handleSubmitRequest = (e) => {
    e.preventDefault();
    
    if (!selectedService || !message) return;

    const collaboration = {
      brandId: user._id,
      brandName: user.name,
      influencerId: influencer._id,
      influencerName: influencer.name,
      service: selectedService.name,
      budget: selectedService.price,
      message: message,
      deadline: deadline,
    };

    createCollaboration(collaboration);
    setShowModal(false);
    setMessage('');
    setDeadline('');
    navigate('/collaborations');
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
              <img 
                src={influencer.avatar} 
                alt={influencer.name}
                className="idet-profile-avatar"
              />
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
