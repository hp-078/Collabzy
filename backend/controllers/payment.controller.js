const Deal = require('../models/Deal.model');
const paymentService = require('../services/payment.service');
const { createNotificationFromTemplate } = require('../services/notification.service');

exports.createEscrow = async (req, res) => {
  try {
    const brandId = req.user._id;
    const { influencerId, campaignId, applicationId, dealId, amount, externalRef } = req.body;

    if (!influencerId || !campaignId || !applicationId || !amount) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const tx = await paymentService.createEscrow({
      brandId,
      influencerId,
      campaignId,
      applicationId,
      dealId,
      amount,
      externalRef
    });

    return res.json({ success: true, message: 'Escrow created', data: tx });
  } catch (err) {
    console.error('Create escrow error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to create escrow' });
  }
};

exports.releaseEscrow = async (req, res) => {
  try {
    const { transactionId } = req.body;
    if (!transactionId) {
      return res.status(400).json({ success: false, message: 'transactionId required' });
    }

    const tx = await paymentService.releaseEscrow({ transactionId });
    return res.json({ success: true, message: 'Escrow released', data: tx });
  } catch (err) {
    console.error('Release escrow error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to release escrow' });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { dealId, amount } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (!dealId || !amount) {
      return res.status(400).json({ success: false, message: 'Deal ID and amount are required' });
    }

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ success: false, message: 'Deal not found' });
    }

    if (userRole !== 'brand' || deal.brand.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only the brand can create payment for this deal' });
    }

    const order = await paymentService.createOrder(deal, amount);
    return res.json({ success: true, message: 'Payment order created', data: order });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create payment order' });
  }
};

exports.createBulkOrder = async (req, res) => {
  try {
    const { dealIds } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (!Array.isArray(dealIds) || dealIds.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one deal ID is required' });
    }

    if (userRole !== 'brand') {
      return res.status(403).json({ success: false, message: 'Only brands can create bulk payment orders' });
    }

    const uniqueDealIds = [...new Set(dealIds.map((id) => String(id)))];
    const deals = await Deal.find({ _id: { $in: uniqueDealIds } });

    if (deals.length !== uniqueDealIds.length) {
      return res.status(404).json({ success: false, message: 'One or more deals not found' });
    }

    for (const deal of deals) {
      if (deal.brand.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized for one or more selected deals' });
      }
      if (deal.status !== 'pending_payment') {
        return res.status(400).json({ success: false, message: 'All selected deals must be pending payment' });
      }
    }

    const payments = await Promise.all(uniqueDealIds.map((dealId) => paymentService.getPaymentByDeal(dealId)));

    if (payments.some((payment) => !payment)) {
      return res.status(404).json({ success: false, message: 'Payment record not found for one or more selected deals' });
    }

    if (payments.some((payment) => payment.paymentStatus !== 'pending')) {
      return res.status(400).json({ success: false, message: 'All selected payments must be in pending status' });
    }

    const order = await paymentService.createBulkOrder({ deals, payments, brandId: userId });
    return res.json({ success: true, message: 'Bulk payment order created', data: order });
  } catch (error) {
    console.error('Create bulk order error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create bulk payment order' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature, dealId } = req.body;
    const userId = req.user._id;

    if (!orderId || !paymentId || !signature || !dealId) {
      return res.status(400).json({ success: false, message: 'Order ID, payment ID, signature, and deal ID are required' });
    }

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ success: false, message: 'Deal not found' });
    }

    if (deal.brand.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const result = await paymentService.verifyAndEscrow(orderId, paymentId, signature);

    // Notify influencer that payment is secured and deal is active
    try {
      await createNotificationFromTemplate(deal.influencer, 'DEAL_STARTED', {
        campaignTitle: deal.campaign?.title || 'Campaign',
        dealId: deal._id
      }, { relatedId: deal._id, relatedType: 'deal' });
    } catch (notifErr) {
      console.error('Notification error (non-fatal):', notifErr);
    }

    return res.json({
      success: true,
      message: 'Payment verified and held in escrow',
      data: {
        payment: result.payment,
        deal: result.deal,
        transaction: result.transaction
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Payment verification failed' });
  }
};

exports.verifyBulkPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature, dealIds } = req.body;
    const userId = req.user._id;

    if (!orderId || !paymentId || !signature || !Array.isArray(dealIds) || dealIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Order ID, payment ID, signature, and deal IDs are required' });
    }

    const result = await paymentService.verifyAndEscrowBulk({
      orderId,
      paymentId,
      signature,
      dealIds: [...new Set(dealIds.map((id) => String(id)))],
      brandId: userId
    });

    try {
      const processedDealIds = result?.processed?.map((item) => item.dealId) || [];
      const processedDeals = await Deal.find({ _id: { $in: processedDealIds } }).populate('campaign', 'title');

      await Promise.all(processedDeals.map((deal) => createNotificationFromTemplate(
        deal.influencer,
        'DEAL_STARTED',
        {
          campaignTitle: deal.campaign?.title || 'Campaign',
          dealId: deal._id
        },
        { relatedId: deal._id, relatedType: 'deal' }
      )));
    } catch (notifErr) {
      console.error('Bulk notification error (non-fatal):', notifErr);
    }

    return res.json({
      success: true,
      message: 'Bulk payment verified and held in escrow',
      data: result
    });
  } catch (error) {
    console.error('Verify bulk payment error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Bulk payment verification failed' });
  }
};

