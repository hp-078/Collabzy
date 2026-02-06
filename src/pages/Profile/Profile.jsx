import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import influencerService from '../../services/influencer.service';
import authService from '../../services/auth.service';
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
  DollarSign,
  Loader
} from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { user, updateUser, isInfluencer, isBrand } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  
  console.log('Profile component rendered, user:', user); // Debug log
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.description || user?.bio || '',
    category: user?.niche || user?.category || '',
    platformType: user?.platform || user?.platformType || 'Instagram',
    youtubeUrl: user?.youtubeUrl || '',
    instagramUrl: user?.instagramUrl || '',
    location: user?.location || '',
    website: user?.website || '',
    industry: user?.industry || '',
    services: user?.services || [],
  });

  console.log('Initial formData:', formData); // Debug log

  const [newService, setNewService] = useState({
    name: '',
    price: '',
    description: '',
  });

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState(user?.avatar || '');

  // Update form data when user object changes
  useEffect(() => {
    if (user) {
      console.log('User changed, updating formData with user:', user); // Debug log
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        bio: user.description || user.bio || prev.bio,
        category: user.niche || user.category || prev.category,
        platformType: user.platform || user.platformType || prev.platformType,
        youtubeUrl: user.youtubeUrl || prev.youtubeUrl,
        instagramUrl: user.instagramUrl || prev.instagramUrl,
        location: user.location || prev.location,
        website: user.website || prev.website,
        industry: user.industry || prev.industry,
        services: user.services || prev.services,
      }));
      
      if (user.avatar) {
        setPreviewImage(user.avatar);
      }
    }
  }, [user]);

  // Fetch profile data on mount (for influencers)
  useEffect(() => {
    const loadProfile = async () => {
      console.log('Loading profile for influencer:', isInfluencer); // Debug log
      if (isInfluencer) {
        try {
          const response = await influencerService.getOwnProfile();
          const profileData = response.data || response; // Handle both wrapped and unwrapped responses
          console.log('Profile loaded:', profileData); // Debug log
          setProfile(profileData);

          // Update form data with fetched profile
          if (profileData) {
            setFormData(prev => {
              const newData = {
                ...prev,
                name: profileData.name || prev.name,
                bio: profileData.bio || prev.bio,
                category: profileData.niche || prev.category, // backend uses 'niche'
                platformType: profileData.platform || prev.platformType, // backend uses 'platform'
                youtubeUrl: profileData.youtubeUrl || prev.youtubeUrl,
                instagramUrl: profileData.instagramUrl || prev.instagramUrl,
                location: profileData.location || prev.location,
                website: profileData.website || prev.website,
                services: profileData.services || prev.services,
              };
              console.log('Updated formData:', newData); // Debug log
              return newData;
            });

            if (profileData.avatar) {
              setPreviewImage(profileData.avatar);
            }
          }
        } catch (error) {
          console.log('No profile yet or error loading:', error);
        }
      }
      setLoading(false);
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInfluencer]);

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
    const { name, value } = e.target;
    console.log('Form field changed:', name, value); // Debug log
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
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
      // Map frontend fields to backend fields
      const updatedData = {
        name: formData.name,
        bio: formData.bio,
        niche: formData.category, // frontend 'category' → backend 'niche'
        platform: formData.platformType, // frontend 'platformType' → backend 'platform'
        location: formData.location,
        avatar: previewImage,
        youtubeUrl: formData.youtubeUrl,
        instagramUrl: formData.instagramUrl,
        website: formData.website,
        services: formData.services,
      };

      // Update profile based on role
      if (isInfluencer) {
        try {
          // Try to update existing profile first
          await influencerService.updateProfile(updatedData);
          toast.success('Profile updated successfully!');
        } catch (updateError) {
          // If profile doesn't exist (404), create a new one
          if (updateError.response?.status === 404) {
            await influencerService.createProfile(updatedData);
            toast.success('Profile created successfully!');
          } else {
            // Re-throw other errors
            throw updateError;
          }
        }

        // Update local user state
        updateUser({
          ...user,
          ...formData,
          avatar: previewImage
        });
      } else if (isBrand) {
        // For brands, update user info via auth service
        // Note: Brand profile update endpoint would need to be created in backend
        updateUser({
          ...user,
          ...updatedData,
          avatar: previewImage
        });

        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update profile. Please try again.';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="prof-page">
        <div className="prof-container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '1rem'
        }}>
          <Loader size={48} className="spin-animation" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

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
                    readOnly
                    className="input"
                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                    title="Email cannot be changed"
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
                <label htmlFor="bio">About</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
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
                      <label htmlFor="category">Niche / Category</label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
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
                      <label htmlFor="platformType">
                        Primary Platform
                      </label>
                      <select
                        id="platformType"
                        name="platformType"
                        value={formData.platformType}
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
