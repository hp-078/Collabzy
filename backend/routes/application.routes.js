const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/application.controller');
const { requireAuth, requireInfluencer, requireBrand } = require('../middleware/auth.middleware');

// ==========================================
// APPLICATION ROUTES
// ==========================================

// Submit application (Influencer only)
// POST /api/applications
router.post('/', requireAuth, requireInfluencer, applicationController.submitApplication);

// Get influencer's own applications
// GET /api/applications/my-applications
router.get('/my-applications', requireAuth, requireInfluencer, applicationController.getMyApplications);

// Get single application by ID
// GET /api/applications/:id
router.get('/:id', requireAuth, applicationController.getApplicationById);

// Withdraw application (Influencer only)
// PUT /api/applications/:id/withdraw
router.put('/:id/withdraw', requireAuth, requireInfluencer, applicationController.withdrawApplication);

// Update application (Influencer only, only if pending)
// PUT /api/applications/:id
router.put('/:id', requireAuth, requireInfluencer, applicationController.updateApplication);

// Get applications for a campaign (Brand only - campaign owner)
// GET /api/applications/campaign/:campaignId
router.get('/campaign/:campaignId', requireAuth, requireBrand, applicationController.getApplicationsForCampaign);

// Update application status (Brand only - campaign owner)
// PUT /api/applications/:id/status
router.put('/:id/status', requireAuth, requireBrand, applicationController.updateApplicationStatus);

// Get application statistics for campaign (Brand only)
// GET /api/applications/campaign/:campaignId/stats
router.get('/campaign/:campaignId/stats', requireAuth, requireBrand, applicationController.getCampaignApplicationStats);

module.exports = router;
