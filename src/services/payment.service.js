import api from './api';

const paymentService = {
  /**
   * Create payment order for a deal (Brand only)
   * @param {string} dealId - Deal ID
   * @param {number} amount - Payment amount
   * @returns {Promise} Order details with Razorpay order_id
   */
  createPaymentOrder: async (dealId, amount) => {
    const response = await api.post('/payments/create-order', {
      dealId,
      amount
    });
    return response.data;
  },

  /**
   * Verify payment after successful Razorpay checkout
   * @param {Object} paymentData - Payment verification data
   * @param {string} paymentData.orderId - Razorpay order ID
   * @param {string} paymentData.paymentId - Razorpay payment ID
   * @param {string} paymentData.signature - Razorpay signature
   * @param {string} paymentData.dealId - Deal ID
   * @returns {Promise} Verification result
   */
  verifyPayment: async (paymentData) => {
    const response = await api.post('/payments/verify', paymentData);
    return response.data;
  },

  /**
   * Get payment details for a specific deal
   * @param {string} dealId - Deal ID
   * @returns {Promise} Payment details
   */
  getPaymentByDeal: async (dealId) => {
    const response = await api.get(`/payments/deal/${dealId}`);
    return response.data;
  },

  /**
   * Get payment history for current user
   * @param {Object} filters - Filter options
   * @param {string} filters.status - Payment status filter
   * @param {number} filters.page - Page number
   * @param {number} filters.limit - Items per page
   * @returns {Promise} Payment history
   */
  getMyPayments: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await api.get(`/payments/my-payments?${params.toString()}`);
    return response.data;
  },

  /**
   * Release payment to influencer after deal completion (Brand or Admin)
   * @param {string} dealId - Deal ID
   * @returns {Promise} Updated payment
   */
  releasePayment: async (dealId) => {
    const response = await api.patch(`/payments/release/${dealId}`);
    return response.data;
  },

  /**
   * Initiate Razorpay checkout
   * @param {Object} orderData - Order details from backend
   * @param {Function} onSuccess - Success callback
   * @param {Function} onFailure - Failure callback
   */
  initiateRazorpayCheckout: (orderData, onSuccess, onFailure) => {
    // Check if Razorpay is loaded
    if (!window.Razorpay) {
      console.error('Razorpay SDK not loaded');
      onFailure(new Error('Payment gateway not loaded. Please refresh the page.'));
      return;
    }

    const options = {
      key: orderData.key, // Razorpay key from backend
      amount: orderData.amount * 100, // Amount in paise
      currency: orderData.currency || 'INR',
      name: 'Collabzy',
      description: 'Campaign Collaboration Payment',
      order_id: orderData.orderId,
      handler: function (response) {
        // Payment successful
        onSuccess({
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature
        });
      },
      prefill: {
        name: orderData.brandName || '',
        email: orderData.brandEmail || '',
      },
      theme: {
        color: '#6366f1' // Indigo color from theme
      },
      modal: {
        ondismiss: function() {
          onFailure(new Error('Payment cancelled by user'));
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', function (response) {
      onFailure(new Error(response.error.description || 'Payment failed'));
    });
    razorpay.open();
  },

  /**
   * Load Razorpay script dynamically
   * @returns {Promise} Resolves when script is loaded
   */
  loadRazorpayScript: () => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.Razorpay) {
        resolve(true);
        return;
      }

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
