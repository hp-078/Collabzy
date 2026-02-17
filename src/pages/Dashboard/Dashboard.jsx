import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Users, Briefcase, MessageSquare, TrendingUp, DollarSign, Clock,
  CheckCircle, ArrowRight, Star, Calendar, Loader, Sparkles,
  Award, Target, Zap, ArrowUpRight, Shield, Eye, Rocket, Heart,
  BarChart3, Coffee, Sun, Moon, Sunset, Activity
} from 'lucide-react';
import './Dashboard.css';

/* ── helpers ── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', icon: <Sun size={28} />, emoji: '☀️' };
  if (h < 17) return { text: 'Good Afternoon', icon: <Coffee size={28} />, emoji: '🌤️' };
  if (h < 21) return { text: 'Good Evening', icon: <Sunset size={28} />, emoji: '🌇' };
  return { text: 'Good Night', icon: <Moon size={28} />, emoji: '🌙' };
};

const motivationalTips = {
  influencer: [
    { icon: <Sparkles size={18} />, tip: 'Complete your profile to get 3x more collaboration requests!' },
    { icon: <Target size={18} />, tip: 'Brands love consistency — post regularly to boost visibility.' },
    { icon: <Heart size={18} />, tip: 'Engage with your audience — it boosts your attractiveness to brands.' },
    { icon: <Rocket size={18} />, tip: 'Apply to campaigns quickly — early applicants get noticed first!' },
    { icon: <Award size={18} />, tip: 'Great reviews lead to premium deals. Always deliver quality work!' },
  ],
  brand: [
    { icon: <Target size={18} />, tip: 'Detailed campaign briefs attract 2x more quality applications.' },
    { icon: <Users size={18} />, tip: 'Look for influencers whose audience matches your target demographic.' },
    { icon: <Zap size={18} />, tip: 'Respond to applications within 48 hours for best engagement.' },
    { icon: <Star size={18} />, tip: 'Leave reviews after collaborations — it builds trust on the platform.' },
    { icon: <DollarSign size={18} />, tip: 'Setting competitive budgets attracts top-tier creators.' },
  ],
  admin: [
    { icon: <Shield size={18} />, tip: 'Monitor platform health regularly for the best user experience.' },
    { icon: <Activity size={18} />, tip: 'Check for stale campaigns and nudge brands to update them.' },
    { icon: <Eye size={18} />, tip: 'Review new user registrations for quality assurance.' },
  ],
};

/* ── SVG Progress Ring ── */
const ProgressRing = ({ percent = 0, size = 100, stroke = 8, label, sublabel, color = 'var(--accent-coral)' }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(percent, 100) / 100) * circ;
  return (
    <div className="dash-ring-wrap">
      <svg width={size} height={size} className="dash-ring-svg">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="dash-ring-progress" />
      </svg>
      <div className="dash-ring-content">
        <span className="dash-ring-value">{Math.round(percent)}%</span>
        {sublabel && <span className="dash-ring-sublabel">{sublabel}</span>}
      </div>
      {label && <p className="dash-ring-label">{label}</p>}
    </div>
  );
};

