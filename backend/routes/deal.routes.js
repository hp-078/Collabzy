const express = require('express');
const router = express.Router();
const dealController = require('../controllers/deal.controller');
const { requireAuth, requireInfluencer, requireBrand } = require('../middleware/auth.middleware');

// ==========================================
// DEAL ROUTES
// ==========================================

// Get my deals (both influencer and brand can use this)
// GET /api/deals/my-deals
router.get('/my-deals', requireAuth, dealController.getMyDeals);

// Get single deal by ID
// GET /api/deals/:id
router.get('/:id', requireAuth, dealController.getDealById);

// Create deal (automatically when application is accepted - internal)
// This would typically be called internally, not directly by users

// Update deal status (both parties can update based on workflow)
// PUT /api/deals/:id/status
router.put('/:id/status', requireAuth, dealController.updateDealStatus);

// Submit deliverable/content (Influencer only)
// POST /api/deals/:id/submit
router.post('/:id/submit', requireAuth, requireInfluencer, dealController.submitContent);

// Approve content (Brand only)
// POST /api/deals/:id/approve
router.post('/:id/approve', requireAuth, requireBrand, dealController.approveContent);

// Request revision (Brand only)
// POST /api/deals/:id/request-revision
router.post('/:id/request-revision', requireAuth, requireBrand, dealController.requestRevision);

// Resubmit after revision (Influencer only)
// POST /api/deals/:id/resubmit
router.post('/:id/resubmit', requireAuth, requireInfluencer, dealController.resubmitContent);

// Mark deal as complete (Brand only, after all content approved)
// POST /api/deals/:id/complete
router.post('/:id/complete', requireAuth, requireBrand, dealController.markComplete);

// Cancel deal (Both parties, with reason)
// POST /api/deals/:id/cancel
router.post('/:id/cancel', requireAuth, dealController.cancelDeal);

// Add note to deal (Both parties)
// POST /api/deals/:id/notes
router.post('/:id/notes', requireAuth, dealController.addNote);

// Get deal statistics (influencer or brand)
// GET /api/deals/stats/summary
router.get('/stats/summary', requireAuth, dealController.getDealStats);

module.exports = router;
