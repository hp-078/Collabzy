import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import influencerService from '../../services/influencer.service';
import brandService from '../../services/brand.service';
import youtubeService from '../../services/youtube.service';
import instagramService from '../../services/instagram.service';
import { CATEGORY_OPTIONS, normalizeCategoryList } from '../../constants/categories';
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
  IndianRupee,
  Loader,
  RefreshCw,
  TrendingUp,
  Eye,
  Users as UsersIcon,
} from 'lucide-react';
import './Profile.css';

// ─── Helpers ────────────────────────────────────────────────────────────────

const toCategoryArray = (value) => {
  if (Array.isArray(value)) return normalizeCategoryList(value);
  if (typeof value === 'string' && value.trim()) return normalizeCategoryList([value]);
  return [];
};

const pickNumber = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const formatYouTubeStats = (raw = {}, previous = null) => {
  const channel = raw.channel || raw.youtubeData || {};
  const metrics = raw.metrics || raw.youtubeStats || {};

  return {
    channel: {
      title: channel.title || channel.channelTitle || previous?.channel?.title || '',
      subscriberCount: pickNumber(channel.subscriberCount, channel.subscribers, raw.youtubeStats?.subscribers, previous?.channel?.subscriberCount),
      viewCount: pickNumber(channel.viewCount, channel.totalViews, channel.views, raw.youtubeStats?.totalViews, previous?.channel?.viewCount),
      videoCount: pickNumber(channel.videoCount, channel.videos, raw.youtubeStats?.videoCount, previous?.channel?.videoCount),
      thumbnail: channel.thumbnail || previous?.channel?.thumbnail || '',
      channelId: channel.channelId || raw.youtubeChannelId || previous?.channel?.channelId || '',
    },
    metrics: {
      engagementRate: pickNumber(metrics.engagementRate, raw.youtubeStats?.engagementRate, previous?.metrics?.engagementRate),
      averageViews: pickNumber(metrics.averageViews, raw.youtubeStats?.averageViews, previous?.metrics?.averageViews),
    },
    recentVideos: raw.recentVideos || raw.youtubeData?.recentVideos || previous?.recentVideos || [],
    fetchedAt: raw.fetchedAt || raw.youtubeData?.fetchedAt || raw.youtubeStats?.lastFetched || previous?.fetchedAt,
    cached: Boolean(raw.cached),
  };
};

const formatInstagramStats = (raw = {}, previous = null) => {
  const profile = raw.profile || raw.instagramData || {};
  const metrics = raw.metrics || raw.instagramStats || {};

  return {
    profile: {
      username: profile.username || raw.instagramUsername || previous?.profile?.username || '',
      name: profile.name || previous?.profile?.name || '',
      biography: profile.biography || previous?.profile?.biography || '',
      profilePicture: profile.profilePicture || profile.profile_picture_url || previous?.profile?.profilePicture || '',
      followers: pickNumber(profile.followers, profile.followers_count, raw.instagramStats?.followers, previous?.profile?.followers),
      following: pickNumber(profile.following, profile.follows_count, raw.instagramStats?.following, previous?.profile?.following),
      posts: pickNumber(profile.posts, profile.media_count, raw.instagramStats?.posts, previous?.profile?.posts),
      isVerified: Boolean(profile.isVerified || previous?.profile?.isVerified),
    },
    metrics: {
      engagementRate: pickNumber(metrics.engagementRate, raw.instagramStats?.engagementRate, previous?.metrics?.engagementRate),
      averageLikes: pickNumber(metrics.averageLikes, raw.instagramStats?.averageLikes, previous?.metrics?.averageLikes),
      averageComments: pickNumber(metrics.averageComments, raw.instagramStats?.averageComments, previous?.metrics?.averageComments),
    },
    recentPosts: raw.recentPosts || profile.recentMedia || raw.instagramData?.recentMedia || previous?.recentPosts || [],
    fetchedAt: raw.fetchedAt || raw.instagramData?.fetchedAt || raw.instagramStats?.lastFetched || previous?.fetchedAt,
    cached: Boolean(raw.cached),
  };
};

// ─── Initial form state builder ──────────────────────────────────────────────

const buildFormData = (source = {}) => ({
  name: source.name || '',
  email: source.email || '',
  bio: source.description || source.bio || '',
  categories: toCategoryArray(source.niche || source.category),
  platformType: source.platform || source.platformType || 'Instagram',
  youtubeUrl: source.youtubeUrl || '',
  instagramUrl: source.instagramUrl || '',
  location: source.location || '',
  website: source.website || source.websiteUrl || '',
  industry: source.industry || '',
  services: source.services || [],
  platforms: source.platforms || [],
});

// ─── Component ───────────────────────────────────────────────────────────────

