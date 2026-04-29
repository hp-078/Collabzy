import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CheckCircle, Clock, IndianRupee, Loader,
  RefreshCw, TimerReset, Wallet2, AlertTriangle, Shield,
  TrendingUp, XCircle, Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import paymentService from '../../services/payment.service';
import './WalletsPage.css';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const WalletStatCard = ({ label, value, sub, icon: Icon, gradient }) => (
  <article className={`wallet-stat-card wallet-gradient-${gradient}`}>
    <div className="wallet-stat-icon"><Icon size={22} /></div>
    <div className="wallet-stat-copy">
      <span>{label}</span>
      <strong>{value}</strong>
      {sub ? <small>{sub}</small> : null}
    </div>
  </article>
);

const SectionHeader = ({ title, count, hint }) => (
  <div className="wallet-section-head">
    <div>
      <h3>{title}</h3>
      {hint ? <p>{hint}</p> : null}
    </div>
    <span className="wallet-pill">{count}</span>
  </div>
);

const ReleaseButton = ({ dealId, onReleased }) => {
  const [loading, setLoading] = useState(false);

  const handleRelease = async () => {
    if (!dealId) {
      toast.error('Invalid deal ID');
      return;
    }
    const confirmed = window.confirm('Are you sure you want to release this payment to the influencer?');
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await paymentService.releasePayment(dealId);
      if (res.success) {
        toast.success('✅ Payment released to influencer wallet!');
        if (onReleased) onReleased();
      } else {
        toast.error(res.message || 'Release failed');
      }
    } catch (err) {
      console.error('Release error:', err);
      toast.error(err?.response?.data?.message || err.message || 'Failed to release payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="wallet-release-btn"
      onClick={handleRelease}
      disabled={loading}
      title="Release payment to influencer"
    >
      {loading ? (
        <><Loader size={14} className="wallet-spin" /><span>Releasing…</span></>
      ) : (
        <><Shield size={14} /><span>Release to Influencer</span></>
      )}
    </button>
  );
};

const PaymentCard = ({ payment, onReleased, showReleaseButton = false, isOverdue = false }) => {
  const deal = payment.dealId || {};
  const brandName = payment.brandId?.name || payment.brandId?.email || 'Brand';
  const influencerName = payment.influencerId?.name || payment.influencerId?.email || 'Influencer';
  const completedAt = deal.completedAt || payment.releasedAt || payment.paidAt || payment.updatedAt;
  const ageDays = completedAt
    ? Math.floor((Date.now() - new Date(completedAt).getTime()) / (24 * 60 * 60 * 1000))
    : 0;

  const dealId = deal._id || (typeof payment.dealId === 'string' ? payment.dealId : null);

  return (
    <article className={`wallet-item ${isOverdue ? 'wallet-item-overdue' : ''}`}>
      <div className="wallet-item-main">
        <div className="wallet-item-top">
          <div>
            <h4>{deal?.campaign?.title || payment.campaignId?.title || 'Campaign Payment'}</h4>
            <p>{brandName} → {influencerName}</p>
          </div>
          <div className="wallet-item-badges">
            <span className={`wallet-badge wallet-badge-${payment.paymentStatus}`}>
              {payment.paymentStatus}
            </span>
            <span className={`wallet-badge wallet-badge-deal-${deal.status || 'unknown'}`}>
              Deal: {deal.status || 'unknown'}
            </span>
          </div>
        </div>

        <div className="wallet-item-grid">
          <div>
            <span>Total Amount</span>
            <strong>{formatCurrency(payment.totalAmount)}</strong>
          </div>
          <div>
            <span>Influencer Gets</span>
            <strong className="wallet-influencer-amount">{formatCurrency(payment.influencerAmount)}</strong>
          </div>
          <div>
            <span>Platform Fee ({payment.platformFeePercentage || 10}%)</span>
            <strong>{formatCurrency(payment.platformFee)}</strong>
          </div>
          <div>
            <span>Deal Status</span>
            <strong>{deal.status || 'n/a'}</strong>
          </div>
          <div>
            <span>Completed</span>
            <strong>{completedAt ? new Date(completedAt).toLocaleDateString('en-IN') : '—'}</strong>
          </div>
          <div>
            <span>Age</span>
            <strong className={isOverdue ? 'wallet-overdue-text' : ''}>
              {ageDays} day{ageDays !== 1 ? 's' : ''} {isOverdue ? '⚠️ Overdue' : ''}
            </strong>
          </div>
        </div>
      </div>

      <div className="wallet-item-actions">
        {showReleaseButton && dealId ? (
          <ReleaseButton dealId={dealId} onReleased={onReleased} />
        ) : (
          <span className="wallet-muted">
            {payment.paymentStatus === 'released' ? '✅ Released' :
              payment.paymentStatus === 'refunded' ? '↩️ Refunded' :
                deal.status !== 'completed' ? `Waiting for deal completion` : 'No action needed'}
          </span>
        )}
      </div>
    </article>
  );
};

const WalletCardList = ({ items, emptyLabel, onReleased, showReleaseButton = false, isOverdueSection = false }) => {
  if (!items || !items.length) {
    return (
      <div className="wallet-empty">
        <Wallet2 size={28} />
        <p>{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="wallet-list">
      {items.map((payment) => {
        const deal = payment.dealId || {};
        const isOverdue = isOverdueSection ||
          (deal.status === 'completed' &&
            payment.paymentStatus !== 'released' &&
            (() => {
              const completedAt = deal.completedAt || payment.paidAt;
              if (!completedAt) return false;
              const ageDays = Math.floor((Date.now() - new Date(completedAt).getTime()) / (24 * 60 * 60 * 1000));
              return ageDays > 7;
            })());

        const canRelease = showReleaseButton &&
          payment.paymentStatus === 'escrow' &&
          deal.status === 'completed';

        return (
          <PaymentCard
            key={payment._id}
            payment={payment}
            onReleased={onReleased}
            showReleaseButton={canRelease}
            isOverdue={isOverdue}
          />
        );
      })}
    </div>
  );
};

const WalletTableList = ({ items, emptyLabel }) => {
  if (!items || !items.length) {
    return (
      <div className="wallet-empty">
        <Wallet2 size={28} />
        <p>{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="wallet-table-container">
      <table className="wallet-table">
        <thead>
          <tr>
            <th>Campaign</th>
            <th>Brand & Influencer</th>
            <th>Total Amount</th>
            <th>Influencer Share</th>
            <th>Platform Fee</th>
            <th>Completed On</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((payment) => {
            const deal = payment.dealId || {};
            const brandName = payment.brandId?.name || payment.brandId?.email || 'Brand';
            const influencerName = payment.influencerId?.name || payment.influencerId?.email || 'Influencer';
            const completedAt = deal.completedAt || payment.releasedAt || payment.paidAt || payment.updatedAt;

            return (
              <tr key={payment._id}>
                <td className="wallet-table-title">
                  {deal?.campaign?.title || payment.campaignId?.title || 'Campaign Payment'}
                </td>
                <td className="wallet-table-users">
                  <div><strong>B:</strong> {brandName}</div>
                  <div><strong>I:</strong> {influencerName}</div>
                </td>
                <td className="wallet-table-amount">
                  {formatCurrency(payment.totalAmount)}
                </td>
                <td className="wallet-table-influencer-amount">
                  {formatCurrency(payment.influencerAmount)}
                </td>
                <td className="wallet-table-platform-amount">
                  {formatCurrency(payment.platformFee)}
                </td>
                <td className="wallet-table-date">
                  {completedAt ? new Date(completedAt).toLocaleDateString('en-IN') : '—'}
                </td>
                <td>
                  <span className={`wallet-badge wallet-badge-${payment.paymentStatus}`}>
                    {payment.paymentStatus}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default function WalletsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState({
    pendingPayments: [],
    readyToReleasePayments: [],
    completedPayments: [],
    refundedPayments: [],
    duePayments: [],
    overview: {
      escrow: 0,
      readyToRelease: 0,
      completed: 0,
      refunded: 0,
      due: 0,
      totalEscrowed: 0,
      totalReleased: 0,
      totalPlatformRevenue: 0
    },
    totalPayments: 0
  });

  const loadOverview = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await paymentService.getAdminWalletOverview();
      const data = res?.data || res || {};
      setOverview({
        pendingPayments: Array.isArray(data.pendingPayments) ? data.pendingPayments : [],
        readyToReleasePayments: Array.isArray(data.readyToReleasePayments) ? data.readyToReleasePayments : [],
        completedPayments: Array.isArray(data.completedPayments) ? data.completedPayments : [],
        refundedPayments: Array.isArray(data.refundedPayments) ? data.refundedPayments : [],
        duePayments: Array.isArray(data.duePayments) ? data.duePayments : [],
        overview: data.overview || {
          escrow: 0, readyToRelease: 0, completed: 0, refunded: 0, due: 0,
          totalEscrowed: 0, totalReleased: 0, totalPlatformRevenue: 0
        },
        totalPayments: data.totalPayments || 0
      });
    } catch (err) {
      console.error('Admin wallet overview error:', err);
      toast.error(err?.response?.data?.message || 'Failed to load wallet overview');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOverview(false);
  }, []);

  const handleReleased = () => {
    loadOverview(true);
  };

  const [activeTab, setActiveTab] = useState('escrow');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');

  const filterAndGroupItems = (items, dateFieldAccessor) => {
    const search = searchTerm.toLowerCase();
    const filtered = items.filter(payment => {
      const deal = payment.dealId || {};
      const brandName = (payment.brandId?.name || payment.brandId?.email || '').toLowerCase();
      const influencerName = (payment.influencerId?.name || payment.influencerId?.email || '').toLowerCase();
      const campaignTitle = (deal?.campaign?.title || payment.campaignId?.title || '').toLowerCase();

      return !searchTerm || brandName.includes(search) || influencerName.includes(search) || campaignTitle.includes(search);
    });

    const groups = {};
    filtered.forEach(payment => {
      const deal = payment.dealId || {};
      const dateVal = dateFieldAccessor(payment, deal);
      let monthStr = 'Unknown';
      if (dateVal) {
        const d = new Date(dateVal);
        monthStr = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      }

      if (selectedMonth !== 'all' && monthStr !== selectedMonth) return;

      if (!groups[monthStr]) groups[monthStr] = [];
      groups[monthStr].push(payment);
    });

    // Sort months descending
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === 'Unknown') return 1;
      if (b === 'Unknown') return -1;
      return new Date(b) - new Date(a);
    });

    return { groups, sortedKeys };
  };

  const availableMonths = useMemo(() => {
    const months = new Set();
    const addMonths = (items, dateFieldAccessor) => {
      items.forEach(payment => {
        const deal = payment.dealId || {};
        const dateVal = dateFieldAccessor(payment, deal);
        if (dateVal) {
          const d = new Date(dateVal);
          months.add(d.toLocaleString('default', { month: 'long', year: 'numeric' }));
        }
      });
    };
    if (activeTab === 'escrow') addMonths(overview.pendingPayments, (p, d) => d.paidAt || p.updatedAt);
    if (activeTab === 'completed') addMonths(overview.completedPayments, (p, d) => d.completedAt || p.releasedAt || p.paidAt || p.updatedAt);
    return Array.from(months).sort((a, b) => new Date(b) - new Date(a));
  }, [overview, activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchTerm('');
    setSelectedMonth('all');
  };

  const ov = overview.overview;

  const stats = useMemo(() => ([
    {
      label: 'In Escrow (Active Deals)',
      value: formatCurrency(ov.totalEscrowed),
      sub: `${ov.escrow} payment${ov.escrow !== 1 ? 's' : ''} held`,
      icon: Clock,
      gradient: 'peach'
    },
    {
      label: 'Ready to Release',
      value: ov.readyToRelease,
      sub: 'Deals completed — awaiting release',
      icon: Shield,
      gradient: 'sky'
    },
    {
      label: 'Released to Influencers',
      value: formatCurrency(ov.totalReleased),
      sub: `${ov.completed} payment${ov.completed !== 1 ? 's' : ''} completed`,
      icon: CheckCircle,
      gradient: 'mint'
    },
    {
      label: 'Platform Revenue',
      value: formatCurrency(ov.totalPlatformRevenue),
      sub: 'Retained platform fees',
      icon: TrendingUp,
      gradient: 'lavender'
    },
    {
      label: 'Overdue (>7 Days)',
      value: ov.due,
      sub: 'Needs immediate attention',
      icon: TimerReset,
      gradient: ov.due > 0 ? 'peach' : 'sky'
    },
    {
      label: 'Total Records',
      value: overview.totalPayments,
      sub: 'All tracked payments',
      icon: IndianRupee,
      gradient: 'lavender'
    }
  ]), [overview, ov]);

  if (loading) {
    return (
      <div className="wallet-page">
        <div className="wallet-loading">
          <Loader size={36} className="wallet-spin" />
          <p>Loading wallet management…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-page">
      <div className="wallet-container">
        <header className="wallet-hero">
          <div>
            <div className="wallet-hero-kicker">Admin Escrow</div>
            <h1>Wallet Management</h1>
            <p>
              Track held payments, release funds to influencers, and monitor platform revenue.
              Payments are held in escrow until a deal is marked completed.
            </p>
          </div>
          <div className="wallet-hero-actions">
            <button className="wallet-refresh-btn" onClick={() => loadOverview(true)} disabled={refreshing}>
              <RefreshCw size={16} className={refreshing ? 'wallet-spin' : ''} />
              <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
            </button>
          </div>
        </header>

        <section className="wallet-stats-grid">
          {stats.map((stat) => (
            <WalletStatCard key={stat.label} {...stat} />
          ))}
        </section>

        {/* Tab Navigation */}
        <div className="collab-tabs" style={{ marginBottom: '2rem', marginTop: '1rem' }}>
          {ov.readyToRelease > 0 && (
            <button
              className={`collab-tab ${activeTab === 'ready' ? 'active' : ''}`}
              onClick={() => setActiveTab('ready')}
            >
              Ready to Release <span className="tab-badge" style={{ backgroundColor: '#ff4b4b' }}>{ov.readyToRelease}</span>
            </button>
          )}
          {ov.due > 0 && (
            <button
              className={`collab-tab ${activeTab === 'overdue' ? 'active' : ''}`}
              onClick={() => setActiveTab('overdue')}
            >
              Overdue <span className="tab-badge" style={{ backgroundColor: '#ff4b4b' }}>{ov.due}</span>
            </button>
          )}
          <button
            className={`collab-tab ${activeTab === 'escrow' ? 'active' : ''}`}
            onClick={() => handleTabChange('escrow')}
          >
            In Escrow <span className="tab-badge">{ov.escrow - ov.readyToRelease}</span>
          </button>
          <button
            className={`collab-tab ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => handleTabChange('completed')}
          >
            Completed
          </button>
          {overview.refundedPayments.length > 0 && (
            <button
              className={`collab-tab ${activeTab === 'refunded' ? 'active' : ''}`}
              onClick={() => handleTabChange('refunded')}
            >
              Refunded
            </button>
          )}
        </div>

        {/* Filters Bar (for Escrow and Completed) */}
        {(activeTab === 'escrow' || activeTab === 'completed') && (
          <div className="collab-filters-bar">
            <div className="collab-search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by campaign, brand, or influencer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="collab-filter-tabs">
              <button
                className={`collab-filter-tab ${selectedMonth === 'all' ? 'collab-active' : ''}`}
                onClick={() => setSelectedMonth('all')}
              >
                All Months
              </button>
              {availableMonths.map(month => (
                <button
                  key={month}
                  className={`collab-filter-tab ${selectedMonth === month ? 'collab-active' : ''}`}
                  onClick={() => setSelectedMonth(month)}
                >
                  {month}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Tab Content */}
        <div className="wallet-tab-content">
          {activeTab === 'ready' && ov.readyToRelease > 0 && (
            <section className="wallet-panel wallet-panel-urgent">
              <SectionHeader
                title="⚡ Ready to Release"
                count={ov.readyToRelease}
                hint="These deals are completed. Release payment to credit the influencer's wallet."
              />
              <WalletCardList
                items={overview.readyToReleasePayments}
                emptyLabel="No payments ready to release."
                onReleased={handleReleased}
                showReleaseButton={true}
                isOverdueSection={false}
              />
            </section>
          )}

          {activeTab === 'overdue' && ov.due > 0 && (
            <section className="wallet-panel wallet-panel-overdue">
              <SectionHeader
                title="⚠️ Overdue Payments"
                count={ov.due}
                hint="Deals completed more than 7 days ago. Release these immediately."
              />
              <WalletCardList
                items={overview.duePayments}
                emptyLabel="No overdue payments."
                onReleased={handleReleased}
                showReleaseButton={true}
                isOverdueSection={true}
              />
            </section>
          )}

          {activeTab === 'escrow' && (() => {
            const { groups, sortedKeys } = filterAndGroupItems(overview.pendingPayments, (p, d) => d.paidAt || p.updatedAt);
            return (
              <section className="wallet-panel">
                <SectionHeader
                  title="In Escrow — Deals In Progress"
                  count={ov.escrow - ov.readyToRelease}
                  hint="Funds held in admin escrow while influencer completes the deal."
                />
                {sortedKeys.length === 0 ? (
                   <div className="wallet-empty">
                     <Wallet2 size={28} />
                     <p>No active escrow payments match your filters.</p>
                   </div>
                ) : (
                  sortedKeys.map(month => (
                    <div key={month} className="wallet-month-group">
                      <h4 className="wallet-month-header">{month}</h4>
                      <WalletCardList
                        items={groups[month]}
                        emptyLabel=""
                        onReleased={handleReleased}
                        showReleaseButton={false}
                      />
                    </div>
                  ))
                )}
              </section>
            );
          })()}

          {activeTab === 'completed' && (() => {
            const { groups, sortedKeys } = filterAndGroupItems(overview.completedPayments, (p, d) => d.completedAt || p.releasedAt || p.paidAt || p.updatedAt);
            return (
              <section className="wallet-panel">
                <SectionHeader
                  title="Completed Payments"
                  count={ov.completed}
                  hint="Payments successfully released to influencer wallets."
                />
                {sortedKeys.length === 0 ? (
                   <div className="wallet-empty">
                     <Wallet2 size={28} />
                     <p>No completed payments match your filters.</p>
                   </div>
                ) : (
                  sortedKeys.map(month => (
                    <div key={month} className="wallet-month-group">
                      <h4 className="wallet-month-header">{month}</h4>
                      <WalletTableList
                        items={groups[month]}
                        emptyLabel=""
                      />
                    </div>
                  ))
                )}
              </section>
            );
          })()}

          {activeTab === 'refunded' && overview.refundedPayments.length > 0 && (
            <section className="wallet-panel">
              <SectionHeader
                title="Refunded Payments"
                count={overview.refundedPayments.length}
                hint="Payments that were refunded back to the brand."
              />
              <WalletCardList
                items={overview.refundedPayments}
                emptyLabel="No refunded payments."
                showReleaseButton={false}
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}