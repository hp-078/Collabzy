import express from 'express';
import { protect, requireInfluencer, requireAdmin } from '../middleware/auth.middleware.js';
import {
  getProfile,
  createOrUpdateProfile,
  fetchYouTubeProfile,
  analyzePost,
  getInfluencerById,
  getAllInfluencers,
  updateTrustScore
} from '../controllers/influencer.controller.js';

const router = express.Router();

// Public routes
router.get('/', getAllInfluencers);
router.get('/:id', getInfluencerById);

// Protected routes - Influencer only
router.use(protect, requireInfluencer);
router.get('/profile', getProfile);
router.post('/profile', createOrUpdateProfile);
router.post('/fetch-youtube', fetchYouTubeProfile);
router.post('/analyze-post', analyzePost);

// Admin routes
router.put('/:id/trust-score', protect, requireAdmin, updateTrustScore);

export default router;