exports.getPaymentByDeal = async (req, res) => {
  try {
    const { dealId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ success: false, message: 'Deal not found' });
    }

    const isAuthorized = deal.brand.toString() === userId.toString() ||
      deal.influencer.toString() === userId.toString() ||
      userRole === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this payment' });
    }

    const payment = await paymentService.getPaymentByDeal(dealId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

        // Include public Razorpay key and basic order info so frontend can initiate checkout
        return res.json({
            success: true,
            data: {
                payment,
                orderId: payment.razorpayOrderId,
                amount: payment.totalAmount,
                currency: payment.currency,
                key: process.env.RAZORPAY_KEY_ID || null
            }
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
 * Release payment to influencer.
 * - Brand can release for their own completed deal.
 * - Admin can release any completed deal.
 */
exports.releasePayment = async (req, res) => {
  try {
    const { dealId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const deal = await Deal.findById(dealId)
      .populate('campaign', 'title')
      .populate('influencer', 'name email');

    if (!deal) {
      return res.status(404).json({ success: false, message: 'Deal not found' });
    }

    // Brand can release their own deal; admin can release any deal
    const isAuthorized =
      (userRole === 'brand' && deal.brand.toString() === userId.toString()) ||
      userRole === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to release payment' });
    }

    if (deal.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: `Deal must be completed before releasing payment. Current status: "${deal.status}"`
      });
    }

    const payment = await paymentService.releasePayment(dealId);

    // Notify influencer that payment has been sent
    try {
      const releasedBy = userRole === 'admin' ? 'Admin' : 'Brand';
      await createNotificationFromTemplate(deal.influencer._id || deal.influencer, 'PAYMENT_RELEASED', {
        campaignTitle: deal.campaign?.title || 'Campaign',
        amount: payment.influencerAmount,
        dealId: deal._id,
        releasedBy
      }, { relatedId: deal._id, relatedType: 'deal' });
    } catch (notifErr) {
      console.error('Notification error (non-fatal):', notifErr);
    }

    return res.json({
      success: true,
      message: 'Payment released to influencer wallet successfully',
      data: payment
    });
  } catch (error) {
    console.error('Release payment error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to release payment' });
  }
};

exports.refundPayment = async (req, res) => {
  try {
    const { dealId } = req.params;
    const { reason } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can issue refunds' });
    }

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Refund reason is required' });
    }

    const payment = await paymentService.refundPayment(dealId, reason);

    // Notify brand about refund
    try {
      const deal = await Deal.findById(dealId).populate('campaign', 'title');
      if (deal) {
        await createNotificationFromTemplate(deal.brand, 'PAYMENT_REFUNDED', {
          campaignTitle: deal.campaign?.title || 'Campaign',
          amount: payment.refundAmount,
          reason,
          dealId: deal._id
        }, { relatedId: deal._id, relatedType: 'deal' });
      }
    } catch (notifErr) {
      console.error('Notification error (non-fatal):', notifErr);
    }

    return res.json({ success: true, message: 'Payment refunded to brand', data: payment });
  } catch (error) {
    console.error('Refund payment error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to refund payment' });
  }
};

exports.getMyPayments = async (req, res) => {
  try {
    const payments = await paymentService.getUserPayments(req.user._id, req.user.role);
    return res.json({ success: true, data: payments });
  } catch (error) {
    console.error('Get my payments error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch payments' });
  }
};

exports.getPlatformStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const stats = await paymentService.getPlatformStats();
    return res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get platform stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

exports.getAdminWalletOverview = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const data = await paymentService.getAdminWalletOverview();
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Get admin wallet overview error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch wallet overview' });
  }
};

exports.handleWebhook = async (req, res) => paymentService.handleWebhook(req, res);
