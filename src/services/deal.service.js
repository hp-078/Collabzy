import api from './api';

const dealService = {
  // Create a new deal (brand only)
  createDeal: async (dealData) => {
    const response = await api.post('/deals', dealData);
    return response.data;
  },

  // Get my deals (both brand and influencer)
  getMyDeals: async () => {
    const response = await api.get('/deals/my-deals');
    return response.data;
  },

  // Get deal by ID
  getDealById: async (dealId) => {
    const response = await api.get(`/deals/${dealId}`);
    return response.data;
  },

  // Update deal status
  updateDealStatus: async (dealId, statusData) => {
    const response = await api.put(`/deals/${dealId}/status`, statusData);
    return response.data;
  },

  // Update deliverable
  updateDeliverable: async (dealId, deliverableIndex, data) => {
    const response = await api.put(`/deals/${dealId}/deliverables/${deliverableIndex}`, data);
    return response.data;
  }
};

export default dealService;
