import api from './api';

const influencerService = {
  // Create influencer profile
  createProfile: async (profileData) => {
    const response = await api.post('/influencer/profile', profileData);
    return response.data;
  },

  // Get influencer profile by user ID
  getProfile: async (userId) => {
    const response = await api.get(`/influencer/${userId}`);
    return response.data;
  },

  // Get own influencer profile
  getOwnProfile: async () => {
    const response = await api.get('/influencer/profile');
    return response.data;
  },

  // Update influencer profile
  updateProfile: async (profileData) => {
    const response = await api.put('/influencer/profile', profileData);
    return response.data;
  },

  // Get all influencers with filtering
  getAllInfluencers: async (filters = {}) => {
    const response = await api.get('/influencer', { params: filters });
    return response.data;
  },

  // Fetch YouTube profile data
  fetchYouTubeProfile: async (channelId) => {
    const response = await api.post('/influencer/youtube/fetch', { channelId });
    return response.data;
  },

  // Fetch Instagram profile data
  fetchInstagramProfile: async (username) => {
    const response = await api.post('/influencer/instagram/fetch', { username });
    return response.data;
  },

  // Get trending influencers
  getTrendingInfluencers: async (limit = 10) => {
    const response = await api.get('/influencer', {
      params: { 
        sortBy: 'trustScore',
        order: 'desc',
        limit 
      }
    });
    return response.data;
  },
};

export default influencerService;
