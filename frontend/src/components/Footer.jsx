import React from 'react';
import '../styles/Footer.css';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-column">
            <img 
              src="/logo.png" 
              alt="MedRx" 
              className="footer-logo"
              style={{ height: '40px', width: 'auto' }}
            />
            <p className="body-medium footer-tagline">
              Medicine that listens, technology that serves.
            </p>
          </div>

          <div className="footer-column">
            <h4 className="heading-2 footer-title">Quick Links</h4>
            <ul className="footer-links">
              <li><button onClick={() => scrollToSection('services')} className="footer-link-btn">Services</button></li>
              <li><button onClick={() => scrollToSection('how-it-works')} className="footer-link-btn">How It Works</button></li>
              <li><button onClick={() => scrollToSection('testimonials')} className="footer-link-btn">Testimonials</button></li>
              <li><button onClick={() => scrollToSection('booking')} className="footer-link-btn">Book Visit</button></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="heading-2 footer-title">Contact</h4>
            <ul className="footer-contact">
              <li>
                <Mail size={16} />
                <a href="mailto:care@medrx.com">care@medrx.com</a>
              </li>
              <li>
                <Phone size={16} />
                <a href="tel:+16716892993">+1 (671) 689-2993</a>
              </li>
              <li>
                <MapPin size={16} />
                <span>Guam, serving HI & CA</span>
              </li>
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="heading-2 footer-title">Availability</h4>
            <p className="body-medium" style={{ marginBottom: '0.5rem' }}>
              <strong>Tuesday - Saturday (Guam)</strong>
            </p>
            <ul className="footer-hours">
              <li><strong>California:</strong> 3 PM - 10 PM (Mon-Fri)</li>
              <li><strong>Hawaii:</strong> 1 PM - 8 PM (Mon-Fri)</li>
              <li><strong>Guam:</strong> 9 AM - 4 PM ChST (Tue-Sat)</li>
            </ul>
            <p className="caption" style={{ marginTop: '0.5rem', opacity: 0.7 }}>
              Lunch break: 12-1 PM (Guam time)
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="caption">
            © {currentYear} MedRx. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;