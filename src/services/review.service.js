import api from './api';

const reviewService = {
  // Create a review for a completed deal
  createReview: async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  // Get my reviews (as reviewer)
  getMyReviews: async () => {
    const response = await api.get('/reviews/my-reviews');
    return response.data;
  },

  // Get reviews for a specific user
  getReviewsForUser: async (userId) => {
    const response = await api.get(`/reviews/user/${userId}`);
    return response.data;
  },

  // Get review by ID
  getReviewById: async (reviewId) => {
    const response = await api.get(`/reviews/${reviewId}`);
    return response.data;
  },

  // Respond to a review (as the reviewee)
  respondToReview: async (reviewId, response) => {
    const res = await api.put(`/reviews/${reviewId}/respond`, { response });
    return res.data;
  }
};

export default reviewService;
