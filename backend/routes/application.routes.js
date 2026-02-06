const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/application.controller');
const { requireAuth, requireInfluencer, requireBrand } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(requireAuth);

// Influencer routes (MUST be before /:id)
router.post('/', requireInfluencer, applicationController.submitApplication);
router.get('/my-applications', requireInfluencer, applicationController.getMyApplications);

// Brand routes (MUST be before /:id)
router.get('/campaign/:campaignId', requireBrand, applicationController.getApplicationsForCampaign);
router.get('/campaign/:campaignId/stats', requireBrand, applicationController.getCampaignApplicationStats);

// General routes (/:id pattern comes LAST)
router.get('/:id', applicationController.getApplicationById);
router.put('/:id', requireInfluencer, applicationController.updateApplication);
router.put('/:id/status', requireBrand, applicationController.updateApplicationStatus);
router.put('/:id/withdraw', requireInfluencer, applicationController.withdrawApplication);

module.exports = router;
