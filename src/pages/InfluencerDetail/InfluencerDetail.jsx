import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  MapPin,
  CheckCircle,
  MessageSquare,
  Send,
  X,
  Youtube,
  Instagram,
  Eye,
  Heart,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Play,
  Linkedin,
  BookOpen,
  FolderOpen,
  Languages,
  Tag,
  Loader
} from 'lucide-react';
import './InfluencerDetail.css';

/* ── helpers ── */
const formatCount = (num) => {
  if (!num) return '0';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toLocaleString();
};

const formatDuration = (iso) => {
  if (!iso) return '';
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return iso;
  const h = m[1] ? `${m[1]}:` : '';
  const min = m[2] || '0';
  const sec = (m[3] || '0').padStart(2, '0');
  return `${h}${min}:${sec}`;
};

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const truncate = (str, len = 60) => {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '\u2026' : str;
};

/* ── component ── */
const InfluencerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { influencers, createCollaboration, getInfluencerById } = useData();
  const { user, isAuthenticated, isBrand } = useAuth();

  const [influencer, setInfluencer] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [message, setMessage] = useState('');
  const [deadline, setDeadline] = useState('');
  const ytScrollRef = useRef(null);
  const igScrollRef = useRef(null);

  /* Always fetch fresh profile data from API so brand sees latest updates */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setProfileLoading(true);

      try {
        // Always hit API so platform data is up-to-date
        const data = await getInfluencerById(id);
        if (!cancelled) setInfluencer(data || null);
      } catch (err) {
        console.error('Failed to load influencer profile:', err);
        // Fallback: try the cached list (e.g. when backend is down)
        const fromList = influencers.find(i => i._id === id);
        if (!cancelled) setInfluencer(fromList || null);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* Loading state */
  if (profileLoading) {
    return (
      <div className="idet-not-found">
        <Loader size={48} className="spin-animation" />
        <p>Loading influencer profile…</p>
      </div>
    );
  }

  if (!influencer) {
    return (
      <div className="idet-not-found">
        <h2>Influencer not found</h2>
        <Link to="/influencers" className="btn btn-primary">Back to Influencers</Link>
      </div>
    );
  }

  /* data shortcuts */
  const yt = influencer.youtubeStats || {};
  const ig = influencer.instagramStats || {};
  const ytData = influencer.youtubeData || {};
  const igData = influencer.instagramData || {};
  const recentVideos = ytData.recentVideos || [];
  const recentMedia = igData.recentMedia || [];
  const services = influencer.services || [];
  const niches = Array.isArray(influencer.niche) ? influencer.niche : (influencer.niche ? [influencer.niche] : []);

  const engagementRate = Number(influencer.averageEngagementRate || yt.engagementRate || ig.engagementRate || 0);

  /* carousel scroll */
  const scrollCarousel = (ref, dir) => {
    if (!ref.current) return;
    const amount = 320;
    ref.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  /* collaborate */
  const handleCollaborate = (service) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setSelectedService(service);
    setShowModal(true);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!selectedService || !message) { alert('Please fill in all required fields'); return; }

    const collaboration = {
      influencerId: influencer.user?._id || influencer.user,
      service: selectedService.name,
      budget: selectedService.price,
      message,
      deadline,
    };

    const result = await createCollaboration(collaboration);
    if (result.success) {
      alert('Collaboration request sent successfully! Check Messages to continue.');
      setShowModal(false);
      setMessage('');
      setDeadline('');
      navigate('/messages');
    } else {
      alert(`Failed to send request: ${result.error}`);
    }
  };

  /* engagement donut calculation */
  const engPercent = Math.min(engagementRate, 100);
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (engPercent / 100) * circumference;

  return (
    <div className="idet-page">
      <div className="idet-container">

        {/* Back */}
        <Link to="/influencers" className="idet-back-link">
          <ArrowLeft size={20} /> Back to Influencers
        </Link>

        {/* Top Stats Bar */}
        <div className="idet-stats-bar">
          <div className={`idet-stat-pill ${ig.followers > 0 ? (ig.followers > yt.subscribers ? 'idet-stat-highlight-ig' : '') : 'idet-stat-zero'}`}>
            <div className="idet-stat-pill-val">{formatCount(ig.followers)}</div>
            <div className="idet-stat-pill-lbl">Instagram followers</div>
            <div className="idet-stat-pill-icon idet-ig-icon"><Instagram size={18} /></div>
          </div>
          <div className={`idet-stat-pill idet-stat-pill-yt ${yt.subscribers > 0 ? 'idet-stat-highlight' : 'idet-stat-zero'}`}>
            <div className="idet-stat-pill-val">{formatCount(yt.subscribers)}</div>
            <div className="idet-stat-pill-lbl">Youtube followers</div>
            <div className="idet-stat-pill-icon idet-yt-icon"><Youtube size={18} /></div>
          </div>
          <div className="idet-stat-pill idet-stat-zero">
            <div className="idet-stat-pill-val">0</div>
            <div className="idet-stat-pill-lbl">LinkedIn followers</div>
            <div className="idet-stat-pill-icon idet-li-icon"><Linkedin size={18} /></div>
          </div>
          <div className="idet-stat-pill idet-stat-zero">
            <div className="idet-stat-pill-val">0</div>
            <div className="idet-stat-pill-lbl">Blog Average Visit</div>
            <div className="idet-stat-pill-icon idet-blog-icon"><BookOpen size={18} /></div>
          </div>
          <div className="idet-stat-pill idet-stat-zero">
            <div className="idet-stat-pill-val">{influencer.campaignsCompleted || 0}</div>
            <div className="idet-stat-pill-lbl">Projects Overview</div>
            <div className="idet-stat-pill-icon idet-proj-icon"><FolderOpen size={18} /></div>
          </div>
        </div>

        {/* Two-column body */}
        <div className="idet-body">

          {/* LEFT SIDEBAR */}
          <aside className="idet-sidebar">
            <div className="idet-sidebar-photo">
              {influencer.avatar ? (
                <img src={influencer.avatar} alt={influencer.name} />
              ) : (
                <div className="idet-sidebar-photo-placeholder">
                  {influencer.name?.charAt(0) || '?'}
                </div>
              )}
            </div>

            <h2 className="idet-sidebar-name">{influencer.name}</h2>

            {influencer.location && (
              <>
                <div className="idet-sidebar-meta">
                  <Languages size={15} />
                  <span>English</span>
                </div>
                <div className="idet-sidebar-meta">
                  <MapPin size={15} />
                  <span>{influencer.location}</span>
                </div>
              </>
            )}

            {niches.length > 0 && (
              <div className="idet-sidebar-meta">
                <Tag size={15} />
                <span>{niches.join(', ')}</span>
              </div>
            )}

            {isBrand ? (
              <button
                className="idet-contact-btn"
                onClick={() => handleCollaborate(services[0] || { name: 'General', price: 0 })}
              >
                <MessageSquare size={16} /> Contact Me
              </button>
            ) : !isAuthenticated ? (
              <Link to="/register?role=brand" className="idet-contact-btn">
                <MessageSquare size={16} /> Sign Up to Contact
              </Link>
            ) : null}
          </aside>

          {/* MAIN CONTENT */}
          <main className="idet-main">

            {/* YouTube Channel Info */}
            {yt.subscribers > 0 && (
              <section className="idet-channel-info">
                <div className="idet-channel-avatar">
                  {ytData.thumbnail ? (
                    <img src={ytData.thumbnail} alt={ytData.title || influencer.name} />
                  ) : (
                    <div className="idet-channel-avatar-ph"><Youtube size={28} /></div>
                  )}
                </div>
                <div className="idet-channel-details">
                  <div className="idet-channel-handle">
                    {ytData.customUrl ? `@${ytData.customUrl.replace('@', '')}` : influencer.name}
                    {influencer.isVerified && <CheckCircle size={16} className="idet-verified-icon" />}
                  </div>
                  <div className="idet-channel-counts">
                    <span>{yt.videoCount || 0} videos</span>
                    <span>{formatCount(yt.subscribers)} subscribers</span>
                  </div>
                  <div className="idet-channel-name">{ytData.title || influencer.name}</div>
                  <div className="idet-channel-category">{niches[0] || 'Creator'}</div>
                </div>
              </section>
            )}

            {/* Instagram Channel Info */}
            {ig.followers > 0 && (
              <section className="idet-channel-info idet-channel-ig">
                <div className="idet-channel-avatar">
                  {igData.profilePicture ? (
                    <img src={igData.profilePicture} alt={igData.username || influencer.name} />
                  ) : (
                    <div className="idet-channel-avatar-ph idet-ig-grad"><Instagram size={28} /></div>
                  )}
                </div>
                <div className="idet-channel-details">
                  <div className="idet-channel-handle">
                    @{igData.username || influencer.name}
                    {(igData.isVerified || influencer.isVerified) && <CheckCircle size={16} className="idet-verified-icon" />}
                  </div>
                  <div className="idet-channel-counts">
                    <span>{ig.posts || 0} posts</span>
                    <span>{formatCount(ig.followers)} followers</span>
                  </div>
                  <div className="idet-channel-name">{igData.name || influencer.name}</div>
                  <div className="idet-channel-category">{niches[0] || 'Creator'}</div>
                </div>
              </section>
            )}

            {/* About / Bio */}
            {influencer.bio && (
              <section className="idet-section-card idet-bio-card">
                <h3 className="idet-sec-title">About</h3>
                <p className="idet-bio-text">{influencer.bio}</p>
              </section>
            )}

            {/* Recent YouTube Videos Carousel */}
            {recentVideos.length > 0 && (
              <section className="idet-section-card">
                <h3 className="idet-sec-title">Recent YouTube Videos ({recentVideos.length} videos)</h3>
                <div className="idet-carousel-wrap">
                  <button className="idet-carousel-arrow idet-arrow-left" onClick={() => scrollCarousel(ytScrollRef, 'left')}>
                    <ChevronLeft size={22} />
                  </button>
                  <div className="idet-video-carousel" ref={ytScrollRef}>
                    {recentVideos.map((v, i) => (
                      <a
                        key={v.videoId || i}
                        href={`https://www.youtube.com/watch?v=${v.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="idet-video-card"
                      >
                        <div className="idet-video-thumb">
                          <img src={v.thumbnail} alt={v.title} />
                          <div className="idet-play-overlay"><Play size={32} fill="#fff" /></div>
                          {v.duration && <span className="idet-vid-duration">{formatDuration(v.duration)}</span>}
                        </div>
                        <div className="idet-video-stats">
                          <span className="idet-vs-likes"><Heart size={13} /> {formatCount(v.likes)}</span>
                          <span className="idet-vs-views"><Eye size={13} /> {formatCount(v.views)}</span>
                          <span className="idet-vs-comments"><MessageCircle size={13} /> {formatCount(v.comments)}</span>
                        </div>
                        <p className="idet-video-title">{truncate(v.title, 55)}</p>
                        <span className="idet-video-date">{formatDate(v.publishedAt)}</span>
                      </a>
                    ))}
                  </div>
                  <button className="idet-carousel-arrow idet-arrow-right" onClick={() => scrollCarousel(ytScrollRef, 'right')}>
                    <ChevronRight size={22} />
                  </button>
                </div>
              </section>
            )}

            {/* Recent Instagram Posts Carousel */}
            {recentMedia.length > 0 && (
              <section className="idet-section-card">
                <h3 className="idet-sec-title">Recent Instagram Posts ({recentMedia.length} posts)</h3>
                <div className="idet-carousel-wrap">
                  <button className="idet-carousel-arrow idet-arrow-left" onClick={() => scrollCarousel(igScrollRef, 'left')}>
                    <ChevronLeft size={22} />
                  </button>
                  <div className="idet-video-carousel" ref={igScrollRef}>
                    {recentMedia.map((m, i) => (
                      <a
                        key={m.mediaId || i}
                        href={m.permalink || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="idet-video-card"
                      >
                        <div className="idet-video-thumb idet-thumb-square">
                          <img src={m.mediaUrl || m.thumbnail} alt={m.caption || 'Post'} />
                        </div>
                        <div className="idet-video-stats">
                          <span className="idet-vs-likes"><Heart size={13} /> {formatCount(m.likes)}</span>
                          <span className="idet-vs-comments"><MessageCircle size={13} /> {formatCount(m.comments)}</span>
                        </div>
                        <p className="idet-video-title">{truncate(m.caption, 55)}</p>
                        <span className="idet-video-date">{formatDate(m.timestamp)}</span>
                      </a>
                    ))}
                  </div>
                  <button className="idet-carousel-arrow idet-arrow-right" onClick={() => scrollCarousel(igScrollRef, 'right')}>
                    <ChevronRight size={22} />
                  </button>
                </div>
              </section>
            )}

            {/* Engagement & Campaign Row */}
            <div className="idet-twin-row">
              {/* Profile Engagement */}
              <div className="idet-section-card idet-engagement-card">
                <h3 className="idet-sec-title">Profile Engagement</h3>
                <div className="idet-engagement-body">
                  <div className="idet-engagement-list">
                    <div className="idet-eng-item">
                      <span className="idet-eng-dot" style={{ background: '#9B59B6' }}></span>
                      <span className="idet-eng-label">Average Likes</span>
                      <span className="idet-eng-val">{formatCount(ig.averageLikes || 0)}</span>
                    </div>
                    <div className="idet-eng-item">
                      <span className="idet-eng-dot" style={{ background: '#FF6B6B' }}></span>
                      <span className="idet-eng-label">Video views</span>
                      <span className="idet-eng-val">{formatCount(yt.totalViews || 0)}</span>
                    </div>
                    <div className="idet-eng-item">
                      <span className="idet-eng-dot" style={{ background: '#E4405F' }}></span>
                      <span className="idet-eng-label">Comments</span>
                      <span className="idet-eng-val">{formatCount(ig.averageComments || 0)}</span>
                    </div>
                  </div>
                  {/* Donut */}
                  <div className="idet-donut-wrap">
                    <svg viewBox="0 0 120 120" className="idet-donut">
                      <circle cx="60" cy="60" r="54" fill="none" stroke="#eee" strokeWidth="12" />
                      <circle
                        cx="60" cy="60" r="54" fill="none"
                        stroke="url(#donutGrad)" strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        transform="rotate(-90 60 60)"
                      />
                      <defs>
                        <linearGradient id="donutGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#9B59B6" />
                          <stop offset="100%" stopColor="#FF6B6B" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="idet-donut-pct">{engagementRate.toFixed(2)}%</span>
                  </div>
                </div>
                <div className="idet-eng-tip">
                  Achieving 5%+ engagement is good. 10%+ indicates strong performance
                </div>
              </div>

              {/* Campaign History */}
              <div className="idet-section-card idet-campaign-card">
                <div className="idet-campaign-head">
                  <h3 className="idet-sec-title">Campaign History</h3>
                  <span className="idet-campaign-count">{influencer.campaignsCompleted || 0}</span>
                </div>
                {(influencer.campaignsCompleted || 0) === 0 ? (
                  <div className="idet-campaign-empty">
                    <div className="idet-campaign-illust">
                      <Briefcase size={40} />
                    </div>
                    <p>No campaigns to present at this moment</p>
                  </div>
                ) : (
                  <div className="idet-campaign-done">
                    <Briefcase size={28} />
                    <span>{influencer.campaignsCompleted} campaigns completed</span>
                  </div>
                )}
              </div>
            </div>

            {/* My Commercials (Services Table) */}
            <section className="idet-section-card idet-commercials">
              <h3 className="idet-commercials-title">My Commercials</h3>
              {services.length > 0 ? (
                <div className="idet-table-wrap">
                  <table className="idet-table">
                    <thead>
                      <tr>
                        <th>Items</th>
                        <th>Prices</th>
                        <th>Comments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.map((s, i) => (
                        <tr key={s._id || i}>
                          <td>{s.name}</td>
                          <td className="idet-price-cell">${s.price}</td>
                          <td>
                            <span className="idet-svc-desc">{s.description || '\u2014'}</span>
                            {isBrand && (
                              <button className="idet-req-btn" onClick={() => handleCollaborate(s)}>
                                Request
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="idet-no-services">No services listed yet.</p>
              )}
            </section>
          </main>
        </div>
      </div>

      {/* Collaboration Modal */}
      {showModal && (
        <div className="idet-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="idet-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="idet-modal-header">
              <h2>Send Collaboration Request</h2>
              <button className="idet-modal-close" onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmitRequest} className="idet-modal-form">
              <div className="idet-modal-info">
                <div className="idet-info-row">
                  <span className="idet-info-label">Influencer:</span>
                  <span className="idet-info-value">{influencer.name}</span>
                </div>
                <div className="idet-info-row">
                  <span className="idet-info-label">Service:</span>
                  <span className="idet-info-value">{selectedService?.name}</span>
                </div>
                <div className="idet-info-row">
                  <span className="idet-info-label">Budget:</span>
                  <span className="idet-info-value idet-price">${selectedService?.price}</span>
                </div>
              </div>
              <div className="input-group">
                <label htmlFor="deadline">Deadline</label>
                <input type="date" id="deadline" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="input" min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="input-group">
                <label htmlFor="message">Message</label>
                <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your collaboration requirements..." className="input idet-textarea" rows={5} required />
              </div>
              <div className="idet-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Send size={18} /> Send Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfluencerDetail;
