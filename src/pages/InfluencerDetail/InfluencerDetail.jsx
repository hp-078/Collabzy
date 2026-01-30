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

  const influencer = influencers.find(i => i.id === id);

  if (!influencer) {
    return (
      <div className="not-found">
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
      brandId: user.id,
      brandName: user.name,
      influencerId: influencer.id,
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
    <div className="influencer-detail-page">
      <div className="detail-container">
        {/* Back Button */}
        <Link to="/influencers" className="back-link">
          <ArrowLeft size={20} />
          Back to Influencers
        </Link>

        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar-section">
            <div className="avatar-wrapper">
              <img 
                src={influencer.avatar} 
                alt={influencer.name}
                className="profile-avatar"
              />
              {influencer.verified && (
                <span className="verified-badge">
                  <CheckCircle size={24} />
                </span>
              )}
            </div>
          </div>
          
          <div className="profile-info">
            <div className="profile-header-top">
              <div>
                <h1 className="profile-name">{influencer.name}</h1>
                <p className="profile-niche">{influencer.niche}</p>
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
            
            <div className="profile-meta">
              <span className="meta-item">
                <MapPin size={16} />
                {influencer.location}
              </span>
              <span className="meta-item">
                <Calendar size={16} />
                Joined {influencer.joinedDate}
              </span>
            </div>

            <div className="profile-stats">
              <div className="stat-box">
                <Users size={24} />
                <div>
                  <span className="stat-value">{influencer.followers}</span>
                  <span className="stat-label">Followers</span>
                </div>
              </div>
              <div className="stat-box">
                <Star size={24} fill="currentColor" />
                <div>
                  <span className="stat-value">{influencer.rating}</span>
                  <span className="stat-label">Rating</span>
                </div>
              </div>
              <div className="stat-box">
                <CheckCircle size={24} />
                <div>
                  <span className="stat-value">{influencer.pastCollabs?.length || 0}</span>
                  <span className="stat-label">Collabs</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="profile-content">
          <div className="content-main">
            {/* About Section */}
            <section className="profile-section">
              <h2 className="section-title">About</h2>
              <p className="about-text">{influencer.description}</p>
            </section>

            {/* Services Section */}
            <section className="profile-section">
              <h2 className="section-title">Services</h2>
              <div className="services-grid">
                {influencer.services?.map((service) => (
                  <div key={service.id} className="service-card">
                    <div className="service-header">
                      <h3 className="service-name">{service.name}</h3>
                      <span className="service-price">
                        <DollarSign size={18} />
                        {service.price}
                      </span>
                    </div>
                    <p className="service-description">{service.description}</p>
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
              <section className="profile-section">
                <h2 className="section-title">Past Collaborations</h2>
                <div className="collab-badges">
                  {influencer.pastCollabs.map((brand, index) => (
                    <span key={index} className="collab-badge">{brand}</span>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="content-sidebar">
            {/* Quick Stats */}
            <div className="sidebar-card">
              <h3>Quick Stats</h3>
              <div className="quick-stats">
                <div className="quick-stat">
                  <span className="label">Platform</span>
                  <span className="value">{influencer.platform}</span>
                </div>
                <div className="quick-stat">
                  <span className="label">Niche</span>
                  <span className="value">{influencer.niche}</span>
                </div>
                <div className="quick-stat">
                  <span className="label">Starting Price</span>
                  <span className="value">
                    ${influencer.services ? Math.min(...influencer.services.map(s => s.price)) : 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Card */}
            {!isBrand && (
              <div className="sidebar-card cta-card">
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
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Send Collaboration Request</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitRequest} className="modal-form">
              <div className="modal-info">
                <div className="info-row">
                  <span className="info-label">Influencer:</span>
                  <span className="info-value">{influencer.name}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Service:</span>
                  <span className="info-value">{selectedService?.name}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Budget:</span>
                  <span className="info-value price">${selectedService?.price}</span>
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
                  className="input textarea"
                  rows={5}
                  required
                />
              </div>

              <div className="modal-actions">
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
