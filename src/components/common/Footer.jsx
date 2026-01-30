import { Link } from 'react-router-dom';
import { 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube,
  Mail,
  MapPin,
  Phone
} from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span className="logo-icon">C</span>
              <span className="logo-text">Collabzy</span>
            </Link>
            <p className="footer-description">
              Connecting influencers with brands for meaningful collaborations. 
              Build your network, grow your influence, and create impactful partnerships.
            </p>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="#" className="social-link" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
              <a href="#" className="social-link" aria-label="YouTube">
                <Youtube size={20} />
              </a>
            </div>
          </div>

          <div className="footer-links">
            <h4 className="footer-heading">Platform</h4>
            <ul>
              <li><Link to="/influencers">Find Influencers</Link></li>
              <li><Link to="/register">Become an Influencer</Link></li>
              <li><Link to="/register">For Brands</Link></li>
              <li><Link to="/">Pricing</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4 className="footer-heading">Company</h4>
            <ul>
              <li><Link to="/">About Us</Link></li>
              <li><Link to="/">Blog</Link></li>
              <li><Link to="/">Careers</Link></li>
              <li><Link to="/">Press Kit</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4 className="footer-heading">Support</h4>
            <ul>
              <li><Link to="/">Help Center</Link></li>
              <li><Link to="/">Terms of Service</Link></li>
              <li><Link to="/">Privacy Policy</Link></li>
              <li><Link to="/">Contact Us</Link></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h4 className="footer-heading">Contact</h4>
            <div className="contact-item">
              <Mail size={16} />
              <span>hello@collabzy.com</span>
            </div>
            <div className="contact-item">
              <Phone size={16} />
              <span>+1 (555) 123-4567</span>
            </div>
            <div className="contact-item">
              <MapPin size={16} />
              <span>San Francisco, CA</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Collabzy. All rights reserved.</p>
          <p>Made with ❤️ for creators and brands</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
