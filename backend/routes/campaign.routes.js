const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaign.controller');
const { requireAuth, requireBrand, requireInfluencer, optionalAuth } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(requireAuth);

// Brand-specific routes (MUST be before /:id to prevent pattern conflicts)
router.get('/brand/my-campaigns', requireBrand, campaignController.getMyCampaigns);
router.post('/', requireBrand, campaignController.createCampaign);

// Influencer-specific routes (MUST be before /:id)
router.get('/influencer/eligible', requireInfluencer, campaignController.getEligibleCampaigns);
router.get('/influencer/recommended', requireInfluencer, campaignController.getRecommendedCampaigns);

// General campaign routes (/:id pattern comes LAST)
router.get('/', campaignController.getAllCampaigns);
router.get('/:id', campaignController.getCampaignById);
router.put('/:id', requireBrand, campaignController.updateCampaign);
router.delete('/:id', requireBrand, campaignController.deleteCampaign);

module.exports = router;
