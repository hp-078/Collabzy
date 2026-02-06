const express = require('express');
const router = express.Router();
const dealController = require('../controllers/deal.controller');
const { requireAuth, requireBrand } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(requireAuth);

router.post('/', requireBrand, dealController.createDeal);
router.get('/my-deals', dealController.getMyDeals);
router.get('/:id', dealController.getDealById);
router.put('/:id/status', dealController.updateDealStatus);
router.put('/:id/deliverables/:deliverableIndex', dealController.updateDeliverable);

module.exports = router;
