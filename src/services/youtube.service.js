import api from './api';

const youtubeService = {
  // Fetch YouTube channel profile and analytics
  fetchProfile: async (youtubeUrl) => {
    const response = await api.post('/youtube/fetch-profile', { youtubeUrl });
    return response.data;
  },

  // Analyze a specific YouTube video
  analyzeVideo: async (videoUrl) => {
    const response = await api.post('/youtube/analyze-video', { videoUrl });
    return response.data;
  },

  // Get current quota usage (admin only)
  getQuotaUsage: async () => {
    const response = await api.get('/youtube/quota');
    return response.data;
  },
};

export default youtubeService;
