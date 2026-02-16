import api from './api';

const instagramService = {
  // Fetch Instagram profile and analytics
  fetchProfile: async (instagramUrl) => {
    const response = await api.post('/instagram/fetch-profile', { instagramUrl });
    return response.data;
  },

  // Submit manual profile data (when auto-fetch fails)
  submitManualProfile: async (profileData) => {
    const response = await api.post('/instagram/manual-profile', profileData);
    return response.data;
  },

  // Analyze a specific Instagram post
  analyzePost: async (postUrl) => {
    const response = await api.post('/instagram/analyze-post', { postUrl });
    return response.data;
  },
};

export default instagramService;
