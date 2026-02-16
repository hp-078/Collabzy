import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import influencerService from '../services/influencer.service';
import campaignService from '../services/campaign.service';
import applicationService from '../services/application.service';
import messageService from '../services/message.service';
import dealService from '../services/deal.service';
import reviewService from '../services/review.service';

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
  const [deals, setDeals] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cache, setCache] = useState({
    influencers: { data: null, timestamp: null },
    campaigns: { data: null, timestamp: null },
    applications: { data: null, timestamp: null },
    deals: { data: null, timestamp: null },
    conversations: { data: null, timestamp: null },
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
  const fetchRecommendedCampaigns = async (limit = 20) => {
    if (!isAuthenticated) return [];

    setLoading(true);
    setError(null);
    try {
      const response = await campaignService.getRecommendedCampaigns(limit);
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
      return [];
    }

    if (!forceRefresh && isCacheValid('applications')) {
      setApplications(cache.applications.data);
      return cache.applications.data;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await applicationService.getMyApplications(filters);
      const data = response.data || [];
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
      deals: { data: null, timestamp: null },
      conversations: { data: null, timestamp: null },
    });
  };

  // ============ DEAL FUNCTIONS ============

  // Fetch my deals
  const fetchMyDeals = async (forceRefresh = false) => {
    if (!isAuthenticated) return [];

    if (!forceRefresh && isCacheValid('deals')) {
      setDeals(cache.deals.data);
      return cache.deals.data;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await dealService.getMyDeals();
      const data = response.data || [];
      setDeals(data);
      updateCache('deals', data);
      return data;
    } catch (error) {
      console.error('Failed to fetch deals:', error);
      setError('Failed to load deals');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Create deal from accepted application (brand only)
  const createDeal = async (dealData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await dealService.createDeal(dealData);
      updateCache('deals', null);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to create deal:', error);
      const errorMsg = error.response?.data?.message || 'Failed to create deal';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Update deal status
  const updateDealStatus = async (dealId, statusData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await dealService.updateDealStatus(dealId, statusData);
      updateCache('deals', null);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to update deal:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update deal';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // ============ REVIEW FUNCTIONS ============

  // Create a review for a completed deal
  const createReview = async (reviewData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await reviewService.createReview(reviewData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to create review:', error);
      const errorMsg = error.response?.data?.message || 'Failed to submit review';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Get reviews for a user
  const getReviewsForUser = async (userId) => {
    try {
      const response = await reviewService.getReviewsForUser(userId);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      return [];
    }
  };

  // ============ MESSAGE FUNCTIONS (CAMPAIGN-CENTRIC) ============

  // Fetch all collaborations (applications) with their message threads
  const fetchCollaborations = async (forceRefresh = false) => {
    if (!isAuthenticated) return [];

    if (!forceRefresh && isCacheValid('conversations')) {
      setConversations(cache.conversations.data);
      return cache.conversations.data;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await messageService.getMyCollaborations();
      const data = response.data || [];
      setConversations(data);
      updateCache('conversations', data);
      return data;
    } catch (error) {
      console.error('Failed to fetch collaborations:', error);
      setError('Failed to load collaborations');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get messages for a specific application/collaboration
  const getApplicationMessages = async (applicationId, page = 1) => {
    if (!isAuthenticated) return [];
    try {
      const response = await messageService.getApplicationMessages(applicationId, page);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch application messages:', error);
      return [];
    }
  };

  // Send a message in application/collaboration context
  const sendApplicationMessage = async (applicationId, content) => {
    try {
      const response = await messageService.sendApplicationMessage(applicationId, content);
      // Invalidate conversations cache
      updateCache('conversations', null);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to send application message:', error);
      const errorMsg = error.response?.data?.message || 'Failed to send message';
      return { success: false, error: errorMsg };
    }
  };

  // Create collaboration request (sends message to influencer)
  const createCollaboration = async (collaborationData) => {
    try {
      const { influencerId, service, budget, message, deadline } = collaborationData;
      
      // Format collaboration request message
      const formattedMessage = `🤝 Collaboration Request\n\n` +
        `Service: ${service || 'Not specified'}\n` +
        `Budget: $${budget || 'To be discussed'}\n` +
        `Deadline: ${deadline || 'To be discussed'}\n\n` +
        `Message:\n${message}`;
      
      // Send as message
      const response = await messageService.sendMessage(influencerId, formattedMessage);
      
      // Invalidate conversations cache
      updateCache('conversations', null);
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to send collaboration request:', error);
      const errorMsg = error.response?.data?.message || 'Failed to send collaboration request. Make sure backend is running.';
      return { success: false, error: errorMsg };
    }
  };

  // Get brand's campaign applications
  const fetchCampaignApplications = async (campaignId) => {
    if (!isAuthenticated) return [];
    try {
      const response = await applicationService.getCampaignApplications(campaignId);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch campaign applications:', error);
      return [];
    }
  };

  const value = {
    // State
    influencers,
    campaigns,
    applications,
    deals,
    conversations,
    loading,
    error,

    // Fetch functions
    fetchInfluencers,
    fetchCampaigns,
    fetchMyCampaigns,
    fetchEligibleCampaigns,
    fetchRecommendedCampaigns,
    fetchMyApplications,
    fetchMyDeals,
    fetchCollaborations,
    fetchCampaignApplications,

    // Get single item
    getCampaignById,
    getInfluencerById,
    getApplicationMessages,
    getReviewsForUser,

    // Create/Update functions
    createCampaign,
    updateCampaign,
    submitApplication,
    updateApplicationStatus,
    createDeal,
    updateDealStatus,
    createReview,
    sendApplicationMessage,
    createCollaboration,

    // Utility
    clearCache,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
