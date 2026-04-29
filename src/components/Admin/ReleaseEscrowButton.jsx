import React, { useState } from 'react';
import paymentService from '../../services/payment.service';
import toast from 'react-hot-toast';

/**
 * ReleaseEscrowButton - releases payment to influencer for a completed deal.
 * @param {string} dealId - The deal ID to release payment for.
 * @param {function} onReleased - Callback after successful release.
 */
export default function ReleaseEscrowButton({ dealId, onReleased }) {
  const [loading, setLoading] = useState(false);

  const handleRelease = async () => {
    if (!dealId) {
      toast.error('Invalid deal ID');
      return;
    }
    setLoading(true);
    try {
      const res = await paymentService.releasePayment(dealId);
      if (res.success) {
        toast.success('✅ Payment released to influencer!');
        if (onReleased) onReleased(res.data);
      } else {
        toast.error(res.message || 'Release failed');
      }
    } catch (err) {
      console.error('Release error:', err);
      toast.error(err?.response?.data?.message || err.message || 'Release failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className="inf-act-accept" onClick={handleRelease} disabled={loading}>
      {loading ? 'Releasing…' : 'Release Payment'}
    </button>
  );
}
