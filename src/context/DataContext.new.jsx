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
  const { isAuthenticated } = useAuth();
  const [influencers, setInfluencers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
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
    try {
      const response = await influencerService.getAllInfluencers(filters);
      const data = response.data || [];
      setInfluencers(data);
      updateCache('influencers', data);
      return data;
    } catch (error) {
      console.error('Failed to fetch influencers:', error);
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
    try {
      const response = await campaignService.getAllCampaigns(filters);
      const data = response.data || [];
      setCampaigns(data);
      updateCache('campaigns', data);
      return data;
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's campaigns (brand only)
  const fetchMyCampaigns = async (filters = {}) => {
    if (!isAuthenticated) return [];

    setLoading(true);
    try {
      const response = await campaignService.getMyCampaigns(filters);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch my campaigns:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch eligible campaigns (influencer only)
  const fetchEligibleCampaigns = async (filters = {}) => {
    if (!isAuthenticated) return [];

    setLoading(true);
    try {
      const response = await campaignService.getEligibleCampaigns(filters);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch eligible campaigns:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch applications
  const fetchMyApplications = async (filters = {}, forceRefresh = false) => {
    if (!isAuthenticated) return [];

    if (!forceRefresh && isCacheValid('applications')) {
      setApplications(cache.applications.data);
      return cache.applications.data;
    }

    setLoading(true);
    try {
      const response = await applicationService.getMyApplications(filters);
      const data = response.data || [];
      setApplications(data);
      updateCache('applications', data);
      return data;
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get single campaign
  const getCampaignById = async (campaignId) => {
    try {
      const response = await campaignService.getCampaignById(campaignId);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch campaign:', error);
      return null;
    }
  };

  // Get single influencer
  const getInfluencerById = async (userId) => {
    try {
      const response = await influencerService.getProfile(userId);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch influencer:', error);
      return null;
    }
  };

  // Create campaign
  const createCampaign = async (campaignData) => {
    try {
      const response = await campaignService.createCampaign(campaignData);
      // Invalidate campaigns cache
      updateCache('campaigns', null);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to create campaign:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to create campaign' };
    }
  };

  // Update campaign
  const updateCampaign = async (campaignId, campaignData) => {
    try {
      const response = await campaignService.updateCampaign(campaignId, campaignData);
      // Invalidate campaigns cache
      updateCache('campaigns', null);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to update campaign:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to update campaign' };
    }
  };

  // Submit application
  const submitApplication = async (applicationData) => {
    try {
      const response = await applicationService.submitApplication(applicationData);
      // Invalidate applications cache
      updateCache('applications', null);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to submit application:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to submit application' };
    }
  };

  // Update application status (brand only)
  const updateApplicationStatus = async (applicationId, status, message = '') => {
    try {
      const response = await applicationService.updateApplicationStatus(applicationId, status, message);
      // Invalidate applications cache
      updateCache('applications', null);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to update application:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to update application' };
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

  const value = {
    // State
    influencers,
    campaigns,
    applications,
    loading,

    // Fetch functions
    fetchInfluencers,
    fetchCampaigns,
    fetchMyCampaigns,
    fetchEligibleCampaigns,
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
