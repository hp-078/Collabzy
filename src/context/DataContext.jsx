import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import influencerService from '../services/influencer.service';
import campaignService from '../services/campaign.service';
import applicationService from '../services/application.service';

const DataContext = createContext(null);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [influencers, setInfluencers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cache, setCache] = useState({
    influencers: { data: null, timestamp: null },
    campaigns: { data: null, timestamp: null },
    applications: { data: null, timestamp: null },
  });

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  // Check if cache is valid
  const isCacheValid = (cacheKey) => {
    const cached = cache[cacheKey];
    if (!cached.data || !cached.timestamp) return false;
    return Date.now() - cached.timestamp < CACHE_DURATION;
  };

  // Update cache
  const updateCache = (cacheKey, data) => {
    setCache(prev => ({
      ...prev,
      [cacheKey]: { data, timestamp: Date.now() }
    }));
  };

  // Fetch influencers
  const fetchInfluencers = async (filters = {}, forceRefresh = false) => {
    if (!forceRefresh && isCacheValid('influencers')) {
      setInfluencers(cache.influencers.data);
      return cache.influencers.data;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await influencerService.getAllInfluencers(filters);
      const data = response.data || [];
      setInfluencers(data);
      updateCache('influencers', data);
      return data;
    } catch (error) {
      console.error('Failed to fetch influencers:', error);
      setError('Failed to load influencers');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch campaigns
  const fetchCampaigns = async (filters = {}, forceRefresh = false) => {
    if (!isAuthenticated) return [];

    if (!forceRefresh && isCacheValid('campaigns')) {
      setCampaigns(cache.campaigns.data);
      return cache.campaigns.data;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await campaignService.getAllCampaigns(filters);
      const data = response.data || [];
      setCampaigns(data);
      updateCache('campaigns', data);
      return data;
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      setError('Failed to load campaigns');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's campaigns (brand only)
  const fetchMyCampaigns = async (filters = {}) => {
    if (!isAuthenticated) return [];

    setLoading(true);
    setError(null);
    try {
      const response = await campaignService.getMyCampaigns(filters);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch my campaigns:', error);
      setError('Failed to load your campaigns');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch eligible campaigns (influencer only)
  const fetchEligibleCampaigns = async (filters = {}) => {
    if (!isAuthenticated) return [];

    setLoading(true);
    setError(null);
    try {
      const response = await campaignService.getEligibleCampaigns(filters);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch eligible campaigns:', error);
      setError('Failed to load campaigns');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch recommended campaigns (influencer only)
  const fetchRecommendedCampaigns = async (filters = {}) => {
    if (!isAuthenticated) return [];

    setLoading(true);
    setError(null);
    try {
      const response = await campaignService.getRecommendedCampaigns(filters);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch recommended campaigns:', error);
      setError('Failed to load recommendations');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch applications
  const fetchMyApplications = async (filters = {}, forceRefresh = false) => {
    if (!isAuthenticated) {
      console.log('⚠️ Not authenticated, skipping application fetch');
      return [];
    }

    if (!forceRefresh && isCacheValid('applications')) {
      console.log('📦 Using cached applications:', cache.applications.data?.length || 0);
      setApplications(cache.applications.data);
      return cache.applications.data;
    }

    console.log('🔄 Fetching applications from API...');
    setLoading(true);
    setError(null);
    try {
      const response = await applicationService.getMyApplications(filters);
      const data = response.data || [];
      console.log('✅ Fetched applications:', data.length);
      console.log('📋 Applications data:', data);
      setApplications(data);
      updateCache('applications', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch applications:', error);
      setError('Failed to load applications');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get single campaign
  const getCampaignById = async (campaignId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await campaignService.getCampaignById(campaignId);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch campaign:', error);
      setError('Failed to load campaign details');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get single influencer
  const getInfluencerById = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await influencerService.getProfile(userId);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch influencer:', error);
      setError('Failed to load influencer profile');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create campaign
  const createCampaign = async (campaignData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await campaignService.createCampaign(campaignData);
      // Invalidate campaigns cache
      updateCache('campaigns', null);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to create campaign:', error);
      const errorMsg = error.response?.data?.message || 'Failed to create campaign';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Update campaign
  const updateCampaign = async (campaignId, campaignData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await campaignService.updateCampaign(campaignId, campaignData);
      // Invalidate campaigns cache
      updateCache('campaigns', null);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to update campaign:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update campaign';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Submit application
  const submitApplication = async (applicationData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await applicationService.submitApplication(applicationData);
      // Invalidate applications cache
      updateCache('applications', null);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to submit application:', error);
      const errorMsg = error.response?.data?.message || 'Failed to submit application';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Update application status (brand only)
  const updateApplicationStatus = async (applicationId, status, message = '') => {
    setLoading(true);
    setError(null);
    try {
      const response = await applicationService.updateApplicationStatus(applicationId, status, message);
      // Invalidate applications cache
      updateCache('applications', null);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to update application:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update application';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Clear all cache
  const clearCache = () => {
    setCache({
      influencers: { data: null, timestamp: null },
      campaigns: { data: null, timestamp: null },
      applications: { data: null, timestamp: null },
    });
  };

  // Backward compatibility helpers (for components still using old API)
  const collaborations = applications; // Applications = Collaborations conceptually
  const brands = []; // Not used in new version
  const messages = []; // Will be handled separately

  const value = {
    // State
    influencers,
    campaigns,
    applications,
    collaborations, // Alias for backward compatibility
    brands, // Empty for backward compatibility
    messages, // Empty for backward compatibility
    loading,
    error,

    // Fetch functions
    fetchInfluencers,
    fetchCampaigns,
    fetchMyCampaigns,
    fetchEligibleCampaigns,
    fetchRecommendedCampaigns,
    fetchMyApplications,

    // Get single item
    getCampaignById,
    getInfluencerById,

    // Create/Update functions
    createCampaign,
    updateCampaign,
    submitApplication,
    updateApplicationStatus,



    // Utility
    clearCache,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
