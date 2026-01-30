import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  ArrowRight,
  Users,
  Star,
  TrendingUp,
  CheckCircle,
  Sparkles,
  Search,
  Instagram,
  Youtube,
  Video,
  MessageSquare,
  Shield,
  Zap,
  BarChart3,
  Send,
  Target,
  Calendar,
  DollarSign,
  FileText,
  Quote,
  Play,
  Award,
  Rocket,
  Globe
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import './Home.css';

const Home = () => {
  const { influencers } = useData();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    // Scroll animation observer
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('home-animate-in');
        }
      });
    }, observerOptions);

    // Observe all elements with scroll animation
    const animatedElements = document.querySelectorAll('[data-scroll-animate]');
    animatedElements.forEach(el => observer.observe(el));

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      animatedElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  const featuredInfluencers = influencers.slice(0, 6);

  const heroFeatures = [
    { icon: <Rocket size={20} />, text: 'AI-Powered Matching' },
    { icon: <Shield size={20} />, text: 'Secure Payments' },
    { icon: <Zap size={20} />, text: 'Instant Collaboration' },
  ];

  const platformFeatures = [
    {
      icon: <Search size={32} />,
      title: 'Smart Discovery',
      description: 'AI-powered search finds perfect creators instantly',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: <MessageSquare size={32} />,
      title: 'Real-Time Chat',
      description: 'Collaborate seamlessly with built-in messaging',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Shield size={32} />,
      title: 'Secure Escrow',
      description: 'Protected payments for peace of mind',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: <BarChart3 size={32} />,
      title: 'Analytics Dashboard',
      description: 'Track performance with real-time insights',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: <Zap size={32} />,
      title: 'Instant Approval',
      description: 'Fast-track collaborations with one click',
      gradient: 'from-violet-500 to-purple-500'
    },
    {
      icon: <Award size={32} />,
      title: 'Verified Creators',
      description: 'Work with authenticated influencers only',
      gradient: 'from-yellow-500 to-amber-500'
    }
  ];

  const stats = [
    { value: '50K+', label: 'Active Creators', icon: <Users size={24} /> },
    { value: '10K+', label: 'Brands', icon: <Sparkles size={24} /> },
    { value: '100K+', label: 'Collaborations', icon: <Rocket size={24} /> },
    { value: '98%', label: 'Success Rate', icon: <Award size={24} /> }
  ];

  const testimonials = [
    {
      name: 'Sarah Mitchell',
      role: 'Marketing Director',
      company: 'TechVision',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      rating: 5,
      quote: 'Collabzy transformed our influencer marketing. The AI matching is incredible!'
    },
    {
      name: 'Alex Chen',
      role: 'Founder',
      company: 'StartupHub',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      rating: 5,
      quote: 'Best platform for finding authentic creators. ROI increased by 300%!'
    },
    {
      name: 'Emma Davis',
      role: 'Content Creator',
      company: '@emmalifestyle',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
      rating: 5,
      quote: 'Finally, a platform that values creators. Payments are instant and secure!'
    }
  ];

  return (
    <div className="home-futuristic">
      {/* Animated Background */}
      <div className="home-bg-animated">
        <div className="home-gradient-orb home-orb-1"></div>
        <div className="home-gradient-orb home-orb-2"></div>
        <div className="home-gradient-orb home-orb-3"></div>
        <div className="home-particles">
          {[...Array(50)].map((_, i) => (
            <div key={i} className="home-particle" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}></div>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <section className="home-hero-section">
        <div className="home-hero-container">
          <div className="home-hero-content" data-scroll-animate>
            <div className="home-hero-badge">
              <Sparkles size={16} className="home-badge-icon" />
              <span>Next-Gen Influencer Platform</span>
              <div className="home-badge-glow"></div>
            </div>

            <h1 className="home-hero-title">
              <span className="home-title-line" data-animate-in>
                The Future of
              </span>
              <span className="home-title-gradient" data-animate-in>
                Influencer Marketing
              </span>
              <span className="home-title-line" data-animate-in>
                Starts Here
              </span>
            </h1>

            <p className="home-hero-description" data-animate-in>
              Connect with verified creators, launch campaigns in minutes, and track
              real-time performance with AI-powered insights.
            </p>

            {/* Animated Search Bar */}
            <div className="home-search-container" data-animate-in>
              <div className="home-search-wrapper">
                <Search size={20} className="home-search-icon" />
                <input
                  type="text"
                  placeholder="Search creators by niche, platform, or name..."
                  className="home-search-input"
                />
                <Link to="/influencers" className="home-search-btn">
                  <span>Explore</span>
                  <ArrowRight size={18} />
                </Link>
              </div>
              <div className="home-search-glow"></div>
            </div>

            {/* Hero Features */}
            <div className="home-hero-features" data-animate-in>
              {heroFeatures.map((feature, index) => (
                <div key={index} className="home-hero-feature-item">
                  {feature.icon}
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="home-hero-cta" data-animate-in>
              <Link to="/register?role=brand" className="home-btn-primary">
                <span>Start as Brand</span>
                <ArrowRight size={20} />
                <div className="home-btn-glow"></div>
              </Link>
              <Link to="/register?role=influencer" className="home-btn-secondary">
                <Play size={20} />
                <span>Join as Creator</span>
              </Link>
            </div>
          </div>

          {/* Floating Elements */}
          <div className="home-hero-floating">
            <div className="home-float-card home-float-1" style={{
              transform: `translateY(${scrollY * 0.1}px)`
            }}>
              <div className="home-float-icon">
                <TrendingUp size={24} />
              </div>
              <div className="home-float-text">
                <div className="home-float-value">+245%</div>
                <div className="home-float-label">ROI Growth</div>
              </div>
            </div>
            <div className="home-float-card home-float-2" style={{
              transform: `translateY(${scrollY * 0.15}px)`
            }}>
              <div className="home-float-icon">
                <Users size={24} />
              </div>
              <div className="home-float-text">
                <div className="home-float-value">50K+</div>
                <div className="home-float-label">Creators</div>
              </div>
            </div>
            <div className="home-float-card home-float-3" style={{
              transform: `translateY(${scrollY * 0.12}px)`
            }}>
              <div className="home-float-icon">
                <Rocket size={24} />
              </div>
              <div className="home-float-text">
                <div className="home-float-value">24/7</div>
                <div className="home-float-label">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Animated Stats */}
      <section className="home-stats-section">
        <div className="home-stats-container">
          {stats.map((stat, index) => (
            <div key={index} className="home-stat-card" data-scroll-animate>
              <div className="home-stat-icon">{stat.icon}</div>
              <div className="home-stat-value">{stat.value}</div>
              <div className="home-stat-label">{stat.label}</div>
              <div className="home-stat-glow"></div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="home-how-it-works-section">
        <div className="home-section-container">
          <div className="home-section-header" data-scroll-animate>
            <div className="home-section-badge">
              <Rocket size={16} />
              <span>How It Works</span>
            </div>
            <h2 className="home-section-title">
              Start Your Journey in
              <span className="home-title-accent"> 3 Simple Steps</span>
            </h2>
            <p className="home-section-subtitle">
              From signup to collaboration in minutes
            </p>
          </div>

          <div className="home-steps-container">
            <div className="home-step-card" data-scroll-animate>
              <div className="home-step-number">
                <span>01</span>
              </div>
              <div className="home-step-icon">
                <Users size={32} />
              </div>
              <h3 className="home-step-title">Create Your Profile</h3>
              <p className="home-step-description">
                Sign up as an influencer or brand. Build your profile with portfolio,
                metrics, and showcase your unique value proposition.
              </p>
              <div className="home-step-glow"></div>
            </div>

            <div className="home-step-arrow" data-scroll-animate>
              <ArrowRight size={32} />
            </div>

            <div className="home-step-card" data-scroll-animate style={{ animationDelay: '0.2s' }}>
              <div className="home-step-number">
                <span>02</span>
              </div>
              <div className="home-step-icon">
                <Search size={32} />
              </div>
              <h3 className="home-step-title">Discover & Connect</h3>
              <p className="home-step-description">
                Use AI-powered search to find perfect matches. Filter by niche,
                engagement rate, and platform. Send collaboration requests instantly.
              </p>
              <div className="home-step-glow"></div>
            </div>

            <div className="home-step-arrow" data-scroll-animate>
              <ArrowRight size={32} />
            </div>

            <div className="home-step-card" data-scroll-animate style={{ animationDelay: '0.4s' }}>
              <div className="home-step-number">
                <span>03</span>
              </div>
              <div className="home-step-icon">
                <Rocket size={32} />
              </div>
              <h3 className="home-step-title">Launch & Track</h3>
              <p className="home-step-description">
                Manage collaborations, track progress, and communicate in real-time.
                Secure payments and detailed analytics included.
              </p>
              <div className="home-step-glow"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="home-features-section">
        <div className="home-section-container">
          <div className="home-section-header" data-scroll-animate>
            <div className="home-section-badge">
              <Zap size={16} />
              <span>Platform Features</span>
            </div>
            <h2 className="home-section-title">
              Everything You Need to
              <span className="home-title-accent"> Succeed</span>
            </h2>
            <p className="home-section-subtitle">
              Powerful tools designed for modern influencer marketing
            </p>
          </div>

          <div className="home-features-grid">
            {platformFeatures.map((feature, index) => (
              <div key={index} className="home-feature-card" data-scroll-animate style={{ animationDelay: `${index * 0.1}s` }}>
                <div className={`home-feature-icon bg-gradient-to-br ${feature.gradient}`}>
                  {feature.icon}
                  <div className="home-feature-icon-glow"></div>
                </div>
                <h3 className="home-feature-title">{feature.title}</h3>
                <p className="home-feature-description">{feature.description}</p>
                <div className="home-feature-hover-effect"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Influencer Showcase - Instagram Style */}
      <section className="home-showcase-section">
        <div className="home-section-container">
          <div className="home-section-header" data-scroll-animate>
            <div className="home-section-badge">
              <Star size={16} />
              <span>Top Creators</span>
            </div>
            <h2 className="home-section-title">
              Featured
              <span className="home-title-accent"> Influencers</span>
            </h2>
          </div>

          <div className="home-showcase-grid">
            {featuredInfluencers.map((influencer, index) => (
              <div
                key={influencer.id}
                className="home-insta-card"
                data-scroll-animate
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Instagram-style Header */}
                <div className="home-insta-header">
                  <div className="home-insta-avatar-wrapper">
                    <div className="home-insta-avatar-ring">
                      <img src={influencer.avatar} alt={influencer.name} className="home-insta-avatar" />
                    </div>
                    {influencer.verified && (
                      <div className="home-insta-verified">
                        <CheckCircle size={20} />
                      </div>
                    )}
                  </div>

                  <div className="home-insta-stats">
                    <div className="home-insta-stat">
                      <div className="home-insta-stat-value">{influencer.followers}</div>
                      <div className="home-insta-stat-label">Followers</div>
                    </div>
                    <div className="home-insta-stat">
                      <div className="home-insta-stat-value">{250 + (index * 50)}</div>
                      <div className="home-insta-stat-label">Posts</div>
                    </div>
                    <div className="home-insta-stat">
                      <div className="home-insta-stat-value">{influencer.engagementRate || '4.2%'}</div>
                      <div className="home-insta-stat-label">Engagement</div>
                    </div>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="home-insta-info">
                  <h3 className="home-insta-name">{influencer.name}</h3>
                  <p className="home-insta-category">{influencer.niche}</p>
                  <p className="home-insta-bio">
                    Professional {influencer.niche.toLowerCase()} creator • Collaborations welcome
                  </p>

                  <div className="home-insta-platforms">
                    <Instagram size={16} />
                    <Youtube size={16} />
                    <Video size={16} />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="home-insta-actions">
                  <Link to={`/influencer/${influencer.id}`} className="home-insta-btn-primary">
                    <span>View Profile</span>
                  </Link>
                  <button className="home-insta-btn-secondary">
                    <MessageSquare size={18} />
                  </button>
                </div>

                {/* Rating & Price */}
                <div className="home-insta-footer">
                  <div className="home-insta-rating">
                    <Star size={16} fill="currentColor" />
                    <span>{influencer.rating}</span>
                    <span className="home-insta-reviews">({100 + (index * 30)} reviews)</span>
                  </div>
                  <div className="home-insta-price">
                    From <strong>${200 + (index * 75)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="home-testimonials-section">
        <div className="home-section-container">
          <div className="home-section-header" data-scroll-animate>
            <div className="home-section-badge">
              <Quote size={16} />
              <span>Testimonials</span>
            </div>
            <h2 className="home-section-title">
              Loved by
              <span className="home-title-accent"> Thousands</span>
            </h2>
          </div>

          <div className="home-testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="home-testimonial-card" data-scroll-animate style={{ animationDelay: `${index * 0.15}s` }}>
                <div className="home-testimonial-quote-icon">
                  <Quote size={24} />
                </div>
                <div className="home-testimonial-rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <p className="home-testimonial-quote">"{testimonial.quote}"</p>
                <div className="home-testimonial-author">
                  <img src={testimonial.avatar} alt={testimonial.name} className="home-testimonial-avatar" />
                  <div className="home-testimonial-info">
                    <h4 className="home-testimonial-name">{testimonial.name}</h4>
                    <p className="home-testimonial-role">{testimonial.role} • {testimonial.company}</p>
                  </div>
                </div>
                <div className="home-testimonial-glow"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="home-cta-section">
        <div className="home-cta-container" data-scroll-animate>
          <div className="home-cta-content">
            <div className="home-cta-icon">
              <Rocket size={48} />
            </div>
            <h2 className="home-cta-title">
              Ready to Transform Your
              <span className="home-title-accent"> Marketing?</span>
            </h2>
            <p className="home-cta-description">
              Join thousands of brands and creators building the future of influencer marketing
            </p>
            <div className="home-cta-buttons">
              <Link to="/register?role=brand" className="home-btn-primary home-btn-large">
                <span>Get Started Free</span>
                <ArrowRight size={22} />
                <div className="home-btn-glow"></div>
              </Link>
              <Link to="/register?role=influencer" className="home-btn-glass home-btn-large">
                <Globe size={22} />
                <span>Join as Creator</span>
              </Link>
            </div>
          </div>
          <div className="home-cta-glow"></div>
        </div>
      </section>
    </div>
  );
};

export default Home;
