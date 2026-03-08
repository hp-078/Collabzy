// backend/routes/payment.routes.js
// Payment routes for Razorpay integration

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { requireAuth, requireBrand, requireAdmin } = require('../middleware/auth.middleware');

// Webhook endpoint (no auth - verified by signature)
router.post('/webhook', paymentController.handleWebhook);

// All other routes require authentication
router.use(requireAuth);

// Create payment order (brand only)
router.post('/create-order', requireBrand, paymentController.createOrder);

// Verify payment (brand only)
router.post('/verify', requireBrand, paymentController.verifyPayment);

// Get payment by deal ID
router.get('/deal/:dealId', paymentController.getPaymentByDeal);

// Release payment to influencer (brand or admin)
router.patch('/release/:dealId', paymentController.releasePayment);

// Refund payment (admin only)
router.post('/refund/:dealId', requireAdmin, paymentController.refundPayment);

// Get my payment history
router.get('/my-payments', paymentController.getMyPayments);

// Platform statistics (admin only)
router.get('/platform-stats', requireAdmin, paymentController.getPlatformStats);

module.exports = router;
