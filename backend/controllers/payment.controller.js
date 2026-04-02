// backend/controllers/payment.controller.js
// Payment controller for handling Razorpay transactions

const crypto = require('crypto');
const paymentService = require('../services/payment.service');
const Deal = require('../models/Deal.model');
const Payment = require('../models/Payment.model');

/**
 * Create payment order for a deal
 * POST /api/payments/create-order
 */
exports.createOrder = async (req, res) => {
    try {
        const { dealId } = req.body;
        const userId = req.user._id;
        const userRole = req.user.role;

        if (!dealId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Deal ID and amount are required'
            });
        }

        // Fetch deal
        const deal = await Deal.findById(dealId);
        
        if (!deal) {
            return res.status(404).json({
                success: false,
                message: 'Deal not found'
            });
        }

        // Verify user is the brand
        if (userRole !== 'brand' || deal.brand.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only the brand can create payment for this deal'
            });
        }

        // Payment must be initiated at deal creation time only.
        return res.status(400).json({
            success: false,
            message: 'Pay-later is disabled. Payment must be initialized during deal creation.'
        });

    } catch (error) {
        console.error('Create order error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to create payment order'
        });
    }
};

/**
 * Verify payment and move to escrow
 * POST /api/payments/verify
 */
exports.verifyPayment = async (req, res) => {
    try {
        const { orderId, paymentId, signature, dealId } = req.body;
        const userId = req.user._id;

        if (!orderId || !paymentId || !signature || !dealId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID, payment ID, signature, and deal ID are required'
            });
        }

        // Fetch deal to verify ownership
        const deal = await Deal.findById(dealId);
        
        if (!deal) {
            return res.status(404).json({
                success: false,
                message: 'Deal not found'
            });
        }

        // Verify user is the brand
        if (deal.brand.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        // Verify and escrow payment
        const result = await paymentService.verifyAndEscrow(orderId, paymentId, signature);

        return res.json({
            success: true,
            message: 'Payment verified and held in escrow',
            data: {
                payment: result.payment,
                deal: result.deal
            }
        });
    } catch (error) {
        console.error('Verify payment error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Payment verification failed'
        });
    }
};

/**
 * Get payment details for a deal
 * GET /api/payments/deal/:dealId
 */
exports.getPaymentByDeal = async (req, res) => {
    try {
        const { dealId } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role;

        // Fetch deal to verify access
        const deal = await Deal.findById(dealId);
        
        if (!deal) {
            return res.status(404).json({
                success: false,
                message: 'Deal not found'
            });
        }

        // Verify user is part of the deal
        const isAuthorized = deal.brand.toString() === userId.toString() || 
                           deal.influencer.toString() === userId.toString() ||
                           userRole === 'admin';

        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this payment'
            });
        }

        const payment = await Payment.findOne({ dealId });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        return res.json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error('Get payment error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch payment'
        });
    }
};

/**
 * Release payment to influencer
 * PATCH /api/payments/release/:dealId
 */
exports.releasePayment = async (req, res) => {
    try {
        const { dealId } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role;

        // Fetch deal
        const deal = await Deal.findById(dealId);
        
        if (!deal) {
            return res.status(404).json({
                success: false,
                message: 'Deal not found'
            });
        }

        // Verify user is the brand or admin
        const isAuthorized = (userRole === 'brand' && deal.brand.toString() === userId.toString()) ||
                           userRole === 'admin';

        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to release payment'
            });
        }

        // Check if deal is completed
        if (deal.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Deal must be completed before releasing payment'
            });
        }

        // Release payment
        const payment = await paymentService.releasePayment(dealId);

        return res.json({
            success: true,
            message: 'Payment released to influencer',
            data: payment
        });
    } catch (error) {
        console.error('Release payment error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Failed to release payment'
        });
    }
};

/**
 * Refund payment to brand
 * POST /api/payments/refund/:dealId
 */
exports.refundPayment = async (req, res) => {
    try {
        const { dealId } = req.params;
        const { reason } = req.body;
        const userRole = req.user.role;

        // Only admins can issue refunds
        if (userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can issue refunds'
            });
        }

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Refund reason is required'
            });
        }

        const payment = await paymentService.refundPayment(dealId, reason);

        return res.json({
            success: true,
            message: 'Payment refunded to brand',
            data: payment
        });
    } catch (error) {
        console.error('Refund payment error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Failed to refund payment'
        });
    }
};

/**
 * Get user's payment history
 * GET /api/payments/my-payments
 */
exports.getMyPayments = async (req, res) => {
    try {
        const userId = req.user._id;
        const userRole = req.user.role;

        const filter = userRole === 'brand' 
            ? { brandId: userId }
            : { influencerId: userId };

        const payments = await Payment.find(filter)
            .populate('dealId', 'campaign agreedRate')
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            data: payments
        });
    } catch (error) {
        console.error('Get my payments error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch payments'
        });
    }
};

/**
 * Get platform revenue statistics (admin only)
 * GET /api/payments/platform-stats
 */
exports.getPlatformStats = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const payments = await Payment.find({ paymentStatus: { $in: ['paid', 'escrow', 'released'] } });

        const stats = {
            totalPayments: payments.length,
            totalRevenue: payments.reduce((sum, p) => sum + p.totalAmount, 0),
            platformEarnings: payments.reduce((sum, p) => sum + p.platformFee, 0),
            inEscrow: payments.filter(p => p.paymentStatus === 'escrow').reduce((sum, p) => sum + p.totalAmount, 0),
            released: payments.filter(p => p.paymentStatus === 'released').reduce((sum, p) => sum + p.influencerAmount, 0)
        };

        return res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get platform stats error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch stats'
        });
    }
};

/**
 * Razorpay webhook handler (for payment status updates)
 * POST /api/payments/webhook
 */
exports.handleWebhook = async (req, res) => {
    try {
        // Verify webhook signature
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];
        
        if (!webhookSecret) {
            console.warn('RAZORPAY_WEBHOOK_SECRET not configured');
            return res.json({ success: true }); // Accept in development
        }

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (signature !== expectedSignature) {
            return res.status(401).json({
                success: false,
                message: 'Invalid signature'
            });
        }

        // Process webhook event
        const event = req.body.event;
        const payload = req.body.payload?.payment?.entity;

        console.log('Razorpay webhook event:', event);

        // Handle different events
        switch (event) {
            case 'payment.captured':
                console.log('Payment captured:', payload?.id);
                // Payment successful - already handled in verifyPayment
                break;
            case 'payment.failed':
                console.log('Payment failed:', payload?.id);
                // Update payment status to failed
                break;
            case 'refund.processed':
                console.log('Refund processed:', payload?.id);
                // Update refund status
                break;
            default:
                console.log('Unhandled webhook event:', event);
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).json({
            success: false,
            message: 'Webhook processing failed'
        });
    }
};
