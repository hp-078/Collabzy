import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
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
  const { clearCache } = useData();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

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
      if (isInfluencer) {
        try {
          const response = await influencerService.getOwnProfile();
          const profileData = response.data || response;
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
                platforms: profileData.platforms || prev.platforms || [],
              };
              return newData;
            });

            if (profileData.avatar) {
              setPreviewImage(profileData.avatar);
            }

            // Load cached YouTube stats if available (from DB fields)
            if (profileData.youtubeData || profileData.youtubeStats) {
              const ytData = {
                channel: {
                  title: profileData.youtubeData?.title || '',
                  subscriberCount: profileData.youtubeStats?.subscribers || 0,
                  viewCount: profileData.youtubeStats?.totalViews || 0,
                  videoCount: profileData.youtubeStats?.videoCount || 0,
                  thumbnail: profileData.youtubeData?.thumbnail || '',
                  channelId: profileData.youtubeChannelId || '',
                },
                metrics: {
                  engagementRate: profileData.youtubeStats?.engagementRate || 0,
                  averageViews: profileData.youtubeStats?.averageViews || 0,
                },
                recentVideos: profileData.youtubeData?.recentVideos || [],
                fetchedAt: profileData.youtubeData?.fetchedAt || profileData.youtubeStats?.lastFetched,
              };
              setYoutubeStats(ytData);
            } else {
              // Fallback: try to reconstruct from platforms array
              const ytPlatform = (profileData.platforms || []).find(p => p.type === 'YouTube');
              if (ytPlatform?.stats) {
                const ytData = {
                  channel: {
                    title: ytPlatform.channelTitle || '',
                    subscriberCount: ytPlatform.stats.subscribers || 0,
                    viewCount: ytPlatform.stats.views || 0,
                    videoCount: ytPlatform.stats.videos || 0,
                    thumbnail: '',
                    channelId: ytPlatform.channelId || '',
                  },
                  metrics: {
                    engagementRate: ytPlatform.stats.engagementRate || 0,
                    averageViews: 0,
                  },
                  recentVideos: [],
                  fetchedAt: ytPlatform.lastFetched,
                };
                setYoutubeStats(ytData);
              }
            }

            // Load cached Instagram stats if available (from DB fields)
            if (profileData.instagramData || profileData.instagramStats) {
              const igData = {
                profile: {
                  username: profileData.instagramData?.username || profileData.instagramUsername || '',
                  name: profileData.instagramData?.name || '',
                  biography: profileData.instagramData?.biography || '',
                  profilePicture: profileData.instagramData?.profilePicture || '',
                  followers: profileData.instagramStats?.followers || 0,
                  following: profileData.instagramStats?.following || 0,
                  posts: profileData.instagramStats?.posts || 0,
                  isVerified: profileData.instagramData?.isVerified || false,
                },
                metrics: {
                  engagementRate: profileData.instagramStats?.engagementRate || 0,
                  averageLikes: profileData.instagramStats?.averageLikes || 0,
                  averageComments: profileData.instagramStats?.averageComments || 0,
                },
                recentPosts: profileData.instagramData?.recentMedia || [],
                fetchedAt: profileData.instagramData?.fetchedAt || profileData.instagramStats?.lastFetched,
              };
              setInstagramStats(igData);
            } else {
              // Fallback: try to reconstruct from platforms array
              const igPlatform = (profileData.platforms || []).find(p => p.type === 'Instagram');
              if (igPlatform?.stats) {
                const igData = {
                  profile: {
                    username: igPlatform.username || '',
                    name: '',
                    biography: '',
                    profilePicture: '',
                    followers: igPlatform.stats.followers || 0,
                    following: igPlatform.stats.following || 0,
                    posts: igPlatform.stats.posts || 0,
                    isVerified: false,
                  },
                  metrics: {
                    engagementRate: igPlatform.stats.engagementRate || 0,
                    averageLikes: 0,
                    averageComments: 0,
                  },
                  recentPosts: [],
                  fetchedAt: igPlatform.lastFetched,
                };
                setInstagramStats(igData);
              }
            }
          }
        } catch (error) {
          // Profile not found or error loading
        }
      } else if (isBrand) {
        try {
          const response = await brandService.getOwnProfile();
          const profileData = response.data || response;
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
          // Profile not found or error loading
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

      const updatedPlatforms = [...(formData.platforms || []), platform];
      
      setFormData({
        ...formData,
        platforms: updatedPlatforms,
      });

      // Auto-save to backend
      try {
        await influencerService.updateProfile({
          platforms: updatedPlatforms,
        });
      } catch (err) {
        console.warn('Failed to auto-save platform:', err);
      }

      setNewPlatform({ type: 'YouTube', url: '' });
      setShowPlatformModal(false);
      toast.success(`✅ ${newPlatform.type} platform connected and saved! It will appear in your Connected Platforms list.`);
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
          
          const updatedPlatforms = [...(formData.platforms || []), platform];
          
          setFormData({
            ...formData,
            platforms: updatedPlatforms,
          });
          
          // Auto-save to backend
          try {
            await influencerService.updateProfile({
              instagramUrl: newPlatform.url,
              platforms: updatedPlatforms,
            });
          } catch (err) {
            console.warn('Failed to auto-save Instagram platform:', err);
          }
          
          setNewPlatform({ type: 'YouTube', url: '' });
          setShowPlatformModal(false);
          toast.success('✅ Instagram connected and saved! Check Connected Platforms section below.');
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

          const updatedPlatforms = [...(formData.platforms || []), platform];

          // Also set instagramUrl so backend stores it and Social Media Analytics section shows
          setFormData(prev => ({
            ...prev,
            instagramUrl: newPlatform.url,
            platforms: updatedPlatforms,
          }));

          // Populate instagramStats state so it shows immediately in Social Media Analytics
          const formattedIgStats = {
            profile: {
              username: igData.profile?.username || '',
              name: igData.profile?.name || '',
              biography: igData.profile?.biography || '',
              profilePicture: igData.profile?.profilePicture || '',
              followers: igData.profile?.followers || 0,
              following: igData.profile?.following || 0,
              posts: igData.profile?.posts || 0,
              isVerified: igData.profile?.isVerified || false,
            },
            metrics: {
              engagementRate: igData.metrics?.engagementRate || 0,
              averageLikes: igData.metrics?.averageLikes || 0,
              averageComments: igData.metrics?.averageComments || 0,
            },
            recentPosts: igData.recentPosts || [],
            fetchedAt: new Date(),
            cached: false,
          };
          setInstagramStats(formattedIgStats);

          // Persist to DB via influencer service so data survives reload
          try {
            await influencerService.fetchInstagramProfile(newPlatform.url);
            // Also update platforms array in backend
            await influencerService.updateProfile({
              instagramUrl: newPlatform.url,
              platforms: updatedPlatforms,
            });
            clearCache();
          } catch (persistErr) {
            console.warn('Instagram data shown but failed to persist to DB:', persistErr);
          }

          setNewPlatform({ type: 'YouTube', url: '' });
          setShowPlatformModal(false);
          toast.success('🎉 Instagram connected with stats! Check Connected Platforms section 📸');
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

        const updatedPlatforms = [...(formData.platforms || []), platform];

        // Also set youtubeUrl so the backend stores it and Social Media Analytics section shows
        setFormData(prev => ({
          ...prev,
          youtubeUrl: newPlatform.url,
          platforms: updatedPlatforms,
        }));

        // Populate youtubeStats state so it shows immediately in Social Media Analytics
        const formattedYtStats = {
          channel: {
            title: ytData.channel?.title || '',
            subscriberCount: ytData.channel?.subscriberCount || 0,
            viewCount: ytData.channel?.viewCount || 0,
            videoCount: ytData.channel?.videoCount || 0,
            thumbnail: ytData.channel?.thumbnail || '',
            channelId: ytData.channel?.channelId || '',
          },
          metrics: {
            engagementRate: ytData.metrics?.engagementRate || 0,
            averageViews: ytData.metrics?.averageViews || 0,
          },
          recentVideos: ytData.recentVideos || [],
          fetchedAt: new Date(),
          cached: false,
        };
        setYoutubeStats(formattedYtStats);

        // Persist to DB via influencer service so data survives reload
        try {
          await influencerService.fetchYouTubeProfile(newPlatform.url);
          // Also update platforms array in backend
          await influencerService.updateProfile({
            youtubeUrl: newPlatform.url,
            platforms: updatedPlatforms,
          });
          clearCache();
        } catch (persistErr) {
          console.warn('YouTube data shown but failed to persist to DB:', persistErr);
        }

        setNewPlatform({ type: 'YouTube', url: '' });
        setShowPlatformModal(false);
        toast.success('🎉 YouTube connected with stats! Check Connected Platforms section 🎥');
      }
    } catch (error) {
      console.error('Error adding platform:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch YouTube data');
    } finally {
      setAddingPlatform(false);
    }
  };

  const handleRemovePlatform = async (index) => {
    const updatedPlatforms = formData.platforms.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      platforms: updatedPlatforms,
    });
    
    // Auto-save to backend
    try {
      await influencerService.updateProfile({
        platforms: updatedPlatforms,
      });
      toast.success('Platform removed and saved successfully');
    } catch (err) {
      console.warn('Failed to auto-save after removing platform:', err);
      toast.success('Platform removed locally (click Save Profile to persist)');
    }
  };


  const handleFetchYouTubeData = async () => {
    // Get YouTube URL from either direct field or platforms array
    const youtubeUrl = formData.youtubeUrl || 
      (formData.platforms || []).find(p => p.type === 'YouTube')?.url;
    
    if (!youtubeUrl) {
      toast.error('Please enter your YouTube channel URL first');
      return;
    }

    setFetchingYouTube(true);
    try {
      const response = await influencerService.fetchYouTubeProfile(youtubeUrl);

      if (response.success && response.data) {
        const ytData = response.data;

        // Update the stats state with fetched data
        const formattedData = {
          channel: {
            title: ytData.channel?.title || '',
            subscriberCount: ytData.channel?.subscriberCount || 0,
            viewCount: ytData.channel?.viewCount || 0,
            videoCount: ytData.channel?.videoCount || 0,
            thumbnail: ytData.channel?.thumbnail || '',
            channelId: ytData.channel?.channelId || '',
          },
          metrics: {
            engagementRate: ytData.metrics?.engagementRate || 0,
            averageViews: ytData.metrics?.averageViews || 0,
          },
          recentVideos: ytData.recentVideos || [],
          fetchedAt: new Date(),
          cached: response.cached || false,
        };
        
        setYoutubeStats(formattedData);
        
        // Invalidate influencer list cache so public profile shows fresh data
        clearCache();

        // Show success message with stats
        const message = response.cached
          ? `📦 YouTube data loaded from cache\n📊 ${formattedData.channel.subscriberCount?.toLocaleString()} subscribers`
          : `✅ YouTube data fetched!\n📊 ${formattedData.channel.subscriberCount?.toLocaleString()} subscribers\n📹 ${formattedData.channel.videoCount} videos\n💫 ${formattedData.metrics.engagementRate?.toFixed(2)}% engagement`;
        
        toast.success(message, { duration: 5000 });
      }
    } catch (error) {
      console.error('Error fetching YouTube data:', error);
      const errorMsg = error.response?.data?.message || 'Failed to fetch YouTube data';
      toast.error(errorMsg);
    } finally {
      setFetchingYouTube(false);
    }
  };

  const handleRefreshYouTubeData = async () => {
    setFetchingYouTube(true);
    try {
      const response = await influencerService.refreshYouTubeProfile();

      if (response.success && response.data) {
        const ytData = response.data;
        
        // Update the stats state with refreshed data
        const formattedData = {
          channel: {
            title: ytData.channel?.title || '',
            subscriberCount: ytData.channel?.subscriberCount || 0,
            viewCount: ytData.channel?.viewCount || 0,
            videoCount: ytData.channel?.videoCount || 0,
            thumbnail: ytData.channel?.thumbnail || '',
            channelId: ytData.channel?.channelId || '',
          },
          metrics: {
            engagementRate: ytData.metrics?.engagementRate || 0,
            averageViews: ytData.metrics?.averageViews || 0,
          },
          recentVideos: ytData.recentVideos || [],
          fetchedAt: new Date(),
          cached: false,
        };
        
        setYoutubeStats(formattedData);
        
        // Invalidate cache so public profile shows fresh data
        clearCache();

        toast.success(
          `🔄 YouTube data refreshed!\n📊 ${formattedData.channel.subscriberCount?.toLocaleString()} subscribers\n📹 ${formattedData.channel.videoCount} videos\n💫 ${formattedData.metrics.engagementRate?.toFixed(2)}% engagement`,
          { duration: 5000 }
        );
      }
    } catch (error) {
      console.error('Error refreshing YouTube data:', error);
      const errorMsg = error.response?.data?.message || 'Failed to refresh YouTube data';
      toast.error(errorMsg);
    } finally {
      setFetchingYouTube(false);
    }
  };

  const handleFetchInstagramData = async () => {
    // Get Instagram URL from either direct field or platforms array
    const instagramUrl = formData.instagramUrl || 
      (formData.platforms || []).find(p => p.type === 'Instagram')?.url;
    
    if (!instagramUrl) {
      toast.error('Please enter your Instagram profile URL first');
      return;
    }

    setFetchingInstagram(true);
    try {
      const response = await influencerService.fetchInstagramProfile(instagramUrl);

      if (response.requiresManualInput) {
        toast.error('Auto-fetch unavailable. Please enter your Instagram stats manually.');
        return;
      }

      if (response.success && response.data) {
        const igData = response.data;

        // Update the stats state with fetched data
        const formattedData = {
          profile: {
            username: igData.profile?.username || '',
            name: igData.profile?.name || '',
            biography: igData.profile?.biography || '',
            profilePicture: igData.profile?.profilePicture || '',
            followers: igData.profile?.followers || 0,
            following: igData.profile?.following || 0,
            posts: igData.profile?.posts || 0,
            isVerified: igData.profile?.isVerified || false,
          },
          metrics: {
            engagementRate: igData.metrics?.engagementRate || 0,
            averageLikes: igData.metrics?.averageLikes || 0,
            averageComments: igData.metrics?.averageComments || 0,
          },
          recentPosts: igData.recentPosts || [],
          fetchedAt: new Date(),
          cached: response.cached || false,
        };
        
        setInstagramStats(formattedData);
        
        // Invalidate cache so public profile shows fresh data
        clearCache();

        // Show success message with stats
        const message = response.cached
          ? `📦 Instagram data loaded from cache\n👥 ${formattedData.profile.followers?.toLocaleString()} followers`
          : `✅ Instagram data fetched!\n👥 ${formattedData.profile.followers?.toLocaleString()} followers\n📸 ${formattedData.profile.posts} posts\n💫 ${formattedData.metrics.engagementRate?.toFixed(2)}% engagement`;
        
        toast.success(message, { duration: 5000 });
      }
    } catch (error) {
      console.error('Error fetching Instagram data:', error);
      const errorMsg = error.response?.data?.message || 'Failed to fetch Instagram data';
      toast.error(errorMsg);
    } finally {
      setFetchingInstagram(false);
    }
  };

  const handleRefreshInstagramData = async () => {
    setFetchingInstagram(true);
    try {
      const response = await influencerService.refreshInstagramProfile();

      if (response.requiresManualInput) {
        toast.error('Auto-fetch unavailable. Please enter your Instagram stats manually.');
        return;
      }

      if (response.success && response.data) {
        const igData = response.data;
        
        // Update the stats state with refreshed data
        const formattedData = {
          profile: {
            username: igData.profile?.username || '',
            name: igData.profile?.name || '',
            biography: igData.profile?.biography || '',
            profilePicture: igData.profile?.profilePicture || '',
            followers: igData.profile?.followers || 0,
            following: igData.profile?.following || 0,
            posts: igData.profile?.posts || 0,
            isVerified: igData.profile?.isVerified || false,
          },
          metrics: {
            engagementRate: igData.metrics?.engagementRate || 0,
            averageLikes: igData.metrics?.averageLikes || 0,
            averageComments: igData.metrics?.averageComments || 0,
          },
          recentPosts: igData.recentPosts || [],
          fetchedAt: new Date(),
          cached: false,
        };
        
        setInstagramStats(formattedData);
        
        // Invalidate cache so public profile shows fresh data
        clearCache();

        toast.success(
          `🔄 Instagram data refreshed!\n👥 ${formattedData.profile.followers?.toLocaleString()} followers\n📸 ${formattedData.profile.posts} posts\n💫 ${formattedData.metrics.engagementRate?.toFixed(2)}% engagement`,
          { duration: 5000 }
        );
      }
    } catch (error) {
      console.error('Error refreshing Instagram data:', error);
      const errorMsg = error.response?.data?.message || 'Failed to refresh Instagram data';
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
          // Invalidate DataContext cache so influencer list reflects changes
          clearCache();
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

                {/* Social Media Stats Section - Only show if user has connected platforms */}
                {(formData.platforms || []).length > 0 && (
                  <div className="prof-section" style={{ marginTop: '2rem' }}>
                    <h2>Social Media Analytics</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      Detailed statistics for your connected platforms
                    </p>

                    {/* YouTube Stats - Only show if YouTube is connected */}
                    {(formData.platforms || []).some(p => p.type === 'YouTube') && (
                    <div className="prof-social-stats-card" style={{ marginBottom: '1.5rem' }}>
                      <div className="prof-stats-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Youtube size={24} style={{ color: '#FF0000' }} />
                          <h3>YouTube</h3>
                        </div>
                        <button
                          type="button"
                          onClick={youtubeStats ? handleRefreshYouTubeData : handleFetchYouTubeData}
                          disabled={fetchingYouTube}
                          className="btn btn-outline btn-sm"
                        >
                          {fetchingYouTube ? (
                            <>
                              <Loader size={16} className="animate-spin" />
                              {youtubeStats ? 'Refreshing...' : 'Fetching...'}
                            </>
                          ) : (
                            <>
                              <RefreshCw size={16} />
                              {youtubeStats ? 'Refresh Stats' : 'Fetch Stats'}
                            </>
                          )}
                        </button>
                      </div>

                      {youtubeStats ? (
                        <>
                          <div className="prof-stats-grid">
                            <div className="prof-stat-item">
                              <UsersIcon size={18} />
                              <div>
                                <p className="prof-stat-value">{youtubeStats.channel?.subscriberCount?.toLocaleString() || '0'}</p>
                                <p className="prof-stat-label">Subscribers</p>
                              </div>
                            </div>
                            <div className="prof-stat-item">
                              <Eye size={18} />
                              <div>
                                <p className="prof-stat-value">{youtubeStats.channel?.viewCount?.toLocaleString() || '0'}</p>
                                <p className="prof-stat-label">Total Views</p>
                              </div>
                            </div>
                            <div className="prof-stat-item">
                              <Camera size={18} />
                              <div>
                                <p className="prof-stat-value">{youtubeStats.channel?.videoCount?.toLocaleString() || '0'}</p>
                                <p className="prof-stat-label">Videos</p>
                              </div>
                            </div>
                            <div className="prof-stat-item">
                              <TrendingUp size={18} />
                              <div>
                                <p className="prof-stat-value">{youtubeStats.metrics?.engagementRate?.toFixed(2) || '0'}%</p>
                                <p className="prof-stat-label">Engagement</p>
                              </div>
                            </div>
                          </div>
                          {youtubeStats.fetchedAt && (
                            <p className="prof-stats-last-updated">
                              Last updated: {new Date(youtubeStats.fetchedAt).toLocaleString()}
                              {youtubeStats.cached && ' (from cache)'}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="prof-empty-state" style={{ padding: '2rem' }}>
                          <Youtube size={48} style={{ opacity: 0.3 }} />
                          <p>No YouTube stats available</p>
                          <p className="prof-empty-hint">Click "Fetch Stats" to load your YouTube analytics</p>
                        </div>
                      )}
                    </div>
                    )}

                    {/* Instagram Stats - Only show if Instagram is connected */}
                    {(formData.platforms || []).some(p => p.type === 'Instagram') && (
                    <div className="prof-social-stats-card">
                      <div className="prof-stats-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Instagram size={24} style={{ color: '#E4405F' }} />
                          <h3>Instagram</h3>
                        </div>
                        <button
                          type="button"
                          onClick={instagramStats ? handleRefreshInstagramData : handleFetchInstagramData}
                          disabled={fetchingInstagram}
                          className="btn btn-outline btn-sm"
                        >
                          {fetchingInstagram ? (
                            <>
                              <Loader size={16} className="animate-spin" />
                              {instagramStats ? 'Refreshing...' : 'Fetching...'}
                            </>
                          ) : (
                            <>
                              <RefreshCw size={16} />
                              {instagramStats ? 'Refresh Stats' : 'Fetch Stats'}
                            </>
                          )}
                        </button>
                      </div>

                      {instagramStats ? (
                        <>
                          <div className="prof-stats-grid">
                            <div className="prof-stat-item">
                              <UsersIcon size={18} />
                              <div>
                                <p className="prof-stat-value">{instagramStats.profile?.followers?.toLocaleString() || '0'}</p>
                                <p className="prof-stat-label">Followers</p>
                              </div>
                            </div>
                            <div className="prof-stat-item">
                              <UsersIcon size={18} />
                              <div>
                                <p className="prof-stat-value">{instagramStats.profile?.following?.toLocaleString() || '0'}</p>
                                <p className="prof-stat-label">Following</p>
                              </div>
                            </div>
                            <div className="prof-stat-item">
                              <Camera size={18} />
                              <div>
                                <p className="prof-stat-value">{instagramStats.profile?.posts?.toLocaleString() || '0'}</p>
                                <p className="prof-stat-label">Posts</p>
                              </div>
                            </div>
                            <div className="prof-stat-item">
                              <TrendingUp size={18} />
                              <div>
                                <p className="prof-stat-value">{instagramStats.metrics?.engagementRate?.toFixed(2) || '0'}%</p>
                                <p className="prof-stat-label">Engagement</p>
                              </div>
                            </div>
                          </div>
                          {instagramStats.fetchedAt && (
                            <p className="prof-stats-last-updated">
                              Last updated: {new Date(instagramStats.fetchedAt).toLocaleString()}
                              {instagramStats.cached && ' (from cache)'}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="prof-empty-state" style={{ padding: '2rem' }}>
                          <Instagram size={48} style={{ opacity: 0.3 }} />
                          <p>No Instagram stats available</p>
                          <p className="prof-empty-hint">Click "Fetch Stats" to load your Instagram analytics</p>
                        </div>
                      )}
                    </div>
                    )}
                  </div>
                )}

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
