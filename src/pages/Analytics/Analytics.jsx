import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  TrendingUp, DollarSign, Users, Briefcase, Star, CheckCircle,
  Clock, BarChart3, PieChart, Activity, ArrowUpRight, ArrowDownRight,
  Calendar, Target, Zap, Award, Eye, MessageSquare, Loader
} from 'lucide-react';
import './Analytics.css';

const Analytics = () => {
  const { user, isInfluencer, isBrand } = useAuth();
  const {
    applications, deals, campaigns,
    fetchMyApplications, fetchMyDeals, fetchMyCampaigns, fetchCampaigns,
    getReviewsForUser
  } = useData();

  const [loading, setLoading] = useState(true);
  const [myCampaigns, setMyCampaigns] = useState([]);
  const [myDeals, setMyDeals] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (isInfluencer) {
          const apps = await fetchMyApplications({}, true);
          setMyApps(apps || []);
          const dls = await fetchMyDeals(true);
          setMyDeals(dls || []);
          if (user?._id) {
            const revs = await getReviewsForUser(user._id);
            setReviews(revs || []);
          }
        } else if (isBrand) {
          const camps = await fetchMyCampaigns();
          setMyCampaigns(camps || []);
          const dls = await fetchMyDeals(true);
          setMyDeals(dls || []);
        }
      } catch (err) {
        console.error('Analytics load error:', err);
      }
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute analytics
  const completedDeals = myDeals.filter(d => d.status === 'completed');
  const activeDeals = myDeals.filter(d => d.status === 'in_progress' || d.status === 'active');
  const totalEarnings = completedDeals.reduce((sum, d) => sum + (d.agreedRate || d.amount || 0), 0);
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0';
  const acceptedApps = myApps.filter(a => a.status === 'accepted');
  const rejectedApps = myApps.filter(a => a.status === 'rejected');
  const pendingApps = myApps.filter(a => a.status === 'pending');
  const successRate = myApps.length > 0
    ? ((acceptedApps.length / myApps.length) * 100).toFixed(0)
    : '0';

  // Brand analytics
  const totalApplicants = myCampaigns.reduce((sum, c) => sum + (c.applicationCount || 0), 0);
  const activeCampaigns = myCampaigns.filter(c => c.status === 'active');
  const completedCampaigns = myCampaigns.filter(c => c.status === 'completed');
  const totalSpent = completedDeals.reduce((sum, d) => sum + (d.agreedRate || d.amount || 0), 0);

  // Bar chart data simulation
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const barData = months.map((m, i) => ({
    month: m,
    value: Math.max(10, Math.floor(Math.random() * 80 + (completedDeals.length * 10)))
  }));
  const maxBar = Math.max(...barData.map(d => d.value));

  // Donut chart data for status distribution
  const statusCounts = isInfluencer
    ? [
        { label: 'Accepted', value: acceptedApps.length, color: '#98D8AA' },
        { label: 'Pending', value: pendingApps.length, color: '#FFD686' },
        { label: 'Rejected', value: rejectedApps.length, color: '#FF9B9B' },
      ]
    : [
        { label: 'Active', value: activeCampaigns.length, color: '#98D8AA' },
        { label: 'Completed', value: completedCampaigns.length, color: '#87CEEB' },
        { label: 'Draft', value: myCampaigns.filter(c => c.status === 'draft').length, color: '#FFD686' },
      ];
  const totalStatus = statusCounts.reduce((s, d) => s + d.value, 0) || 1;

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-loading">
          <div className="analytics-loading-spinner">
            <Loader size={40} className="animate-spin" />
          </div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-container">
        {/* Header */}
        <div className="analytics-header">
          <div className="analytics-header-content">
            <div className="analytics-header-icon">
              <BarChart3 size={28} />
            </div>
            <div>
              <h1>Analytics Dashboard</h1>
              <p>Track your {isInfluencer ? 'collaboration' : 'campaign'} performance and growth</p>
            </div>
          </div>
          <div className="analytics-time-filter">
            {['all', '30d', '7d'].map(range => (
              <button
                key={range}
                className={`analytics-time-btn ${timeRange === range ? 'active' : ''}`}
                onClick={() => setTimeRange(range)}
              >
                {range === 'all' ? 'All Time' : range === '30d' ? '30 Days' : '7 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="analytics-stats-grid">
          {isInfluencer ? (
            <>
              <StatsCard
                icon={<DollarSign size={24} />}
                label="Total Earnings"
                value={`$${totalEarnings.toLocaleString()}`}
                change="+12.5%"
                positive={true}
                gradient="mint"
              />
              <StatsCard
                icon={<CheckCircle size={24} />}
                label="Completed Deals"
                value={completedDeals.length}
                change={`${activeDeals.length} active`}
                positive={true}
                gradient="sky"
              />
              <StatsCard
                icon={<Star size={24} />}
                label="Average Rating"
                value={avgRating}
                change={`${reviews.length} reviews`}
                positive={parseFloat(avgRating) >= 4}
                gradient="lavender"
              />
              <StatsCard
                icon={<Target size={24} />}
                label="Success Rate"
                value={`${successRate}%`}
                change={`${myApps.length} total apps`}
                positive={parseInt(successRate) >= 50}
                gradient="peach"
              />
            </>
          ) : (
            <>
              <StatsCard
                icon={<Briefcase size={24} />}
                label="Total Campaigns"
                value={myCampaigns.length}
                change={`${activeCampaigns.length} active`}
                positive={true}
                gradient="mint"
              />
              <StatsCard
                icon={<Users size={24} />}
                label="Total Applicants"
                value={totalApplicants}
                change="across campaigns"
                positive={true}
                gradient="sky"
              />
              <StatsCard
                icon={<DollarSign size={24} />}
                label="Total Investment"
                value={`$${totalSpent.toLocaleString()}`}
                change="in collaborations"
                positive={true}
                gradient="lavender"
              />
              <StatsCard
                icon={<CheckCircle size={24} />}
                label="Completed Deals"
                value={completedDeals.length}
                change={`${activeDeals.length} in progress`}
                positive={true}
                gradient="peach"
              />
            </>
          )}
        </div>

        {/* Charts Section */}
        <div className="analytics-charts-grid">
          {/* Bar Chart */}
          <div className="analytics-chart-card">
            <div className="analytics-chart-header">
              <h3><Activity size={18} /> Performance Trend</h3>
              <span className="analytics-chart-label">Monthly overview</span>
            </div>
            <div className="analytics-bar-chart">
              {barData.map((d, i) => (
                <div key={i} className="analytics-bar-col">
                  <div className="analytics-bar-wrapper">
                    <div
                      className="analytics-bar"
                      style={{ height: `${(d.value / maxBar) * 100}%` }}
                    >
                      <span className="analytics-bar-tooltip">{d.value}</span>
                    </div>
                  </div>
                  <span className="analytics-bar-label">{d.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Donut Chart */}
          <div className="analytics-chart-card">
            <div className="analytics-chart-header">
              <h3><PieChart size={18} /> Status Distribution</h3>
              <span className="analytics-chart-label">
                {isInfluencer ? 'Applications' : 'Campaigns'}
              </span>
            </div>
            <div className="analytics-donut-container">
              <div className="analytics-donut">
                <svg viewBox="0 0 120 120" className="analytics-donut-svg">
                  {statusCounts.reduce((acc, item, idx) => {
                    const angle = (item.value / totalStatus) * 360;
                    const startAngle = acc.offset;
                    const endAngle = startAngle + angle;
                    const largeArc = angle > 180 ? 1 : 0;
                    const x1 = 60 + 45 * Math.cos((Math.PI * startAngle) / 180);
                    const y1 = 60 + 45 * Math.sin((Math.PI * startAngle) / 180);
                    const x2 = 60 + 45 * Math.cos((Math.PI * endAngle) / 180);
                    const y2 = 60 + 45 * Math.sin((Math.PI * endAngle) / 180);
                    acc.paths.push(
                      <path
                        key={idx}
                        d={`M 60 60 L ${x1} ${y1} A 45 45 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={item.color}
                        stroke="white"
                        strokeWidth="2"
                        className="analytics-donut-segment"
                      />
                    );
                    acc.offset = endAngle;
                    return acc;
                  }, { paths: [], offset: -90 }).paths}
                  <circle cx="60" cy="60" r="28" fill="white" />
                  <text x="60" y="56" textAnchor="middle" className="analytics-donut-value">
                    {totalStatus}
                  </text>
                  <text x="60" y="70" textAnchor="middle" className="analytics-donut-label">
                    Total
                  </text>
                </svg>
              </div>
              <div className="analytics-donut-legend">
                {statusCounts.map((item, i) => (
                  <div key={i} className="analytics-legend-item">
                    <span className="analytics-legend-dot" style={{ background: item.color }} />
                    <span className="analytics-legend-label">{item.label}</span>
                    <span className="analytics-legend-value">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="analytics-activity-section">
          <div className="analytics-activity-card">
            <div className="analytics-chart-header">
              <h3><Clock size={18} /> Recent Activity</h3>
            </div>
            <div className="analytics-activity-list">
              {isInfluencer && myApps.length > 0 ? (
                myApps.slice(0, 8).map((app, i) => (
                  <div key={app._id || i} className="analytics-activity-item" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className={`analytics-activity-icon analytics-icon-${app.status}`}>
                      {app.status === 'accepted' ? <CheckCircle size={16} /> :
                       app.status === 'pending' ? <Clock size={16} /> :
                       app.status === 'rejected' ? <Zap size={16} /> :
                       <Briefcase size={16} />}
                    </div>
                    <div className="analytics-activity-info">
                      <p className="analytics-activity-title">{app.campaign?.title || 'Campaign'}</p>
                      <p className="analytics-activity-sub">
                        {app.campaign?.brandProfile?.companyName || 'Brand'} &bull; ${app.proposedRate || 0}
                      </p>
                    </div>
                    <span className={`analytics-activity-badge analytics-badge-${app.status}`}>
                      {app.status}
                    </span>
                  </div>
                ))
              ) : isBrand && myCampaigns.length > 0 ? (
                myCampaigns.slice(0, 8).map((camp, i) => (
                  <div key={camp._id || i} className="analytics-activity-item" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className={`analytics-activity-icon analytics-icon-${camp.status}`}>
                      {camp.status === 'active' ? <Briefcase size={16} /> :
                       camp.status === 'completed' ? <CheckCircle size={16} /> :
                       <Clock size={16} />}
                    </div>
                    <div className="analytics-activity-info">
                      <p className="analytics-activity-title">{camp.title}</p>
                      <p className="analytics-activity-sub">
                        {camp.applicationCount || 0} applicants &bull; {camp.category || 'General'}
                      </p>
                    </div>
                    <span className={`analytics-activity-badge analytics-badge-${camp.status}`}>
                      {camp.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="analytics-empty-activity">
                  <Activity size={40} />
                  <p>No activity yet</p>
                  <span>Start collaborating to see your analytics!</span>
                </div>
              )}
            </div>
          </div>

          {/* Reviews Summary (Influencer) or Top Campaigns (Brand) */}
          <div className="analytics-activity-card">
            <div className="analytics-chart-header">
              <h3>
                {isInfluencer ? <><Award size={18} /> Reviews & Ratings</> : <><TrendingUp size={18} /> Top Campaigns</>}
              </h3>
            </div>
            {isInfluencer ? (
              <div className="analytics-reviews-summary">
                <div className="analytics-rating-big">
                  <span className="analytics-rating-value">{avgRating}</span>
                  <div className="analytics-rating-stars">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        size={20}
                        fill={s <= Math.round(parseFloat(avgRating)) ? '#FFD686' : 'none'}
                        stroke={s <= Math.round(parseFloat(avgRating)) ? '#FFD686' : '#D4C8B8'}
                      />
                    ))}
                  </div>
                  <span className="analytics-rating-count">{reviews.length} reviews</span>
                </div>
                {reviews.length > 0 ? (
                  <div className="analytics-reviews-list">
                    {reviews.slice(0, 4).map((rev, i) => (
                      <div key={rev._id || i} className="analytics-review-item">
                        <div className="analytics-review-stars">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={12}
                              fill={s <= rev.rating ? '#FFD686' : 'none'}
                              stroke={s <= rev.rating ? '#FFD686' : '#D4C8B8'}
                            />
                          ))}
                        </div>
                        <p className="analytics-review-text">
                          {rev.content || rev.text || 'Great collaboration!'}
                        </p>
                        <span className="analytics-review-author">
                          — {rev.reviewer?.name || 'Brand'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="analytics-empty-reviews">
                    <Star size={32} />
                    <p>No reviews yet</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="analytics-top-campaigns">
                {myCampaigns.length > 0 ? (
                  myCampaigns
                    .sort((a, b) => (b.applicationCount || 0) - (a.applicationCount || 0))
                    .slice(0, 5)
                    .map((camp, i) => (
                      <div key={camp._id || i} className="analytics-top-campaign-item">
                        <div className="analytics-top-rank">#{i + 1}</div>
                        <div className="analytics-top-info">
                          <p className="analytics-top-title">{camp.title}</p>
                          <p className="analytics-top-sub">{camp.category} &bull; {camp.platformType || 'Any'}</p>
                        </div>
                        <div className="analytics-top-stats">
                          <span><Users size={12} /> {camp.applicationCount || 0}</span>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="analytics-empty-reviews">
                    <Briefcase size={32} />
                    <p>No campaigns yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* Stats Card Component */
const StatsCard = ({ icon, label, value, change, positive, gradient }) => (
  <div className={`analytics-stat-card analytics-gradient-${gradient}`}>
    <div className="analytics-stat-icon">{icon}</div>
    <div className="analytics-stat-content">
      <span className="analytics-stat-value">{value}</span>
      <span className="analytics-stat-label">{label}</span>
    </div>
    <div className={`analytics-stat-change ${positive ? 'positive' : 'negative'}`}>
      {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      <span>{change}</span>
    </div>
  </div>
);

export default Analytics;
