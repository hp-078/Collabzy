const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// Public routes (specific paths MUST be before /:id)
router.get('/user/:userId', reviewController.getReviewsForUser);

// Protected routes (specific paths MUST be before /:id)
router.post('/', requireAuth, reviewController.createReview);
router.get('/my-reviews', requireAuth, reviewController.getMyReviews);

// Routes with /:id pattern come LAST
router.get('/:id', reviewController.getReviewById);
router.put('/:id/respond', requireAuth, reviewController.respondToReview);

module.exports = router;
