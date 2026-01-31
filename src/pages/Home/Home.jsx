import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import {
  ArrowRight,
  CheckCircle,
  Sparkles,
  MessageSquare,
  Send,
  Play,
  ExternalLink,
  Heart
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import './Home.css';

const Home = () => {
  const { influencers } = useData();
  const lenisRef = useRef(null);

  useEffect(() => {
    // Initialize Lenis smooth scroll
    lenisRef.current = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    // RAF loop for Lenis
    function raf(time) {
      lenisRef.current?.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Scroll animation observer
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('[data-animate]');
    animatedElements.forEach(el => observer.observe(el));

    return () => {
      lenisRef.current?.destroy();
      animatedElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  const featuredInfluencers = influencers.slice(0, 6);

  // Portfolio/Project items with placeholder content
  const portfolioItems = [
    {
      id: 1,
      title: 'Fashion Brand Campaign',
      category: 'Instagram • Lifestyle',
      description: [
        'Complete social media campaign with 50+ posts',
        'Increased brand awareness by 180%',
        'Reached 2M+ targeted audience',
        'Generated 500+ user-generated content pieces'
      ],
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
      stats: { views: '2.4M', engagement: '8.5%' }
    },
    {
      id: 2,
      title: 'Tech Product Launch',
      category: 'YouTube • Technology',
      description: [
        'Product review and unboxing series',
        'Collaborated with 15 tech influencers',
        'Achieved 1M+ views in first week',
        'Drove 25K+ website conversions'
      ],
      image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=300&fit=crop',
      stats: { views: '1.2M', engagement: '6.2%' }
    },
    {
      id: 3,
      title: 'Beauty Collection Promo',
      category: 'TikTok • Beauty',
      description: [
        'Viral TikTok challenge campaign',
        'Featured 30+ beauty creators',
        'Hashtag reached 50M+ impressions',
        'Sold out product in 48 hours'
      ],
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop',
      stats: { views: '5.8M', engagement: '12.3%' }
    },
    {
      id: 4,
      title: 'Fitness App Collaboration',
      category: 'Multi-Platform • Health',
      description: [
        'Cross-platform fitness challenge',
        'Partnered with 20 fitness influencers',
        'Generated 100K+ app downloads',
        'Built engaged community of 50K+'
      ],
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
      stats: { views: '3.1M', engagement: '9.7%' }
    }
  ];

  // Testimonial videos with placeholder content
  const videoTestimonials = [
    { id: 1, name: 'Alex Rivera', role: 'Brand Manager', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
    { id: 2, name: 'Sarah Kim', role: 'Marketing Lead', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    { id: 3, name: 'Jordan Chen', role: 'Startup Founder', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan' },
    { id: 4, name: 'Maya Patel', role: 'Content Creator', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya' },
    { id: 5, name: 'Chris Taylor', role: 'E-commerce Owner', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chris' },
    { id: 6, name: 'Lisa Wong', role: 'Agency Director', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa' }
  ];

  // Pricing packages
  const pricingPackages = [
    {
      id: 1,
      name: 'Starter',
      price: '299',
      period: 'month',
      description: 'Perfect for small businesses and startups looking to start their influencer marketing journey.',
      features: [
        'Up to 5 influencer connections',
        'Basic analytics dashboard',
        'Email support',
        '1 active campaign',
        'Standard matching algorithm'
      ],
      testimonial: {
        text: '"Great for getting started. Found amazing micro-influencers for our brand!"',
        author: 'Jamie L. - Small Business Owner'
      },
      popular: false
    },
    {
      id: 2,
      name: 'Professional',
      price: '799',
      period: 'month',
      description: 'Full-featured platform for growing brands with advanced tools and priority support.',
      features: [
        'Unlimited influencer connections',
        'Advanced analytics & reporting',
        'Priority 24/7 support',
        'Unlimited campaigns',
        'AI-powered matching',
        'Secure payment escrow',
        'Campaign performance tracking'
      ],
      testimonial: {
        text: '"The AI matching is incredible. Our ROI increased by 300% in just 3 months!"',
        author: 'Michael R. - Marketing Director'
      },
      popular: true
    }
  ];

  return (
    <div className="home-playful">
      {/* Hero Section with Wavy Background */}
      <section className="hero-section">
        <div className="hero-wave-bg">
          <svg className="wave-top" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="#FFE4D6" d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,181.3C960,203,1056,213,1152,197.3C1248,181,1344,139,1392,117.3L1440,96L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
          </svg>
        </div>

        <div className="hero-container">
          <div className="hero-content" data-animate>
            <div className="hero-logo-area">
              <div className="hero-logo-icon">
                <Sparkles size={24} />
              </div>
              <span className="hero-brand">Collabzy</span>
            </div>

            <h1 className="hero-title">
              <span className="title-line">connecting</span>
              <span className="title-accent">
                <span className="handwritten">brands</span>
                <span className="and-symbol">&</span>
                <span className="handwritten">creators</span>
              </span>
            </h1>

            <p className="hero-subtitle">
              a platform for modern influencer marketing
            </p>

            <Link to="/influencers" className="hero-cta-btn">
              <span>Explore Creators</span>
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="hero-image-area" data-animate>
            <div className="hero-mockup">
              <img
                src="https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=500&h=400&fit=crop"
                alt="Platform Preview"
                className="mockup-image"
              />
              <div className="mockup-overlay">
                <div className="mockup-stat">
                  <span className="stat-value">50K+</span>
                  <span className="stat-label">Creators</span>
                </div>
              </div>
            </div>
            <div className="floating-badge badge-1">
              <Heart size={16} fill="currentColor" />
              <span>10K+ Collaborations</span>
            </div>
          </div>
        </div>

        <div className="scroll-indicator">
          <div className="scroll-dot"></div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section className="portfolio-section">
        <div className="section-container">
          <div className="section-header" data-animate>
            <h2 className="section-title playful-title">
              <span className="title-small">Look what</span>
              <span className="title-large">
                we <span className="handwritten accent-pink">made!</span>
              </span>
            </h2>
          </div>

          <div className="portfolio-list">
            {portfolioItems.map((item, index) => (
              <div
                key={item.id}
                className={`portfolio-card ${index % 2 === 1 ? 'reverse' : ''}`}
                data-animate
              >
                <div className="portfolio-content">
                  <span className="portfolio-category">{item.category}</span>
                  <h3 className="portfolio-title">{item.title}</h3>
                  <ul className="portfolio-features">
                    {item.description.map((desc, i) => (
                      <li key={i}>
                        <CheckCircle size={16} />
                        <span>{desc}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="portfolio-stats">
                    <div className="stat-item">
                      <span className="stat-label">Views</span>
                      <span className="stat-value">{item.stats.views}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Engagement</span>
                      <span className="stat-value">{item.stats.engagement}</span>
                    </div>
                  </div>
                  <Link to="/influencers" className="portfolio-link">
                    <span>See Case Study</span>
                    <ExternalLink size={16} />
                  </Link>
                </div>
                <div className="portfolio-image-wrapper">
                  <img src={item.image} alt={item.title} className="portfolio-image" />
                  <div className="image-decoration"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section with Video Grid */}
      <section className="testimonials-section">
        <div className="testimonials-wave-top"></div>

        <div className="section-container">
          <div className="section-header" data-animate>
            <h2 className="section-title playful-title light">
              <span className="title-small">What my</span>
              <span className="title-large">
                <span className="handwritten accent-cream">Clients</span> say
              </span>
            </h2>
          </div>

          <div className="video-testimonials-grid" data-animate>
            {videoTestimonials.map((testimonial) => (
              <div key={testimonial.id} className="video-testimonial-card">
                <div className="video-thumbnail">
                  <img src={testimonial.image} alt={testimonial.name} />
                  <button className="play-button">
                    <Play size={24} fill="currentColor" />
                  </button>
                </div>
                <div className="testimonial-info">
                  <span className="testimonial-name">{testimonial.name}</span>
                  <span className="testimonial-role">{testimonial.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="testimonials-wave-bottom"></div>
      </section>

      {/* Services/Pricing Section */}
      <section className="pricing-section">
        <div className="section-container">
          <div className="section-header" data-animate>
            <h2 className="section-title playful-title">
              <span className="title-small">Ser</span>
              <span className="title-large">
                <span className="handwritten accent-green">vices</span>
                <span className="title-small inline"> I offer</span>
              </span>
            </h2>
          </div>

          <div className="pricing-grid" data-animate>
            {pricingPackages.map((pkg) => (
              <div key={pkg.id} className={`pricing-card ${pkg.popular ? 'popular' : ''}`}>
                {pkg.popular && <div className="popular-badge">Most Popular</div>}

                <div className="pricing-header">
                  <h3 className="pricing-name">{pkg.name}</h3>
                  <div className="pricing-amount">
                    <span className="currency">$</span>
                    <span className="price">{pkg.price}</span>
                    <span className="period">/{pkg.period}</span>
                  </div>
                  <p className="pricing-description">{pkg.description}</p>
                </div>

                <div className="pricing-testimonial">
                  <p className="testimonial-text">{pkg.testimonial.text}</p>
                  <span className="testimonial-author">{pkg.testimonial.author}</span>
                </div>

                <ul className="pricing-features">
                  {pkg.features.map((feature, index) => (
                    <li key={index}>
                      <CheckCircle size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/register" className="pricing-cta">
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="contact-wave-bg"></div>

        <div className="section-container">
          <div className="contact-content" data-animate>
            <div className="contact-illustration">
              <div className="illustration-circle">
                <MessageSquare size={48} />
              </div>
              <div className="illustration-dots">
                <span></span><span></span><span></span>
              </div>
            </div>

            <div className="contact-header">
              <h2 className="section-title playful-title">
                <span className="title-small">Have any other questions?</span>
              </h2>
              <p className="contact-subtitle">
                Fill the form or DM me on X. I usually respond within 24 hours.
              </p>
            </div>

            <form className="contact-form">
              <div className="form-group">
                <label>Name</label>
                <input type="text" placeholder="Your name" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="your@email.com" />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea placeholder="Tell us about your project..." rows={4}></textarea>
              </div>
              <button type="submit" className="submit-btn">
                <span>Submit Message</span>
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="final-cta-section">
        <div className="section-container">
          <div className="cta-content" data-animate>
            <h2 className="cta-title">Ready to Bring Your Vision to Life?</h2>
            <p className="cta-subtitle">
              Let's collaborate! Join thousands of brands and creators
              building amazing campaigns together.
            </p>
            <Link to="/register" className="cta-button">
              <span>Start Now</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
