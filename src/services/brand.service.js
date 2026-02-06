import api from './api';

const brandService = {
  // Get own brand profile (requires brand role)
  getOwnProfile: async () => {
    const response = await api.get('/brand/profile/me');
    return response.data;
  },

  // Update own brand profile
  updateProfile: async (profileData) => {
    const response = await api.put('/brand/profile', profileData);
    return response.data;
  },

  // Get brand profile by ID (public)
  getProfileById: async (brandId) => {
    const response = await api.get(`/brand/${brandId}`);
    return response.data;
  },

  // List all brands (public)
  listBrands: async (params = {}) => {
    const response = await api.get('/brand/list', { params });
    return response.data;
  }
};

export default brandService;
