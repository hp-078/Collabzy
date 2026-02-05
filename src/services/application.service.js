import api from './api';

const applicationService = {
  // Submit application to campaign (Influencer only)
  submitApplication: async (applicationData) => {
    const response = await api.post('/application', applicationData);
    return response.data;
  },

  // Get all applications for a campaign (Brand only)
  getCampaignApplications: async (campaignId, filters = {}) => {
    const response = await api.get(`/application/campaign/${campaignId}`, { params: filters });
    return response.data;
  },

  // Get influencer's own applications
  getMyApplications: async (filters = {}) => {
    const response = await api.get('/application/my-applications', { params: filters });
    return response.data;
  },

  // Get single application by ID
  getApplicationById: async (applicationId) => {
    const response = await api.get(`/application/${applicationId}`);
    return response.data;
  },

  // Update application status (Brand only)
  updateApplicationStatus: async (applicationId, status, message = '') => {
    const response = await api.patch(`/application/${applicationId}/status`, {
      status,
      message
    });
    return response.data;
  },

  // Withdraw application (Influencer only)
  withdrawApplication: async (applicationId) => {
    const response = await api.delete(`/application/${applicationId}`);
    return response.data;
  },

  // Get applications by status
  getApplicationsByStatus: async (status, filters = {}) => {
    const response = await api.get('/application/my-applications', {
      params: { ...filters, status }
    });
    return response.data;
  },
};

export default applicationService;
