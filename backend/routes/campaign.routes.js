const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaign.controller');
const { requireAuth, requireBrand, requireInfluencer } = require('../middleware/auth.middleware');

// Public routes - anyone can view active campaigns
router.get('/:id', campaignController.getCampaignById);

// Protected routes - require authentication
router.use(requireAuth);

// Brand-only routes - campaign management
router.post('/', requireBrand, campaignController.createCampaign);
router.put('/:id', requireBrand, campaignController.updateCampaign);
router.delete('/:id', requireBrand, campaignController.deleteCampaign);
router.get('/brand/my-campaigns', requireBrand, campaignController.getMyCampaigns);

// Influencer-only routes - discover campaigns
router.get('/influencer/eligible', requireInfluencer, campaignController.getEligibleCampaigns);
router.get('/influencer/recommended', requireInfluencer, campaignController.getRecommendedCampaigns);

module.exports = router;
