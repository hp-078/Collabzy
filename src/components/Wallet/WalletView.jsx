import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export default function WalletView() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await api.get('/wallets/me');
        setWallet(res.data.data);
      } catch (err) {
        console.error('Wallet fetch error', err);
        toast.error('Failed to load wallet');
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, []);

  if (loading) return <div>Loading wallet…</div>;

  const balance = wallet?.balance || 0;
  const ledger = wallet?.ledger || [];

  return (
    <div className="card">
      <h3>My Wallet</h3>
      <p>
        <strong>Balance:</strong>{' '}
        <span style={{ color: balance > 0 ? '#1f7a48' : 'inherit', fontWeight: 700 }}>
          {formatCurrency(balance)}
        </span>
        <span style={{ color: '#888', fontSize: '0.8em', marginLeft: '0.4rem' }}>INR</span>
      </p>
      <div>
        <h4>Transaction History</h4>
        {ledger.length ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {[...ledger].reverse().map((l, i) => (
              <li key={l._id || i} style={{
                padding: '0.6rem 0',
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#888' }}>
                    {new Date(l.createdAt).toLocaleString('en-IN')}
                  </div>
                  {l.note && (
                    <div style={{ fontSize: '0.9rem', color: '#555', marginTop: '0.2rem' }}>
                      {l.note}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontWeight: 700,
                    color: (l.delta || 0) >= 0 ? '#1f7a48' : '#c0392b'
                  }}>
                    {(l.delta || 0) >= 0 ? '+' : ''}{formatCurrency(l.delta)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#888' }}>
                    Balance: {formatCurrency(l.balanceAfter)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ color: '#888', fontSize: '0.9rem', padding: '0.5rem 0' }}>
            No transactions yet
          </div>
        )}
      </div>
    </div>
  );
}
