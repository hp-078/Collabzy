import api from './api';

const paymentService = {
  // Escrow API (server-side simulated escrow)
  createEscrow: async ({ influencerId, campaignId, applicationId, amount, externalRef }) => {
    const resp = await api.post('/payments/escrow', { influencerId, campaignId, applicationId, amount, externalRef });
    return resp.data;
  },

  releaseEscrow: async ({ transactionId }) => {
    const resp = await api.post('/payments/release', { transactionId });
    return resp.data;
  },

  // Razorpay / deal payment helpers
  createPaymentOrder: async (dealId, amount) => {
    const response = await api.post('/payments/create-order', { dealId, amount });
    return response.data;
  },

  createBulkPaymentOrder: async (dealIds) => {
    const response = await api.post('/payments/create-bulk-order', { dealIds });
    return response.data;
  },

  verifyPayment: async (paymentData) => {
    const response = await api.post('/payments/verify', paymentData);
    return response.data;
  },

  verifyBulkPayment: async (paymentData) => {
    const response = await api.post('/payments/verify-bulk', paymentData);
    return response.data;
  },

  getPaymentByDeal: async (dealId) => {
    const response = await api.get(`/payments/deal/${dealId}`);
    return response.data;
  },

  getMyPayments: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    const response = await api.get(`/payments/my-payments?${params.toString()}`);
    return response.data;
  },

  getAdminWalletOverview: async () => {
    const response = await api.get('/payments/admin/overview');
    return response.data;
  },

  getMyWallet: async () => {
    const response = await api.get('/wallets/me');
    return response.data;
  },

  getAllWallets: async () => {
    const response = await api.get('/wallets/all');
    return response.data;
  },

  releasePayment: async (dealId) => {
    const response = await api.patch(`/payments/release/${dealId}`);
    return response.data;
  },

  initiateRazorpayCheckout: (orderData, onSuccess, onFailure) => {
    if (!window.Razorpay) {
      console.error('Razorpay SDK not loaded');
      onFailure(new Error('Payment gateway not loaded. Please refresh the page.'));
      return;
    }

    const options = {
      key: orderData.key,
      amount: orderData.amount * 100,
      currency: orderData.currency || 'INR',
      name: 'Collabzy',
      description: 'Campaign Collaboration Payment',
      order_id: orderData.orderId,
      handler: function (response) {
        onSuccess({
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature
        });
      },
      prefill: {
        name: orderData.brandName || '',
        email: orderData.brandEmail || ''
      },
      theme: { color: '#6366f1' },
      modal: { ondismiss: function () { onFailure(new Error('Payment cancelled by user')); } }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', function (response) {
      onFailure(new Error(response.error.description || 'Payment failed'));
    });
    razorpay.open();
  },

  loadRazorpayScript: () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
      document.body.appendChild(script);
    });
  }
};

export default paymentService;
