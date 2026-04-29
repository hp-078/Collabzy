import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import api from '../../services/api';
import {
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  IndianRupee,
  Loader,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Users
} from 'lucide-react';
import './Dashboard.css';

const formatCurrency = (value) => `₹${(value || 0).toLocaleString()}`;

const Dashboard = () => {
  const { user, isInfluencer, isBrand, isAdmin } = useAuth();
  const {
    influencers,
    applications,
    campaigns,
    deals,
    loading,
    error,
    fetchInfluencers,
    fetchMyApplications,
    fetchMyCampaigns,
    fetchMyDeals
  } = useData();

  const [localLoading, setLocalLoading] = useState(true);
  const [myCampaigns, setMyCampaigns] = useState([]);
  const [walletAmount, setWalletAmount] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLocalLoading(true);
      try {
        if (isInfluencer) {
          await fetchMyApplications();
          await fetchMyDeals();
          try {
            const walletResponse = await api.get('/wallets/me');
            setWalletAmount(walletResponse?.data?.data?.balance || 0);
          } catch (walletErr) {
            console.error('Dashboard wallet load error:', walletErr);
            setWalletAmount(0);
          }
        }
        if (isBrand) {
          const data = await fetchMyCampaigns();
          setMyCampaigns(data || []);
          await fetchMyDeals();
        }
        await fetchInfluencers();
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLocalLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingApps = applications.filter((app) => app.status === 'pending');
  const completedDeals = deals.filter((deal) => deal.status === 'completed');
  const activeDeals = deals.filter((deal) => deal.status === 'in_progress' || deal.status === 'active');
  const totalEarnings = completedDeals.reduce((sum, deal) => sum + (deal.agreedRate || deal.amount || 0), 0);

  const headline = useMemo(() => {
    if (isInfluencer) {
      return {
        title: `Welcome back, ${user?.name?.split(' ')[0] || 'Creator'}`,
        subtitle: 'Focus on pending applications and active collaborations to grow faster.',
        primaryAction: { to: '/campaigns', label: 'Find Campaigns', icon: Sparkles },
        secondaryAction: { to: '/messages', label: 'Open Messages' }
      };
    }

    if (isBrand) {
      return {
        title: `Welcome back, ${user?.name?.split(' ')[0] || 'Brand'}`,
        subtitle: 'Launch campaigns, review responses, and move top creators into deals quickly.',
        primaryAction: { to: '/campaigns', label: 'Manage Campaigns', icon: Briefcase },
        secondaryAction: { to: '/influencers', label: 'Discover Influencers' }
      };
    }

    return {
      title: `Welcome back, ${user?.name?.split(' ')[0] || 'Admin'}`,
      subtitle: 'Monitor platform health, campaign activity, and collaboration pipeline at a glance.',
      primaryAction: { to: '/admin', label: 'Open Admin Panel', icon: TrendingUp },
      secondaryAction: { to: '/analytics', label: 'View Analytics' }
    };
  }, [isInfluencer, isBrand, user]);

  const metrics = isInfluencer
    ? [
        { label: 'Wallet Balance', value: formatCurrency(walletAmount), icon: IndianRupee },
        { label: 'Active Deals', value: activeDeals.length, icon: Briefcase },
        { label: 'Pending Applications', value: pendingApps.length, icon: Clock },
        { label: 'Completed Deals', value: completedDeals.length, icon: CheckCircle }
      ]
    : isBrand
      ? [
          { label: 'My Campaigns', value: myCampaigns.length, icon: Briefcase },
          { label: 'Active Deals', value: activeDeals.length, icon: Clock },
          { label: 'Completed Deals', value: completedDeals.length, icon: CheckCircle },
          { label: 'Influencers', value: influencers.length, icon: Users }
        ]
      : [
          { label: 'Influencers', value: influencers.length, icon: Users },
          { label: 'Campaigns', value: campaigns.length, icon: Briefcase },
          { label: 'Applications', value: applications.length, icon: CheckCircle },
          { label: 'Active Deals', value: activeDeals.length, icon: TrendingUp }
        ];

  const recentItems = isInfluencer
    ? applications.slice(0, 6).map((item) => ({
        id: item._id,
        title: item.campaign?.title || 'Campaign application',
        sub: item.campaign?.brandProfile?.companyName || 'Brand',
        status: item.status || 'pending',
        date: item.createdAt
      }))
    : isBrand
      ? myCampaigns.slice(0, 6).map((item) => ({
          id: item._id,
          title: item.title || 'Campaign',
          sub: `${item.applicationCount || 0} applications`,
          status: item.status || 'active',
          date: item.createdAt
        }))
      : campaigns.slice(0, 6).map((item) => ({
          id: item._id,
          title: item.title || 'Campaign',
          sub: item.brandProfile?.companyName || 'Brand campaign',
          status: item.status || 'active',
          date: item.createdAt
        }));

  const quickActions = [
    { to: '/messages', label: 'Messages', icon: MessageSquare },
    { to: '/collaborations', label: 'Collaborations', icon: Briefcase },
    { to: '/analytics', label: 'Analytics', icon: TrendingUp },
    isBrand
      ? { to: '/influencers', label: 'Find Influencers', icon: Users }
      : { to: '/campaigns', label: 'Campaigns', icon: Sparkles }
  ];

  const upcoming = (isBrand ? myCampaigns : applications)
    .filter((item) => item.deadline || item.campaign?.deadline)
    .slice(0, 4)
    .map((item) => ({
      id: item._id,
      title: item.title || item.campaign?.title || 'Upcoming deadline',
      date: item.deadline || item.campaign?.deadline
    }));

  if (loading || localLoading) {
    return (
      <div className="dash-page">
        <div className="dash-loading">
          <Loader size={36} className="dash-spin" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-page">
      <div className="dash-container">
        {error && <div className="dash-alert">{error}</div>}

        <section className="dash-hero">
          <div>
            <h1>{headline.title}</h1>
            <p>{headline.subtitle}</p>
          </div>
          <div className="dash-hero-actions">
            <Link to={headline.primaryAction.to} className="dash-btn dash-btn-primary">
              <headline.primaryAction.icon size={16} />
              <span>{headline.primaryAction.label}</span>
            </Link>
            <Link to={headline.secondaryAction.to} className="dash-btn dash-btn-secondary">
              <span>{headline.secondaryAction.label}</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        <section className="dash-metrics">
          {metrics.map((metric) => (
            <article key={metric.label} className="dash-metric-card">
              <div className="dash-metric-top">
                <span>{metric.label}</span>
                <metric.icon size={18} />
              </div>
              <p>{metric.value}</p>
            </article>
          ))}
        </section>

        {isInfluencer ? (
          <section className="dash-panel" style={{ marginBottom: '1.2rem' }}>
            <div className="dash-panel-head">
              <h3>Wallet Snapshot</h3>
              <Link to="/wallets">Open wallet</Link>
            </div>
            <div className="dash-wallet-note">
              Your current wallet balance is {formatCurrency(walletAmount)}. Released campaign payments will appear here once the admin completes the transfer.
            </div>
          </section>
        ) : null}

        <section className="dash-grid">
          <div className="dash-panel">
            <div className="dash-panel-head">
              <h2>{isInfluencer ? 'Recent Applications' : isBrand ? 'Recent Campaigns' : 'Recent Platform Activity'}</h2>
              <Link to={isInfluencer ? '/campaigns' : '/collaborations'}>View all</Link>
            </div>

            {recentItems.length === 0 ? (
              <div className="dash-empty">
                <Briefcase size={18} />
                <p>No items yet. Start with your primary action above.</p>
              </div>
            ) : (
              <div className="dash-list">
                {recentItems.map((item) => (
                  <article key={item.id} className="dash-row">
                    <div>
                      <h4>{item.title}</h4>
                      <p>{item.sub}</p>
                    </div>
                    <div className="dash-row-right">
                      <span className={`dash-status dash-status-${item.status}`}>{item.status}</span>
                      <small>
                        {item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </small>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="dash-side">
            <div className="dash-panel">
              <div className="dash-panel-head">
                <h3>Quick Actions</h3>
              </div>
              <div className="dash-actions">
                {quickActions.map((action) => (
                  <Link key={action.label} to={action.to} className="dash-action-link">
                    <action.icon size={16} />
                    <span>{action.label}</span>
                    <ArrowRight size={14} />
                  </Link>
                ))}
              </div>
            </div>

            <div className="dash-panel">
              <div className="dash-panel-head">
                <h3>Upcoming Deadlines</h3>
              </div>
              {upcoming.length === 0 ? (
                <div className="dash-empty dash-empty-compact">
                  <Calendar size={16} />
                  <p>No upcoming deadlines.</p>
                </div>
              ) : (
                <div className="dash-deadlines">
                  {upcoming.map((item) => (
                    <div key={item.id} className="dash-deadline-row">
                      <p>{item.title}</p>
                      <span>
                        {new Date(item.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
