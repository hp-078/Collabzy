// backend/services/payment.service.js
// Payment service for Razorpay integration and escrow management

const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment.model');
const Deal = require('../models/Deal.model');

class PaymentService {
    constructor() {
        // Initialize Razorpay only if credentials are provided
        this.razorpay = null;
        this.platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE) || 10;
        
        // Lazy initialization - only create Razorpay instance when needed
        if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_SECRET) {
            try {
                this.razorpay = new Razorpay({
                    key_id: process.env.RAZORPAY_KEY_ID,
                    key_secret: process.env.RAZORPAY_SECRET
                });
                console.log('✅ Razorpay initialized successfully');
            } catch (error) {
                console.warn('⚠️  Razorpay initialization failed:', error.message);
            }
        } else {
            console.warn('⚠️  Razorpay credentials not configured. Payment features will be disabled.');
        }
    }
    
    /**
     * Check if Razorpay is configured
     */
    isConfigured() {
        return this.razorpay !== null;
    }
    
    /**
     * Ensure Razorpay is configured before use
     */
    ensureConfigured() {
        if (!this.isConfigured()) {
            throw new Error('Payment gateway not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_SECRET in environment variables.');
        }
    }

    /**
     * Create Razorpay order for a deal
     * @param {Object} deal - Deal object
     * @param {Number} amount - Payment amount
     * @returns {Object} - Order details
     */
    async createOrder(deal, amount) {
        try {
            this.ensureConfigured();
            
            // Calculate amounts
            const totalAmount = Math.round(amount * 100); // Convert to paise
            const platformFee = Math.round(totalAmount * (this.platformFeePercentage / 100));
            const influencerAmount = totalAmount - platformFee;

            // Create Razorpay order
            const orderOptions = {
                amount: totalAmount, // Amount in paise
                currency: 'INR',
                receipt: `deal_${deal._id}`,
                notes: {
                    dealId: deal._id.toString(),
                    brandId: deal.brand.toString(),
                    influencerId: deal.influencer.toString(),
                    campaignId: deal.campaign?.toString() || ''
                }
            };

            const razorpayOrder = await this.razorpay.orders.create(orderOptions);

            // Create payment record
            const payment = await Payment.create({
                dealId: deal._id,
                brandId: deal.brand,
                influencerId: deal.influencer,
                applicationId: deal.application,
                campaignId: deal.campaign,
                totalAmount: amount,
                platformFeePercentage: this.platformFeePercentage,
                platformFee: platformFee / 100, // Convert back to rupees
                influencerAmount: influencerAmount / 100,
                razorpayOrderId: razorpayOrder.id,
                paymentStatus: 'pending',
                currency: 'INR',
                receiptNumber: razorpayOrder.receipt
            });

            // Update deal with payment reference
            deal.paymentId = payment._id;
            deal.status = 'pending_payment';
            deal.paymentStatus = 'pending';
            await deal.save();

            return {
                orderId: razorpayOrder.id,
                amount: amount,
                currency: 'INR',
                key: process.env.RAZORPAY_KEY_ID,
                payment: payment
            };
        } catch (error) {
            console.error('Create order error:', error);
            throw new Error('Failed to create payment order');
        }
    }

    /**
     * Verify Razorpay payment signature
     * @param {String} orderId - Razorpay order ID
     * @param {String} paymentId - Razorpay payment ID
     * @param {String} signature - Razorpay signature
     * @returns {Boolean} - Verification result
     */
    verifyPaymentSignature(orderId, paymentId, signature) {
        try {
            this.ensureConfigured();
            
            const text = `${orderId}|${paymentId}`;
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_SECRET)
                .update(text)
                .digest('hex');

            return expectedSignature === signature;
        } catch (error) {
            console.error('Signature verification error:', error);
            return false;
        }
    }

    /**
     * Process payment verification and move funds to escrow
     * @param {String} orderId - Razorpay order ID
     * @param {String} paymentId - Razorpay payment ID
     * @param {String} signature - Razorpay signature
     * @returns {Object} - Payment and deal details
     */
    async verifyAndEscrow(orderId, paymentId, signature) {
        try {
            // Verify signature
            const isValid = this.verifyPaymentSignature(orderId, paymentId, signature);
            
            if (!isValid) {
                throw new Error('Invalid payment signature');
            }

            // Find payment
            const payment = await Payment.findOne({ razorpayOrderId: orderId });
            
            if (!payment) {
                throw new Error('Payment not found');
            }

            if (payment.paymentStatus !== 'pending') {
                throw new Error('Payment already processed');
            }

            // Update payment
            payment.razorpayPaymentId = paymentId;
            payment.razorpaySignature = signature;
            await payment.updateStatus('paid', 'Payment verified and held in escrow');
            
            // Move to escrow
            await payment.updateStatus('escrow', 'Funds held securely until deal completion');

            // Update deal status
            const deal = await Deal.findById(payment.dealId);
            deal.status = 'active';
            deal.paymentStatus = 'paid';
            deal.paidAt = new Date();
            await deal.save();

            // TODO: Send notifications
            // await notificationService.create(payment.brandId, 'PAYMENT_CONFIRMED', { dealId: deal._id });
            // await notificationService.create(payment.influencerId, 'DEAL_STARTED', { dealId: deal._id });

            return {
                payment,
                deal
            };
        } catch (error) {
            console.error('Payment verification error:', error);
            throw error;
        }
    }

    /**
     * Release payment to influencer after deal completion
     * @param {String} dealId - Deal ID
     * @returns {Object} - Updated payment
     */
    async releasePayment(dealId) {
        try {
            const payment = await Payment.findOne({ dealId });
            
            if (!payment) {
                throw new Error('Payment not found');
            }

            if (payment.paymentStatus !== 'escrow') {
                throw new Error(`Cannot release payment in status: ${payment.paymentStatus}`);
            }

            // Check if deal is completed
            const deal = await Deal.findById(dealId);
            
            if (deal.status !== 'completed') {
                throw new Error('Deal must be completed before releasing payment');
            }

            // Release payment
            await payment.updateStatus('released', 'Payment released to influencer');
            payment.payoutStatus = 'processing';
            await payment.save();

            // TODO: Initiate actual payout to influencer
            // This would involve:
            // 1. Razorpay automatic payouts API
            // 2. Bank transfer initiation
            // 3. UPI transfer
            // For now, we'll create a payout record for manual processing
            
            payment.payoutId = `payout_${Date.now()}`;
            payment.payoutStatus = 'completed'; // In production, this would be updated via webhook
            await payment.save();

            // TODO: Send notifications
            // await notificationService.create(payment.influencerId, 'PAYMENT_RECEIVED', { amount: payment.influencerAmount });
            // await notificationService.create(payment.brandId, 'PAYMENT_RELEASED', { dealId });

            // Update trust scores
            // await updateTrustScore(payment.influencerId, 'deal_completed', +3);
            // await updateTrustScore(payment.brandId, 'deal_completed', +2);

            return payment;
        } catch (error) {
            console.error('Release payment error:', error);
            throw error;
        }
    }

    /**
     * Refund payment to brand (before deal starts or on cancellation)
     * @param {String} dealId - Deal ID
     * @param {String} reason - Refund reason
     * @returns {Object} - Updated payment
     */
    async refundPayment(dealId, reason = '') {
        try {
            const payment = await Payment.findOne({ dealId });
            
            if (!payment) {
                throw new Error('Payment not found');
            }

            if (!['paid', 'escrow'].includes(payment.paymentStatus)) {
                throw new Error(`Cannot refund payment in status: ${payment.paymentStatus}`);
            }

            // Create Razorpay refund
            let refund = null;
            if (payment.razorpayPaymentId) {
                this.ensureConfigured();
                refund = await this.razorpay.payments.refund(payment.razorpayPaymentId, {
                    amount: payment.totalAmount * 100, // Full refund in paise
                    notes: {
                        dealId: dealId.toString(),
                        reason
                    }
                });
            }

            // Update payment
            payment.refundReason = reason;
            payment.refundAmount = payment.totalAmount;
            payment.refundId = refund?.id || `refund_manual_${Date.now()}`;
            await payment.updateStatus('refunded', `Refund issued: ${reason}`);

            // Update deal
            const deal = await Deal.findById(dealId);
            deal.status = 'cancelled';
            deal.cancellationReason = reason;
            await deal.save();

            // TODO: Send notifications
            // await notificationService.create(payment.brandId, 'PAYMENT_REFUNDED', { refundAmount: payment.totalAmount });

            return payment;
        } catch (error) {
            console.error('Refund payment error:', error);
            throw error;
        }
    }

    /**
     * Get payment details for a deal
     * @param {String} dealId - Deal ID
     * @returns {Object} - Payment details
     */
    async getPaymentByDeal(dealId) {
        try {
            const payment = await Payment.findOne({ dealId })
                .populate('brandId', 'email role')
                .populate('influencerId', 'email role')
                .populate('dealId');

            return payment;
        } catch (error) {
            console.error('Get payment error:', error);
            throw error;
        }
    }

    /**
     * Get all payments for a user (brand or influencer)
     * @param {String} userId - User ID
     * @param {String} role - User role
     * @returns {Array} - List of payments
     */
    async getUserPayments(userId, role) {
        try {
            const filter = role === 'brand' 
                ? { brandId: userId }
                : { influencerId: userId };

            const payments = await Payment.find(filter)
                .populate('dealId')
                .populate('campaignId', 'title')
                .sort({ createdAt: -1 });

            return payments;
        } catch (error) {
            console.error('Get user payments error:', error);
            throw error;
        }
    }

    /**
     * Get platform revenue statistics
     * @returns {Object} - Revenue statistics
     */
    async getPlatformStats() {
        try {
            const stats = await Payment.aggregate([
                {
                    $group: {
                        _id: '$paymentStatus',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$totalAmount' },
                        totalPlatformFee: { $sum: '$platformFee' }
                    }
                }
            ]);

            return stats;
        } catch (error) {
            console.error('Get platform stats error:', error);
            throw error;
        }
    }
}

module.exports = new PaymentService();
