const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { requireAuth, requireBrand, requireAdmin } = require('../middleware/auth.middleware');

// Webhook (public endpoint verified by signature)
router.post('/webhook', paymentController.handleWebhook);

// Escrow endpoints (internal simulated escrow)
router.post('/escrow', requireAuth, paymentController.createEscrow);
router.post('/release', requireAuth, requireAdmin, paymentController.releaseEscrow);

// Razorpay / Deal payment endpoints
router.post('/create-order', requireAuth, requireBrand, paymentController.createOrder);
router.post('/create-bulk-order', requireAuth, requireBrand, paymentController.createBulkOrder);
router.post('/verify', requireAuth, requireBrand, paymentController.verifyPayment);
router.post('/verify-bulk', requireAuth, requireBrand, paymentController.verifyBulkPayment);
router.get('/deal/:dealId', requireAuth, paymentController.getPaymentByDeal);
router.patch('/release/:dealId', requireAuth, paymentController.releasePayment);
router.post('/refund/:dealId', requireAuth, requireAdmin, paymentController.refundPayment);
router.get('/my-payments', requireAuth, paymentController.getMyPayments);
router.get('/platform-stats', requireAuth, requireAdmin, paymentController.getPlatformStats);
router.get('/admin/overview', requireAuth, requireAdmin, paymentController.getAdminWalletOverview);

module.exports = router;
