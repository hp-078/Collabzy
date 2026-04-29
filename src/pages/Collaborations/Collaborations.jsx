import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  IndianRupee,
  Calendar,
  MessageSquare,
  Filter,
  Search,
  Loader,
  Eye,
  FileText,
  Play,
  Upload,
  AlertCircle,
  Handshake,
  Star,
  CreditCard,
  Lock,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  Users,
  TrendingUp,
  LayoutGrid,
  List,
  Award,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import paymentService from '../../services/payment.service';
import './Collaborations.css';

const Collaborations = () => {
  const { user, isInfluencer, isBrand } = useAuth();
  const navigate = useNavigate();
  const {
    applications,
    deals,
    loading,
    error,
    fetchMyApplications,
    fetchMyCampaigns,
    fetchCampaignApplications,
    updateApplicationStatus,
    fetchMyDeals,
    createDeal,
    updateDealStatus,
    createReview
  } = useData();
  
  const getTabStorageKey = () => {
    const role = isBrand ? 'brand' : isInfluencer ? 'influencer' : 'user';
    const userPart = user?._id || user?.id || 'guest';
    return `collabzy_collab_tab_${role}_${userPart}`;
  };

  // Tabs: 'applications' | 'pending_payment' | 'deals'
  const [activeTab, setActiveTab] = useState('applications');

  const switchTab = (tab) => {
    setActiveTab(tab);
    localStorage.setItem(getTabStorageKey(), tab);
  };
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [localLoading, setLocalLoading] = useState(true);
  const [brandApplications, setBrandApplications] = useState([]);
  const [myDeals, setMyDeals] = useState([]);
  const [dealFilter, setDealFilter] = useState('all');
  const [showCreateDealModal, setShowCreateDealModal] = useState(null); // holds application to create deal from
  const [dealForm, setDealForm] = useState({ agreedRate: '', deadline: '' });
  const [submitting, setSubmitting] = useState(false);
  
  // Review state
  const [showReviewModal, setShowReviewModal] = useState(null); // holds deal to review
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', content: '' });

  // Payment state
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [dealPayments, setDealPayments] = useState({}); // Cache payment status by deal ID

  // === Brand-specific state ===
  const [viewMode, setViewMode] = useState('campaign'); // 'campaign' | 'table'
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [brandFilters, setBrandFilters] = useState({
    selectedCampaign: 'all',
    status: 'all',
    platform: 'all',
    niches: [],
    rateMin: '',
    rateMax: '',
    dateFrom: '',
    dateTo: '',
    minTrustScore: '',
    minFollowers: '',
    sortBy: 'newest',
  });
  const [expandedCampaigns, setExpandedCampaigns] = useState({});
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedApplicationIds, setSelectedApplicationIds] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // === Brand deals state ===
  const [dealViewMode, setDealViewMode] = useState('campaign'); // 'campaign' | 'table'
  const [dealSearchTerm, setDealSearchTerm] = useState('');
  const [showDealAdvancedFilters, setShowDealAdvancedFilters] = useState(false);
  const [expandedDealGroups, setExpandedDealGroups] = useState({});
  const [brandDealFilters, setBrandDealFilters] = useState({
    selectedCampaign: 'all',
    status: 'all',
    source: 'all',
    paymentStatus: 'all',
    rateMin: '',
    rateMax: '',
    deadlineFrom: '',
    deadlineTo: '',
    createdFrom: '',
    createdTo: '',
    overdueOnly: false,
    sortBy: 'newest',
  });

  // === Pending payment payment state ===
  const [pendingPaymentDealForPayment, setPendingPaymentDealForPayment] = useState(null);

  const NICHES = ['Fashion', 'Beauty', 'Tech', 'Gaming', 'Fitness', 'Food', 'Travel', 'Lifestyle', 'Education', 'Entertainment', 'Business', 'Sports'];

  const getProfilePlatformLabel = (profile = {}) => {
    if (profile.platformType) return profile.platformType;

    const connectedPlatforms = Array.isArray(profile.platforms)
      ? profile.platforms
        .map((p) => p?.type)
        .filter(Boolean)
      : [];

    const uniqueConnected = [...new Set(connectedPlatforms)];
    if (uniqueConnected.length > 1) return 'Multiple';
    if (uniqueConnected.length === 1) return uniqueConnected[0];

    const hasInstagram = Number(profile?.instagramStats?.followers || 0) > 0;
    const hasYouTube = Number(profile?.youtubeStats?.subscribers || 0) > 0;

    if (hasInstagram && hasYouTube) return 'Multiple';
    if (hasInstagram) return 'Instagram';
    if (hasYouTube) return 'YouTube';

    return 'Unknown';
  };

  const getProfilePlatformClass = (platformLabel) => {
    const normalized = String(platformLabel || 'other').toLowerCase();
    if (normalized.includes('instagram')) return 'instagram';
    if (normalized.includes('youtube')) return 'youtube';
    if (normalized.includes('tiktok')) return 'tiktok';
    if (normalized.includes('multiple')) return 'multiple';
    return 'other';
  };

  const getProfileEngagementRate = (profile = {}) => {
    const direct = Number(profile?.averageEngagementRate);
    if (Number.isFinite(direct) && direct >= 0) return direct;

    const yt = Number(profile?.youtubeStats?.engagementRate);
    const ig = Number(profile?.instagramStats?.engagementRate);
    const values = [yt, ig].filter((v) => Number.isFinite(v) && v >= 0);

    if (values.length === 0) return null;
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    return avg;
  };

  const formatEngagementRate = (profile = {}) => {
    const value = getProfileEngagementRate(profile);
    return value === null ? '—' : `${value.toFixed(1)}%`;
  };

  const isPlatformMatch = (profile = {}, selectedPlatform = 'all') => {
    if (selectedPlatform === 'all') return true;
    const platformLabel = getProfilePlatformLabel(profile);
    return platformLabel.toLowerCase() === selectedPlatform.toLowerCase();
  };

  const isCampaignObject = (campaignValue) => (
    !!campaignValue && typeof campaignValue === 'object' && !Array.isArray(campaignValue)
  );

  const getCampaignIdFromApp = (app) => (
    app?.campaign?._id ||
    app?.campaignId ||
    (typeof app?.campaign === 'string' ? app.campaign : null)
  );

  const normalizeCampaignApplication = (app, fallbackCampaign = null) => {
    const normalizedCampaign = isCampaignObject(app?.campaign) ? app.campaign : fallbackCampaign;
    const normalizedCampaignId = (
      normalizedCampaign?._id ||
      normalizedCampaign?.id ||
      (typeof app?.campaign === 'string' ? app.campaign : null) ||
      fallbackCampaign?._id ||
      null
    );

    return {
      ...app,
      campaign: normalizedCampaign,
      campaignId: normalizedCampaignId,
    };
  };

  const loadBrandApplications = async () => {
    const campaigns = await fetchMyCampaigns();
    if (!campaigns || campaigns.length === 0) {
      setBrandApplications([]);
      return;
    }

    const allApps = [];
    for (const campaign of campaigns) {
      const apps = await fetchCampaignApplications(campaign._id);
      allApps.push(...apps.map(app => normalizeCampaignApplication(app, campaign)));
    }
    setBrandApplications(allApps);
  };

  const getCampaignIdFromDeal = (deal) => (
    deal?.campaign?._id ||
    deal?.campaignId ||
    (typeof deal?.campaign === 'string' ? deal.campaign : null)
  );

  const getDealCampaignTitle = (deal) => {
    if (deal?.campaign?.title) return deal.campaign.title;
    const campaignId = getCampaignIdFromDeal(deal);
    if (!campaignId) return 'Direct Outreach';
    return `Campaign ${String(campaignId).slice(-6)}`;
  };

  const getDealPaymentStatus = (deal) => (
    deal?.paymentStatus || deal?.paymentId?.paymentStatus || (deal?.paymentId ? 'paid' : 'pending')
  );

  const isDealPendingPayment = (deal) => {
    const paymentStatus = getDealPaymentStatus(deal);
    if (deal?.status === 'pending_payment') return true;

    // Backward-compatible fallback for older records created before pending_payment stage.
    return (deal?.status === 'active' || deal?.status === 'in_progress') && paymentStatus === 'pending';
  };

  // Fetch data on mount
  useEffect(() => {
    const storageKey = getTabStorageKey();
    const savedTab = localStorage.getItem(storageKey);
    const validTabs = ['applications', 'pending_payment', 'deals'];
    setActiveTab(validTabs.includes(savedTab) ? savedTab : 'applications');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, user?.id, isBrand, isInfluencer]);

  useEffect(() => {
    localStorage.setItem(getTabStorageKey(), activeTab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user?._id, user?.id, isBrand, isInfluencer]);

  useEffect(() => {
    const loadData = async () => {
      setLocalLoading(true);
      try {
        // Load applications
        if (isInfluencer) {
          await fetchMyApplications();
        } else if (isBrand) {
          await loadBrandApplications();
        }
        
        // Load deals
        const dealsData = await fetchMyDeals(true);
        setMyDeals(dealsData || []);

        // Load Razorpay script
        if (isBrand) {
          try {
            await paymentService.loadRazorpayScript();
            setRazorpayLoaded(true);
          } catch (err) {
            console.error('Failed to load Razorpay:', err);
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLocalLoading(false);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dealApplicationIds = useMemo(() => {
    const ids = new Set();
    myDeals.forEach((deal) => {
      const appId = deal?.application?._id || (typeof deal?.application === 'string' ? deal.application : null);
      if (appId) ids.add(appId);
    });
    return ids;
  }, [myDeals]);

  const visibleInfluencerApplications = useMemo(
    () => applications.filter((app) => !dealApplicationIds.has(app._id)),
    [applications, dealApplicationIds]
  );

  const visibleBrandApplications = useMemo(
    () => brandApplications.filter((app) => !dealApplicationIds.has(app._id)),
    [brandApplications, dealApplicationIds]
  );

  // Use the right data source based on role and exclude applications that already moved to deal flow.
  const items = isInfluencer ? visibleInfluencerApplications : visibleBrandApplications;

  const filteredItems = items.filter(app => {
    // Status filter
    let matchesFilter = filter === 'all';
    if (filter === 'pending') matchesFilter = app.status === 'pending' || app.status === 'reviewed';
    else if (filter === 'active') matchesFilter = app.status === 'shortlisted' || app.status === 'accepted';
    else if (filter === 'completed') matchesFilter = app.status === 'accepted';
    else if (filter === 'rejected') matchesFilter = app.status === 'rejected' || app.status === 'withdrawn';
    else if (filter === 'all') matchesFilter = true;

    // Search filter
    const campaignTitle = app.campaign?.title || '';
    const brandName = app.campaign?.brandProfile?.companyName || '';
    const influencerName = app.influencer?.name || app.influencerProfile?.name || '';
    const matchesSearch = !searchTerm ||
      campaignTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      influencerName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleStatusChange = async (appId, newStatus) => {
    const result = await updateApplicationStatus(appId, newStatus);
    if (result.success) {
      // Refresh data
      if (isInfluencer) {
        fetchMyApplications({}, true);
      } else {
        // Reload brand applications
        const campaigns = await fetchMyCampaigns();
        if (campaigns && campaigns.length > 0) {
          const allApps = [];
          for (const campaign of campaigns) {
            const apps = await fetchCampaignApplications(campaign._id);
            allApps.push(...apps.map(a => normalizeCampaignApplication(a, campaign)));
          }
          setBrandApplications(allApps);
        }
      }
    } else {
      alert(`❌ Failed to update application status!\n\n${result.error}\n\n✅ Solution:\n1. Open a new terminal\n2. cd backend\n3. npm run dev\n\nSee START_HERE.md for details`);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
      case 'reviewed':
        return <Clock size={16} />;
      case 'shortlisted':
        return <Eye size={16} />;
      case 'accepted':
        return <CheckCircle size={16} />;
      case 'rejected':
      case 'withdrawn':
        return <XCircle size={16} />;
      default:
        return null;
    }
  };

  const statusCounts = {
    all: items.length,
    pending: items.filter(a => a.status === 'pending' || a.status === 'reviewed').length,
    active: items.filter(a => a.status === 'shortlisted' || a.status === 'accepted').length,
    completed: items.filter(a => a.status === 'accepted').length,
  };

  const pendingPaymentDeals = useMemo(
    () => myDeals.filter((deal) => isDealPendingPayment(deal)),
    [myDeals]
  );

  const nonPendingPaymentDeals = useMemo(
    () => myDeals.filter((deal) => !isDealPendingPayment(deal)),
    [myDeals]
  );

  // Filter deals (excluding pending payment stage)
  const filteredDeals = nonPendingPaymentDeals.filter(deal => {
    const matchesFilter = dealFilter === 'all' || deal.status === dealFilter;
    const campaignTitle = deal.campaign?.title || '';
    const otherPartyName = isBrand 
      ? (deal.influencer?.name || '') 
      : (deal.brand?.name || '');
    const matchesSearch = !searchTerm ||
      campaignTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      otherPartyName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const dealStatusCounts = {
    all: nonPendingPaymentDeals.length,
    active: nonPendingPaymentDeals.filter(d => d.status === 'active' || d.status === 'in_progress').length,
    pending_review: nonPendingPaymentDeals.filter(d => d.status === 'pending_review').length,
    completed: nonPendingPaymentDeals.filter(d => d.status === 'completed').length,
  };

  const brandDealCampaignOptions = useMemo(() => {
    const seen = new Set();
    const options = [];
    let hasDirect = false;

    nonPendingPaymentDeals.forEach(deal => {
      const campaignId = getCampaignIdFromDeal(deal);
      if (!campaignId) {
        hasDirect = true;
        return;
      }

      if (!seen.has(campaignId)) {
        seen.add(campaignId);
        options.push({
          id: campaignId,
          title: getDealCampaignTitle(deal),
        });
      }
    });

    options.sort((a, b) => a.title.localeCompare(b.title));

    return {
      campaigns: options,
      hasDirect,
    };
  }, [nonPendingPaymentDeals]);

  const brandDealStatusCounts = useMemo(() => ({
    all: nonPendingPaymentDeals.length,
    active: nonPendingPaymentDeals.filter(d => d.status === 'active' || d.status === 'in_progress').length,
    review: nonPendingPaymentDeals.filter(d => d.status === 'pending_review').length,
    completed: nonPendingPaymentDeals.filter(d => d.status === 'completed').length,
    cancelled: nonPendingPaymentDeals.filter(d => d.status === 'cancelled' || d.status === 'disputed').length,
  }), [nonPendingPaymentDeals]);

  const filteredBrandDeals = useMemo(() => {
    const f = brandDealFilters;
    let list = nonPendingPaymentDeals.filter(deal => {
      const campaignId = getCampaignIdFromDeal(deal);
      const isDirect = !campaignId;
      const influencerName = deal.influencer?.name || '';
      const campaignTitle = getDealCampaignTitle(deal);

      if (dealSearchTerm) {
        const q = dealSearchTerm.toLowerCase();
        if (!influencerName.toLowerCase().includes(q) && !campaignTitle.toLowerCase().includes(q)) {
          return false;
        }
      }

      if (f.selectedCampaign !== 'all') {
        if (f.selectedCampaign === 'direct') {
          if (!isDirect) return false;
        } else if (campaignId !== f.selectedCampaign) {
          return false;
        }
      }

      if (f.source === 'direct' && !isDirect) return false;
      if (f.source === 'campaign' && isDirect) return false;

      if (f.status !== 'all') {
        if (f.status === 'active' && deal.status !== 'active' && deal.status !== 'in_progress') return false;
        if (f.status === 'review' && deal.status !== 'pending_review') return false;
        if (f.status === 'completed' && deal.status !== 'completed') return false;
        if (f.status === 'cancelled' && deal.status !== 'cancelled' && deal.status !== 'disputed') return false;
      }

      const paymentStatus = getDealPaymentStatus(deal);
      if (f.paymentStatus !== 'all' && paymentStatus !== f.paymentStatus) return false;

      if (f.rateMin && (deal.agreedRate || 0) < Number(f.rateMin)) return false;
      if (f.rateMax && (deal.agreedRate || 0) > Number(f.rateMax)) return false;

      if (f.deadlineFrom && deal.deadline && new Date(deal.deadline) < new Date(f.deadlineFrom)) return false;
      if (f.deadlineTo && deal.deadline && new Date(deal.deadline) > new Date(`${f.deadlineTo}T23:59:59`)) return false;

      if (f.createdFrom && new Date(deal.createdAt) < new Date(f.createdFrom)) return false;
      if (f.createdTo && new Date(deal.createdAt) > new Date(`${f.createdTo}T23:59:59`)) return false;

      if (f.overdueOnly) {
        const isOverdue = deal.deadline && new Date(deal.deadline) < new Date();
        const completedOrCancelled = ['completed', 'cancelled'].includes(deal.status);
        if (!isOverdue || completedOrCancelled) return false;
      }

      return true;
    });

    list.sort((a, b) => {
      switch (f.sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'rate_desc':
          return (b.agreedRate || 0) - (a.agreedRate || 0);
        case 'rate_asc':
          return (a.agreedRate || 0) - (b.agreedRate || 0);
        case 'deadline_asc':
          return new Date(a.deadline || '2100-01-01') - new Date(b.deadline || '2100-01-01');
        case 'deadline_desc':
          return new Date(b.deadline || '1970-01-01') - new Date(a.deadline || '1970-01-01');
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return list;
  }, [nonPendingPaymentDeals, brandDealFilters, dealSearchTerm]);

  const groupedBrandDeals = useMemo(() => {
    const groups = {};

    filteredBrandDeals.forEach(deal => {
      const campaignId = getCampaignIdFromDeal(deal);
      const groupKey = campaignId || 'direct-outreach';
      const campaignData = isCampaignObject(deal.campaign) ? deal.campaign : null;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          groupKey,
          campaignId: campaignId || null,
          campaign: campaignData,
          isDirect: !campaignId,
          label: campaignData?.title || (!campaignId ? 'Direct Outreach Deals' : getDealCampaignTitle(deal)),
          deals: [],
        };
      }

      if (!groups[groupKey].campaign && campaignData) {
        groups[groupKey].campaign = campaignData;
        groups[groupKey].label = campaignData.title || groups[groupKey].label;
      }

      groups[groupKey].deals.push(deal);
    });

    return Object.values(groups).sort((a, b) => a.label.localeCompare(b.label));
  }, [filteredBrandDeals]);

  const activeDealFiltersCount = useMemo(() => {
    let count = 0;
    if (brandDealFilters.selectedCampaign !== 'all') count++;
    if (brandDealFilters.status !== 'all') count++;
    if (brandDealFilters.source !== 'all') count++;
    if (brandDealFilters.paymentStatus !== 'all') count++;
    if (brandDealFilters.rateMin) count++;
    if (brandDealFilters.rateMax) count++;
    if (brandDealFilters.deadlineFrom) count++;
    if (brandDealFilters.deadlineTo) count++;
    if (brandDealFilters.createdFrom) count++;
    if (brandDealFilters.createdTo) count++;
    if (brandDealFilters.overdueOnly) count++;
    if (dealSearchTerm) count++;
    return count;
  }, [brandDealFilters, dealSearchTerm]);

  // ======== Brand-specific computed data ========
  const brandCampaignsList = useMemo(() => {
    const seen = new Set();
    const list = [];
    visibleBrandApplications.forEach(app => {
      const cId = getCampaignIdFromApp(app);
      if (cId && !seen.has(cId)) {
        seen.add(cId);
        if (isCampaignObject(app.campaign)) {
          list.push(app.campaign);
        }
      }
    });
    return list;
  }, [visibleBrandApplications]);

  const brandStatusCounts = useMemo(() => ({
    all: visibleBrandApplications.length,
    pending: visibleBrandApplications.filter(a => a.status === 'pending' || a.status === 'reviewed').length,
    shortlisted: visibleBrandApplications.filter(a => a.status === 'shortlisted').length,
    accepted: visibleBrandApplications.filter(a => a.status === 'accepted').length,
    rejected: visibleBrandApplications.filter(a => a.status === 'rejected').length,
  }), [visibleBrandApplications]);

  const filteredBrandApps = useMemo(() => {
    const f = brandFilters;
    let apps = visibleBrandApplications.filter(app => {
      if (searchTerm) {
        const name = app.influencerProfile?.name || app.influencer?.name || '';
        const title = app.campaign?.title || '';
        if (!name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      }
      if (f.selectedCampaign !== 'all' && getCampaignIdFromApp(app) !== f.selectedCampaign) return false;
      if (f.status !== 'all') {
        if (f.status === 'pending' && app.status !== 'pending' && app.status !== 'reviewed') return false;
        if (f.status !== 'pending' && app.status !== f.status) return false;
      }
      if (!isPlatformMatch(app.influencerProfile, f.platform)) return false;
      if (f.niches.length > 0) {
        const iNiches = app.influencerProfile?.niche || [];
        if (!f.niches.some(n => iNiches.includes(n))) return false;
      }
      if (f.rateMin && (app.proposedRate || 0) < Number(f.rateMin)) return false;
      if (f.rateMax && (app.proposedRate || 0) > Number(f.rateMax)) return false;
      if (f.dateFrom && new Date(app.createdAt) < new Date(f.dateFrom)) return false;
      if (f.dateTo && new Date(app.createdAt) > new Date(f.dateTo + 'T23:59:59')) return false;
      if (f.minTrustScore && (app.influencerProfile?.trustScore || 0) < Number(f.minTrustScore)) return false;
      if (f.minFollowers && (app.influencerProfile?.totalFollowers || 0) < Number(f.minFollowers)) return false;
      return true;
    });
    apps.sort((a, b) => {
      switch (f.sortBy) {
        case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'rate_asc': return (a.proposedRate || 0) - (b.proposedRate || 0);
        case 'rate_desc': return (b.proposedRate || 0) - (a.proposedRate || 0);
        case 'followers_desc': return (b.influencerProfile?.totalFollowers || 0) - (a.influencerProfile?.totalFollowers || 0);
        case 'trust_desc': return (b.influencerProfile?.trustScore || 0) - (a.influencerProfile?.trustScore || 0);
        default: return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    return apps;
  }, [visibleBrandApplications, brandFilters, searchTerm]);

  const selectedApplications = useMemo(
    () => visibleBrandApplications.filter((app) => selectedApplicationIds.includes(app._id)),
    [visibleBrandApplications, selectedApplicationIds]
  );

  const selectedIdsSet = useMemo(
    () => new Set(selectedApplicationIds),
    [selectedApplicationIds]
  );

  const groupedApps = useMemo(() => {
    const groups = {};
    filteredBrandApps.forEach(app => {
      const cId = getCampaignIdFromApp(app) || 'unknown';
      const campaignData = isCampaignObject(app.campaign) ? app.campaign : null;
      if (!groups[cId]) groups[cId] = { campaignId: cId, campaign: campaignData, apps: [] };
      if (!groups[cId].campaign && campaignData) {
        groups[cId].campaign = campaignData;
      }
      groups[cId].apps.push(app);
    });
    return Object.values(groups);
  }, [filteredBrandApps]);

  const activeFiltersCount = useMemo(() => {
    let c = 0;
    if (brandFilters.selectedCampaign !== 'all') c++;
    if (brandFilters.status !== 'all') c++;
    if (brandFilters.platform !== 'all') c++;
    if (brandFilters.niches.length > 0) c++;
    if (brandFilters.rateMin) c++;
    if (brandFilters.rateMax) c++;
    if (brandFilters.dateFrom) c++;
    if (brandFilters.dateTo) c++;
    if (brandFilters.minTrustScore) c++;
    if (brandFilters.minFollowers) c++;
    if (searchTerm) c++;
    return c;
  }, [brandFilters, searchTerm]);

  useEffect(() => {
    setSelectedApplicationIds((prev) => {
      const validIds = new Set(visibleBrandApplications.map((app) => app._id));
      return prev.filter((id) => validIds.has(id));
    });
  }, [visibleBrandApplications]);

  // ======== Brand helper functions ========
  const updateBrandFilter = (key, value) => {
    setBrandFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleNiche = (niche) => {
    setBrandFilters(prev => ({
      ...prev,
      niches: prev.niches.includes(niche)
        ? prev.niches.filter(n => n !== niche)
        : [...prev.niches, niche]
    }));
  };

  const clearAllBrandFilters = () => {
    setBrandFilters({
      selectedCampaign: 'all',
      status: 'all',
      platform: 'all',
      niches: [],
      rateMin: '',
      rateMax: '',
      dateFrom: '',
      dateTo: '',
      minTrustScore: '',
      minFollowers: '',
      sortBy: 'newest',
    });
    setSearchTerm('');
  };

  const toggleApplicationSelection = (applicationId) => {
    setSelectedApplicationIds((prev) => (
      prev.includes(applicationId)
        ? prev.filter((id) => id !== applicationId)
        : [...prev, applicationId]
    ));
  };

  const toggleSelectAllInList = (apps, shouldSelect) => {
    const ids = apps.map((app) => app._id);
    if (ids.length === 0) return;

    setSelectedApplicationIds((prev) => {
      if (shouldSelect) {
        const merged = new Set([...prev, ...ids]);
        return [...merged];
      }
      return prev.filter((id) => !ids.includes(id));
    });
  };

  const refreshBrandApplicationAndDealData = async () => {
    await Promise.all([
      loadBrandApplications(),
      fetchMyDeals(true).then((dealsData) => setMyDeals(dealsData || [])),
    ]);
  };

  const handleBulkStatusAction = async (targetStatus, allowedStatuses, actionLabel) => {
    if (selectedApplications.length === 0) {
      toast.error('Select at least one influencer first');
      return;
    }

    const applicable = selectedApplications.filter((app) => allowedStatuses.includes(app.status));
    if (applicable.length === 0) {
      toast.error(`Selected influencers are not eligible for ${actionLabel.toLowerCase()}`);
      return;
    }

    setBulkProcessing(true);
    try {
      const results = await Promise.all(
        applicable.map((app) => updateApplicationStatus(app._id, targetStatus))
      );

      const successCount = results.filter((r) => r.success).length;
      if (successCount > 0) {
        toast.success(`${actionLabel} applied to ${successCount} influencer${successCount > 1 ? 's' : ''}`);
      }

      if (successCount !== applicable.length) {
        toast.error(`${applicable.length - successCount} update(s) failed`);
      }

      await loadBrandApplications();
      setSelectedApplicationIds((prev) => prev.filter((id) => !applicable.some((app) => app._id === id)));
    } catch (err) {
      toast.error(`Failed to ${actionLabel.toLowerCase()} selected influencers`);
    } finally {
      setBulkProcessing(false);
    }
  };

  const resolveDealDeadline = (application) => {
    if (application?.campaign?.deadline) {
      return new Date(application.campaign.deadline).toISOString().split('T')[0];
    }
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 14);
    return fallback.toISOString().split('T')[0];
  };

  const processDealPaymentAtCreation = async (deal, paymentOrder) => {
    if (!razorpayLoaded) {
      return { success: false, error: 'Payment gateway not loaded. Please refresh and try again.' };
    }

    if (!deal?._id || !paymentOrder?.orderId) {
      return { success: false, error: 'Missing payment session for newly created deal.' };
    }

    setPaymentProcessing(true);

    return new Promise((resolve) => {
      paymentService.initiateRazorpayCheckout(
        {
          ...paymentOrder,
          brandName: user?.name,
          brandEmail: user?.email
        },
        async (response) => {
          try {
            const verifyResult = await paymentService.verifyPayment({
              orderId: response.orderId,
              paymentId: response.paymentId,
              signature: response.signature,
              dealId: deal._id
            });

            if (!verifyResult.success) {
              resolve({ success: false, error: 'Payment verification failed.' });
              return;
            }

            setDealPayments((prev) => ({
              ...prev,
              [deal._id]: { status: 'paid', ...(verifyResult.data || {}) }
            }));

            resolve({ success: true });
          } catch (verifyErr) {
            console.error('Payment verification error:', verifyErr);
            resolve({ success: false, error: 'Payment verification failed.' });
          } finally {
            setPaymentProcessing(false);
          }
        },
        (error) => {
          console.error('Payment error:', error);
          setPaymentProcessing(false);
          resolve({ success: false, error: error?.message || 'Payment failed or was cancelled.' });
        }
      );
    });
  };

  // Handle payment for pending payment deals
  const handlePendingPaymentDealPayment = async (deal) => {
    if (!deal?._id || !deal?.paymentId) {
      toast.error('Invalid deal or missing payment information');
      return;
    }

    if (!razorpayLoaded) {
      toast.error('Payment gateway not loaded. Please refresh and try again.');
      return;
    }

    setPaymentProcessing(true);

    try {
      // Fetch the payment details to get the Razorpay order ID
      const paymentResponse = await paymentService.getPaymentByDeal(deal._id);
      
      if (!paymentResponse.success || !paymentResponse.data) {
        toast.error('Failed to fetch payment details');
        setPaymentProcessing(false);
        return;
      }

      const { payment, orderId, amount: orderAmount, currency, key } = paymentResponse.data;

      // If no Razorpay order ID, return error
      if (!orderId) {
        toast.error('Payment order not found. Please contact support.');
        setPaymentProcessing(false);
        return;
      }

      // Initiate Razorpay checkout
      return new Promise((resolve) => {
        paymentService.initiateRazorpayCheckout(
          {
            orderId: orderId,
            amount: orderAmount || deal.agreedRate,
            currency: currency || 'INR',
            key: key || process.env.REACT_APP_RAZORPAY_KEY_ID,
            brandName: user?.name,
            brandEmail: user?.email
          },
          async (response) => {
            try {
              const verifyResult = await paymentService.verifyPayment({
                orderId: response.orderId,
                paymentId: response.paymentId,
                signature: response.signature,
                dealId: deal._id
              });

              if (!verifyResult.success) {
                toast.error('Payment verification failed.');
                resolve({ success: false });
                return;
              }

              toast.success('Payment completed successfully! Deal is now active.');
              setPendingPaymentDealForPayment(null);
              
              // Refresh deals
              const dealsData = await fetchMyDeals(true);
              setMyDeals(dealsData || []);
              
              // Switch to deals tab
              switchTab('deals');
              
              resolve({ success: true });
            } catch (verifyErr) {
              console.error('Payment verification error:', verifyErr);
              toast.error('Payment verification failed.');
              resolve({ success: false });
            } finally {
              setPaymentProcessing(false);
            }
          },
          (error) => {
            console.error('Payment error:', error);
            toast.error(error?.message || 'Payment failed or was cancelled.');
            setPaymentProcessing(false);
            resolve({ success: false });
          }
        );
      });
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast.error('Failed to initiate payment');
      setPaymentProcessing(false);
    }
  };

  const handleBulkCreateDeals = async () => {
    if (selectedApplications.length === 0) {
      toast.error('Select at least one influencer first');
      return;
    }

    const eligible = selectedApplications.filter((app) => app.status === 'accepted');
    if (eligible.length === 0) {
      toast.error('Select accepted influencers to create deals');
      return;
    }

    const withValidRate = eligible.filter((app) => Number(app.proposedRate || 0) > 0);
    if (withValidRate.length === 0) {
      toast.error('Selected influencers must have a valid proposed rate to create deals');
      return;
    }

    setBulkProcessing(true);
    try {
      let createdCount = 0;
      let failedCount = 0;

      for (const app of withValidRate) {
        const createResult = await createDeal({
          applicationId: app._id,
          agreedRate: Number(app.proposedRate),
          deadline: resolveDealDeadline(app),
        });

        if (!createResult.success) {
          failedCount += 1;
          continue;
        }

        // Deals are created in pending_payment status - no automatic payment
        createdCount += 1;
      }

      if (createdCount > 0) {
        toast.success(`Created ${createdCount} deal${createdCount > 1 ? 's' : ''}. Go to Pending Payment tab to complete payments.`);
        switchTab('pending_payment');
      }

      if (failedCount > 0) {
        toast.error(`${failedCount} deal${failedCount > 1 ? 's' : ''} failed to create.`);
      }

      await refreshBrandApplicationAndDealData();
      setSelectedApplicationIds((prev) => prev.filter((id) => !withValidRate.some((app) => app._id === id)));
    } catch (err) {
      toast.error('Failed to create deals for selected influencers');
    } finally {
      setBulkProcessing(false);
    }
  };

  const toggleCampaignExpanded = (campaignId) => {
    setExpandedCampaigns(prev => ({
      ...prev,
      [campaignId]: !prev[campaignId],
    }));
  };

  const formatFollowers = (n) => {
    if (!n) return '—';
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return String(n);
  };

  const getTrustClass = (score) => {
    if (!score) return 'trust-na';
    if (score >= 80) return 'trust-high';
    if (score >= 60) return 'trust-med';
    return 'trust-low';
  };

  const handleTableSort = (col) => {
    setBrandFilters(prev => {
      if (col === 'rate') return { ...prev, sortBy: prev.sortBy === 'rate_desc' ? 'rate_asc' : 'rate_desc' };
      if (col === 'followers') return { ...prev, sortBy: 'followers_desc' };
      if (col === 'trust') return { ...prev, sortBy: 'trust_desc' };
      if (col === 'date') return { ...prev, sortBy: prev.sortBy === 'newest' ? 'oldest' : 'newest' };
      return prev;
    });
  };

  // Render influencer table (used in both campaign view and table view)
  const renderInfluencerTable = (apps, showCampaignCol = false) => (
    <div className="brand-inf-table-scroll">
      <table className="brand-inf-table">
        <thead>
          <tr>
            <th className="th-select">
              <input
                type="checkbox"
                className="brand-select-checkbox"
                checked={apps.length > 0 && apps.every((app) => selectedIdsSet.has(app._id))}
                onChange={(e) => toggleSelectAllInList(apps, e.target.checked)}
                title="Select all in this list"
              />
            </th>
            <th className="th-influencer">Influencer</th>
            {showCampaignCol && <th className="th-campaign">Campaign</th>}
            <th className="th-platform">Platform</th>
            <th
              className="th-followers th-sortable"
              onClick={() => handleTableSort('followers')}
              title="Sort by followers"
            >
              <span>Followers</span> <ArrowUpDown size={12} />
            </th>
            <th className="th-engagement">Engagement</th>
            <th className="th-niche">Niche</th>
            <th
              className="th-rate th-sortable"
              onClick={() => handleTableSort('rate')}
              title="Sort by rate"
            >
              <span>Rate</span> <ArrowUpDown size={12} />
            </th>
            <th
              className="th-date th-sortable"
              onClick={() => handleTableSort('date')}
              title="Sort by date"
            >
              <span>Applied</span> <ArrowUpDown size={12} />
            </th>
            <th
              className="th-trust th-sortable"
              onClick={() => handleTableSort('trust')}
              title="Sort by trust score"
            >
              <span>Trust</span> <ArrowUpDown size={12} />
            </th>
            <th className="th-status">Status</th>
            <th className="th-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {apps.map(app => {
            const profile = app.influencerProfile || {};
            const name = profile.name || app.influencer?.name || 'Influencer';
            const initials = name.charAt(0).toUpperCase();
            const platformLabel = getProfilePlatformLabel(profile);
            const platformClass = getProfilePlatformClass(platformLabel);
            return (
              <tr
                key={app._id}
                className={`inf-row inf-row-${app.status}`}
                onClick={() => setSelectedApp(app)}
                title="Click to view details"
              >
                <td className="td-select" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="brand-select-checkbox"
                    checked={selectedIdsSet.has(app._id)}
                    onChange={() => toggleApplicationSelection(app._id)}
                    title="Select influencer"
                  />
                </td>
                <td className="td-influencer" onClick={e => e.stopPropagation()}>
                  <div className="inf-name-cell" onClick={() => setSelectedApp(app)}>
                    <div className={`inf-avatar inf-avatar-${platformClass}`}>
                      {profile.avatar
                        ? <img src={profile.avatar} alt={name} />
                        : <span>{initials}</span>}
                    </div>
                    <div className="inf-name-info">
                      <span className="inf-name">{name}</span>
                      {profile.location && <span className="inf-location">{profile.location}</span>}
                    </div>
                  </div>
                </td>
                {showCampaignCol && (
                  <td className="td-campaign">
                    <span className="inf-campaign-tag">{app.campaign?.title || '—'}</span>
                  </td>
                )}
                <td className="td-platform">
                  <span className={`inf-platform-badge plat-${platformClass}`}>
                    {platformLabel === 'Unknown' ? '—' : platformLabel}
                  </span>
                </td>
                <td className="td-followers">
                  <div className="inf-stat-cell">
                    <Users size={13} />
                    <span>{formatFollowers(profile.totalFollowers)}</span>
                  </div>
                </td>
                <td className="td-engagement">
                  <div className="inf-stat-cell">
                    <TrendingUp size={13} />
                    <span>{formatEngagementRate(profile)}</span>
                  </div>
                </td>
                <td className="td-niche">
                  <div className="inf-niches">
                    {(profile.niche || []).slice(0, 2).map((n, i) => (
                      <span key={i} className="inf-niche-tag">{n}</span>
                    ))}
                    {(profile.niche || []).length > 2 && (
                      <span className="inf-niche-more">+{profile.niche.length - 2}</span>
                    )}
                  </div>
                </td>
                <td className="td-rate">
                  <span className="inf-rate">₹{(app.proposedRate || 0).toLocaleString()}</span>
                </td>
                <td className="td-date">
                  <span className="inf-date">{formatDate(app.createdAt)}</span>
                </td>
                <td className="td-trust">
                  <span className={`inf-trust-score ${getTrustClass(profile.trustScore)}`}>
                    {profile.trustScore || '—'}
                  </span>
                </td>
                <td className="td-status">
                  <span className={`collab-status-badge collab-status-${app.status}`}>
                    {getStatusIcon(app.status)}
                    <span>{app.status}</span>
                  </span>
                </td>
                <td className="td-actions" onClick={e => e.stopPropagation()}>
                  <div className="inf-action-btns">
                    <span className="inf-act-hint">Use global actions</span>
                    <button
                      className="inf-act-btn inf-act-view"
                      title="View Details"
                      onClick={() => setSelectedApp(app)}
                    >
                      <Eye size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // Render brand empty state
  const renderBrandEmptyState = () => (
    <div className="collab-empty-state">
      <Briefcase size={48} />
      <h3>No applications found</h3>
      <p>
        {activeFiltersCount > 0
          ? 'No applications match your current filters. Try adjusting or clearing filters.'
          : 'Create campaigns to start receiving influencer applications.'}
      </p>
      {activeFiltersCount > 0 && (
        <button className="btn btn-secondary" onClick={clearAllBrandFilters}>
          <X size={16} /> Clear All Filters
        </button>
      )}
    </div>
  );

  // Render brand applications view
  const renderBrandApplicationsView = () => (
    <>
      {/* ── Stats Pills ── */}
      <div className="brand-apps-topbar">
        <div className="brand-stat-pills">
          {[
            { key: 'all',         label: 'All',         count: brandStatusCounts.all },
            { key: 'pending',     label: 'Pending',     count: brandStatusCounts.pending },
            { key: 'shortlisted', label: 'Shortlisted', count: brandStatusCounts.shortlisted },
            { key: 'accepted',    label: 'Accepted',    count: brandStatusCounts.accepted },
            { key: 'rejected',    label: 'Rejected',    count: brandStatusCounts.rejected },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              className={`brand-stat-pill brand-stat-${key} ${brandFilters.status === key ? 'active' : ''}`}
              onClick={() => updateBrandFilter('status', key)}
            >
              {label}
              <span className="brand-stat-cnt">{count}</span>
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="brand-view-toggle">
          <button
            className={`brand-view-btn ${viewMode === 'campaign' ? 'active' : ''}`}
            onClick={() => setViewMode('campaign')}
            title="Group by campaign"
          >
            <LayoutGrid size={15} /> Campaign
          </button>
          <button
            className={`brand-view-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Flat table view"
          >
            <List size={15} /> Table
          </button>
        </div>
      </div>

      {/* ── Search + Filter Controls ── */}
      <div className="brand-filter-row">
        <div className="collab-search-box brand-search">
          <Search size={17} />
          <input
            type="text"
            placeholder="Search influencer name or campaign…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="brand-search-clear" onClick={() => setSearchTerm('')} title="Clear search">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="brand-filter-controls">
          {/* Campaign Selector */}
          <select
            className="brand-select"
            value={brandFilters.selectedCampaign}
            onChange={e => updateBrandFilter('selectedCampaign', e.target.value)}
          >
            <option value="all">All Campaigns</option>
            {brandCampaignsList.map(c => (
              <option key={c._id} value={c._id}>{c.title}</option>
            ))}
          </select>

          {/* Platform */}
          <select
            className="brand-select"
            value={brandFilters.platform}
            onChange={e => updateBrandFilter('platform', e.target.value)}
          >
            <option value="all">All Platforms</option>
            <option value="Instagram">Instagram</option>
            <option value="YouTube">YouTube</option>
            <option value="TikTok">TikTok</option>
            <option value="Multiple">Multiple</option>
          </select>

          {/* Sort */}
          <select
            className="brand-select"
            value={brandFilters.sortBy}
            onChange={e => updateBrandFilter('sortBy', e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="rate_desc">Rate: High → Low</option>
            <option value="rate_asc">Rate: Low → High</option>
            <option value="followers_desc">Followers: High → Low</option>
            <option value="trust_desc">Trust Score: High → Low</option>
          </select>

          {/* Advanced Filters Toggle */}
          <button
            className={`brand-adv-btn ${showAdvancedFilters ? 'open' : ''} ${activeFiltersCount > 0 ? 'has-active' : ''}`}
            onClick={() => setShowAdvancedFilters(p => !p)}
          >
            <SlidersHorizontal size={15} />
            <span>Filters</span>
            {activeFiltersCount > 0 && <span className="brand-filter-badge">{activeFiltersCount}</span>}
          </button>

          {/* Clear All */}
          {activeFiltersCount > 0 && (
            <button className="brand-clear-btn" onClick={clearAllBrandFilters} title="Clear all filters">
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Advanced Filters Panel ── */}
      {showAdvancedFilters && (
        <div className="brand-adv-panel">
          {/* Niche Multi-Select */}
          <div className="brand-adv-section">
            <label className="brand-adv-label">
              <Award size={14} /> Niche
            </label>
            <div className="brand-niche-chips">
              {NICHES.map(niche => (
                <button
                  key={niche}
                  className={`brand-niche-chip ${brandFilters.niches.includes(niche) ? 'active' : ''}`}
                  onClick={() => toggleNiche(niche)}
                >
                  {niche}
                </button>
              ))}
            </div>
          </div>

          {/* Rate Range */}
          <div className="brand-adv-section">
            <label className="brand-adv-label">
              <IndianRupee size={14} /> Proposed Rate (₹)
            </label>
            <div className="brand-range-row">
              <input
                type="number"
                className="brand-range-input"
                placeholder="Min"
                value={brandFilters.rateMin}
                onChange={e => updateBrandFilter('rateMin', e.target.value)}
                min="0"
              />
              <span className="brand-range-sep">–</span>
              <input
                type="number"
                className="brand-range-input"
                placeholder="Max"
                value={brandFilters.rateMax}
                onChange={e => updateBrandFilter('rateMax', e.target.value)}
                min="0"
              />
            </div>
          </div>

          {/* Min Followers */}
          <div className="brand-adv-section">
            <label className="brand-adv-label">
              <Users size={14} /> Min Followers
            </label>
            <div className="brand-range-row">
              <input
                type="number"
                className="brand-range-input"
                placeholder="e.g. 10000"
                value={brandFilters.minFollowers}
                onChange={e => updateBrandFilter('minFollowers', e.target.value)}
                min="0"
              />
            </div>
          </div>

          {/* Min Trust Score */}
          <div className="brand-adv-section">
            <label className="brand-adv-label">
              <Award size={14} /> Min Trust Score
            </label>
            <div className="brand-range-row">
              <input
                type="number"
                className="brand-range-input"
                placeholder="e.g. 60"
                value={brandFilters.minTrustScore}
                onChange={e => updateBrandFilter('minTrustScore', e.target.value)}
                min="0"
                max="100"
              />
              <span className="brand-range-sep">/ 100</span>
            </div>
          </div>

          {/* Applied Date Range */}
          <div className="brand-adv-section">
            <label className="brand-adv-label">
              <Calendar size={14} /> Applied Date
            </label>
            <div className="brand-range-row">
              <input
                type="date"
                className="brand-range-input"
                value={brandFilters.dateFrom}
                onChange={e => updateBrandFilter('dateFrom', e.target.value)}
              />
              <span className="brand-range-sep">–</span>
              <input
                type="date"
                className="brand-range-input"
                value={brandFilters.dateTo}
                onChange={e => updateBrandFilter('dateTo', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Active Filter Chips ── */}
      {activeFiltersCount > 0 && (
        <div className="brand-active-chips">
          {brandFilters.selectedCampaign !== 'all' && (
            <span className="brand-chip">
              Campaign: {brandCampaignsList.find(c => c._id === brandFilters.selectedCampaign)?.title || '...'}
              <button onClick={() => updateBrandFilter('selectedCampaign', 'all')}><X size={11} /></button>
            </span>
          )}
          {brandFilters.status !== 'all' && (
            <span className="brand-chip">
              Status: {brandFilters.status}
              <button onClick={() => updateBrandFilter('status', 'all')}><X size={11} /></button>
            </span>
          )}
          {brandFilters.platform !== 'all' && (
            <span className="brand-chip">
              Platform: {brandFilters.platform}
              <button onClick={() => updateBrandFilter('platform', 'all')}><X size={11} /></button>
            </span>
          )}
          {brandFilters.niches.map(n => (
            <span key={n} className="brand-chip">
              {n}
              <button onClick={() => toggleNiche(n)}><X size={11} /></button>
            </span>
          ))}
          {(brandFilters.rateMin || brandFilters.rateMax) && (
            <span className="brand-chip">
              Rate: ₹{brandFilters.rateMin || '0'} – ₹{brandFilters.rateMax || '∞'}
              <button onClick={() => { updateBrandFilter('rateMin', ''); updateBrandFilter('rateMax', ''); }}><X size={11} /></button>
            </span>
          )}
          {brandFilters.minFollowers && (
            <span className="brand-chip">
              Min followers: {Number(brandFilters.minFollowers).toLocaleString()}
              <button onClick={() => updateBrandFilter('minFollowers', '')}><X size={11} /></button>
            </span>
          )}
          {brandFilters.minTrustScore && (
            <span className="brand-chip">
              Trust ≥ {brandFilters.minTrustScore}
              <button onClick={() => updateBrandFilter('minTrustScore', '')}><X size={11} /></button>
            </span>
          )}
          {(brandFilters.dateFrom || brandFilters.dateTo) && (
            <span className="brand-chip">
              Date: {brandFilters.dateFrom || '…'} – {brandFilters.dateTo || '…'}
              <button onClick={() => { updateBrandFilter('dateFrom', ''); updateBrandFilter('dateTo', ''); }}><X size={11} /></button>
            </span>
          )}
          {searchTerm && (
            <span className="brand-chip">
              "{searchTerm}"
              <button onClick={() => setSearchTerm('')}><X size={11} /></button>
            </span>
          )}
        </div>
      )}

      {/* ── Results Summary ── */}
      <div className="brand-results-bar">
        <span>
          Showing <strong>{filteredBrandApps.length}</strong>
          {filteredBrandApps.length !== visibleBrandApplications.length && ` of ${visibleBrandApplications.length}`} applications
        </span>
      </div>

      <div className="brand-bulk-actions-bar">
        <div className="brand-bulk-left">
          <span className="brand-bulk-count">
            <strong>{selectedApplications.length}</strong> selected
          </span>
          {selectedApplications.length > 0 && (
            <button className="brand-bulk-clear" onClick={() => setSelectedApplicationIds([])}>
              Clear Selection
            </button>
          )}
        </div>
        <div className="brand-bulk-actions">
          <button
            className="inf-act-btn inf-act-shortlist"
            onClick={() => handleBulkStatusAction('shortlisted', ['pending', 'reviewed'], 'Shortlist')}
            disabled={bulkProcessing || selectedApplications.length === 0}
          >
            <Award size={13} /> <span>Shortlist Selected</span>
          </button>
          <button
            className="inf-act-btn inf-act-accept"
            onClick={() => handleBulkStatusAction('accepted', ['shortlisted'], 'Accept')}
            disabled={bulkProcessing || selectedApplications.length === 0}
          >
            <CheckCircle size={13} /> <span>Accept Selected</span>
          </button>
          <button
            className="inf-act-btn inf-act-deal"
            onClick={handleBulkCreateDeals}
            disabled={bulkProcessing || selectedApplications.length === 0}
          >
            <Handshake size={13} /> <span>Deal Selected</span>
          </button>
        </div>
      </div>

      {/* ── Campaign View ── */}
      {viewMode === 'campaign' && (
        <div className="brand-campaign-groups">
          {groupedApps.length > 0 ? (
            groupedApps.map(group => {
              const cId = group.campaignId || 'unknown';
              const isOpen = expandedCampaigns[cId] ?? false;
              const pending = group.apps.filter(a => a.status === 'pending' || a.status === 'reviewed').length;
              const shortlisted = group.apps.filter(a => a.status === 'shortlisted').length;
              const accepted = group.apps.filter(a => a.status === 'accepted').length;
              return (
                <div key={cId} className="brand-campaign-group">
                  <div
                    className={`brand-cg-header ${isOpen ? 'open' : ''}`}
                    onClick={() => toggleCampaignExpanded(cId)}
                  >
                    <div className="brand-cg-left">
                      <div className="brand-cg-icon">
                        <Briefcase size={17} />
                      </div>
                      <div className="brand-cg-info">
                        <h3 className="brand-cg-title">{group.campaign?.title || 'Untitled Campaign'}</h3>
                        <div className="brand-cg-meta">
                          {group.campaign?.category && (
                            <span className="brand-cg-tag">{group.campaign.category}</span>
                          )}
                          {group.campaign?.platformType && (
                            <span className="brand-cg-tag">{group.campaign.platformType}</span>
                          )}
                          {group.campaign?.budget && (
                            <span className="brand-cg-tag budget">
                              ₹{group.campaign.budget.min?.toLocaleString()} – ₹{group.campaign.budget.max?.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="brand-cg-right">
                      <div className="brand-cg-counts">
                        <span className="brand-cg-count total">{group.apps.length} total</span>
                        {pending > 0 && <span className="brand-cg-count pending">{pending} pending</span>}
                        {shortlisted > 0 && <span className="brand-cg-count shortlisted">{shortlisted} shortlisted</span>}
                        {accepted > 0 && <span className="brand-cg-count accepted">{accepted} accepted</span>}
                      </div>
                      <button className="brand-cg-toggle" onClick={e => { e.stopPropagation(); toggleCampaignExpanded(cId); }}>
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="brand-cg-body">
                      {renderInfluencerTable(group.apps, false)}
                    </div>
                  )}
                </div>
              );
            })
          ) : renderBrandEmptyState()}
        </div>
      )}

      {/* ── Flat Table View ── */}
      {viewMode === 'table' && (
        <div className="brand-flat-table-wrap">
          {filteredBrandApps.length > 0
            ? renderInfluencerTable(filteredBrandApps, true)
            : renderBrandEmptyState()}
        </div>
      )}
    </>
  );

  const updateBrandDealFilter = (key, value) => {
    setBrandDealFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllBrandDealFilters = () => {
    setBrandDealFilters({
      selectedCampaign: 'all',
      status: 'all',
      source: 'all',
      paymentStatus: 'all',
      rateMin: '',
      rateMax: '',
      deadlineFrom: '',
      deadlineTo: '',
      createdFrom: '',
      createdTo: '',
      overdueOnly: false,
      sortBy: 'newest',
    });
    setDealSearchTerm('');
  };

  const toggleDealGroupExpanded = (groupKey) => {
    setExpandedDealGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const renderBrandDealEmptyState = () => (
    <div className="collab-empty-state">
      <Handshake size={48} />
      <h3>No deals found</h3>
      <p>
        {activeDealFiltersCount > 0
          ? 'No deals match your current filters. Try adjusting or clearing filters.'
          : 'Deals will appear here once collaborations are confirmed.'}
      </p>
      {activeDealFiltersCount > 0 && (
        <button className="btn btn-secondary" onClick={clearAllBrandDealFilters}>
          <X size={16} /> Clear All Filters
        </button>
      )}
    </div>
  );

  const renderBrandDealsTable = (dealList, showCampaignCol = false) => (
    <div className="brand-inf-table-scroll">
      <table className="brand-inf-table brand-deal-table">
        <thead>
          <tr>
            <th>Influencer</th>
            {showCampaignCol && <th>Campaign</th>}
            <th>Status</th>
            <th>Payment</th>
            <th>Rate</th>
            <th>Deadline</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {dealList.map(deal => {
            const paymentStatus = getDealPaymentStatus(deal);
            const needsPayment = (deal.status === 'pending_payment' || deal.status === 'active') && (!deal.paymentId || paymentStatus === 'pending');
            const canRelease = deal.status === 'completed' && paymentStatus === 'escrow';
            const daysLeft = getDaysUntil(deal.deadline);
            const isDirect = !getCampaignIdFromDeal(deal);

            return (
              <tr key={deal._id} className={`deal-row deal-row-${deal.status}`}>
                <td>
                  <div className="inf-name-cell">
                    <div className="inf-avatar inf-avatar-default">
                      <span>{(deal.influencer?.name || 'I').charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="inf-name-info">
                      <span className="inf-name">{deal.influencer?.name || 'Influencer'}</span>
                      {deal.influencer?.email && <span className="inf-location">{deal.influencer.email}</span>}
                    </div>
                  </div>
                </td>

                {showCampaignCol && (
                  <td>
                    <span className={`inf-campaign-tag ${isDirect ? 'direct' : ''}`}>
                      {isDirect ? 'Direct Outreach' : getDealCampaignTitle(deal)}
                    </span>
                  </td>
                )}

                <td>
                  <span className={`collab-status-badge collab-deal-status-${deal.status}`}>
                    {getDealStatusIcon(deal.status)}
                    {deal.status.replace('_', ' ')}
                  </span>
                </td>

                <td>
                  <span className={`brand-payment-chip brand-payment-${paymentStatus}`}>
                    {paymentStatus.replace('_', ' ')}
                  </span>
                </td>

                <td>
                  <span className="inf-rate">₹{(deal.agreedRate || 0).toLocaleString()}</span>
                </td>

                <td>
                  <div className={`brand-deal-deadline ${daysLeft !== null && daysLeft < 0 ? 'overdue' : ''}`}>
                    <span>{formatDate(deal.deadline)}</span>
                    {daysLeft !== null && (
                      <small>
                        {daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? 'Today' : 'Overdue'}
                      </small>
                    )}
                  </div>
                </td>

                <td>
                  <span className="inf-date">{formatDate(deal.createdAt)}</span>
                </td>

                <td>
                  <div className="inf-action-btns brand-deal-actions">
                    {needsPayment && (
                      <>
                        <button
                          className="inf-act-btn inf-act-accept"
                          onClick={() => handlePendingPaymentDealPayment(deal)}
                          disabled={paymentProcessing}
                        >
                          <CreditCard size={13} /> <span>{paymentProcessing ? 'Processing...' : 'Make Payment'}</span>
                        </button>
                      </>
                    )}

                    {deal.status === 'pending_review' && (
                      <>
                        {deal.previewLink && (
                          <a
                            className="inf-act-btn inf-act-view"
                            href={deal.previewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink size={13} /> <span>Preview</span>
                          </a>
                        )}
                        <button
                          className="inf-act-btn inf-act-accept"
                          onClick={() => handleDealStatusChange(deal._id, 'in_progress', { requestRevision: false })}
                          disabled={submitting}
                        >
                          <CheckCircle size={13} /> <span>Approve Preview</span>
                        </button>
                        <button
                          className="inf-act-btn inf-act-shortlist"
                          onClick={() => handleDealStatusChange(deal._id, 'in_progress', { requestRevision: true })}
                          disabled={submitting}
                        >
                          <Upload size={13} /> <span>Revision</span>
                        </button>
                      </>
                    )}

                    {canRelease && (
                      <button
                        className="inf-act-btn inf-act-accept"
                        onClick={() => handleReleasePayment(deal._id)}
                        disabled={submitting}
                      >
                        <IndianRupee size={13} /> <span>Release</span>
                      </button>
                    )}

                    {deal.status === 'completed' && (
                      <>
                        {deal.finalContentLink && (
                          <a
                            className="inf-act-btn inf-act-view"
                            href={deal.finalContentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink size={13} /> <span>Final Link</span>
                          </a>
                        )}
                        <button
                          className="inf-act-btn inf-act-view"
                          onClick={() => {
                            setShowReviewModal(deal);
                            setReviewForm({ rating: 5, title: '', content: '' });
                          }}
                        >
                          <Star size={13} /> <span>Review</span>
                        </button>
                      </>
                    )}

                    <button className="inf-act-btn inf-act-msg" onClick={handleGoToMessages}>
                      <MessageSquare size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderBrandDealsView = () => (
    <>
      <div className="brand-apps-topbar">
        <div className="brand-stat-pills">
          {[
            { key: 'all', label: 'All', count: brandDealStatusCounts.all },
            { key: 'active', label: 'Active', count: brandDealStatusCounts.active },
            { key: 'review', label: 'In Review', count: brandDealStatusCounts.review },
            { key: 'completed', label: 'Completed', count: brandDealStatusCounts.completed },
            { key: 'cancelled', label: 'Cancelled', count: brandDealStatusCounts.cancelled },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              className={`brand-stat-pill brand-stat-${key} ${brandDealFilters.status === key ? 'active' : ''}`}
              onClick={() => updateBrandDealFilter('status', key)}
            >
              {label}
              <span className="brand-stat-cnt">{count}</span>
            </button>
          ))}
        </div>

        <div className="brand-view-toggle">
          <button
            className={`brand-view-btn ${dealViewMode === 'campaign' ? 'active' : ''}`}
            onClick={() => setDealViewMode('campaign')}
          >
            <LayoutGrid size={15} /> Campaign
          </button>
          <button
            className={`brand-view-btn ${dealViewMode === 'table' ? 'active' : ''}`}
            onClick={() => setDealViewMode('table')}
          >
            <List size={15} /> Table
          </button>
        </div>
      </div>

      <div className="brand-filter-row">
        <div className="collab-search-box brand-search">
          <Search size={17} />
          <input
            type="text"
            placeholder="Search influencer or campaign..."
            value={dealSearchTerm}
            onChange={(e) => setDealSearchTerm(e.target.value)}
          />
          {dealSearchTerm && (
            <button className="brand-search-clear" onClick={() => setDealSearchTerm('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="brand-filter-controls">
          <select
            className="brand-select"
            value={brandDealFilters.selectedCampaign}
            onChange={(e) => updateBrandDealFilter('selectedCampaign', e.target.value)}
          >
            <option value="all">All Campaigns</option>
            {brandDealCampaignOptions.campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
            {brandDealCampaignOptions.hasDirect && <option value="direct">Direct Outreach</option>}
          </select>

          <select
            className="brand-select"
            value={brandDealFilters.source}
            onChange={(e) => updateBrandDealFilter('source', e.target.value)}
          >
            <option value="all">All Sources</option>
            <option value="campaign">Campaign Deals</option>
            <option value="direct">Direct Outreach</option>
          </select>

          <select
            className="brand-select"
            value={brandDealFilters.paymentStatus}
            onChange={(e) => updateBrandDealFilter('paymentStatus', e.target.value)}
          >
            <option value="all">All Payments</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="paid">Paid</option>
            <option value="escrow">Escrow</option>
            <option value="released">Released</option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            className="brand-select"
            value={brandDealFilters.sortBy}
            onChange={(e) => updateBrandDealFilter('sortBy', e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="rate_desc">Rate: High → Low</option>
            <option value="rate_asc">Rate: Low → High</option>
            <option value="deadline_asc">Deadline: Nearest</option>
            <option value="deadline_desc">Deadline: Farthest</option>
          </select>

          <button
            className={`brand-adv-btn ${showDealAdvancedFilters ? 'open' : ''} ${activeDealFiltersCount > 0 ? 'has-active' : ''}`}
            onClick={() => setShowDealAdvancedFilters(prev => !prev)}
          >
            <SlidersHorizontal size={15} />
            <span>Filters</span>
            {activeDealFiltersCount > 0 && <span className="brand-filter-badge">{activeDealFiltersCount}</span>}
          </button>

          {activeDealFiltersCount > 0 && (
            <button className="brand-clear-btn" onClick={clearAllBrandDealFilters}>
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {showDealAdvancedFilters && (
        <div className="brand-adv-panel">
          <div className="brand-adv-section">
            <label className="brand-adv-label"><IndianRupee size={14} /> Agreed Rate (₹)</label>
            <div className="brand-range-row">
              <input
                type="number"
                className="brand-range-input"
                placeholder="Min"
                value={brandDealFilters.rateMin}
                onChange={(e) => updateBrandDealFilter('rateMin', e.target.value)}
                min="0"
              />
              <span className="brand-range-sep">–</span>
              <input
                type="number"
                className="brand-range-input"
                placeholder="Max"
                value={brandDealFilters.rateMax}
                onChange={(e) => updateBrandDealFilter('rateMax', e.target.value)}
                min="0"
              />
            </div>
          </div>

          <div className="brand-adv-section">
            <label className="brand-adv-label"><Calendar size={14} /> Deadline Range</label>
            <div className="brand-range-row">
              <input
                type="date"
                className="brand-range-input"
                value={brandDealFilters.deadlineFrom}
                onChange={(e) => updateBrandDealFilter('deadlineFrom', e.target.value)}
              />
              <span className="brand-range-sep">–</span>
              <input
                type="date"
                className="brand-range-input"
                value={brandDealFilters.deadlineTo}
                onChange={(e) => updateBrandDealFilter('deadlineTo', e.target.value)}
              />
            </div>
          </div>

          <div className="brand-adv-section">
            <label className="brand-adv-label"><Clock size={14} /> Deal Created Date</label>
            <div className="brand-range-row">
              <input
                type="date"
                className="brand-range-input"
                value={brandDealFilters.createdFrom}
                onChange={(e) => updateBrandDealFilter('createdFrom', e.target.value)}
              />
              <span className="brand-range-sep">–</span>
              <input
                type="date"
                className="brand-range-input"
                value={brandDealFilters.createdTo}
                onChange={(e) => updateBrandDealFilter('createdTo', e.target.value)}
              />
            </div>
          </div>

          <div className="brand-adv-section">
            <label className="brand-adv-label"><AlertCircle size={14} /> Overdue</label>
            <label className="brand-overdue-check">
              <input
                type="checkbox"
                checked={brandDealFilters.overdueOnly}
                onChange={(e) => updateBrandDealFilter('overdueOnly', e.target.checked)}
              />
              <span>Show only overdue active deals</span>
            </label>
          </div>
        </div>
      )}

      {activeDealFiltersCount > 0 && (
        <div className="brand-active-chips">
          {brandDealFilters.selectedCampaign !== 'all' && (
            <span className="brand-chip">
              {brandDealFilters.selectedCampaign === 'direct'
                ? 'Direct Outreach'
                : `Campaign: ${brandDealCampaignOptions.campaigns.find(c => c.id === brandDealFilters.selectedCampaign)?.title || '...'}`}
              <button onClick={() => updateBrandDealFilter('selectedCampaign', 'all')}><X size={11} /></button>
            </span>
          )}
          {brandDealFilters.status !== 'all' && (
            <span className="brand-chip">
              Status: {brandDealFilters.status}
              <button onClick={() => updateBrandDealFilter('status', 'all')}><X size={11} /></button>
            </span>
          )}
          {brandDealFilters.source !== 'all' && (
            <span className="brand-chip">
              Source: {brandDealFilters.source}
              <button onClick={() => updateBrandDealFilter('source', 'all')}><X size={11} /></button>
            </span>
          )}
          {brandDealFilters.paymentStatus !== 'all' && (
            <span className="brand-chip">
              Payment: {brandDealFilters.paymentStatus}
              <button onClick={() => updateBrandDealFilter('paymentStatus', 'all')}><X size={11} /></button>
            </span>
          )}
          {(brandDealFilters.rateMin || brandDealFilters.rateMax) && (
            <span className="brand-chip">
              ₹{brandDealFilters.rateMin || '0'} – ₹{brandDealFilters.rateMax || '∞'}
              <button onClick={() => { updateBrandDealFilter('rateMin', ''); updateBrandDealFilter('rateMax', ''); }}><X size={11} /></button>
            </span>
          )}
          {(brandDealFilters.deadlineFrom || brandDealFilters.deadlineTo) && (
            <span className="brand-chip">
              Deadline: {brandDealFilters.deadlineFrom || '…'} – {brandDealFilters.deadlineTo || '…'}
              <button onClick={() => { updateBrandDealFilter('deadlineFrom', ''); updateBrandDealFilter('deadlineTo', ''); }}><X size={11} /></button>
            </span>
          )}
          {(brandDealFilters.createdFrom || brandDealFilters.createdTo) && (
            <span className="brand-chip">
              Created: {brandDealFilters.createdFrom || '…'} – {brandDealFilters.createdTo || '…'}
              <button onClick={() => { updateBrandDealFilter('createdFrom', ''); updateBrandDealFilter('createdTo', ''); }}><X size={11} /></button>
            </span>
          )}
          {brandDealFilters.overdueOnly && (
            <span className="brand-chip">
              Overdue only
              <button onClick={() => updateBrandDealFilter('overdueOnly', false)}><X size={11} /></button>
            </span>
          )}
          {dealSearchTerm && (
            <span className="brand-chip">
              "{dealSearchTerm}"
              <button onClick={() => setDealSearchTerm('')}><X size={11} /></button>
            </span>
          )}
        </div>
      )}

      <div className="brand-results-bar">
        <span>
          Showing <strong>{filteredBrandDeals.length}</strong>
          {filteredBrandDeals.length !== nonPendingPaymentDeals.length && ` of ${nonPendingPaymentDeals.length}`} deals
        </span>
      </div>

      {dealViewMode === 'campaign' && (
        <div className="brand-campaign-groups brand-deal-groups">
          {groupedBrandDeals.length > 0 ? (
            groupedBrandDeals.map(group => {
              const isOpen = expandedDealGroups[group.groupKey] ?? false;
              const activeCount = group.deals.filter(d => d.status === 'active' || d.status === 'in_progress').length;
              const reviewCount = group.deals.filter(d => d.status === 'pending_review').length;
              const completedCount = group.deals.filter(d => d.status === 'completed').length;
              return (
                <div key={group.groupKey} className="brand-campaign-group brand-deal-group">
                  <div className={`brand-cg-header brand-dg-header ${isOpen ? 'open' : ''}`} onClick={() => toggleDealGroupExpanded(group.groupKey)}>
                    <div className="brand-cg-left">
                      <div className={`brand-cg-icon ${group.isDirect ? 'direct' : ''}`}>
                        {group.isDirect ? <MessageSquare size={17} /> : <Briefcase size={17} />}
                      </div>
                      <div className="brand-cg-info">
                        <h3 className="brand-cg-title">{group.label}</h3>
                        <div className="brand-cg-meta">
                          <span className="brand-cg-tag">{group.isDirect ? 'Direct Outreach' : 'Campaign Deal'}</span>
                          {group.campaign?.platformType && <span className="brand-cg-tag">{group.campaign.platformType}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="brand-cg-right">
                      <div className="brand-cg-counts">
                        <span className="brand-cg-count total">{group.deals.length} total</span>
                        {activeCount > 0 && <span className="brand-cg-count shortlisted">{activeCount} active</span>}
                        {reviewCount > 0 && <span className="brand-cg-count pending">{reviewCount} review</span>}
                        {completedCount > 0 && <span className="brand-cg-count accepted">{completedCount} completed</span>}
                      </div>
                      <button className="brand-cg-toggle" onClick={(e) => { e.stopPropagation(); toggleDealGroupExpanded(group.groupKey); }}>
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="brand-cg-body">
                      {renderBrandDealsTable(group.deals, false)}
                    </div>
                  )}
                </div>
              );
            })
          ) : renderBrandDealEmptyState()}
        </div>
      )}

      {dealViewMode === 'table' && (
        <div className="brand-flat-table-wrap brand-flat-deals-wrap">
          {filteredBrandDeals.length > 0
            ? renderBrandDealsTable(filteredBrandDeals, true)
            : renderBrandDealEmptyState()}
        </div>
      )}
    </>
  );

  const renderPendingPaymentView = () => {
    if (isBrand) {
      return (
        <>
          <div className="brand-results-bar">
            <span>
              Pending payment collaborations: <strong>{pendingPaymentDeals.length}</strong>
            </span>
          </div>
          <div className="brand-flat-table-wrap brand-flat-deals-wrap">
            {pendingPaymentDeals.length > 0
              ? renderBrandDealsTable(pendingPaymentDeals, true)
              : (
                <div className="collab-empty-state">
                  <CreditCard size={48} />
                  <h3>No pending payments</h3>
                  <p>Newly confirmed deals will appear here until payment is completed.</p>
                </div>
              )}
          </div>
        </>
      );
    }

    return (
      <div className="collab-list">
        {pendingPaymentDeals.length > 0 ? (
          pendingPaymentDeals.map((deal) => (
            <div key={deal._id} className="collab-card collab-deal-card">
              <div className="collab-header">
                <div className="collab-title">
                  <h3>{deal.brand?.name || 'Brand'}</h3>
                  <span className="collab-status-badge collab-deal-status-pending_payment">
                    <CreditCard size={16} />
                    pending payment
                  </span>
                </div>
                <div className="collab-service">
                  <Briefcase size={16} />
                  {getDealCampaignTitle(deal)}
                </div>
              </div>
              <div className="collab-body">
                <div className="collab-deal-stats">
                  <div className="collab-deal-stat">
                    <IndianRupee size={20} />
                    <div>
                      <span className="stat-label">Agreed Rate</span>
                      <span className="stat-value">₹{deal.agreedRate?.toLocaleString() || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="collab-deal-stat">
                    <Calendar size={20} />
                    <div>
                      <span className="stat-label">Deadline</span>
                      <span className="stat-value">{formatDate(deal.deadline)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="collab-footer">
                <div className="collab-payment-info warning">
                  <Lock size={16} />
                  <span>Waiting for brand payment confirmation</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="collab-empty-state">
            <CreditCard size={48} />
            <h3>No pending payments</h3>
            <p>Confirmed collaborations waiting for payment will appear here.</p>
          </div>
        )}
      </div>
    );
  };

  // Open create deal modal
  const openCreateDealModal = (application) => {
    setShowCreateDealModal(application);
    setDealForm({
      agreedRate: application.proposedRate || '',
      deadline: application.campaign?.deadline 
        ? new Date(application.campaign.deadline).toISOString().split('T')[0] 
        : ''
    });
  };

  // Handle create deal
  const handleCreateDeal = async () => {
    if (!showCreateDealModal) return;
    if (!dealForm.agreedRate || !dealForm.deadline) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createDeal({
        applicationId: showCreateDealModal._id,
        agreedRate: Number(dealForm.agreedRate),
        deadline: dealForm.deadline
      });
      if (result.success) {
        // Deal created and is in pending_payment status - no automatic payment
        toast.success('Deal created successfully! Go to Pending Payment tab to complete payment.');
        setShowCreateDealModal(null);
        // Switch to pending_payment tab so brand can see the new deal
        switchTab('pending_payment');
        // Refresh deals and applications
        const dealsData = await fetchMyDeals(true);
        setMyDeals(dealsData || []);
        if (isInfluencer) {
          await fetchMyApplications({}, true);
        } else if (isBrand) {
          const campaigns = await fetchMyCampaigns();
          if (campaigns && campaigns.length > 0) {
            const allApps = [];
            for (const campaign of campaigns) {
              const apps = await fetchCampaignApplications(campaign._id);
              allApps.push(...apps.map(app => normalizeCampaignApplication(app, campaign)));
            }
            setBrandApplications(allApps);
          }
        }
      } else {
        toast.error(result.error || 'Failed to create deal');
      }
    } catch (err) {
      toast.error('Failed to create deal');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle deal status update
  const handleDealStatusChange = async (dealId, newStatus, extraPayload = {}) => {
    setSubmitting(true);
    try {
      const result = await updateDealStatus(dealId, { status: newStatus, ...extraPayload });
      if (result.success) {
        toast.success(`Deal ${newStatus === 'completed' ? 'completed' : 'updated'} successfully!`);
        // Refresh deals
        const dealsData = await fetchMyDeals(true);
        setMyDeals(dealsData || []);
      } else {
        toast.error(result.error || 'Failed to update deal');
      }
    } catch (err) {
      toast.error('Failed to update deal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPreviewLink = async (deal) => {
    const input = window.prompt('Enter work preview link for brand review:', deal.previewLink || '');
    if (input === null) return;

    const previewLink = normalizeUrl(input);
    if (!previewLink) {
      toast.error('Please enter a valid preview link');
      return;
    }

    await handleDealStatusChange(deal._id, 'pending_review', { previewLink });
  };

  const handleSubmitFinalContentLink = async (deal) => {
    const input = window.prompt('Enter final posted content link:', deal.finalContentLink || '');
    if (input === null) return;

    const finalContentLink = normalizeUrl(input);
    if (!finalContentLink) {
      toast.error('Please enter a valid final content link');
      return;
    }

    await handleDealStatusChange(deal._id, 'completed', { finalContentLink });
  };

  // Handle release payment (Brand only, after deal completion)
  const handleReleasePayment = async (dealId) => {
    if (!window.confirm('Release payment to influencer? This action cannot be undone.')) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await paymentService.releasePayment(dealId);
      
      if (result.success) {
        toast.success('Payment released to influencer successfully!');
        // Refresh deals
        const dealsData = await fetchMyDeals(true);
        setMyDeals(dealsData || []);
        // Update payment cache
        setDealPayments(prev => ({
          ...prev,
          [dealId]: { ...prev[dealId], status: 'released' }
        }));
      } else {
        toast.error(result.message || 'Failed to release payment');
      }
    } catch (err) {
      console.error('Release payment error:', err);
      toast.error('Failed to release payment');
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch payment status for a deal
  const fetchPaymentStatus = async (dealId) => {
    // Return cached if available
    if (dealPayments[dealId]) {
      return dealPayments[dealId];
    }

    try {
      const result = await paymentService.getPaymentByDeal(dealId);
      if (result.success && result.data) {
        const paymentData = { status: result.data.paymentStatus, ...result.data };
        setDealPayments(prev => ({
          ...prev,
          [dealId]: paymentData
        }));
        return paymentData;
      }
    } catch (err) {
      console.error('Fetch payment status error:', err);
    }
    return null;
  };

  // Handle submit review
  const handleSubmitReview = async () => {
    if (!showReviewModal) return;
    if (!reviewForm.content) {
      toast.error('Please write a review');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createReview({
        dealId: showReviewModal._id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        content: reviewForm.content
      });
      if (result.success) {
        toast.success('Review submitted successfully!');
        setShowReviewModal(null);
        setReviewForm({ rating: 5, title: '', content: '' });
        // Refresh deals to update reviewed status
        const dealsData = await fetchMyDeals(true);
        setMyDeals(dealsData || []);
      } else {
        toast.error(result.error || 'Failed to submit review');
      }
    } catch (err) {
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  // Navigate to Messages page (to open collaboration chat)
  const handleGoToMessages = () => {
    navigate('/messages');
  };

  // Star rating component
  const StarRating = ({ rating, onRate }) => {
    return (
      <div className="collab-star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`collab-star ${star <= rating ? 'active' : ''}`}
            onClick={() => onRate(star)}
          >
            <Star size={24} fill={star <= rating ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
    );
  };

  // Get deal status icon
  const getDealStatusIcon = (status) => {
    switch (status) {
      case 'pending_payment':
        return <CreditCard size={16} />;
      case 'active':
        return <Play size={16} />;
      case 'in_progress':
        return <Clock size={16} />;
      case 'pending_review':
        return <Eye size={16} />;
      case 'completed':
        return <CheckCircle size={16} />;
      case 'cancelled':
        return <XCircle size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const normalizeUrl = (value) => {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

    try {
      const parsed = new URL(withProtocol);
      if (!['http:', 'https:'].includes(parsed.protocol)) return null;
      return parsed.toString();
    } catch {
      return null;
    }
  };

  // Days until deadline
  const getDaysUntil = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const end = new Date(deadline);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Show loading state
  if (loading || localLoading) {
    return (
      <div className="collab-page">
        <div className="collab-container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '1rem'
        }}>
          <Loader size={48} className="spin-animation" />
          <p>Loading collaborations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="collab-page">
      <div className="collab-container">
        <div className="collab-page-header">
          <div>
            <h1>Collaborations</h1>
            <p>{isInfluencer ? 'Your applications & active deals' : 'Manage applications & deals'}</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="collab-error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Main Tabs: Applications / Pending Payment / Deals */}
        <div className="collab-main-tabs">
          <button 
            className={`collab-main-tab ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => switchTab('applications')}
          >
            <FileText size={18} />
            Applications
            <span className="collab-tab-count">{items.length}</span>
          </button>
          <button
            className={`collab-main-tab ${activeTab === 'pending_payment' ? 'active' : ''}`}
            onClick={() => switchTab('pending_payment')}
          >
            <CreditCard size={18} />
            Pending Payment
            <span className="collab-tab-count">{pendingPaymentDeals.length}</span>
          </button>
          <button 
            className={`collab-main-tab ${activeTab === 'deals' ? 'active' : ''}`}
            onClick={() => switchTab('deals')}
          >
            <Handshake size={18} />
            Deals
            <span className="collab-tab-count">{nonPendingPaymentDeals.length}</span>
          </button>
        </div>

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <>
            {/* Brand: new campaign-wise table view */}
            {isBrand && renderBrandApplicationsView()}

            {/* Influencer: existing card-based view */}
            {isInfluencer && (
              <>
                {/* Filters */}
                <div className="collab-filters-bar">
                  <div className="collab-search-box">
                    <Search size={20} />
                    <input
                      type="text"
                      placeholder="Search applications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="collab-filter-tabs">
                    {['all', 'pending', 'active', 'completed'].map(status => (
                      <button
                        key={status}
                        className={`collab-filter-tab ${filter === status ? 'collab-active' : ''}`}
                        onClick={() => setFilter(status)}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        <span className="collab-count">{statusCounts[status]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Applications List */}
                <div className="collab-list">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((app) => (
                      <div key={app._id} className="collab-card">
                        <div className="collab-header">
                          <div className="collab-title">
                            <h3>{app.campaign?.brandProfile?.companyName || 'Brand'}</h3>
                            <span className={`collab-status-badge collab-status-${app.status}`}>
                              {getStatusIcon(app.status)}
                              {app.status}
                            </span>
                          </div>
                          <div className="collab-service">
                            <Briefcase size={16} />
                            {app.campaign?.title || 'Campaign'}
                          </div>
                        </div>

                        <div className="collab-body">
                          <p className="collab-message">{app.message || 'No message'}</p>
                          <div className="collab-details">
                            <div className="collab-detail-item">
                              <IndianRupee size={16} />
                              <span>Proposed Rate: <strong>{app.proposedRate || 'N/A'}</strong></span>
                            </div>
                            {app.campaign?.deadline && (
                              <div className="collab-detail-item">
                                <Calendar size={16} />
                                <span>Deadline: <strong>{new Date(app.campaign.deadline).toLocaleDateString()}</strong></span>
                              </div>
                            )}
                            <div className="collab-detail-item">
                              <Clock size={16} />
                              <span>Applied: <strong>{new Date(app.createdAt).toLocaleDateString()}</strong></span>
                            </div>
                            {app.campaign?.budget && (
                              <div className="collab-detail-item">
                                <IndianRupee size={16} />
                                <span>Campaign Budget: <strong>₹{app.campaign.budget.min} – ₹{app.campaign.budget.max}</strong></span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="collab-footer">
                          {app.status === 'pending' && (
                            <div className="collab-action-buttons">
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleStatusChange(app._id, 'withdrawn')}
                              >
                                Withdraw
                              </button>
                            </div>
                          )}
                          {app.status === 'shortlisted' && (
                            <div className="collab-action-buttons">
                              <button className="btn btn-outline btn-sm" onClick={handleGoToMessages}>
                                <MessageSquare size={16} /> Message
                              </button>
                            </div>
                          )}
                          {app.status === 'accepted' && (
                            <div className="collab-action-buttons">
                              <button className="btn btn-outline btn-sm" onClick={handleGoToMessages}>
                                <MessageSquare size={16} /> Message
                              </button>
                              <div className="collab-completed-info collab-success" style={{ marginLeft: 'auto' }}>
                                <CheckCircle size={18} />
                                <span>Accepted! Waiting for deal confirmation.</span>
                              </div>
                            </div>
                          )}
                          {(app.status === 'rejected' || app.status === 'withdrawn') && (
                            <div className="collab-completed-info">
                              <XCircle size={18} />
                              <span>{app.status === 'withdrawn' ? 'Withdrawn' : 'Rejected'}{app.brandResponse?.message ? `: ${app.brandResponse.message}` : ''}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="collab-empty-state">
                      <Briefcase size={48} />
                      <h3>No applications found</h3>
                      <p>
                        {filter !== 'all'
                          ? `You don't have any ${filter} applications.`
                          : 'Apply to campaigns to start collaborating!'}
                      </p>
                      <Link to="/campaigns" className="btn btn-primary">
                        Browse Campaigns
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* Pending Payment Tab */}
        {activeTab === 'pending_payment' && (
          <>
            {renderPendingPaymentView()}
          </>
        )}

        {/* Deals Tab */}
        {activeTab === 'deals' && (
          <>
            {isBrand && renderBrandDealsView()}

            {isInfluencer && (
              <>
                {/* Deal Filters */}
                <div className="collab-filters-bar">
                  <div className="collab-search-box">
                    <Search size={20} />
                    <input
                      type="text"
                      placeholder="Search deals..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="collab-filter-tabs">
                    {['all', 'active', 'pending_review', 'completed'].map(status => (
                      <button
                        key={status}
                        className={`collab-filter-tab ${dealFilter === status ? 'collab-active' : ''}`}
                        onClick={() => setDealFilter(status)}
                      >
                        {status === 'pending_review' ? 'In Review' : status.charAt(0).toUpperCase() + status.slice(1)}
                        <span className="collab-count">{dealStatusCounts[status]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Deals List */}
                <div className="collab-list">
                  {filteredDeals.length > 0 ? (
                    filteredDeals.map((deal) => {
                      const daysLeft = getDaysUntil(deal.deadline);
                      return (
                        <div key={deal._id} className="collab-card collab-deal-card">
                          <div className="collab-header">
                            <div className="collab-title">
                              <h3>{deal.brand?.name || 'Brand'}</h3>
                              <span className={`collab-status-badge collab-deal-status-${deal.status}`}>
                                {getDealStatusIcon(deal.status)}
                                {deal.status.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="collab-service">
                              <Briefcase size={16} />
                              {getDealCampaignTitle(deal)}
                            </div>
                          </div>

                          <div className="collab-body">
                            <div className="collab-deal-stats">
                              <div className="collab-deal-stat">
                                <IndianRupee size={20} />
                                <div>
                                  <span className="stat-label">Agreed Rate</span>
                                  <span className="stat-value">₹{deal.agreedRate?.toLocaleString() || 'N/A'}</span>
                                </div>
                              </div>
                              <div className="collab-deal-stat">
                                <Calendar size={20} />
                                <div>
                                  <span className="stat-label">Deadline</span>
                                  <span className="stat-value">{formatDate(deal.deadline)}</span>
                                </div>
                              </div>
                              {daysLeft !== null && (
                                <div className={`collab-deal-stat ${daysLeft < 3 ? 'urgent' : ''}`}>
                                  <Clock size={20} />
                                  <div>
                                    <span className="stat-label">Time Left</span>
                                    <span className="stat-value">
                                      {daysLeft > 0 ? `${daysLeft} days` : daysLeft === 0 ? 'Today' : 'Overdue'}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {deal.deliverables && deal.deliverables.length > 0 && (
                              <div className="collab-deliverables">
                                <h4>Deliverables</h4>
                                <div className="collab-deliverables-list">
                                  {deal.deliverables.map((d, idx) => (
                                    <div key={idx} className={`collab-deliverable collab-deliverable-${d.status}`}>
                                      {d.status === 'approved' ? <CheckCircle size={14} /> : d.status === 'submitted' ? <Upload size={14} /> : <Clock size={14} />}
                                      <span>{d.description || d.type}</span>
                                      <span className="deliverable-status">{d.status}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {(deal.previewLink || deal.finalContentLink) && (
                              <div className="collab-deliverables" style={{ marginTop: '0.75rem' }}>
                                <h4>Shared Links</h4>
                                <div className="collab-deliverables-list">
                                  {deal.previewLink && (
                                    <a className="collab-deliverable" href={deal.previewLink} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink size={14} />
                                      <span>Work Preview Link</span>
                                    </a>
                                  )}
                                  {deal.finalContentLink && (
                                    <a className="collab-deliverable collab-deliverable-approved" href={deal.finalContentLink} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink size={14} />
                                      <span>Final Posted Content</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="collab-footer">
                            {deal.paymentStatus && (
                              <div className={`collab-payment-info ${deal.paymentStatus === 'paid' ? 'success' : deal.paymentStatus === 'pending' ? 'warning' : ''}`}>
                                <Lock size={16} />
                                <span>
                                  Payment: {deal.paymentStatus === 'paid'
                                    ? 'Secured in Escrow'
                                    : deal.paymentStatus === 'processing'
                                      ? 'Processing...'
                                      : deal.paymentStatus === 'pending'
                                        ? 'Payment Required'
                                        : deal.paymentStatus}
                                </span>
                              </div>
                            )}

                            {(deal.status === 'active' || (deal.status === 'in_progress' && !deal.previewApprovedAt)) && (
                              <div className="collab-action-buttons">
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleSubmitPreviewLink(deal)}
                                  disabled={submitting}
                                >
                                  <Upload size={16} />
                                  Submit for Review
                                </button>
                              </div>
                            )}

                            {deal.status === 'pending_review' && (
                              <div className="collab-completed-info" style={{ marginTop: '0.5rem' }}>
                                <Clock size={18} />
                                <span>Preview submitted. Waiting for brand approval.</span>
                              </div>
                            )}

                            {deal.status === 'in_progress' && deal.previewApprovedAt && (
                              <div className="collab-action-buttons">
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleSubmitFinalContentLink(deal)}
                                  disabled={submitting}
                                >
                                  <ExternalLink size={16} />
                                  Submit Final Content Link
                                </button>
                              </div>
                            )}

                            {deal.status === 'completed' && (
                              <div className="collab-deal-completed-section">
                                <div className="collab-completed-info collab-success">
                                  <CheckCircle size={18} />
                                  <span>Deal completed{deal.completedAt ? ` on ${formatDate(deal.completedAt)}` : ''}</span>
                                </div>
                                <div className="collab-action-buttons">
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => {
                                      setShowReviewModal(deal);
                                      setReviewForm({ rating: 5, title: '', content: '' });
                                    }}
                                  >
                                    <Star size={16} />
                                    Leave Review
                                  </button>
                                </div>
                              </div>
                            )}

                            {deal.status === 'cancelled' && (
                              <div className="collab-completed-info">
                                <XCircle size={18} />
                                <span>Deal cancelled</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="collab-empty-state">
                      <Handshake size={48} />
                      <h3>No deals found</h3>
                      <p>
                        {dealFilter !== 'all'
                          ? `You don't have any ${dealFilter.replace('_', ' ')} deals.`
                          : 'Deals will appear here once applications are accepted and confirmed.'}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* Create Deal Modal */}
        {showCreateDealModal && (
          <div className="collab-modal-overlay" onClick={() => setShowCreateDealModal(null)}>
            <div className="collab-modal" onClick={e => e.stopPropagation()}>
              <div className="collab-modal-header">
                <h2>Create Deal</h2>
                <button className="collab-modal-close" onClick={() => setShowCreateDealModal(null)}>
                  <XCircle size={20} />
                </button>
              </div>
              <div className="collab-modal-body">
                <p className="collab-modal-info">
                  Creating deal with <strong>{showCreateDealModal.influencer?.name || showCreateDealModal.influencerProfile?.name || 'Influencer'}</strong> for campaign <strong>{showCreateDealModal.campaign?.title || 'Campaign'}</strong>
                </p>
                <div className="collab-form-group">
                  <label>Agreed Rate (₹)</label>
                  <input
                    type="number"
                    value={dealForm.agreedRate}
                    onChange={(e) => setDealForm(prev => ({ ...prev, agreedRate: e.target.value }))}
                    placeholder="Enter agreed rate"
                    min="0"
                  />
                </div>
                <div className="collab-form-group">
                  <label>Deadline</label>
                  <input
                    type="date"
                    value={dealForm.deadline}
                    onChange={(e) => setDealForm(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>
              </div>
              <div className="collab-modal-footer">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowCreateDealModal(null)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleCreateDeal}
                  disabled={submitting || !dealForm.agreedRate || !dealForm.deadline}
                >
                  {submitting ? <Loader size={16} className="spin-animation" /> : <Handshake size={16} />}
                  Create Deal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && (
          <div className="collab-modal-overlay" onClick={() => setShowReviewModal(null)}>
            <div className="collab-modal collab-review-modal" onClick={e => e.stopPropagation()}>
              <div className="collab-modal-header">
                <h2>Leave a Review</h2>
                <button className="collab-modal-close" onClick={() => setShowReviewModal(null)}>
                  <XCircle size={20} />
                </button>
              </div>
              <div className="collab-modal-body">
                <p className="collab-modal-info">
                  Rate your experience with <strong>{isBrand ? (showReviewModal.influencer?.name || 'Influencer') : (showReviewModal.brand?.name || 'Brand')}</strong> for <strong>{showReviewModal.campaign?.title || 'this campaign'}</strong>
                </p>
                
                <div className="collab-form-group collab-rating-group">
                  <label>Rating</label>
                  <StarRating 
                    rating={reviewForm.rating} 
                    onRate={(r) => setReviewForm(prev => ({ ...prev, rating: r }))}
                  />
                  <span className="collab-rating-text">{reviewForm.rating}/5 stars</span>
                </div>

                <div className="collab-form-group">
                  <label>Title (optional)</label>
                  <input
                    type="text"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Summarize your experience"
                    maxLength={100}
                  />
                </div>

                <div className="collab-form-group">
                  <label>Your Review *</label>
                  <textarea
                    value={reviewForm.content}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Share your experience working on this campaign..."
                    rows={4}
                    maxLength={1000}
                  />
                  <span className="collab-char-count">{reviewForm.content.length}/1000</span>
                </div>
              </div>
              <div className="collab-modal-footer">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowReviewModal(null)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleSubmitReview}
                  disabled={submitting || !reviewForm.content}
                >
                  {submitting ? <Loader size={16} className="spin-animation" /> : <Star size={16} />}
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======== Influencer Detail Modal (Brand only) ======== */}
        {selectedApp && isBrand && (
          <div className="collab-modal-overlay" onClick={() => setSelectedApp(null)}>
            <div className="collab-modal inf-detail-modal" onClick={e => e.stopPropagation()}>
              <div className="collab-modal-header">
                <h2>Influencer Details</h2>
                <button className="collab-modal-close" onClick={() => setSelectedApp(null)}>
                  <X size={20} />
                </button>
              </div>
              <div className="collab-modal-body inf-detail-body">
                {/* Profile header */}
                <div className="inf-detail-hero">
                  <div className={`inf-detail-avatar inf-avatar-${(selectedApp.influencerProfile?.platformType || 'default').toLowerCase()}`}>
                    {selectedApp.influencerProfile?.avatar
                      ? <img src={selectedApp.influencerProfile.avatar} alt={selectedApp.influencerProfile?.name} />
                      : <span>{(selectedApp.influencerProfile?.name || selectedApp.influencer?.name || '?').charAt(0).toUpperCase()}</span>}
                  </div>
                  <div className="inf-detail-hero-info">
                    <h3>{selectedApp.influencerProfile?.name || selectedApp.influencer?.name || 'Influencer'}</h3>
                    {selectedApp.influencerProfile?.location && (
                      <p className="inf-detail-location">{selectedApp.influencerProfile.location}</p>
                    )}
                    {selectedApp.influencerProfile?.bio && (
                      <p className="inf-detail-bio">{selectedApp.influencerProfile.bio}</p>
                    )}
                    <div className="inf-detail-tag-row">
                      {(selectedApp.influencerProfile?.niche || []).map((n, i) => (
                        <span key={i} className="inf-niche-tag">{n}</span>
                      ))}
                      {selectedApp.influencerProfile?.platformType && (
                        <span className={`inf-platform-badge plat-${selectedApp.influencerProfile.platformType.toLowerCase()}`}>
                          {selectedApp.influencerProfile.platformType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="inf-detail-stats-grid">
                  <div className="inf-detail-stat-card">
                    <Users size={20} />
                    <div>
                      <span className="stat-label">Total Followers</span>
                      <span className="stat-value">{formatFollowers(selectedApp.influencerProfile?.totalFollowers)}</span>
                    </div>
                  </div>
                  <div className="inf-detail-stat-card">
                    <TrendingUp size={20} />
                    <div>
                      <span className="stat-label">Avg Engagement</span>
                      <span className="stat-value">
                        {formatEngagementRate(selectedApp.influencerProfile || {})}
                      </span>
                    </div>
                  </div>
                  <div className="inf-detail-stat-card">
                    <Award size={20} />
                    <div>
                      <span className="stat-label">Trust Score</span>
                      <span className={`stat-value ${getTrustClass(selectedApp.influencerProfile?.trustScore)}`}>
                        {selectedApp.influencerProfile?.trustScore || 0}/100
                      </span>
                    </div>
                  </div>
                  <div className="inf-detail-stat-card">
                    <IndianRupee size={20} />
                    <div>
                      <span className="stat-label">Proposed Rate</span>
                      <span className="stat-value">₹{(selectedApp.proposedRate || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  {selectedApp.influencerProfile?.instagramStats?.followers > 0 && (
                    <div className="inf-detail-stat-card">
                      <span className="plat-icon plat-ig">IG</span>
                      <div>
                        <span className="stat-label">Instagram Followers</span>
                        <span className="stat-value">{formatFollowers(selectedApp.influencerProfile.instagramStats.followers)}</span>
                      </div>
                    </div>
                  )}
                  {selectedApp.influencerProfile?.youtubeStats?.subscribers > 0 && (
                    <div className="inf-detail-stat-card">
                      <span className="plat-icon plat-yt">YT</span>
                      <div>
                        <span className="stat-label">YouTube Subscribers</span>
                        <span className="stat-value">{formatFollowers(selectedApp.influencerProfile.youtubeStats.subscribers)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Campaign context */}
                <div className="inf-detail-campaign-info">
                  <h4><Briefcase size={15} /> Campaign</h4>
                  <p><strong>{selectedApp.campaign?.title}</strong></p>
                  <div className="inf-detail-meta-row">
                    <span><Clock size={13} /> Applied: {formatDate(selectedApp.createdAt)}</span>
                    {selectedApp.campaign?.deadline && (
                      <span><Calendar size={13} /> Deadline: {formatDate(selectedApp.campaign.deadline)}</span>
                    )}
                    {selectedApp.campaign?.budget && (
                      <span><IndianRupee size={13} /> Budget: ₹{selectedApp.campaign.budget.min?.toLocaleString()} – ₹{selectedApp.campaign.budget.max?.toLocaleString()}</span>
                    )}
                  </div>
                </div>

                {/* Application message */}
                {selectedApp.message && (
                  <div className="inf-detail-section">
                    <h4>Application Message</h4>
                    <p>{selectedApp.message}</p>
                  </div>
                )}

                {/* Portfolio links */}
                {selectedApp.portfolioLinks && selectedApp.portfolioLinks.length > 0 && (
                  <div className="inf-detail-section">
                    <h4>Portfolio Links</h4>
                    <div className="inf-portfolio-links">
                      {selectedApp.portfolioLinks.map((link, i) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inf-portfolio-link"
                        >
                          <ExternalLink size={13} />
                          {link.title || link.url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="collab-modal-footer">
                <div className="inf-modal-footer-note">Use the global action bar for shortlist, accept, and deal actions.</div>
                <button className="btn btn-outline" onClick={() => { handleGoToMessages(); setSelectedApp(null); }}>
                  <MessageSquare size={16} /> Message
                </button>
                <button className="btn btn-secondary" onClick={() => setSelectedApp(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Collaborations;
