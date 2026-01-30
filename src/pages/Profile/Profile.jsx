import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  User,
  Mail,
  MapPin,
  Globe,
  Instagram,
  Youtube,
  Camera,
  Save,
  Plus,
  X,
  DollarSign
} from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { user, updateUser, isInfluencer, isBrand } = useAuth();
  const { updateInfluencer, updateBrand } = useData();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    description: user?.description || '',
    niche: user?.niche || '',
    platform: user?.platform || 'Instagram',
    followers: user?.followers || '',
    location: user?.location || '',
    website: user?.website || '',
    industry: user?.industry || '',
    services: user?.services || [],
  });

  const [newService, setNewService] = useState({
    name: '',
    price: '',
    description: '',
  });

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddService = () => {
    if (!newService.name || !newService.price) return;

    const service = {
      id: Date.now().toString(),
      name: newService.name,
      price: parseInt(newService.price),
      description: newService.description,
    };

    setFormData({
      ...formData,
      services: [...formData.services, service],
    });

    setNewService({ name: '', price: '', description: '' });
    setShowServiceModal(false);
  };

  const handleRemoveService = (serviceId) => {
    setFormData({
      ...formData,
      services: formData.services.filter(s => s.id !== serviceId),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (isInfluencer) {
        updateInfluencer(user.id, formData);
      } else if (isBrand) {
        updateBrand(user.id, formData);
      }

      updateUser(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="page-header">
          <h1>Profile Settings</h1>
          <p>Manage your account information and preferences</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="profile-grid">
            {/* Avatar Section */}
            <div className="profile-section avatar-section">
              <div className="avatar-wrapper">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="profile-avatar" />
                ) : (
                  <div className="avatar-placeholder">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <button type="button" className="avatar-upload">
                  <Camera size={20} />
                </button>
              </div>
              <h3>{user?.name}</h3>
              <p className="user-role">{user?.role}</p>
            </div>

            {/* Basic Info */}
            <div className="profile-section">
              <h2>Basic Information</h2>
              
              <div className="form-grid">
                <div className="input-group">
                  <label htmlFor="name">
                    <User size={16} />
                    {isInfluencer ? 'Full Name' : 'Brand Name'}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="email">
                    <Mail size={16} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="location">
                    <MapPin size={16} />
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="City, Country"
                    className="input"
                  />
                </div>

                {isBrand && (
                  <div className="input-group">
                    <label htmlFor="website">
                      <Globe size={16} />
                      Website
                    </label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://example.com"
                      className="input"
                    />
                  </div>
                )}
              </div>

              <div className="input-group full-width">
                <label htmlFor="description">About</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell us about yourself or your brand..."
                  className="input textarea"
                  rows={4}
                />
              </div>
            </div>

            {/* Influencer Specific */}
            {isInfluencer && (
              <>
                <div className="profile-section">
                  <h2>Creator Details</h2>
                  
                  <div className="form-grid">
                    <div className="input-group">
                      <label htmlFor="niche">Niche / Category</label>
                      <select
                        id="niche"
                        name="niche"
                        value={formData.niche}
                        onChange={handleChange}
                        className="input"
                      >
                        <option value="">Select a niche</option>
                        <option value="Fashion & Lifestyle">Fashion & Lifestyle</option>
                        <option value="Tech & Gadgets">Tech & Gadgets</option>
                        <option value="Fitness & Health">Fitness & Health</option>
                        <option value="Food & Cooking">Food & Cooking</option>
                        <option value="Beauty & Skincare">Beauty & Skincare</option>
                        <option value="Travel & Adventure">Travel & Adventure</option>
                        <option value="Gaming">Gaming</option>
                        <option value="Education">Education</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label htmlFor="platform">
                        Primary Platform
                      </label>
                      <select
                        id="platform"
                        name="platform"
                        value={formData.platform}
                        onChange={handleChange}
                        className="input"
                      >
                        <option value="Instagram">Instagram</option>
                        <option value="YouTube">YouTube</option>
                        <option value="TikTok">TikTok</option>
                        <option value="Twitter">Twitter</option>
                        <option value="LinkedIn">LinkedIn</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label htmlFor="followers">Followers</label>
                      <input
                        type="text"
                        id="followers"
                        name="followers"
                        value={formData.followers}
                        onChange={handleChange}
                        placeholder="e.g., 50K, 1M"
                        className="input"
                      />
                    </div>
                  </div>
                </div>

                {/* Services Section */}
                <div className="profile-section services-section">
                  <div className="section-header">
                    <h2>Services</h2>
                    <button 
                      type="button" 
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowServiceModal(true)}
                    >
                      <Plus size={16} />
                      Add Service
                    </button>
                  </div>

                  <div className="services-list">
                    {formData.services.length > 0 ? (
                      formData.services.map((service) => (
                        <div key={service.id} className="service-item">
                          <div className="service-info">
                            <h4>{service.name}</h4>
                            <p>{service.description}</p>
                          </div>
                          <div className="service-actions">
                            <span className="service-price">
                              <DollarSign size={16} />
                              {service.price}
                            </span>
                            <button 
                              type="button"
                              className="remove-btn"
                              onClick={() => handleRemoveService(service.id)}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="no-services">
                        No services added yet. Add your services to start receiving collaboration requests.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Brand Specific */}
            {isBrand && (
              <div className="profile-section">
                <h2>Brand Details</h2>
                
                <div className="form-grid">
                  <div className="input-group">
                    <label htmlFor="industry">Industry</label>
                    <select
                      id="industry"
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      className="input"
                    >
                      <option value="">Select an industry</option>
                      <option value="Technology">Technology</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Food & Beverage">Food & Beverage</option>
                      <option value="Beauty & Cosmetics">Beauty & Cosmetics</option>
                      <option value="Health & Wellness">Health & Wellness</option>
                      <option value="Travel & Hospitality">Travel & Hospitality</option>
                      <option value="E-commerce">E-commerce</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Finance">Finance</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="form-actions">
            {success && (
              <span className="success-message">Profile saved successfully!</span>
            )}
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Add Service Modal */}
        {showServiceModal && (
          <div className="modal-overlay" onClick={() => setShowServiceModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add Service</h2>
                <button 
                  type="button" 
                  className="modal-close"
                  onClick={() => setShowServiceModal(false)}
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="modal-body">
                <div className="input-group">
                  <label htmlFor="serviceName">Service Name</label>
                  <input
                    type="text"
                    id="serviceName"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    placeholder="e.g., Instagram Post, YouTube Review"
                    className="input"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="servicePrice">Price ($)</label>
                  <input
                    type="number"
                    id="servicePrice"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                    placeholder="500"
                    className="input"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="serviceDescription">Description</label>
                  <textarea
                    id="serviceDescription"
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    placeholder="Describe what's included in this service..."
                    className="input textarea"
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowServiceModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleAddService}
                >
                  Add Service
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
