const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { requireAuth, requireBrand } = require('../middleware/auth.middleware');

// ==========================================
// REVIEW ROUTES
// ==========================================

// Submit review (Brand only - brands review influencers after deal completion)
// POST /api/reviews
router.post('/', requireAuth, requireBrand, reviewController.submitReview);

// Get reviews for a specific influencer (public)
// GET /api/reviews/influencer/:influencerId
router.get('/influencer/:influencerId', reviewController.getInfluencerReviews);

// Get my received reviews (Influencer)
// GET /api/reviews/my-reviews
router.get('/my-reviews', requireAuth, reviewController.getMyReviews);

// Get reviews I've given (Brand)
// GET /api/reviews/given
router.get('/given', requireAuth, requireBrand, reviewController.getReviewsGiven);

// Get single review by ID
// GET /api/reviews/:id
router.get('/:id', reviewController.getReviewById);

// Respond to a review (Influencer who received the review)
// POST /api/reviews/:id/respond
router.post('/:id/respond', requireAuth, reviewController.respondToReview);

// Mark review as helpful (any authenticated user)
// POST /api/reviews/:id/helpful
router.post('/:id/helpful', requireAuth, reviewController.markHelpful);

// Flag review as inappropriate (any authenticated user)
// POST /api/reviews/:id/flag
router.post('/:id/flag', requireAuth, reviewController.flagReview);

// Get review statistics for influencer
// GET /api/reviews/influencer/:influencerId/stats
router.get('/influencer/:influencerId/stats', reviewController.getInfluencerReviewStats);

module.exports = router;
