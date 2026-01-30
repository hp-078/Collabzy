import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Users, 
  Briefcase, 
  MessageSquare, 
  Shield, 
  Star,
  TrendingUp,
  CheckCircle,
  Zap
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import './Home.css';

const Home = () => {
  const { influencers } = useData();
  const featuredInfluencers = influencers.slice(0, 3);

  const features = [
    {
      icon: <Users size={32} />,
      title: 'Find Perfect Matches',
      description: 'Browse verified influencers across all niches. Filter by platform, followers, and specialty.'
    },
    {
      icon: <MessageSquare size={32} />,
      title: 'Direct Communication',
      description: 'Connect directly with influencers. Discuss requirements, negotiate terms, and build relationships.'
    },
    {
      icon: <Briefcase size={32} />,
      title: 'Track Collaborations',
      description: 'Manage all your collaborations in one place. From initial contact to final delivery.'
    },
    {
      icon: <Shield size={32} />,
      title: 'Verified Profiles',
      description: 'All profiles are verified to ensure authenticity. Work with real influencers and genuine brands.'
    }
  ];

  const stats = [
    { value: '10K+', label: 'Active Influencers' },
    { value: '5K+', label: 'Brands Onboard' },
    { value: '25K+', label: 'Successful Collabs' },
    { value: '98%', label: 'Satisfaction Rate' }
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Create Your Profile',
      description: 'Sign up as an influencer or brand. Complete your profile with relevant details.'
    },
    {
      step: '02',
      title: 'Discover & Connect',
      description: 'Browse profiles, find the perfect match, and send collaboration requests.'
    },
    {
      step: '03',
      title: 'Collaborate & Grow',
      description: 'Work together, track progress, and build lasting partnerships.'
    }
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-pattern"></div>
        </div>
        <div className="hero-container">
          <div className="hero-content">
            <span className="hero-badge">
              <Zap size={16} />
              The Future of Influencer Marketing
            </span>
            <h1 className="hero-title">
              Connect. Collaborate.
              <span className="hero-title-highlight"> Create Impact.</span>
            </h1>
            <p className="hero-description">
              Collabzy is the premier platform connecting social media influencers 
              with brands for meaningful collaborations. Build partnerships that drive results.
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started Free
                <ArrowRight size={20} />
              </Link>
              <Link to="/influencers" className="btn btn-secondary btn-lg">
                Browse Influencers
              </Link>
            </div>
            <div className="hero-trust">
              <div className="trust-avatars">
                {featuredInfluencers.map((inf, index) => (
                  <img 
                    key={inf.id} 
                    src={inf.avatar} 
                    alt={inf.name}
                    className="trust-avatar"
                    style={{ zIndex: 3 - index }}
                  />
                ))}
              </div>
              <p className="trust-text">
                <strong>1,000+</strong> influencers joined this month
              </p>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card hero-card-main">
              <div className="hero-card-header">
                <img 
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" 
                  alt="Influencer"
                  className="hero-card-avatar"
                />
                <div>
                  <h4>Sarah Johnson</h4>
                  <p>Fashion & Lifestyle</p>
                </div>
                <span className="verified-badge">
                  <CheckCircle size={16} />
                </span>
              </div>
              <div className="hero-card-stats">
                <div className="stat">
                  <span className="stat-value">125K</span>
                  <span className="stat-label">Followers</span>
                </div>
                <div className="stat">
                  <span className="stat-value">4.9</span>
                  <span className="stat-label">Rating</span>
                </div>
                <div className="stat">
                  <span className="stat-value">45</span>
                  <span className="stat-label">Collabs</span>
                </div>
              </div>
            </div>
            <div className="hero-card hero-card-floating hero-card-1">
              <Star size={20} fill="currentColor" />
              <span>New Collab Request!</span>
            </div>
            <div className="hero-card hero-card-floating hero-card-2">
              <TrendingUp size={20} />
              <span>+28% Growth</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="section-header text-center">
            <h2 className="section-title">Why Choose Collabzy?</h2>
            <p className="section-subtitle">
              Everything you need to run successful influencer marketing campaigns
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="how-container">
          <div className="section-header text-center">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Get started in three simple steps
            </p>
          </div>
          <div className="steps-grid">
            {howItWorks.map((item, index) => (
              <div key={index} className="step-card">
                <span className="step-number">{item.step}</span>
                <h3 className="step-title">{item.title}</h3>
                <p className="step-description">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Influencers Section */}
      <section className="featured-section">
        <div className="featured-container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Featured Influencers</h2>
              <p className="section-subtitle">
                Discover top-rated creators ready to collaborate
              </p>
            </div>
            <Link to="/influencers" className="btn btn-outline">
              View All
              <ArrowRight size={18} />
            </Link>
          </div>
          <div className="influencer-grid">
            {featuredInfluencers.map((influencer) => (
              <Link 
                key={influencer.id} 
                to={`/influencer/${influencer.id}`}
                className="influencer-card"
              >
                <div className="influencer-card-header">
                  <img 
                    src={influencer.avatar} 
                    alt={influencer.name}
                    className="influencer-avatar"
                  />
                  {influencer.verified && (
                    <span className="verified-icon">
                      <CheckCircle size={18} />
                    </span>
                  )}
                </div>
                <div className="influencer-card-body">
                  <h3 className="influencer-name">{influencer.name}</h3>
                  <p className="influencer-niche">{influencer.niche}</p>
                  <div className="influencer-meta">
                    <span className="meta-item">
                      <Users size={14} />
                      {influencer.followers}
                    </span>
                    <span className="meta-item">
                      <Star size={14} fill="currentColor" />
                      {influencer.rating}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Start Collaborating?</h2>
            <p className="cta-description">
              Join thousands of influencers and brands already growing together on Collabzy.
            </p>
            <div className="cta-buttons">
              <Link to="/register?role=influencer" className="btn btn-primary btn-lg">
                Join as Influencer
              </Link>
              <Link to="/register?role=brand" className="btn btn-secondary btn-lg">
                Join as Brand
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
