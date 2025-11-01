import React, { useState, useEffect } from 'react';
import '../styles/Header.css';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={`header-nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="container header-content">
        <div className="logo-container">
          <img 
            src="/logo.png" 
            alt="MedRx" 
            className="logo"
            style={{ height: '50px', width: 'auto' }}
          />
              e.target.onerror = null;
              e.target.src = 'https://customer-assets.emergentagent.com/job_47ed8f55-718c-4942-89cb-56d7d4044384/artifacts/7ig9cj8r_logo-medrx-wordmark.svg';
            }}
          />
        </div>
        <nav className="nav-links">
          <button onClick={() => scrollToSection('about')} className="nav-link">About</button>
          <button onClick={() => scrollToSection('services')} className="nav-link">Services</button>
          <button onClick={() => scrollToSection('how-it-works')} className="nav-link">How It Works</button>
          <button onClick={() => scrollToSection('pricing')} className="nav-link">Pricing</button>
        </nav>
        <div className="nav-actions">
          <button onClick={() => scrollToSection('booking')} className="btn-primary">Book Visit</button>
        </div>
      </div>
    </header>
  );
};

export default Header;