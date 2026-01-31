import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
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

  useEffect(() => {
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
      animatedElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  const featuredInfluencers = influencers.slice(0, 6);

  // How It Works - 3 Step Process
  const portfolioItems = [
    {
      id: 1,
      title: 'Brands Create Campaigns',
      category: 'Step 1',
      description: [
        'Businesses post their advertising requirements on Collabzy',
        'Set budget and platform type (Instagram/YouTube)',
        'Define influencer eligibility criteria',
        'Reach the right audience for your brand'
      ],
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
      stats: { views: 'Easy', engagement: 'Setup' }
    },
    {
      id: 2,
      title: 'Creators Get Matched',
      category: 'Step 2',
      description: [
        'Influencers discover campaigns that fit their niche',
        'Filter by reach and engagement requirements',
        'Apply directly to relevant campaigns',
        'Receive smart campaign suggestions automatically'
      ],
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop',
      stats: { views: 'Smart', engagement: 'Match' }
    },
    {
      id: 3,
      title: 'Collaborate & Confirm Deals',
      category: 'Step 3',
      description: [
        'Brands and creators connect through secure chat',
        'Finalize terms and deliverables together',
        'Confirm collaborations safely within Collabzy',
        'Track progress and complete successful campaigns'
      ],
      image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop',
      stats: { views: 'Secure', engagement: 'Deals' }
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
    <div className="home-page">
      {/* Hero Section with Wavy Background */}
      <section className="home-hero">
        <div className="home-hero-wave-bg">
          <svg className="home-wave-top" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="#FFE4D6" d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,181.3C960,203,1056,213,1152,197.3C1248,181,1344,139,1392,117.3L1440,96L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
          </svg>
        </div>

        <div className="home-hero-container">
          <div className="home-hero-content" data-animate>
            <div className="home-hero-logo-area">
              <div className="home-hero-logo-icon">
                <Sparkles size={24} />
              </div>
              <span className="home-hero-brand">Collabzy</span>
            </div>

            <h1 className="home-hero-title">
              <span className="home-title-line">connecting</span>
              <span className="home-title-accent">
                <span className="home-handwritten">brands</span>
                <span className="home-and-symbol">&</span>
                <span className="home-handwritten">creators</span>
              </span>
            </h1>

            <p className="home-hero-subtitle">
              a platform for modern influencer marketing
            </p>

            <Link to="/influencers" className="home-hero-cta-btn">
              <span>Explore Creators</span>
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="home-hero-image-area" data-animate>
            <div className="home-hero-mockup">
              <img
                src="https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=500&h=400&fit=crop"
                alt="Platform Preview"
                className="home-mockup-image"
              />
              <div className="home-mockup-overlay">
                <div className="home-mockup-stat">
                  <span className="home-stat-value">50K+</span>
                  <span className="home-stat-label">Creators</span>
                </div>
              </div>
            </div>
            <div className="home-floating-badge home-badge-1">
              <Heart size={16} fill="currentColor" />
              <span>10K+ Collaborations</span>
            </div>
          </div>
        </div>

        <div className="home-scroll-indicator">
          <div className="home-scroll-dot"></div>
        </div>
      </section>

      {/* Portfolio Section - Stacked Sticky Cards */}
      <section className="home-portfolio-section" id="how-it-works">
        <div className="home-section-container">
          <div className="home-section-header" data-animate>
            <h2 className="home-section-title">
              <span className="home-title-small">How</span>
              <span className="home-title-large">
                it  <span className="home-handwritten home-accent-pink"> Works ?</span> 
              </span>
            </h2>
          </div>

          <div className="home-portfolio-list">
            {portfolioItems.map((item, index) => (
              <div
                key={item.id}
                className={`home-portfolio-card ${index % 2 === 1 ? 'home-reverse' : ''}`}
                data-animate
              >
                <div className="home-portfolio-content">
                  <span className="home-portfolio-category">{item.category}</span>
                  <h3 className="home-portfolio-title">{item.title}</h3>
                  <ul className="home-portfolio-features">
                    {item.description.map((desc, i) => (
                      <li key={i}>
                        <CheckCircle size={16} />
                        <span>{desc}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="home-portfolio-stats">
                    <div className="home-stat-item">
                      <span className="home-stat-label">Views</span>
                      <span className="home-stat-value">{item.stats.views}</span>
                    </div>
                    <div className="home-stat-item">
                      <span className="home-stat-label">Engagement</span>
                      <span className="home-stat-value">{item.stats.engagement}</span>
                    </div>
                  </div>
                  <Link to="/influencers" className="home-portfolio-link">
                    <span>See Case Study</span>
                    <ExternalLink size={16} />
                  </Link>
                </div>
                <div className="home-portfolio-image-wrapper">
                  <img src={item.image} alt={item.title} className="home-portfolio-image" />
                  <div className="home-image-decoration"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section with Video Grid */}
      <section className="home-testimonials-section">
        <div className="home-testimonials-wave-top"></div>

        <div className="home-section-container">
          <div className="home-section-header" data-animate>
            <h2 className="home-section-title home-light">
              <span className="home-title-small">What my</span>
              <span className="home-title-large">
                <span className="home-handwritten home-accent-cream">Clients</span> say
              </span>
            </h2>
          </div>

          <div className="home-video-testimonials-grid" data-animate>
            {videoTestimonials.map((testimonial) => (
              <div key={testimonial.id} className="home-video-testimonial-card">
                <div className="home-video-thumbnail">
                  <img src={testimonial.image} alt={testimonial.name} />
                  <button className="home-play-button">
                    <Play size={24} fill="currentColor" />
                  </button>
                </div>
                <div className="home-testimonial-info">
                  <span className="home-testimonial-name">{testimonial.name}</span>
                  <span className="home-testimonial-role">{testimonial.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="home-testimonials-wave-bottom"></div>
      </section>

      {/* Services/Pricing Section */}
      <section className="home-pricing-section">
        <div className="home-section-container">
          <div className="home-section-header" data-animate>
            <h2 className="home-section-title">
              <span className="home-title-small">Ser</span>
              <span className="home-title-large">
                <span className="home-handwritten home-accent-green">vices</span>
                <span className="home-title-small home-inline"> I offer</span>
              </span>
            </h2>
          </div>

          <div className="home-pricing-grid" data-animate>
            {pricingPackages.map((pkg) => (
              <div key={pkg.id} className={`home-pricing-card ${pkg.popular ? 'home-popular' : ''}`}>
                {pkg.popular && <div className="home-popular-badge">Most Popular</div>}

                <div className="home-pricing-header">
                  <h3 className="home-pricing-name">{pkg.name}</h3>
                  <div className="home-pricing-amount">
                    <span className="home-currency">$</span>
                    <span className="home-price">{pkg.price}</span>
                    <span className="home-period">/{pkg.period}</span>
                  </div>
                  <p className="home-pricing-description">{pkg.description}</p>
                </div>

                <div className="home-pricing-testimonial">
                  <p className="home-testimonial-text">{pkg.testimonial.text}</p>
                  <span className="home-testimonial-author">{pkg.testimonial.author}</span>
                </div>

                <ul className="home-pricing-features">
                  {pkg.features.map((feature, index) => (
                    <li key={index}>
                      <CheckCircle size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/register" className="home-pricing-cta">
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="home-contact-section">
        <div className="home-contact-wave-bg"></div>

        <div className="home-section-container">
          <div className="home-contact-content" data-animate>
            <div className="home-contact-illustration">
              <div className="home-illustration-circle">
                <MessageSquare size={48} />
              </div>
              <div className="home-illustration-dots">
                <span></span><span></span><span></span>
              </div>
            </div>

            <div className="home-contact-header">
              <h2 className="home-section-title">
                <span className="home-title-small">Have any other questions?</span>
              </h2>
              <p className="home-contact-subtitle">
                Fill the form or DM me on X. I usually respond within 24 hours.
              </p>
            </div>

            <form className="home-contact-form">
              <div className="home-form-group">
                <label>Name</label>
                <input type="text" placeholder="Your name" />
              </div>
              <div className="home-form-group">
                <label>Email</label>
                <input type="email" placeholder="your@email.com" />
              </div>
              <div className="home-form-group">
                <label>Message</label>
                <textarea placeholder="Tell us about your project..." rows={4}></textarea>
              </div>
              <button type="submit" className="home-submit-btn">
                <span>Submit Message</span>
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="home-final-cta-section">
        <div className="home-section-container">
          <div className="home-cta-content" data-animate>
            <h2 className="home-cta-title">Ready to Bring Your Vision to Life?</h2>
            <p className="home-cta-subtitle">
              Let's collaborate! Join thousands of brands and creators
              building amazing campaigns together.
            </p>
            <Link to="/register" className="home-cta-button">
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
