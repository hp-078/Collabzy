import express from 'express';
import { protect, requireBrand, requireInfluencer } from '../middleware/auth.middleware.js';
import { validate, applicationSchemas } from '../middleware/validation.middleware.js';
import {
  submitApplication,
  getMyApplications,
  getCampaignApplications,
  getApplicationById,
  updateApplicationStatus,
  withdrawApplication,
  submitDeliverable,
  rateInfluencer
} from '../controllers/application.controller.js';

const router = express.Router();

// Influencer routes
router.post('/', protect, requireInfluencer, validate(applicationSchemas.createApplication), submitApplication);
router.get('/my-applications', protect, requireInfluencer, getMyApplications);
router.delete('/:id', protect, requireInfluencer, withdrawApplication);
router.post('/:id/deliverable', protect, requireInfluencer, submitDeliverable);

// Brand routes
router.get('/campaign/:campaignId', protect, requireBrand, getCampaignApplications);
router.put('/:id/status', protect, requireBrand, updateApplicationStatus);
router.post('/:id/rate', protect, requireBrand, rateInfluencer);

// Shared routes (influencer or brand)
router.get('/:id', protect, getApplicationById);

export default router;
