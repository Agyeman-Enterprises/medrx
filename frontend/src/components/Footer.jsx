import React from 'react';
import '../styles/Footer.css';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-column">
            <img 
              src="/logo-medrx-wordmark.svg" 
              alt="MedRx" 
              className="footer-logo"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://customer-assets.emergentagent.com/job_47ed8f55-718c-4942-89cb-56d7d4044384/artifacts/7ig9cj8r_logo-medrx-wordmark.svg';
              }}
            />
            <p className="body-medium footer-tagline">
              Medicine that listens, technology that serves.
            </p>
          </div>

          <div className="footer-column">
            <h4 className="heading-2 footer-title">Quick Links</h4>
            <ul className="footer-links">
              <li><a href="#about">About</a></li>
              <li><a href="#services">Services</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#booking">Book Visit</a></li>
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
                <a href="tel:+16711234567">+1 (671) 123-4567</a>
              </li>
              <li>
                <MapPin size={16} />
                <span>Guam, serving HI & CA</span>
              </li>
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="heading-2 footer-title">Service Hours</h4>
            <p className="body-medium">
              Timezone-aware scheduling for:
            </p>
            <ul className="footer-zones">
              <li>Hawaii (HST)</li>
              <li>California (PST/PDT)</li>
              <li>Guam (ChST)</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="caption">
            © {currentYear} MedRx. All rights reserved. | Privacy Policy | Terms of Service
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;