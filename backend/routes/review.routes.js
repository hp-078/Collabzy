const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// Public routes
router.get('/user/:userId', reviewController.getReviewsForUser);
router.get('/:id', reviewController.getReviewById);

// Protected routes
router.post('/', requireAuth, reviewController.createReview);
router.get('/my-reviews', requireAuth, reviewController.getMyReviews);
router.put('/:id/respond', requireAuth, reviewController.respondToReview);

module.exports = router;
