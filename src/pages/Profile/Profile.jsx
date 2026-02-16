import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import influencerService from '../../services/influencer.service';
import brandService from '../../services/brand.service';
import authService from '../../services/auth.service';
import youtubeService from '../../services/youtube.service';
import instagramService from '../../services/instagram.service';
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
  Loader,
  RefreshCw,
  TrendingUp,
  Eye,
  Users as UsersIcon
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
    platforms: user?.platforms || [],
  });

  console.log('Initial formData:', formData); // Debug log

  const [newService, setNewService] = useState({
    name: '',
    price: '',
    description: '',
  });

  const [newPlatform, setNewPlatform] = useState({
    type: 'YouTube',
    url: '',
  });

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState(user?.avatar || '');
  const [fetchingYouTube, setFetchingYouTube] = useState(false);
  const [youtubeStats, setYoutubeStats] = useState(null);
  const [fetchingInstagram, setFetchingInstagram] = useState(false);
  const [instagramStats, setInstagramStats] = useState(null);
  const [addingPlatform, setAddingPlatform] = useState(false);

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
        platforms: user.platforms || prev.platforms,
      }));
      
      if (user.avatar) {
        setPreviewImage(user.avatar);
      }
    }
  }, [user]);

  // Fetch profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      console.log('Loading profile, isInfluencer:', isInfluencer, 'isBrand:', isBrand);
      if (isInfluencer) {
        try {
          const response = await influencerService.getOwnProfile();
          const profileData = response.data || response;
          console.log('Influencer profile loaded:', profileData);
          setProfile(profileData);

          if (profileData) {
            setFormData(prev => {
              const nicheValue = Array.isArray(profileData.niche)
                ? (profileData.niche[0] || '')
                : (profileData.niche || '');
              const newData = {
                ...prev,
                name: profileData.name || prev.name,
                bio: profileData.bio || prev.bio,
                category: nicheValue,
                platformType: profileData.platformType || profileData.platform || prev.platformType,
                youtubeUrl: profileData.youtubeUrl || prev.youtubeUrl,
                instagramUrl: profileData.instagramUrl || prev.instagramUrl,
                location: profileData.location || prev.location,
                website: profileData.website || prev.website,
                services: profileData.services || prev.services,
              };
              console.log('Updated formData:', newData);
              return newData;
            });

            if (profileData.avatar) {
              setPreviewImage(profileData.avatar);
            }
          }
        } catch (error) {
          console.log('No influencer profile yet or error loading:', error);
        }
      } else if (isBrand) {
        try {
          const response = await brandService.getOwnProfile();
          const profileData = response.data || response;
          console.log('Brand profile loaded:', profileData);
          setProfile(profileData);

          if (profileData) {
            setFormData(prev => ({
              ...prev,
              name: profileData.companyName || prev.name,
              bio: profileData.description || prev.bio,
              location: profileData.location || prev.location,
              website: profileData.websiteUrl || prev.website,
              industry: profileData.industry || prev.industry,
              instagramUrl: profileData.instagramUrl || prev.instagramUrl,
            }));

            if (profileData.logo) {
              setPreviewImage(profileData.logo);
            }
          }
        } catch (error) {
          console.log('No brand profile yet or error loading:', error);
        }
      }
      setLoading(false);
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInfluencer, isBrand]);

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
      services: formData.services.filter(s => (s.id || s._id) !== serviceId),
    });
  };

  const handleAddPlatform = async () => {
    if (!newPlatform.url) {
      toast.error('Please enter the platform URL');
      return;
    }

    // Only YouTube is supported for auto-fetch initially
    if (newPlatform.type !== 'YouTube' && newPlatform.type !== 'Instagram') {
      const platform = {
        type: newPlatform.type,
        url: newPlatform.url,
        addedAt: new Date().toISOString(),
      };

      setFormData({
        ...formData,
        platforms: [...(formData.platforms || []), platform],
      });

      setNewPlatform({ type: 'YouTube', url: '' });
      setShowPlatformModal(false);
      toast.success(`${newPlatform.type} platform added successfully! Auto-fetch coming soon.`);
      return;
    }

    // Instagram platform - fetch stats immediately
    if (newPlatform.type === 'Instagram') {
      setAddingPlatform(true);
      try {
        const response = await instagramService.fetchProfile(newPlatform.url);
        
        if (response.requiresManualInput) {
          // Auto-fetch not available, add without stats
          const platform = {
            type: 'Instagram',
            url: newPlatform.url,
            addedAt: new Date().toISOString(),
          };
          setFormData({
            ...formData,
            platforms: [...(formData.platforms || []), platform],
          });
          setNewPlatform({ type: 'YouTube', url: '' });
          setShowPlatformModal(false);
          toast.success('Instagram added! Auto-fetch unavailable — enter stats manually.');
          return;
        }

        if (response.success && response.data) {
          const igData = response.data;
          const platform = {
            type: 'Instagram',
            url: newPlatform.url,
            stats: {
              followers: igData.profile?.followers || 0,
              following: igData.profile?.following || 0,
              posts: igData.profile?.posts || 0,
              engagementRate: igData.metrics?.engagementRate || 0,
            },
            lastFetched: new Date().toISOString(),
            username: igData.profile?.username,
          };

          setFormData({
            ...formData,
            platforms: [...(formData.platforms || []), platform],
          });

          setNewPlatform({ type: 'YouTube', url: '' });
          setShowPlatformModal(false);
          toast.success('Instagram platform added with stats!');
        }
      } catch (error) {
        console.error('Error adding Instagram platform:', error);
        toast.error(error.response?.data?.message || 'Failed to fetch Instagram data');
      } finally {
        setAddingPlatform(false);
      }
      return;
    }

    // YouTube platform - fetch stats immediately
    setAddingPlatform(true);
    try {
      const response = await youtubeService.fetchProfile(newPlatform.url);
      
      if (response.success && response.data) {
        const ytData = response.data;
        
        const platform = {
          type: 'YouTube',
          url: newPlatform.url,
          stats: {
            subscribers: ytData.channel?.subscriberCount || 0,
            views: ytData.channel?.viewCount || 0,
            videos: ytData.channel?.videoCount || 0,
            engagementRate: ytData.metrics?.engagementRate || 0,
          },
          lastFetched: new Date().toISOString(),
          channelId: ytData.channel?.channelId,
          channelTitle: ytData.channel?.title,
        };

        setFormData({
          ...formData,
          platforms: [...(formData.platforms || []), platform],
        });

        setNewPlatform({ type: 'YouTube', url: '' });
        setShowPlatformModal(false);
        toast.success('YouTube platform added successfully!');
      }
    } catch (error) {
      console.error('Error adding platform:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch YouTube data');
    } finally {
      setAddingPlatform(false);
    }
  };

  const handleRemovePlatform = (index) => {
    const updatedPlatforms = formData.platforms.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      platforms: updatedPlatforms,
    });
    toast.success('Platform removed successfully');
  };


  const handleFetchYouTubeData = async () => {
    if (!formData.youtubeUrl) {
      toast.error('Please enter your YouTube channel URL first');
      return;
    }

    setFetchingYouTube(true);
    try {
      const response = await youtubeService.fetchProfile(formData.youtubeUrl);
      
      console.log('YouTube API Response:', response); // Debug log
      
      if (response.success && response.data) {
        const ytData = response.data;
        console.log('YouTube Data:', ytData); // Debug log
        
        setYoutubeStats(ytData);
        
        // Show success message with stats
        toast.success(
          `✅ YouTube data fetched!\n` +
          `📊 ${ytData.channel.subscriberCount?.toLocaleString()} subscribers\n` +
          `📹 ${ytData.channel.videoCount} videos\n` +
          `💫 ${ytData.metrics.engagementRate?.toFixed(2)}% engagement`,
          { duration: 5000 }
        );

        // Auto-update the profile with fetched data
        try {
          const updatedData = {
            name: formData.name,
            bio: formData.bio,
            niche: formData.category,
            platformType: formData.platformType,
            location: formData.location,
            avatar: previewImage,
            youtubeUrl: formData.youtubeUrl,
            instagramUrl: formData.instagramUrl,
            website: formData.website,
            services: formData.services,
            youtubeStats: {
              subscribers: ytData.channel.subscriberCount,
              totalViews: ytData.channel.viewCount,
              videoCount: ytData.channel.videoCount,
              averageViews: ytData.metrics.averageViews,
              engagementRate: ytData.metrics.engagementRate,
              lastFetched: new Date()
            },
            youtubeChannelId: ytData.channel.channelId
          };

          console.log('Updating profile with:', updatedData); // Debug log

          await influencerService.updateProfile(updatedData);
          toast.success('Profile updated with YouTube stats!');
        } catch (updateError) {
          console.error('Error updating profile with YouTube stats:', updateError);
          toast.error('Stats fetched but failed to save to profile');
        }
      }
    } catch (error) {
      console.error('Error fetching YouTube data:', error);
      const errorMsg = error.response?.data?.message || 'Failed to fetch YouTube data';
      toast.error(errorMsg);
    } finally {
      setFetchingYouTube(false);
    }
  };

  const handleFetchInstagramData = async () => {
    if (!formData.instagramUrl) {
      toast.error('Please enter your Instagram profile URL first');
      return;
    }

    setFetchingInstagram(true);
    try {
      const response = await instagramService.fetchProfile(formData.instagramUrl);
      
      console.log('Instagram API Response:', response);
      
      if (response.requiresManualInput) {
        toast.error('Auto-fetch unavailable. Please enter your Instagram stats manually.');
        return;
      }

      if (response.success && response.data) {
        const igData = response.data;
        console.log('Instagram Data:', igData);
        
        setInstagramStats(igData);
        
        // Show success message with stats
        toast.success(
          `✅ Instagram data fetched!\n` +
          `👥 ${igData.profile.followers?.toLocaleString()} followers\n` +
          `📸 ${igData.profile.posts} posts\n` +
          `💫 ${igData.metrics.engagementRate?.toFixed(2)}% engagement`,
          { duration: 5000 }
        );

        // Auto-update the profile with fetched data
        try {
          const updatedData = {
            name: formData.name,
            bio: formData.bio,
            niche: formData.category,
            platformType: formData.platformType,
            location: formData.location,
            avatar: previewImage,
            youtubeUrl: formData.youtubeUrl,
            instagramUrl: formData.instagramUrl,
            website: formData.website,
            services: formData.services,
            instagramStats: {
              followers: igData.profile.followers,
              following: igData.profile.following,
              postCount: igData.profile.posts,
              engagementRate: igData.metrics.engagementRate,
              averageLikes: igData.metrics.averageLikes,
              averageComments: igData.metrics.averageComments,
              lastFetched: new Date()
            },
            instagramUsername: igData.profile.username
          };

          console.log('Updating profile with Instagram data:', updatedData);

          await influencerService.updateProfile(updatedData);
          toast.success('Profile updated with Instagram stats!');
        } catch (updateError) {
          console.error('Error updating profile with Instagram stats:', updateError);
          toast.error('Stats fetched but failed to save to profile');
        }
      }
    } catch (error) {
      console.error('Error fetching Instagram data:', error);
      const errorMsg = error.response?.data?.message || 'Failed to fetch Instagram data';
      toast.error(errorMsg);
    } finally {
      setFetchingInstagram(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isInfluencer) {
        // Map frontend fields to backend fields for influencer
        const updatedData = {
          name: formData.name,
          bio: formData.bio,
          niche: formData.category, // backend handles string-to-array conversion
          platformType: formData.platformType,
          location: formData.location,
          avatar: previewImage,
          youtubeUrl: formData.youtubeUrl,
          instagramUrl: formData.instagramUrl,
          website: formData.website,
          services: formData.services,
          platforms: formData.platforms || [],
        };

        try {
          await influencerService.updateProfile(updatedData);
          toast.success('Profile updated successfully!');
        } catch (updateError) {
          if (updateError.response?.status === 404) {
            await influencerService.createProfile(updatedData);
            toast.success('Profile created successfully!');
          } else {
            throw updateError;
          }
        }

        updateUser({
          ...user,
          name: formData.name,
          avatar: previewImage
        });
      } else if (isBrand) {
        // Map frontend fields to backend BrandProfile fields
        const brandData = {
          companyName: formData.name,
          description: formData.bio,
          location: formData.location,
          websiteUrl: formData.website,
          industry: formData.industry,
          instagramUrl: formData.instagramUrl,
          logo: previewImage,
        };

        try {
          await brandService.updateProfile(brandData);
          toast.success('Brand profile updated successfully!');
        } catch (updateError) {
          console.error('Brand profile update error:', updateError);
          throw updateError;
        }

        updateUser({
          ...user,
          name: formData.name,
          avatar: previewImage
        });
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
                  </div>

                  {/* Connected Platforms Section */}
                  <div className="prof-section-header" style={{ marginTop: '1.5rem' }}>
                    <h3>Connected Platforms</h3>
                    <button 
                      type="button" 
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowPlatformModal(true)}
                    >
                      <Plus size={16} />
                      Add Platform
                    </button>
                  </div>

                  <div className="prof-platforms-list">
                    {(formData.platforms || []).length > 0 ? (
                      (formData.platforms || []).map((platform, index) => (
                        <div key={index} className="prof-platform-item">
                          <div className="prof-platform-icon">
                            {platform.type === 'YouTube' && <Youtube size={24} />}
                            {platform.type === 'Instagram' && <Instagram size={24} />}
                            {platform.type === 'TikTok' && <Globe size={24} />}
                          </div>
                          <div className="prof-platform-info">
                            <h4>{platform.type}</h4>
                            <p className="prof-platform-url">{platform.url}</p>
                            {platform.stats && (
                              <div className="prof-platform-stats">
                                {platform.stats.subscribers != null && (
                                  <span><UsersIcon size={14} /> {platform.stats.subscribers.toLocaleString()} subscribers</span>
                                )}
                                {platform.stats.followers != null && (
                                  <span><UsersIcon size={14} /> {platform.stats.followers.toLocaleString()} followers</span>
                                )}
                                {platform.stats.views != null && (
                                  <span><Eye size={14} /> {platform.stats.views.toLocaleString()} views</span>
                                )}
                                {platform.stats.posts != null && (
                                  <span><Camera size={14} /> {platform.stats.posts.toLocaleString()} posts</span>
                                )}
                                {platform.stats.engagementRate != null && (
                                  <span><TrendingUp size={14} /> {platform.stats.engagementRate.toFixed(2)}% engagement</span>
                                )}
                              </div>
                            )}
                            {platform.lastFetched && (
                              <p className="prof-platform-last-fetched">
                                Last updated: {new Date(platform.lastFetched).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleRemovePlatform(index)}
                            className="prof-platform-remove"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="prof-empty-state">
                        <Globe size={48} />
                        <p>No platforms connected yet</p>
                        <p className="prof-empty-hint">Add your social media platforms to automatically track your stats</p>
                      </div>
                    )}
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
                        <div key={service.id || service._id} className="prof-service-item">
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
                              onClick={() => handleRemoveService(service.id || service._id)}
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

        {/* Add Platform Modal */}
        {showPlatformModal && (
          <div className="prof-modal-overlay" onClick={() => setShowPlatformModal(false)}>
            <div className="prof-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="prof-modal-header">
                <h2>Add Platform</h2>
                <button 
                  type="button" 
                  className="prof-modal-close"
                  onClick={() => setShowPlatformModal(false)}
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="prof-modal-body">
                <div className="input-group">
                  <label htmlFor="platformType">Platform Type</label>
                  <select
                    id="platformType"
                    value={newPlatform.type}
                    onChange={(e) => setNewPlatform({ ...newPlatform, type: e.target.value })}
                    className="input"
                  >
                    <option value="YouTube">YouTube</option>
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="platformUrl">
                    {newPlatform.type === 'YouTube' && <Youtube size={16} />}
                    {newPlatform.type === 'Instagram' && <Instagram size={16} />}
                    {newPlatform.type === 'TikTok' && <Globe size={16} />}
                    {' '} Platform URL
                  </label>
                  <input
                    type="url"
                    id="platformUrl"
                    value={newPlatform.url}
                    onChange={(e) => setNewPlatform({ ...newPlatform, url: e.target.value })}
                    placeholder={
                      newPlatform.type === 'YouTube' 
                        ? 'https://youtube.com/@yourchannel'
                        : newPlatform.type === 'Instagram'
                        ? 'https://instagram.com/yourusername'
                        : 'https://tiktok.com/@yourusername'
                    }
                    className="input"
                  />
                </div>

                {newPlatform.type === 'YouTube' && (
                  <div className="prof-platform-note">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <TrendingUp size={16} style={{ color: 'var(--accent-coral)' }} />
                      <strong>Auto-fetch enabled</strong>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      YouTube stats will be fetched immediately and automatically updated every 24 hours.
                    </p>
                  </div>
                )}

                {newPlatform.type === 'Instagram' && (
                  <div className="prof-platform-note">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <TrendingUp size={16} style={{ color: 'var(--accent-coral)' }} />
                      <strong>Auto-fetch enabled</strong>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      Instagram stats (followers, posts, engagement) will be fetched automatically via Graph API.
                    </p>
                  </div>
                )}

                {newPlatform.type !== 'YouTube' && newPlatform.type !== 'Instagram' && (
                  <div className="prof-platform-note">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Globe size={16} style={{ color: 'var(--pastel-sky)' }} />
                      <strong>Coming Soon</strong>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      Auto-fetch for {newPlatform.type} will be available soon. You can add the platform now to keep it linked.
                    </p>
                  </div>
                )}
              </div>

              <div className="prof-modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowPlatformModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleAddPlatform}
                  disabled={addingPlatform}
                >
                  {addingPlatform ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Add Platform
                    </>
                  )}
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
