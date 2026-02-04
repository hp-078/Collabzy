import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import toast from 'react-hot-toast';
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
    youtubeUrl: user?.youtubeUrl || '',
    instagramUrl: user?.instagramUrl || '',
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
  const [previewImage, setPreviewImage] = useState(user?.avatar || '');

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        toast.success('Profile picture uploaded!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddService = () => {
    if (!newService.name || !newService.price) {
      toast.error('Please fill in service name and price');
      return;
    }

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
    toast.success('Service added successfully!');
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

      const updatedData = { ...formData, avatar: previewImage };

      if (isInfluencer) {
        updateInfluencer(user.id, updatedData);
      } else if (isBrand) {
        updateBrand(user.id, updatedData);
      }

      updateUser(updatedData);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="prof-page">
      <div className="prof-container">
        <div className="prof-page-header">
          <h1>Profile Settings</h1>
          <p>Manage your account information and preferences</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="prof-grid">
            {/* Avatar Section */}
            <div className="prof-section prof-avatar-section">
              <div className="prof-avatar-wrapper">
                {previewImage ? (
                  <img src={previewImage} alt={user.name} className="prof-avatar" />
                ) : (
                  <div className="prof-avatar-placeholder">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <label htmlFor="avatar-upload" className="prof-avatar-upload">
                  <Camera size={20} />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="prof-avatar-input"
                  />
                </label>
              </div>
              <h3>{user?.name}</h3>
              <p className="prof-user-role">{user?.role}</p>
            </div>

            {/* Basic Info */}
            <div className="prof-section">
              <h2>Basic Information</h2>
              
              <div className="prof-form-grid">
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

              <div className="input-group prof-full-width">
                <label htmlFor="description">About</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell us about yourself or your brand..."
                  className="input prof-textarea"
                  rows={4}
                />
              </div>
            </div>

            {/* Influencer Specific */}
            {isInfluencer && (
              <>
                <div className="prof-section">
                  <h2>Creator Details</h2>
                  
                  <div className="prof-form-grid">
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
                        <option value="Multiple">Multiple Platforms</option>
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

                  {/* Social Media Links */}
                  <div className="prof-form-grid">
                    <div className="input-group prof-full-width">
                      <label htmlFor="youtubeUrl">
                        <Youtube size={16} />
                        YouTube Channel URL
                      </label>
                      <input
                        type="url"
                        id="youtubeUrl"
                        name="youtubeUrl"
                        value={formData.youtubeUrl}
                        onChange={handleChange}
                        placeholder="https://youtube.com/@yourchannel"
                        className="input"
                      />
                    </div>

                    <div className="input-group prof-full-width">
                      <label htmlFor="instagramUrl">
                        <Instagram size={16} />
                        Instagram Profile URL
                      </label>
                      <input
                        type="url"
                        id="instagramUrl"
                        name="instagramUrl"
                        value={formData.instagramUrl}
                        onChange={handleChange}
                        placeholder="https://instagram.com/yourusername"
                        className="input"
                      />
                    </div>
                  </div>
                </div>

                {/* Services Section */}
                <div className="prof-section prof-services-section">
                  <div className="prof-section-header">
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

                  <div className="prof-services-list">
                    {formData.services.length > 0 ? (
                      formData.services.map((service) => (
                        <div key={service.id} className="prof-service-item">
                          <div className="prof-service-info">
                            <h4>{service.name}</h4>
                            <p>{service.description}</p>
                          </div>
                          <div className="prof-service-actions">
                            <span className="prof-service-price">
                              <DollarSign size={16} />
                              {service.price}
                            </span>
                            <button 
                              type="button"
                              className="prof-remove-btn"
                              onClick={() => handleRemoveService(service.id)}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="prof-no-services">
                        No services added yet. Add your services to start receiving collaboration requests.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Brand Specific */}
            {isBrand && (
              <div className="prof-section">
                <h2>Brand Details</h2>
                
                <div className="prof-form-grid">
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
          <div className="prof-form-actions">
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Add Service Modal */}
        {showServiceModal && (
          <div className="prof-modal-overlay" onClick={() => setShowServiceModal(false)}>
            <div className="prof-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="prof-modal-header">
                <h2>Add Service</h2>
                <button 
                  type="button" 
                  className="prof-modal-close"
                  onClick={() => setShowServiceModal(false)}
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="prof-modal-body">
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
                    className="input prof-textarea"
                    rows={3}
                  />
                </div>
              </div>

              <div className="prof-modal-actions">
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
