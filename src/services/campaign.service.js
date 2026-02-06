import api from './api';

const campaignService = {
  // Create new campaign (Brand only)
  createCampaign: async (campaignData) => {
    const response = await api.post('/campaigns', campaignData);
    return response.data;
  },

  // Get all campaigns with filtering
  getAllCampaigns: async (filters = {}) => {
    const response = await api.get('/campaigns', { params: filters });
    return response.data;
  },

  // Get single campaign by ID
  getCampaignById: async (campaignId) => {
    const response = await api.get(`/campaigns/${campaignId}`);
    return response.data;
  },

  // Update campaign (Brand only)
  updateCampaign: async (campaignId, campaignData) => {
    const response = await api.put(`/campaigns/${campaignId}`, campaignData);
    return response.data;
  },

  // Delete campaign (Brand only)
  deleteCampaign: async (campaignId) => {
    const response = await api.delete(`/campaigns/${campaignId}`);
    return response.data;
  },

  // Get campaigns created by logged-in brand
  getMyCampaigns: async (filters = {}) => {
    const response = await api.get('/campaigns/brand/my-campaigns', { params: filters });
    return response.data;
  },

  // Get eligible campaigns for logged-in influencer
  getEligibleCampaigns: async (filters = {}) => {
    const response = await api.get('/campaigns/influencer/eligible', { params: filters });
    return response.data;
  },

  // Get recommended campaigns for logged-in influencer
  getRecommendedCampaigns: async (limit = 10) => {
    const response = await api.get('/campaigns/influencer/recommended', { params: { limit } });
    return response.data;
  },

  // Get active campaigns
  getActiveCampaigns: async (filters = {}) => {
    const response = await api.get('/campaigns', {
      params: { ...filters, status: 'active' }
    });
    return response.data;
  },
};

export default campaignService;