/* ── Mini Sparkline Bar Chart ── */
const MiniBarChart = ({ data = [], color = 'var(--accent-coral)', label }) => {
  const max = Math.max(...data, 1);
  return (
    <div className="dash-mini-chart">
      {label && <p className="dash-mini-chart-label">{label}</p>}
      <div className="dash-mini-bars">
        {data.map((v, i) => (
          <div key={i} className="dash-mini-bar-col">
            <div className="dash-mini-bar" style={{
              height: `${(v / max) * 100}%`,
              background: color,
              animationDelay: `${i * 0.08}s`
            }} />
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Achievement Badge ── */
const AchievementBadge = ({ icon, title, unlocked }) => (
  <div className={`dash-badge ${unlocked ? 'dash-badge-unlocked' : 'dash-badge-locked'}`}>
    <div className="dash-badge-icon">{icon}</div>
    <span className="dash-badge-title">{title}</span>
  </div>
);

/* ═══════════ MAIN DASHBOARD ═══════════ */
const Dashboard = () => {
  const { user, isInfluencer, isBrand, isAdmin } = useAuth();
  const {
    influencers, applications, campaigns, deals, loading, error,
    fetchInfluencers, fetchMyApplications, fetchMyCampaigns, fetchMyDeals
  } = useData();
  const [localLoading, setLocalLoading] = useState(true);
  const [myCampaigns, setMyCampaigns] = useState([]);
  const [tipIdx, setTipIdx] = useState(0);

  /* fetch data */
  useEffect(() => {
    const loadData = async () => {
      setLocalLoading(true);
      try {
        if (isInfluencer) { await fetchMyApplications(); await fetchMyDeals(); }
        else if (isBrand) { const c = await fetchMyCampaigns(); setMyCampaigns(c || []); await fetchMyDeals(); }
        await fetchInfluencers();
      } catch (err) { console.error('Dashboard load error:', err); }
      setLocalLoading(false);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* rotate tips */
  const role = isAdmin ? 'admin' : isBrand ? 'brand' : 'influencer';
  const tips = motivationalTips[role];
  useEffect(() => {
    const t = setInterval(() => setTipIdx(i => (i + 1) % tips.length), 6000);
    return () => clearInterval(t);
  }, [tips.length]);

  /* computed */
  const pendingApps    = applications.filter(a => a.status === 'pending');
  const activeApps     = applications.filter(a => a.status === 'shortlisted' || a.status === 'accepted');
  const completedDeals = deals.filter(d => d.status === 'completed');
  const activeDeals    = deals.filter(d => d.status === 'in_progress' || d.status === 'active');
  const totalEarnings  = completedDeals.reduce((s, d) => s + (d.agreedRate || d.amount || 0), 0);

  const greeting = useMemo(getGreeting, []);

  /* week activity (mock sparkline from real data) */
  const weekData = useMemo(() => {
    const days = [0, 0, 0, 0, 0, 0, 0];
    const items = isInfluencer ? applications : isBrand ? myCampaigns : campaigns;
    items.forEach(item => {
      const d = new Date(item.createdAt || item.updatedAt);
      const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
      if (diff >= 0 && diff < 7) days[6 - diff] += 1;
    });
    return days;
  }, [applications, myCampaigns, campaigns, isInfluencer, isBrand]);

  /* completion percentage */
  const totalDeals = deals.length || 1;
  const completionPct = Math.round((completedDeals.length / totalDeals) * 100);

  /* stats */
  const stats = isInfluencer ? [
    { icon: <Briefcase size={22} />, label: 'Active Deals', value: activeDeals.length, color: 'primary', trend: activeDeals.length > 0 ? '+' + activeDeals.length : '—' },
    { icon: <Clock size={22} />, label: 'Pending Apps', value: pendingApps.length, color: 'warning', trend: pendingApps.length > 0 ? pendingApps.length + ' waiting' : 'All clear' },
    { icon: <CheckCircle size={22} />, label: 'Completed', value: completedDeals.length, color: 'success', trend: completedDeals.length > 0 ? '✓ ' + completedDeals.length : 'None yet' },
    { icon: <DollarSign size={22} />, label: 'Earnings', value: `$${totalEarnings.toLocaleString()}`, color: 'info', trend: totalEarnings > 0 ? 'Lifetime' : 'Start earning' },
  ] : isBrand ? [
    { icon: <Briefcase size={22} />, label: 'My Campaigns', value: myCampaigns.length, color: 'primary', trend: myCampaigns.filter(c => c.status === 'active').length + ' active' },
    { icon: <Clock size={22} />, label: 'Active Deals', value: activeDeals.length, color: 'warning', trend: activeDeals.length > 0 ? 'In progress' : '—' },
    { icon: <CheckCircle size={22} />, label: 'Completed', value: completedDeals.length, color: 'success', trend: completedDeals.length > 0 ? '✓ done' : 'None yet' },
    { icon: <Users size={22} />, label: 'Influencers', value: influencers.length, color: 'info', trend: 'Available' },
  ] : [
    { icon: <Users size={22} />, label: 'Total Users', value: influencers.length, color: 'primary', trend: 'Platform' },
    { icon: <Briefcase size={22} />, label: 'Campaigns', value: campaigns.length, color: 'warning', trend: campaigns.filter(c => c.status === 'active').length + ' active' },
    { icon: <CheckCircle size={22} />, label: 'Applications', value: applications.length, color: 'success', trend: 'All time' },
    { icon: <TrendingUp size={22} />, label: 'Active Deals', value: activeDeals.length, color: 'info', trend: 'Live now' },
  ];

  /* achievements */
  const achievements = isInfluencer ? [
    { icon: <Rocket size={18} />, title: 'First Apply', unlocked: applications.length >= 1 },
    { icon: <Briefcase size={18} />, title: '5 Applications', unlocked: applications.length >= 5 },
    { icon: <CheckCircle size={18} />, title: 'Deal Closer', unlocked: completedDeals.length >= 1 },
    { icon: <DollarSign size={18} />, title: '$1k Earned', unlocked: totalEarnings >= 1000 },
    { icon: <Star size={18} />, title: 'Top Creator', unlocked: completedDeals.length >= 10 },
    { icon: <Award size={18} />, title: 'Elite Status', unlocked: completedDeals.length >= 25 },
  ] : isBrand ? [
    { icon: <Rocket size={18} />, title: 'First Campaign', unlocked: myCampaigns.length >= 1 },
    { icon: <Users size={18} />, title: '5 Campaigns', unlocked: myCampaigns.length >= 5 },
    { icon: <CheckCircle size={18} />, title: 'Deal Maker', unlocked: completedDeals.length >= 1 },
    { icon: <Star size={18} />, title: 'Power Brand', unlocked: completedDeals.length >= 10 },
    { icon: <Award size={18} />, title: 'Top Spender', unlocked: totalEarnings >= 5000 },
  ] : [
    { icon: <Shield size={18} />, title: 'Admin Active', unlocked: true },
    { icon: <Eye size={18} />, title: 'Oversight', unlocked: campaigns.length > 0 },
    { icon: <Activity size={18} />, title: 'Platform Live', unlocked: influencers.length > 0 },
  ];

  /* ── loading ── */
  if (loading || localLoading) {
    return (
      <div className="dash-page">
        <div className="dash-loading">
          <div className="dash-loading-ring">
            <Loader size={40} className="spin-animation" />
          </div>
          <p className="dash-loading-text">Preparing your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-page">
      <div className="dash-container">

        {/* Error */}
        {error && (
          <div className="dash-error-banner">
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        {/* ── Hero Welcome Banner ── */}
        <div className="dash-hero-banner">
          <div className="dash-hero-bg-shapes">
            <div className="dash-shape dash-shape-1" />
            <div className="dash-shape dash-shape-2" />
            <div className="dash-shape dash-shape-3" />
          </div>
          <div className="dash-hero-content">
            <div className="dash-hero-left">
              <div className="dash-greeting-badge">
                {greeting.icon}
                <span>{greeting.text}</span>
              </div>
              <h1 className="dash-hero-title">
                Welcome back, <span className="dash-hero-name">{user?.name?.split(' ')[0]}</span>! {greeting.emoji}
              </h1>
              <p className="dash-hero-subtitle">
                {isInfluencer ? 'Ready to land your next big collaboration? Let\'s make it happen.' :
                 isBrand ? 'Find the perfect creators for your brand story today.' :
                 'Here\'s the pulse of your platform — everything at a glance.'}
              </p>
              <div className="dash-hero-actions">
                {isInfluencer && (
                  <>
                    <Link to="/campaigns" className="dash-hero-btn dash-hero-btn-primary">
                      <Sparkles size={18} /> Browse Campaigns
                    </Link>
                    <Link to="/profile" className="dash-hero-btn dash-hero-btn-secondary">
                      Edit Profile
                    </Link>
                  </>
                )}
                {isBrand && (
                  <>
                    <Link to="/influencers" className="dash-hero-btn dash-hero-btn-primary">
                      <Users size={18} /> Find Influencers
                    </Link>
                    <Link to="/campaigns" className="dash-hero-btn dash-hero-btn-secondary">
                      My Campaigns
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <Link to="/admin" className="dash-hero-btn dash-hero-btn-primary">
                    <Shield size={18} /> Admin Panel
                  </Link>
                )}
              </div>
            </div>
            <div className="dash-hero-right">
              <div className="dash-hero-avatar-ring">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="dash-hero-avatar" />
                ) : (
                  <div className="dash-hero-avatar-placeholder">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="dash-hero-status-dot" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Tip Banner ── */}
        <div className="dash-tip-banner" key={tipIdx}>
          <div className="dash-tip-icon">{tips[tipIdx].icon}</div>
          <p className="dash-tip-text">{tips[tipIdx].tip}</p>
          <div className="dash-tip-dots">
            {tips.map((_, i) => (
              <span key={i} className={`dash-tip-dot ${i === tipIdx ? 'active' : ''}`} onClick={() => setTipIdx(i)} />
            ))}
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="dash-stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className={`dash-stat-card dash-stat-${stat.color}`}
                 style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="dash-stat-card-inner">
                <div className="dash-stat-icon">{stat.icon}</div>
                <div className="dash-stat-info">
                  <span className="dash-stat-value">{stat.value}</span>
                  <span className="dash-stat-label">{stat.label}</span>
                </div>
                <span className="dash-stat-trend">
                  <ArrowUpRight size={12} /> {stat.trend}
                </span>
              </div>
              <div className="dash-stat-glow" />
            </div>
          ))}
        </div>

        {/* ── Main Content ── */}
        <div className="dash-content">
          <div className="dash-content-main">

            {/* Progress & Activity Row */}
            <div className="dash-insights-row">
              {/* Completion Ring */}
              <div className="dash-card dash-completion-card">
                <h3><Target size={18} /> Completion Rate</h3>
                <ProgressRing
                  percent={completionPct} size={120} stroke={10}
                  label="Deals completed" sublabel={`${completedDeals.length}/${deals.length}`}
                  color="var(--accent-coral)"
                />
              </div>
              {/* Weekly Activity */}
              <div className="dash-card dash-activity-card">
                <h3><BarChart3 size={18} /> Weekly Activity</h3>
                <MiniBarChart data={weekData} color="var(--accent-purple)" label="Last 7 days" />
                <div className="dash-week-labels">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Applications / Campaigns */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h2>{isInfluencer ? 'Recent Applications' : isBrand ? 'My Campaigns' : 'Recent Activity'}</h2>
                <Link to="/collaborations" className="dash-view-all">
                  View All <ArrowRight size={16} />
                </Link>
              </div>
              <div className="dash-card-body">
                {isInfluencer && applications.length > 0 ? (
                  <div className="dash-timeline">
                    {applications.slice(0, 5).map((app, i) => (
                      <div key={app._id} className="dash-timeline-item" style={{ animationDelay: `${i * 0.1}s` }}>
                        <div className="dash-timeline-dot" />
                        <div className="dash-timeline-content">
                          <div className="dash-timeline-header">
                            <h4>{app.campaign?.title || 'Campaign'}</h4>
                            <span className={`dash-status-badge dash-status-${app.status}`}>{app.status}</span>
                          </div>
                          <p className="dash-timeline-meta">
                            {app.campaign?.brandProfile?.companyName || 'Brand'}
                            <span className="dash-dot-sep">·</span>
                            <DollarSign size={13} />{app.proposedRate || app.campaign?.budget?.min || 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : isBrand && myCampaigns.length > 0 ? (
                  <div className="dash-timeline">
                    {myCampaigns.slice(0, 5).map((campaign, i) => (
                      <div key={campaign._id} className="dash-timeline-item" style={{ animationDelay: `${i * 0.1}s` }}>
                        <div className="dash-timeline-dot" />
                        <div className="dash-timeline-content">
                          <div className="dash-timeline-header">
                            <h4>{campaign.title}</h4>
                            <span className={`dash-status-badge dash-status-${campaign.status}`}>{campaign.status}</span>
                          </div>
                          <p className="dash-timeline-meta">
                            {campaign.applicationCount || 0} applications
                            <span className="dash-dot-sep">·</span>
                            <DollarSign size={13} />{campaign.budget?.min || 0} – {campaign.budget?.max || 0}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dash-empty-state">
                    <div className="dash-empty-icon-wrap"><Briefcase size={36} /></div>
                    <h4>{isInfluencer ? 'No applications yet' : isBrand ? 'No campaigns yet' : 'No activity yet'}</h4>
                    <p>Start your journey and this space will come alive!</p>
                    {isInfluencer && (
                      <Link to="/campaigns" className="dash-hero-btn dash-hero-btn-primary" style={{ marginTop: '0.75rem' }}>
                        <Sparkles size={16} /> Browse Campaigns
                      </Link>
                    )}
                    {isBrand && (
                      <Link to="/influencers" className="dash-hero-btn dash-hero-btn-primary" style={{ marginTop: '0.75rem' }}>
                        <Users size={16} /> Find Influencers
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Pending Actions for Influencer */}
            {isInfluencer && pendingApps.length > 0 && (
              <div className="dash-card dash-pending-card">
                <div className="dash-card-header">
                  <h2><Clock size={18} /> Pending Applications</h2>
                  <span className="dash-pending-count">{pendingApps.length}</span>
                </div>
                <div className="dash-card-body">
                  <div className="dash-timeline">
                    {pendingApps.slice(0, 3).map((app, i) => (
                      <div key={app._id} className="dash-timeline-item dash-timeline-pending" style={{ animationDelay: `${i * 0.1}s` }}>
                        <div className="dash-timeline-dot dash-dot-pending" />
                        <div className="dash-timeline-content">
                          <div className="dash-timeline-header">
                            <h4>{app.campaign?.title || 'Campaign'}</h4>
                            <Link to="/collaborations" className="dash-inline-btn">View →</Link>
                          </div>
                          <p className="dash-timeline-meta">
                            {app.campaign?.brandProfile?.companyName || 'Brand'}
                            <span className="dash-dot-sep">·</span>
                            ${app.proposedRate || 0}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Achievements */}
            <div className="dash-card dash-achievements-card">
              <div className="dash-card-header">
                <h2><Award size={18} /> Achievements</h2>
                <span className="dash-badge-count">
                  {achievements.filter(a => a.unlocked).length}/{achievements.length}
                </span>
              </div>
              <div className="dash-card-body">
                <div className="dash-badges-grid">
                  {achievements.map((a, i) => (
                    <AchievementBadge key={i} {...a} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="dash-content-sidebar">

            {/* Profile Card */}
            <div className="dash-profile-card">
              <div className="dash-profile-header">
                <div className="dash-profile-avatar-wrap">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="dash-profile-avatar" />
                  ) : (
                    <div className="dash-profile-avatar-placeholder">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <h3>{user?.name}</h3>
                <span className="dash-profile-role-badge">{user?.role}</span>
              </div>
              <div className="dash-profile-stats">
                <div className="dash-profile-stat">
                  <span className="dash-value">{isInfluencer ? applications.length : isBrand ? myCampaigns.length : influencers.length}</span>
                  <span className="dash-label">{isInfluencer ? 'Applied' : isBrand ? 'Campaigns' : 'Users'}</span>
                </div>
                <div className="dash-profile-stat">
                  <span className="dash-value">{completedDeals.length}</span>
                  <span className="dash-label">Completed</span>
                </div>
                <div className="dash-profile-stat">
                  <span className="dash-value">{activeDeals.length}</span>
                  <span className="dash-label">Active</span>
                </div>
              </div>
              <Link to="/profile" className="dash-profile-btn">
                <Eye size={16} /> View Profile
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="dash-quick-actions-card">
              <h3>Quick Actions</h3>
              <div className="dash-quick-actions-grid">
                <Link to="/collaborations" className="dash-quick-action">
                  <div className="dash-qa-icon dash-qa-collab"><Briefcase size={20} /></div>
                  <span>Collabs</span>
                </Link>
                <Link to="/messages" className="dash-quick-action">
                  <div className="dash-qa-icon dash-qa-messages"><MessageSquare size={20} /></div>
                  <span>Messages</span>
                </Link>
                <Link to="/analytics" className="dash-quick-action">
                  <div className="dash-qa-icon dash-qa-analytics"><BarChart3 size={20} /></div>
                  <span>Analytics</span>
                </Link>
                {isBrand ? (
                  <Link to="/influencers" className="dash-quick-action">
                    <div className="dash-qa-icon dash-qa-find"><Users size={20} /></div>
                    <span>Discover</span>
                  </Link>
                ) : (
                  <Link to="/campaigns" className="dash-quick-action">
                    <div className="dash-qa-icon dash-qa-find"><Sparkles size={20} /></div>
                    <span>Explore</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="dash-deadlines-card">
              <h3><Calendar size={18} /> Deadlines</h3>
              {isInfluencer && activeApps.length > 0 ? (
                <div className="dash-deadline-list">
                  {activeApps.slice(0, 3).map((app) => (
                    <div key={app._id} className="dash-deadline-item">
                      <div className="dash-deadline-dot" />
                      <div>
                        <p className="dash-deadline-title">{app.campaign?.title || 'Campaign'}</p>
                        <p className="dash-deadline-date">
                          {app.campaign?.deadline ? new Date(app.campaign.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : isBrand && myCampaigns.length > 0 ? (
                <div className="dash-deadline-list">
                  {myCampaigns.filter(c => c.deadline).slice(0, 3).map((campaign) => (
                    <div key={campaign._id} className="dash-deadline-item">
                      <div className="dash-deadline-dot" />
                      <div>
                        <p className="dash-deadline-title">{campaign.title}</p>
                        <p className="dash-deadline-date">
                          {new Date(campaign.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dash-deadline-empty">
                  <Calendar size={28} />
                  <p>No upcoming deadlines</p>
                </div>
              )}
            </div>

            {/* Goal Tracker */}
            <div className="dash-goal-card">
              <h3><Target size={18} /> Goals</h3>
              <div className="dash-goal-list">
                {isInfluencer ? (
                  <>
                    <div className="dash-goal-item">
                      <div className="dash-goal-header">
                        <span>Apply to 5 campaigns</span>
                        <span className="dash-goal-num">{Math.min(applications.length, 5)}/5</span>
                      </div>
                      <div className="dash-goal-bar">
                        <div className="dash-goal-fill" style={{ width: `${Math.min((applications.length / 5) * 100, 100)}%` }} />
                      </div>
                    </div>
                    <div className="dash-goal-item">
                      <div className="dash-goal-header">
                        <span>Complete 3 deals</span>
                        <span className="dash-goal-num">{Math.min(completedDeals.length, 3)}/3</span>
                      </div>
                      <div className="dash-goal-bar">
                        <div className="dash-goal-fill dash-goal-fill-purple" style={{ width: `${Math.min((completedDeals.length / 3) * 100, 100)}%` }} />
                      </div>
                    </div>
                    <div className="dash-goal-item">
                      <div className="dash-goal-header">
                        <span>Earn $500</span>
                        <span className="dash-goal-num">${Math.min(totalEarnings, 500)}/$500</span>
                      </div>
                      <div className="dash-goal-bar">
                        <div className="dash-goal-fill dash-goal-fill-teal" style={{ width: `${Math.min((totalEarnings / 500) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </>
                ) : isBrand ? (
                  <>
                    <div className="dash-goal-item">
                      <div className="dash-goal-header">
                        <span>Create 3 campaigns</span>
                        <span className="dash-goal-num">{Math.min(myCampaigns.length, 3)}/3</span>
                      </div>
                      <div className="dash-goal-bar">
                        <div className="dash-goal-fill" style={{ width: `${Math.min((myCampaigns.length / 3) * 100, 100)}%` }} />
                      </div>
                    </div>
                    <div className="dash-goal-item">
                      <div className="dash-goal-header">
                        <span>Close 5 deals</span>
                        <span className="dash-goal-num">{Math.min(completedDeals.length, 5)}/5</span>
                      </div>
                      <div className="dash-goal-bar">
                        <div className="dash-goal-fill dash-goal-fill-purple" style={{ width: `${Math.min((completedDeals.length / 5) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="dash-goal-item">
                      <div className="dash-goal-header">
                        <span>10 active users</span>
                        <span className="dash-goal-num">{Math.min(influencers.length, 10)}/10</span>
                      </div>
                      <div className="dash-goal-bar">
                        <div className="dash-goal-fill" style={{ width: `${Math.min((influencers.length / 10) * 100, 100)}%` }} />
                      </div>
                    </div>
                    <div className="dash-goal-item">
                      <div className="dash-goal-header">
                        <span>20 campaigns</span>
                        <span className="dash-goal-num">{Math.min(campaigns.length, 20)}/20</span>
                      </div>
                      <div className="dash-goal-bar">
                        <div className="dash-goal-fill dash-goal-fill-purple" style={{ width: `${Math.min((campaigns.length / 20) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
