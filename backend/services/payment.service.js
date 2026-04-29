const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const Payment = require('../models/Payment.model');
const PaymentTransaction = require('../models/PaymentTransaction.model');
const Deal = require('../models/Deal.model');
const walletService = require('./wallet.service');

class PaymentService {
  constructor() {
    this.razorpay = null;
    this.platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE) || 10;

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

  isConfigured() {
    return this.razorpay !== null;
  }

  ensureConfigured() {
    if (!this.isConfigured()) {
      throw new Error('Payment gateway not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_SECRET in environment variables.');
    }
  }

  async createOrder(deal, amount) {
    try {
      this.ensureConfigured();

      const totalAmount = Math.round(amount * 100); // in paise
      const platformFee = Math.round(totalAmount * (this.platformFeePercentage / 100));
      const influencerAmount = totalAmount - platformFee;

      const orderOptions = {
        amount: totalAmount,
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

      const payment = await Payment.create({
        dealId: deal._id,
        brandId: deal.brand,
        influencerId: deal.influencer,
        applicationId: deal.application,
        campaignId: deal.campaign,
        totalAmount: amount,
        platformFeePercentage: this.platformFeePercentage,
        platformFee: platformFee / 100,
        influencerAmount: influencerAmount / 100,
        razorpayOrderId: razorpayOrder.id,
        paymentStatus: 'pending',
        currency: 'INR',
        receiptNumber: razorpayOrder.receipt
      });

      deal.paymentId = payment._id;
      deal.status = 'pending_payment';
      deal.paymentStatus = 'pending';
      await deal.save();

      return {
        orderId: razorpayOrder.id,
        amount,
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID,
        payment
      };
    } catch (error) {
      console.error('Create order error:', error);
      throw new Error(error.message || 'Failed to create payment order');
    }
  }

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

  async _recordPaymentStatus(payment, newStatus, note, session = null) {
    payment.statusHistory = payment.statusHistory || [];
    payment.statusHistory.push({
      status: payment.paymentStatus,
      timestamp: new Date(),
      note
    });
    payment.paymentStatus = newStatus;
    if (newStatus === 'paid') payment.paidAt = new Date();
    if (newStatus === 'released') payment.releasedAt = new Date();
    if (newStatus === 'refunded') payment.refundedAt = new Date();
    if (session) {
      await payment.save({ session });
    } else {
      await payment.save();
    }
  }

  /**
   * Create escrow: brand pays → full amount credited to admin wallet (held).
   * The split between platform fee and influencer amount happens at release time.
   */
  async createEscrowTransaction({ brandId, influencerId, campaignId, applicationId, dealId, amount, externalRef = null, paymentId = null }, session = null) {
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    const adminId = await walletService.getAdminUserId();
    if (!adminId) {
      throw new Error('Admin account not configured. Please ensure an admin user exists.');
    }

    const tx = await PaymentTransaction.create([
      {
        type: 'escrow',
        status: 'held',
        amount,
        currency: 'INR',
        from: brandId,
        to: influencerId,
        admin: adminId,
        deal: dealId || null,
        campaign: campaignId,
        application: applicationId,
        meta: { paymentId, platformFeePercentage: this.platformFeePercentage },
        externalRef
      }
    ], { session });

    const txDoc = tx[0];
    // Amount is held in escrow logic, no admin wallet transaction here
    return txDoc;
  }

  async createEscrow(payload) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const tx = await this.createEscrowTransaction(payload, session);
      await session.commitTransaction();
      return tx;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * verifyAndEscrow: called after Razorpay payment.
   * Verifies signature → puts full amount in admin escrow wallet → sets payment to 'escrow'.
   */
  async verifyAndEscrow(orderId, paymentId, signature) {
    const isValid = this.verifyPaymentSignature(orderId, paymentId, signature);
    if (!isValid) {
      throw new Error('Invalid payment signature');
    }

    const payment = await Payment.findOne({ razorpayOrderId: orderId });
    if (!payment) {
      throw new Error('Payment record not found');
    }

    if (payment.paymentStatus === 'escrow' || payment.paymentStatus === 'released') {
      throw new Error('Payment already processed');
    }

    if (payment.paymentStatus !== 'pending') {
      throw new Error(`Cannot process payment with status: ${payment.paymentStatus}`);
    }

    const deal = await Deal.findById(payment.dealId);
    if (!deal) {
      throw new Error('Deal not found');
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      payment.razorpayPaymentId = paymentId;
      payment.razorpaySignature = signature;
      // Mark as paid first
      await this._recordPaymentStatus(payment, 'paid', 'Razorpay payment received', session);

      // Create escrow transaction — full totalAmount credited to admin
      const transaction = await this.createEscrowTransaction({
        brandId: payment.brandId,
        influencerId: payment.influencerId,
        campaignId: payment.campaignId,
        applicationId: payment.applicationId,
        dealId: payment.dealId,
        amount: payment.totalAmount,
        paymentId: payment._id,
        externalRef: orderId
      }, session);

      // Now mark as escrow (funds are held in admin wallet)
      await this._recordPaymentStatus(payment, 'escrow', 'Funds held in escrow until deal completion', session);

      // Activate the deal
      deal.status = 'active';
      deal.paymentStatus = 'paid';
      deal.paidAt = new Date();
      await deal.save({ session });

      await session.commitTransaction();
      return { payment, deal, transaction };
    } catch (error) {
      await session.abortTransaction();
      console.error('verifyAndEscrow error:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * releaseEscrowTransaction: admin wallet debit, then:
   * - influencerAmount → influencer wallet
   * - platformFee stays in admin wallet (already there)
   */
  async releaseEscrowTransaction(transactionId, session = null) {
    const tx = await PaymentTransaction.findById(transactionId).session(session);
    if (!tx) {
      throw new Error('Transaction not found');
    }
    if (tx.status !== 'held') {
      throw new Error(`Transaction already processed (status: ${tx.status})`);
    }

    // Find the associated payment to get influencerAmount and platformFee split
    const paymentDoc = tx.meta?.paymentId
      ? await Payment.findById(tx.meta.paymentId).session(session)
      : null;

    const influencerAmount = paymentDoc ? paymentDoc.influencerAmount : tx.amount;
    const platformFee = paymentDoc ? paymentDoc.platformFee : 0;

    // Escrow split happens here directly
    // Credit influencer's share to influencer wallet
    await walletService.creditWallet(tx.to, influencerAmount, tx._id, session, `Payment received for completed deal`);
    
    // Credit platform fee as platform revenue to admin wallet
    if (platformFee > 0) {
      await walletService.creditWallet(tx.admin, platformFee, tx._id, session, `Platform fee (${paymentDoc?.platformFeePercentage || 10}%) retained`);
    }

    tx.status = 'released';
    tx.type = 'release';
    await tx.save({ session });

    return tx;
  }

  async releaseEscrow({ transactionId }) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const tx = await this.releaseEscrowTransaction(transactionId, session);

      if (tx.meta?.paymentId) {
        const payment = await Payment.findById(tx.meta.paymentId).session(session);
        if (payment && payment.paymentStatus === 'escrow') {
          await this._recordPaymentStatus(payment, 'released', 'Payment released to influencer by admin', session);
          payment.payoutId = `payout_${Date.now()}`;
          payment.payoutStatus = 'completed';
          await payment.save({ session });
        }
      }

      await session.commitTransaction();
      return tx;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * releasePayment: called when admin/brand releases payment after deal completion.
   * Finds the held PaymentTransaction for the deal, releases it.
   */
  async releasePayment(dealId) {
    const payment = await Payment.findOne({ dealId });
    if (!payment) {
      throw new Error('Payment not found for this deal');
    }

    if (payment.paymentStatus === 'released') {
      throw new Error('Payment has already been released');
    }

    if (payment.paymentStatus !== 'escrow') {
      throw new Error(`Cannot release payment in status: "${payment.paymentStatus}". Payment must be in escrow.`);
    }

    const deal = await Deal.findById(dealId);
    if (!deal) {
      throw new Error('Deal not found');
    }

    if (deal.status !== 'completed') {
      throw new Error('Deal must be completed before releasing payment');
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Find the held transaction for this payment
      const tx = await PaymentTransaction.findOne({
        $or: [
          { 'meta.paymentId': payment._id, status: 'held' },
          { deal: dealId, status: 'held' }
        ]
      }).session(session);

      if (tx) {
        // Use the standard release path which handles the split properly
        await this.releaseEscrowTransaction(tx._id, session);
      } else {
        // Fallback: no transaction record — do the wallet split manually
        console.warn(`No held PaymentTransaction found for deal ${dealId}, using fallback release`);
        const adminId = await walletService.getAdminUserId();
        if (!adminId) throw new Error('Admin account not found');

        // Credit influencer and admin (platform revenue) directly
        await walletService.creditWallet(payment.influencerId, payment.influencerAmount, payment._id, session, `Payment received for completed deal`);
        if (payment.platformFee > 0) {
          await walletService.creditWallet(adminId, payment.platformFee, payment._id, session, `Platform fee retained`);
        }
      }

      // Update payment record
      await this._recordPaymentStatus(payment, 'released', 'Payment released to influencer', session);
      payment.payoutId = `payout_${Date.now()}`;
      payment.payoutStatus = 'completed';
      await payment.save({ session });

      await session.commitTransaction();
      return payment;
    } catch (error) {
      await session.abortTransaction();
      console.error('releasePayment error:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async refundPayment(dealId, reason = '') {
    const payment = await Payment.findOne({ dealId });
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (!['paid', 'escrow'].includes(payment.paymentStatus)) {
      throw new Error(`Cannot refund payment in status: ${payment.paymentStatus}`);
    }

    const deal = await Deal.findById(dealId);
    if (!deal) {
      throw new Error('Deal not found');
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Find held transaction
      const tx = await PaymentTransaction.findOne({
        $or: [
          { 'meta.paymentId': payment._id, status: 'held' },
          { deal: dealId, status: 'held' }
        ]
      }).session(session);

      if (tx) {
        // NOTE: Actual Razorpay refund would happen via razorpay.payments.refund() in production
        // No admin wallet debit is necessary because funds were not deposited into it during escrow.
        tx.status = 'refunded';
        tx.type = 'refund';
        await tx.save({ session });
      }

      payment.refundReason = reason;
      payment.refundAmount = payment.totalAmount;
      payment.refundId = `refund_manual_${Date.now()}`;
      await this._recordPaymentStatus(payment, 'refunded', `Refund issued: ${reason}`, session);

      deal.status = 'cancelled';
      deal.cancellationReason = reason;
      deal.cancelledAt = new Date();
      await deal.save({ session });

      await session.commitTransaction();
      return payment;
    } catch (error) {
      await session.abortTransaction();
      console.error('refundPayment error:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getPaymentByDeal(dealId) {
    return Payment.findOne({ dealId })
      .populate('brandId', 'email role name')
      .populate('influencerId', 'email role name')
      .populate('dealId');
  }

  async getUserPayments(userId, role) {
    const filter = role === 'brand' ? { brandId: userId } : { influencerId: userId };
    return Payment.find(filter)
      .populate('dealId')
      .populate('campaignId', 'title')
      .sort({ createdAt: -1 });
  }

  async getPlatformStats() {
    const [byStatus, totals] = await Promise.all([
      Payment.aggregate([
        {
          $group: {
            _id: '$paymentStatus',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
            totalPlatformFee: { $sum: '$platformFee' }
          }
        }
      ]),
      Payment.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$platformFee' },
            totalTransactions: { $sum: 1 },
            totalVolume: { $sum: '$totalAmount' },
            totalInfluencerPayouts: { $sum: '$influencerAmount' }
          }
        }
      ])
    ]);

    return {
      byStatus,
      totals: totals[0] || { totalRevenue: 0, totalTransactions: 0, totalVolume: 0, totalInfluencerPayouts: 0 }
    };
  }

  async getAdminWalletOverview() {
    const now = new Date();
    const overdueThreshold = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    const payments = await Payment.find({})
      .populate('brandId', 'name email role')
      .populate('influencerId', 'name email role')
      .populate('campaignId', 'title status')
      .populate('dealId', 'status completedAt deadline agreedRate paymentStatus paidAt')
      .sort({ createdAt: -1 });

    // Payments that are currently held in escrow (need to be released)
    const escrowPayments = payments.filter(p => p.paymentStatus === 'escrow');

    // Completed payments already released to influencers
    const completedPayments = payments.filter(p => p.paymentStatus === 'released');

    // Refunded payments
    const refundedPayments = payments.filter(p => p.paymentStatus === 'refunded');

    // Overdue: deal is completed, payment still in escrow, and it's been > 7 days
    const duePayments = escrowPayments.filter(payment => {
      const deal = payment.dealId;
      if (!deal) return false;
      if (deal.status !== 'completed') return false;
      const completedAt = deal.completedAt || payment.paidAt;
      return completedAt && new Date(completedAt) <= overdueThreshold;
    });

    // Escrow payments where deal is completed (ready to release, including overdue)
    const readyToRelease = escrowPayments.filter(payment => {
      const deal = payment.dealId;
      return deal && deal.status === 'completed';
    });

    // Escrow payments where deal is still active (not yet completed)
    const activeEscrow = escrowPayments.filter(payment => {
      const deal = payment.dealId;
      return !deal || deal.status !== 'completed';
    });

    // Financial summary
    const totalEscrowed = escrowPayments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const totalReleased = completedPayments.reduce((sum, p) => sum + (p.influencerAmount || 0), 0);
    const totalPlatformRevenue = completedPayments.reduce((sum, p) => sum + (p.platformFee || 0), 0);

    return {
      totalPayments: payments.length,
      // For the admin UI: "pending" means in escrow (active deals, not yet completed)
      pendingPayments: activeEscrow,
      // Ready to release: escrow + deal completed
      readyToReleasePayments: readyToRelease,
      completedPayments,
      refundedPayments,
      duePayments,
      overview: {
        escrow: escrowPayments.length,
        readyToRelease: readyToRelease.length,
        completed: completedPayments.length,
        refunded: refundedPayments.length,
        due: duePayments.length,
        totalEscrowed,
        totalReleased,
        totalPlatformRevenue
      }
    };
  }

  async handleWebhook(req, res) {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      const signature = req.headers['x-razorpay-signature'];

      if (!webhookSecret) {
        return res.json({ success: true });
      }

      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== expectedSignature) {
        return res.status(401).json({ success: false, message: 'Invalid signature' });
      }

      return res.json({ success: true });
    } catch (error) {
      console.error('Webhook error:', error);
      return res.status(500).json({ success: false, message: 'Webhook processing failed' });
    }
  }
}

module.exports = new PaymentService();