const Profile = () => {
  const { user, updateUser, isInfluencer, isBrand } = useAuth();
  const { clearCache } = useData();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(() => buildFormData(user));
  const [previewImage, setPreviewImage] = useState(user?.avatar || '');

  // Category picker state
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(-1);
  const categorySearchRef = useRef(null);

  // Social stats state
  const [youtubeStats, setYoutubeStats] = useState(null);
  const [fetchingYouTube, setFetchingYouTube] = useState(false);
  const [instagramStats, setInstagramStats] = useState(null);
  const [fetchingInstagram, setFetchingInstagram] = useState(false);

  // Modal state
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [addingPlatform, setAddingPlatform] = useState(false);
  const [importingPhoto, setImportingPhoto] = useState(false);

  const [newService, setNewService] = useState({ name: '', price: '', description: '' });
  const [newPlatform, setNewPlatform] = useState({ type: 'YouTube', url: '' });

  const fileInputRef = useRef(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Camera state
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  // ── Load profile on mount ────────────────────────────────────────────────

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (isInfluencer) {
          const response = await influencerService.getOwnProfile();
          const data = response.data || response;

          setFormData((prev) => ({
            ...prev,
            name: data.name || prev.name,
            bio: data.bio || prev.bio,
            categories: toCategoryArray(data.niche).length > 0 ? toCategoryArray(data.niche) : prev.categories,
            platformType: data.platformType || data.platform || prev.platformType,
            youtubeUrl: data.youtubeUrl || prev.youtubeUrl,
            instagramUrl: data.instagramUrl || prev.instagramUrl,
            location: data.location || prev.location,
            website: data.website || prev.website,
            services: data.services || prev.services,
            platforms: data.platforms || prev.platforms,
          }));

          if (data.avatar) setPreviewImage(data.avatar);

          // Load cached YouTube stats
          if (data.youtubeData || data.youtubeStats) {
            setYoutubeStats(formatYouTubeStats(data));
          } else {
            const ytPlatform = (data.platforms || []).find((p) => p.type === 'YouTube');
            if (ytPlatform?.stats) {
              setYoutubeStats(formatYouTubeStats({
                channel: {
                  channelTitle: ytPlatform.channelTitle,
                  subscribers: ytPlatform.stats.subscribers,
                  views: ytPlatform.stats.views,
                  videos: ytPlatform.stats.videos,
                  channelId: ytPlatform.channelId,
                },
                metrics: { engagementRate: ytPlatform.stats.engagementRate },
                fetchedAt: ytPlatform.lastFetched,
              }));
            }
          }

          // Load cached Instagram stats
          if (data.instagramData || data.instagramStats) {
            setInstagramStats(formatInstagramStats(data));
          } else {
            const igPlatform = (data.platforms || []).find((p) => p.type === 'Instagram');
            if (igPlatform?.stats) {
              setInstagramStats(formatInstagramStats({
                profile: {
                  username: igPlatform.username,
                  followers: igPlatform.stats.followers,
                  following: igPlatform.stats.following,
                  posts: igPlatform.stats.posts,
                },
                metrics: { engagementRate: igPlatform.stats.engagementRate },
                fetchedAt: igPlatform.lastFetched,
              }));
            }
          }
        } else if (isBrand) {
          const response = await brandService.getOwnProfile();
          const data = response.data || response;

          setFormData((prev) => ({
            ...prev,
            name: data.companyName || prev.name,
            bio: data.description || prev.bio,
            location: data.location || prev.location,
            website: data.websiteUrl || prev.website,
            industry: data.industry || prev.industry,
            instagramUrl: data.instagramUrl || prev.instagramUrl,
          }));

          if (data.logo) setPreviewImage(data.logo);
        }
      } catch {
        // Profile not found yet — silently ignore
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [isInfluencer, isBrand]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Image upload ─────────────────────────────────────────────────────────

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      e.target.value = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
      toast.success('Photo selected! Click "Save Changes" to apply.');
      setShowPhotoUploadModal(false);
      e.target.value = '';
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  const handleTakePhoto = async () => {
    setShowPhotoUploadModal(false);
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Camera is not supported in this browser. Please use "Choose from Gallery" instead.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      setCameraStream(stream);
      setShowCameraModal(true);

      // Attach stream to video element after modal renders
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access was denied. Please allow camera permissions in your browser settings.');
        toast.error('Camera permission denied. Please allow camera access and try again.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device.');
        toast.error('No camera found on this device. Please use "Choose from Gallery" instead.');
      } else {
        setCameraError('Failed to access camera. Please try again.');
        toast.error('Failed to open camera. Please try "Choose from Gallery" instead.');
      }
    }
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Use the video's actual dimensions for best quality
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    // Center-crop to square
    const offsetX = (video.videoWidth - size) / 2;
    const offsetY = (video.videoHeight - size) / 2;
    ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreviewImage(dataUrl);
    toast.success('Photo captured! Click "Save Changes" to apply.');

    // Clean up
    stopCamera();
    setShowCameraModal(false);
  };

  const handleCloseCameraModal = () => {
    stopCamera();
    setShowCameraModal(false);
    setCameraError(null);
  };

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const handleImportInstagramPhoto = async () => {
    // 1. Try existing data first (already loaded from database)
    const existingPhoto = instagramStats?.profile?.profilePicture;
    if (existingPhoto) {
      setPreviewImage(existingPhoto);
      toast.success('Instagram profile photo imported!');
      setShowPhotoUploadModal(false);
      return;
    }

    // 2. No cached photo — fall back to API call
    const url = formData.instagramUrl || (formData.platforms || []).find((p) => p.type === 'Instagram')?.url;
    if (!url) { toast.error('Please add your Instagram profile URL first'); return; }

    setImportingPhoto(true);
    try {
      const response = await instagramService.fetchProfile(url);
      if (response.success && response.data?.profile?.profilePicture) {
        setPreviewImage(response.data.profile.profilePicture);
        toast.success('Instagram profile photo imported!');
        setShowPhotoUploadModal(false);
      } else {
        toast.error('Could not fetch Instagram profile photo');
      }
    } catch {
      toast.error('Failed to import Instagram photo');
    } finally {
      setImportingPhoto(false);
    }
  };

  const handleImportYouTubePhoto = async () => {
    // 1. Try existing data first (already loaded from database)
    const existingPhoto = youtubeStats?.channel?.thumbnail;
    if (existingPhoto) {
      setPreviewImage(existingPhoto);
      toast.success('YouTube channel photo imported!');
      setShowPhotoUploadModal(false);
      return;
    }

    // 2. No cached photo — fall back to API call
    const url = formData.youtubeUrl || (formData.platforms || []).find((p) => p.type === 'YouTube')?.url;
    if (!url) { toast.error('Please add your YouTube channel URL first'); return; }

    setImportingPhoto(true);
    try {
      const response = await youtubeService.fetchProfile(url);
      if (response.success && response.data?.channel?.thumbnail) {
        setPreviewImage(response.data.channel.thumbnail);
        toast.success('YouTube channel photo imported!');
        setShowPhotoUploadModal(false);
      } else {
        toast.error('Could not fetch YouTube channel photo');
      }
    } catch {
      toast.error('Failed to import YouTube photo');
    } finally {
      setImportingPhoto(false);
    }
  };

  // ── Form change ──────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ── Category picker ──────────────────────────────────────────────────────

  const filteredCategoryOptions = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    if (query.length < 2) return [];
    return CATEGORY_OPTIONS
      .filter((c) => !formData.categories.includes(c))
      .filter((c) => c.toLowerCase().includes(query));
  }, [categorySearch, formData.categories]);

  const addCategory = (category) => {
    if (!category) return;
    setFormData((prev) =>
      prev.categories.includes(category) ? prev : { ...prev, categories: [...prev.categories, category] }
    );
    setCategorySearch('');
    setActiveCategoryIndex(-1);
    setIsCategoryDropdownOpen(false);
    categorySearchRef.current?.focus();
  };

  const removeCategory = (category) => {
    setFormData((prev) => ({ ...prev, categories: prev.categories.filter((c) => c !== category) }));
  };

  const handleCategorySearchKeyDown = (e) => {
    if (!isCategoryDropdownOpen || filteredCategoryOptions.length === 0) {
      if (e.key === 'Backspace' && !categorySearch && formData.categories.length > 0) {
        removeCategory(formData.categories[formData.categories.length - 1]);
      }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveCategoryIndex((p) => (p + 1) % filteredCategoryOptions.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveCategoryIndex((p) => (p <= 0 ? filteredCategoryOptions.length - 1 : p - 1)); }
    if (e.key === 'Enter') { e.preventDefault(); addCategory(filteredCategoryOptions[activeCategoryIndex] || filteredCategoryOptions[0]); }
    if (e.key === 'Escape') { setIsCategoryDropdownOpen(false); setActiveCategoryIndex(-1); }
  };

  // ── Services ─────────────────────────────────────────────────────────────

  const handleAddService = () => {
    if (!newService.name || !newService.price) { toast.error('Please fill in service name and price'); return; }
    const service = { id: Date.now().toString(), name: newService.name, price: parseInt(newService.price), description: newService.description };
    setFormData((prev) => ({ ...prev, services: [...prev.services, service] }));
    setNewService({ name: '', price: '', description: '' });
    setShowServiceModal(false);
    toast.success('Service added!');
  };

  const handleRemoveService = (serviceId) => {
    setFormData((prev) => ({ ...prev, services: prev.services.filter((s) => (s.id || s._id) !== serviceId) }));
  };

  // ── Platforms ────────────────────────────────────────────────────────────

  const handleAddPlatform = async () => {
    if (!newPlatform.url) { toast.error('Please enter the platform URL'); return; }

    // Non-auto-fetch platforms (e.g. TikTok)
    if (newPlatform.type !== 'YouTube' && newPlatform.type !== 'Instagram') {
      const platform = { type: newPlatform.type, url: newPlatform.url, addedAt: new Date().toISOString() };
      const updatedPlatforms = [...(formData.platforms || []), platform];
      setFormData((prev) => ({ ...prev, platforms: updatedPlatforms }));
      try { await influencerService.updateProfile({ platforms: updatedPlatforms }); } catch { /* best-effort */ }
      setNewPlatform({ type: 'YouTube', url: '' });
      setShowPlatformModal(false);
      toast.success(`✅ ${newPlatform.type} platform connected and saved!`);
      return;
    }

    setAddingPlatform(true);
    try {
      if (newPlatform.type === 'Instagram') {
        const response = await instagramService.fetchProfile(newPlatform.url);

        if (response.requiresManualInput) {
          const platform = { type: 'Instagram', url: newPlatform.url, addedAt: new Date().toISOString() };
          const updatedPlatforms = [...(formData.platforms || []), platform];
          setFormData((prev) => ({ ...prev, platforms: updatedPlatforms }));
          try { await influencerService.updateProfile({ instagramUrl: newPlatform.url, platforms: updatedPlatforms }); } catch { /* best-effort */ }
          setNewPlatform({ type: 'YouTube', url: '' });
          setShowPlatformModal(false);
          toast.success('✅ Instagram connected and saved!');
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
          setFormData((prev) => ({ ...prev, instagramUrl: newPlatform.url, platforms: updatedPlatforms }));
          setInstagramStats(formatInstagramStats({ ...igData, fetchedAt: new Date(), cached: false }, instagramStats));
          try {
            await influencerService.fetchInstagramProfile(newPlatform.url);
            await influencerService.updateProfile({ instagramUrl: newPlatform.url, platforms: updatedPlatforms });
            clearCache();
          } catch { /* best-effort */ }
          setNewPlatform({ type: 'YouTube', url: '' });
          setShowPlatformModal(false);
          toast.success('🎉 Instagram connected with stats!');
        }
      } else {
        // YouTube
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
          setFormData((prev) => ({ ...prev, youtubeUrl: newPlatform.url, platforms: updatedPlatforms }));
          setYoutubeStats(formatYouTubeStats({ ...ytData, fetchedAt: new Date(), cached: false }, youtubeStats));
          try {
            await influencerService.fetchYouTubeProfile(newPlatform.url);
            await influencerService.updateProfile({ youtubeUrl: newPlatform.url, platforms: updatedPlatforms });
            clearCache();
          } catch { /* best-effort */ }
          setNewPlatform({ type: 'YouTube', url: '' });
          setShowPlatformModal(false);
          toast.success('🎉 YouTube connected with stats!');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to fetch ${newPlatform.type} data`);
    } finally {
      setAddingPlatform(false);
    }
  };

  const handleRemovePlatform = async (index) => {
    const updatedPlatforms = formData.platforms.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, platforms: updatedPlatforms }));
    try {
      await influencerService.updateProfile({ platforms: updatedPlatforms });
      toast.success('Platform removed successfully');
    } catch {
      toast.success('Platform removed locally (click Save to persist)');
    }
  };

  // ── YouTube analytics ────────────────────────────────────────────────────

  const handleFetchYouTubeData = async () => {
    const url = formData.youtubeUrl || (formData.platforms || []).find((p) => p.type === 'YouTube')?.url;
    if (!url) { toast.error('Please enter your YouTube channel URL first'); return; }

    setFetchingYouTube(true);
    try {
      const response = await influencerService.fetchYouTubeProfile(url);
      if (response.success && response.data) {
        const formatted = formatYouTubeStats({ ...response.data, fetchedAt: new Date(), cached: response.cached || false }, youtubeStats);
        setYoutubeStats(formatted);
        clearCache();
        const msg = response.cached
          ? `📦 YouTube data from cache\n📊 ${formatted.channel.subscriberCount?.toLocaleString()} subscribers`
          : `✅ YouTube fetched!\n📊 ${formatted.channel.subscriberCount?.toLocaleString()} subscribers\n📹 ${formatted.channel.videoCount} videos\n💫 ${formatted.metrics.engagementRate?.toFixed(2)}% engagement`;
        toast.success(msg, { duration: 5000 });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch YouTube data');
    } finally {
      setFetchingYouTube(false);
    }
  };

  const handleRefreshYouTubeData = async () => {
    setFetchingYouTube(true);
    try {
      const response = await influencerService.refreshYouTubeProfile();
      if (response.success && response.data) {
        const formatted = formatYouTubeStats({ ...response.data, fetchedAt: new Date(), cached: false }, youtubeStats);
        setYoutubeStats(formatted);
        clearCache();
        toast.success(`🔄 YouTube refreshed!\n📊 ${formatted.channel.subscriberCount?.toLocaleString()} subscribers`, { duration: 5000 });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to refresh YouTube data');
    } finally {
      setFetchingYouTube(false);
    }
  };

  // ── Instagram analytics ──────────────────────────────────────────────────

  const handleFetchInstagramData = async () => {
    const url = formData.instagramUrl || (formData.platforms || []).find((p) => p.type === 'Instagram')?.url;
    if (!url) { toast.error('Please enter your Instagram profile URL first'); return; }

    setFetchingInstagram(true);
    try {
      const response = await influencerService.fetchInstagramProfile(url);
      if (response.requiresManualInput) { toast.error('Auto-fetch unavailable. Please enter stats manually.'); return; }
      if (response.success && response.data) {
        const formatted = formatInstagramStats({ ...response.data, fetchedAt: new Date(), cached: response.cached || false }, instagramStats);
        setInstagramStats(formatted);
        clearCache();
        const msg = response.cached
          ? `📦 Instagram data from cache\n👥 ${formatted.profile.followers?.toLocaleString()} followers`
          : `✅ Instagram fetched!\n👥 ${formatted.profile.followers?.toLocaleString()} followers\n📸 ${formatted.profile.posts} posts\n💫 ${formatted.metrics.engagementRate?.toFixed(2)}% engagement`;
        toast.success(msg, { duration: 5000 });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch Instagram data');
    } finally {
      setFetchingInstagram(false);
    }
  };

  const handleRefreshInstagramData = async () => {
    setFetchingInstagram(true);
    try {
      const response = await influencerService.refreshInstagramProfile();
      if (response.requiresManualInput) { toast.error('Auto-fetch unavailable. Please enter stats manually.'); return; }
      if (response.success && response.data) {
        const formatted = formatInstagramStats({ ...response.data, fetchedAt: new Date(), cached: false }, instagramStats);
        setInstagramStats(formatted);
        clearCache();
        toast.success(`🔄 Instagram refreshed!\n👥 ${formatted.profile.followers?.toLocaleString()} followers`, { duration: 5000 });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to refresh Instagram data');
    } finally {
      setFetchingInstagram(false);
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isInfluencer) {
        const payload = {
          name: formData.name,
          bio: formData.bio,
          niche: formData.categories,
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
          await influencerService.updateProfile(payload);
          clearCache();
          toast.success('Profile updated successfully!');
        } catch (err) {
          if (err.response?.status === 404) {
            await influencerService.createProfile(payload);
            toast.success('Profile created successfully!');
          } else throw err;
        }
      } else if (isBrand) {
        await brandService.updateProfile({
          companyName: formData.name,
          description: formData.bio,
          location: formData.location,
          websiteUrl: formData.website,
          industry: formData.industry,
          instagramUrl: formData.instagramUrl,
          logo: previewImage,
        });
        toast.success('Brand profile updated successfully!');
      }
      updateUser({ ...user, name: formData.name, avatar: previewImage });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="prof-page">
        <div className="prof-container prof-loading">
          <Loader size={48} className="spin-animation" />
          <p>Loading profile…</p>
        </div>
      </div>
    );
  }

  // ── Derived values ───────────────────────────────────────────────────────

  const platforms = formData.platforms || [];
  const hasYouTube = platforms.some((p) => p.type === 'YouTube');
  const hasInstagram = platforms.some((p) => p.type === 'Instagram');

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="prof-page">
      <div className="prof-container">
        <div className="prof-page-header">
          <h1>Settings</h1>
          <p>Manage your profile, account information and preferences</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="prof-grid">

            {/* ── Avatar Section ─────────────────────────────────────────── */}
            <div className="prof-section prof-avatar-section">
              <div className="prof-avatar-wrapper">
                {previewImage ? (
                  <img src={previewImage} alt={user.name} className="prof-avatar" />
                ) : (
                  <div className="prof-avatar-placeholder">{user?.name?.charAt(0) || 'U'}</div>
                )}
                <button
                  type="button"
                  className="prof-avatar-upload"
                  onClick={() => setShowPhotoUploadModal(true)}
                  title="Change profile photo"
                >
                  <Camera size={18} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />

              </div>

              <div className="prof-avatar-details">
                <h3>{user?.name}</h3>
                <span className="prof-user-role">{user?.role}</span>
                <p className="prof-avatar-hint">Click the camera icon to change your photo</p>
              </div>
            </div>

            {/* ── Basic Information ──────────────────────────────────────── */}
            <div className="prof-section">
              <h2>Basic Information</h2>
              <div className="prof-form-grid">
                <div className="input-group">
                  <label htmlFor="name"><User size={16} />{isInfluencer ? 'Full Name' : 'Brand Name'}</label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="input" />
                </div>

                <div className="input-group">
                  <label htmlFor="email"><Mail size={16} />Email Address</label>
                  <input type="email" id="email" name="email" value={formData.email} readOnly className="input prof-input-readonly" title="Email cannot be changed" />
                </div>

                <div className="input-group">
                  <label htmlFor="location"><MapPin size={16} />Location</label>
                  <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} placeholder="City, Country" className="input" />
                </div>

                {isBrand && (
                  <div className="input-group">
                    <label htmlFor="website"><Globe size={16} />Website</label>
                    <input type="url" id="website" name="website" value={formData.website} onChange={handleChange} placeholder="https://example.com" className="input" />
                  </div>
                )}
              </div>

              <div className="input-group prof-full-width">
                <label htmlFor="bio">About</label>
                <textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} placeholder="Tell us about yourself or your brand…" className="input prof-textarea" rows={4} />
              </div>
            </div>

            {/* ── Influencer-specific ────────────────────────────────────── */}
            {isInfluencer && (
              <>
                <div className="prof-section">
                  <h2>Creator Details</h2>
                  <div className="prof-form-grid">

                    {/* Category picker */}
                    <div className="input-group">
                      <label htmlFor="category">Niche / Category</label>
                      <div className="prof-category-picker">
                        <div className="prof-category-input-wrapper" onClick={() => categorySearchRef.current?.focus()}>
                          <input
                            ref={categorySearchRef}
                            id="category"
                            type="text"
                            value={categorySearch}
                            onChange={(e) => {
                              setCategorySearch(e.target.value);
                              setIsCategoryDropdownOpen(e.target.value.trim().length >= 2);
                              setActiveCategoryIndex(-1);
                            }}
                            onFocus={() => setIsCategoryDropdownOpen(categorySearch.trim().length >= 2)}
                            onBlur={() => setTimeout(() => { setIsCategoryDropdownOpen(false); setActiveCategoryIndex(-1); }, 120)}
                            onKeyDown={handleCategorySearchKeyDown}
                            className="prof-category-search-input"
                            placeholder="Type 2+ letters to search"
                          />
                          {categorySearch && (
                            <button type="button" className="prof-category-clear-btn" onClick={(e) => { e.stopPropagation(); setCategorySearch(''); setIsCategoryDropdownOpen(false); setActiveCategoryIndex(-1); categorySearchRef.current?.focus(); }} aria-label="Clear">
                              <X size={14} />
                            </button>
                          )}
                        </div>

                        {formData.categories.length > 0 && (
                          <div className="prof-category-chips">
                            {formData.categories.map((c) => (
                              <span key={c} className="prof-category-chip">
                                {c}
                                <button type="button" className="prof-category-chip-remove" onClick={() => removeCategory(c)} aria-label={`Remove ${c}`}><X size={12} /></button>
                              </span>
                            ))}
                          </div>
                        )}

                        {isCategoryDropdownOpen && (
                          <div className="prof-category-dropdown">
                            {filteredCategoryOptions.length > 0
                              ? filteredCategoryOptions.map((c, i) => (
                                <button key={c} type="button" className={`prof-category-option${i === activeCategoryIndex ? ' active' : ''}`} onMouseDown={() => addCategory(c)}>{c}</button>
                              ))
                              : <p className="prof-category-empty">No matching category found</p>
                            }
                          </div>
                        )}
                        <small className="prof-category-hint">Select multiple categories. Type at least 2 letters to search.</small>
                      </div>
                    </div>

                    {/* Primary platform */}
                    <div className="input-group">
                      <label htmlFor="platformType">Primary Platform</label>
                      <select id="platformType" name="platformType" value={formData.platformType} onChange={handleChange} className="input">
                        <option value="Instagram">Instagram</option>
                        <option value="YouTube">YouTube</option>
                        <option value="TikTok">TikTok</option>
                        <option value="Multiple">Multiple Platforms</option>
                      </select>
                    </div>
                  </div>

                  {/* Connected Platforms (unified — includes stats, refresh & remove) */}
                  <div className="prof-section-header" style={{ marginTop: '1.5rem' }}>
                    <h3>Connected Platforms</h3>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowPlatformModal(true)}>
                      <Plus size={16} />Add Platform
                    </button>
                  </div>

                  <div className="prof-platforms-list">
                    {platforms.length > 0 ? platforms.map((platform, index) => {
                      const isYT = platform.type === 'YouTube';
                      const isIG = platform.type === 'Instagram';
                      const stats = isYT ? youtubeStats : isIG ? instagramStats : null;

                      return (
                        <div key={index} className="prof-social-stats-card">
                          {/* Header: icon + name + URL + actions */}
                          <div className="prof-stats-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                              {isYT && <Youtube size={24} style={{ color: '#FF0000', flexShrink: 0 }} />}
                              {isIG && <Instagram size={24} style={{ color: '#E4405F', flexShrink: 0 }} />}
                              {!isYT && !isIG && <Globe size={24} style={{ flexShrink: 0 }} />}
                              <div style={{ minWidth: 0 }}>
                                <h3 style={{ margin: 0 }}>{platform.type}</h3>
                                <p className="prof-platform-url" style={{ margin: 0, fontSize: '0.8rem' }}>{platform.url}</p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                              {/* Refresh / Fetch button (YouTube & Instagram only) */}
                              {isYT && (
                                <button type="button" onClick={stats ? handleRefreshYouTubeData : handleFetchYouTubeData} disabled={fetchingYouTube} className="btn btn-outline btn-sm">
                                  {fetchingYouTube ? <><Loader size={16} className="animate-spin" />{stats ? 'Refreshing…' : 'Fetching…'}</> : <><RefreshCw size={16} />{stats ? 'Refresh' : 'Fetch Stats'}</>}
                                </button>
                              )}
                              {isIG && (
                                <button type="button" onClick={stats ? handleRefreshInstagramData : handleFetchInstagramData} disabled={fetchingInstagram} className="btn btn-outline btn-sm">
                                  {fetchingInstagram ? <><Loader size={16} className="animate-spin" />{stats ? 'Refreshing…' : 'Fetching…'}</> : <><RefreshCw size={16} />{stats ? 'Refresh' : 'Fetch Stats'}</>}
                                </button>
                              )}
                              {/* Remove button */}
                              <button type="button" onClick={() => handleRemovePlatform(index)} className="prof-platform-remove">
                                <X size={18} />
                              </button>
                            </div>
                          </div>

                          {/* Stats grid */}
                          {isYT && stats ? (
                            <>
                              <div className="prof-stats-grid">
                                <div className="prof-stat-item"><UsersIcon size={18} /><div><p className="prof-stat-value">{stats.channel?.subscriberCount?.toLocaleString() || '0'}</p><p className="prof-stat-label">Subscribers</p></div></div>
                                <div className="prof-stat-item"><Eye size={18} /><div><p className="prof-stat-value">{stats.channel?.viewCount?.toLocaleString() || '0'}</p><p className="prof-stat-label">Total Views</p></div></div>
                                <div className="prof-stat-item"><Camera size={18} /><div><p className="prof-stat-value">{stats.channel?.videoCount?.toLocaleString() || '0'}</p><p className="prof-stat-label">Videos</p></div></div>
                                <div className="prof-stat-item"><TrendingUp size={18} /><div><p className="prof-stat-value">{stats.metrics?.engagementRate?.toFixed(2) || '0'}%</p><p className="prof-stat-label">Engagement</p></div></div>
                              </div>
                              {stats.fetchedAt && (
                                <p className="prof-stats-last-updated">Last updated: {new Date(stats.fetchedAt).toLocaleString()}{stats.cached && ' (from cache)'}</p>
                              )}
                            </>
                          ) : isIG && stats ? (
                            <>
                              <div className="prof-stats-grid">
                                <div className="prof-stat-item"><UsersIcon size={18} /><div><p className="prof-stat-value">{stats.profile?.followers?.toLocaleString() || '0'}</p><p className="prof-stat-label">Followers</p></div></div>
                                <div className="prof-stat-item"><UsersIcon size={18} /><div><p className="prof-stat-value">{stats.profile?.following?.toLocaleString() || '0'}</p><p className="prof-stat-label">Following</p></div></div>
                                <div className="prof-stat-item"><Camera size={18} /><div><p className="prof-stat-value">{stats.profile?.posts?.toLocaleString() || '0'}</p><p className="prof-stat-label">Posts</p></div></div>
                                <div className="prof-stat-item"><TrendingUp size={18} /><div><p className="prof-stat-value">{stats.metrics?.engagementRate?.toFixed(2) || '0'}%</p><p className="prof-stat-label">Engagement</p></div></div>
                              </div>
                              {stats.fetchedAt && (
                                <p className="prof-stats-last-updated">Last updated: {new Date(stats.fetchedAt).toLocaleString()}{stats.cached && ' (from cache)'}</p>
                              )}
                            </>
                          ) : (isYT || isIG) ? (
                            <div className="prof-empty-state" style={{ padding: '1.5rem' }}>
                              {isYT ? <Youtube size={36} style={{ opacity: 0.3 }} /> : <Instagram size={36} style={{ opacity: 0.3 }} />}
                              <p>No stats available yet</p>
                              <p className="prof-empty-hint">Click "{stats ? 'Refresh' : 'Fetch Stats'}" to load analytics</p>
                            </div>
                          ) : (
                            /* Non-YouTube/Instagram platforms: show basic info */
                            platform.stats && (
                              <div className="prof-platform-stats" style={{ marginTop: '0.75rem' }}>
                                {platform.stats.subscribers != null && <span><UsersIcon size={14} />{platform.stats.subscribers.toLocaleString()} subscribers</span>}
                                {platform.stats.followers != null && <span><UsersIcon size={14} />{platform.stats.followers.toLocaleString()} followers</span>}
                              </div>
                            )
                          )}
                        </div>
                      );
                    }) : (
                      <div className="prof-empty-state">
                        <Globe size={48} />
                        <p>No platforms connected yet</p>
                        <p className="prof-empty-hint">Add your social media platforms to automatically track your stats</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Services */}
                <div className="prof-section prof-services-section">
                  <div className="prof-section-header">
                    <h2>Services</h2>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowServiceModal(true)}>
                      <Plus size={16} />Add Service
                    </button>
                  </div>
                  <div className="prof-services-list">
                    {formData.services.length > 0 ? formData.services.map((service) => (
                      <div key={service.id || service._id} className="prof-service-item">
                        <div className="prof-service-info">
                          <h4>{service.name}</h4>
                          <p>{service.description}</p>
                        </div>
                        <div className="prof-service-actions">
                          <span className="prof-service-price"><IndianRupee size={16} />{service.price}</span>
                          <button type="button" className="prof-remove-btn" onClick={() => handleRemoveService(service.id || service._id)}><X size={16} /></button>
                        </div>
                      </div>
                    )) : (
                      <p className="prof-no-services">No services added yet. Add your services to start receiving collaboration requests.</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ── Brand-specific ─────────────────────────────────────────── */}
            {isBrand && (
              <div className="prof-section">
                <h2>Brand Details</h2>
                <div className="prof-form-grid">
                  <div className="input-group">
                    <label htmlFor="industry">Industry</label>
                    <select id="industry" name="industry" value={formData.industry} onChange={handleChange} className="input">
                      <option value="">Select an industry</option>
                      {['Technology','Fashion','Food & Beverage','Beauty & Cosmetics','Health & Wellness','Travel & Hospitality','E-commerce','Entertainment','Finance','Other'].map((ind) => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save button */}
          <div className="prof-form-actions">
            <button type="submit" className="btn btn-primary btn-lg prof-save-btn" disabled={saving}>
              <Save size={18} />
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* ── Add Service Modal ──────────────────────────────────────────── */}
        {showServiceModal && (
          <div className="prof-modal-overlay" onClick={() => setShowServiceModal(false)}>
            <div className="prof-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="prof-modal-header">
                <h2>Add Service</h2>
                <button type="button" className="prof-modal-close" onClick={() => setShowServiceModal(false)}><X size={24} /></button>
              </div>
              <div className="prof-modal-body">
                <div className="input-group">
                  <label htmlFor="serviceName">Service Name</label>
                  <input type="text" id="serviceName" value={newService.name} onChange={(e) => setNewService((p) => ({ ...p, name: e.target.value }))} placeholder="e.g., Instagram Post, YouTube Review" className="input" />
                </div>
                <div className="input-group">
                  <label htmlFor="servicePrice">Price (₹)</label>
                  <input type="number" id="servicePrice" value={newService.price} onChange={(e) => setNewService((p) => ({ ...p, price: e.target.value }))} placeholder="500" className="input" />
                </div>
                <div className="input-group">
                  <label htmlFor="serviceDescription">Description</label>
                  <textarea id="serviceDescription" value={newService.description} onChange={(e) => setNewService((p) => ({ ...p, description: e.target.value }))} placeholder="Describe what's included…" className="input prof-textarea" rows={3} />
                </div>
              </div>
              <div className="prof-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowServiceModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleAddService}>Add Service</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Add Platform Modal ─────────────────────────────────────────── */}
        {showPlatformModal && (
          <div className="prof-modal-overlay" onClick={() => setShowPlatformModal(false)}>
            <div className="prof-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="prof-modal-header">
                <h2>Add Platform</h2>
                <button type="button" className="prof-modal-close" onClick={() => setShowPlatformModal(false)}><X size={24} /></button>
              </div>
              <div className="prof-modal-body">
                <div className="input-group">
                  <label htmlFor="newPlatformType">Platform Type</label>
                  <select id="newPlatformType" value={newPlatform.type} onChange={(e) => setNewPlatform((p) => ({ ...p, type: e.target.value }))} className="input">
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
                    {' '}Platform URL
                  </label>
                  <input
                    type="url" id="platformUrl" value={newPlatform.url}
                    onChange={(e) => setNewPlatform((p) => ({ ...p, url: e.target.value }))}
                    placeholder={
                      newPlatform.type === 'YouTube' ? 'https://youtube.com/@yourchannel'
                        : newPlatform.type === 'Instagram' ? 'https://instagram.com/yourusername'
                        : 'https://tiktok.com/@yourusername'
                    }
                    className="input"
                  />
                </div>
                <div className="prof-platform-note">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {newPlatform.type === 'TikTok' ? <Globe size={16} style={{ color: 'var(--pastel-sky)' }} /> : <TrendingUp size={16} style={{ color: 'var(--accent-coral)' }} />}
                    <strong>{newPlatform.type === 'TikTok' ? 'Coming Soon' : 'Auto-fetch enabled'}</strong>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {newPlatform.type === 'YouTube' && 'YouTube stats will be fetched immediately.'}
                    {newPlatform.type === 'Instagram' && 'Instagram stats will be fetched via Graph API.'}
                    {newPlatform.type === 'TikTok' && 'Auto-fetch for TikTok will be available soon.'}
                  </p>
                </div>
              </div>
              <div className="prof-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPlatformModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleAddPlatform} disabled={addingPlatform}>
                  {addingPlatform ? <><Loader size={18} className="animate-spin" />Adding…</> : <><Plus size={18} />Add Platform</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Photo Upload Modal ─────────────────────────────────────────── */}
        {showPhotoUploadModal && (
          <div className="prof-modal-overlay" onClick={() => setShowPhotoUploadModal(false)}>
            <div className="prof-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
              <div className="prof-modal-header">
                <h2>Change Profile Photo</h2>
                <button type="button" className="prof-modal-close" onClick={() => setShowPhotoUploadModal(false)}><X size={24} /></button>
              </div>
              <div className="prof-modal-body">
                {previewImage && (
                  <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Current Photo</p>
                    <img src={previewImage} alt="Current profile" style={{ width: 200, height: 200, borderRadius: 'var(--clay-radius)', objectFit: 'cover', border: '2px solid var(--gray-200)' }} />
                  </div>
                )}
                <p style={{ fontSize: '0.95rem', color: 'var(--dark-text)', marginBottom: '1.5rem', fontWeight: 500 }}>Choose how to change your photo:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button type="button" onClick={handleTakePhoto} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem', fontWeight: 500 }}>
                    <Camera size={20} />Take Photo with Camera
                  </button>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem', fontWeight: 500 }}>
                    <Camera size={20} />Choose from Gallery
                  </button>
                  {(formData.instagramUrl || hasInstagram) && (
                    <button type="button" onClick={handleImportInstagramPhoto} disabled={importingPhoto} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem', fontWeight: 500, opacity: importingPhoto ? 0.6 : 1 }}>
                      {importingPhoto ? <><Loader size={20} className="animate-spin" />Importing…</> : <><Instagram size={20} style={{ color: '#E4405F' }} />Import from Instagram</>}
                    </button>
                  )}
                  {(formData.youtubeUrl || hasYouTube) && (
                    <button type="button" onClick={handleImportYouTubePhoto} disabled={importingPhoto} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem', fontWeight: 500, opacity: importingPhoto ? 0.6 : 1 }}>
                      {importingPhoto ? <><Loader size={20} className="animate-spin" />Importing…</> : <><Youtube size={20} style={{ color: '#FF0000' }} />Import from YouTube</>}
                    </button>
                  )}
                </div>
              </div>
              <div className="prof-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPhotoUploadModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Camera Preview Modal ────────────────────────────────────────── */}
        {showCameraModal && (
          <div className="prof-modal-overlay" onClick={handleCloseCameraModal}>
            <div className="prof-modal-content prof-camera-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
              <div className="prof-modal-header">
                <h2>📸 Take Photo</h2>
                <button type="button" className="prof-modal-close" onClick={handleCloseCameraModal}><X size={24} /></button>
              </div>
              <div className="prof-modal-body" style={{ padding: '0' }}>
                <div className="prof-camera-preview">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      maxHeight: '400px',
                      objectFit: 'cover',
                      borderRadius: '12px',
                      transform: 'scaleX(-1)',
                      background: '#000',
                    }}
                  />
                  {cameraError && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Camera size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                      <p>{cameraError}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="prof-modal-actions" style={{ justifyContent: 'center', gap: '1rem', padding: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseCameraModal}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCapturePhoto}
                  disabled={!cameraStream}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Camera size={18} />Capture Photo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden canvas for camera capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default Profile;