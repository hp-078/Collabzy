import express from 'express';
import { protect, requireBrand, requireInfluencer } from '../middleware/auth.middleware.js';
import { validate, campaignSchemas } from '../middleware/validation.middleware.js';
import {
  createCampaign,
  getAllCampaigns,
  getEligibleCampaigns,
  getRecommendedCampaigns,
  getCampaignById,
  getMyCampaigns,
  updateCampaign,
  deleteCampaign
} from '../controllers/campaign.controller.js';

const router = express.Router();

// Public routes
router.get('/', getAllCampaigns);
router.get('/:id', getCampaignById);

// Influencer routes
router.get('/eligible', protect, requireInfluencer, getEligibleCampaigns);
router.get('/recommended', protect, requireInfluencer, getRecommendedCampaigns);

// Brand routes
router.post('/', protect, requireBrand, validate(campaignSchemas.createCampaign), createCampaign);
router.get('/my-campaigns', protect, requireBrand, getMyCampaigns);
router.put('/:id', protect, requireBrand, updateCampaign);
router.delete('/:id', protect, requireBrand, deleteCampaign);

export default router;
