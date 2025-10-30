import React from 'react';
import '../styles/Hero.css';

const Hero = () => {
  const scrollToBooking = () => {
    const element = document.getElementById('booking');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero-section">
      <div className="hero-image-container">
        <img 
          src="https://images.unsplash.com/photo-1708491038948-095cf1428875?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwyfHxibGFjayUyMGZlbWFsZSUyMGRvY3RvcnxlbnwwfHx8fDE3NjE4NDA5Mzd8MA&ixlib=rb-4.1.0&q=85" 
          alt="Professional black female doctor - MedRx telemedicine"
          className="hero-image"
        />
        <div className="hero-overlay"></div>
      </div>
      <div className="container hero-content">
        <div className="hero-announcement">
          <span>🌺</span>
          <span>Serving Hawaii, California & Guam</span>
        </div>
        <h1 className="heading-hero hero-title">
          GLP-1 Weight Loss Program
        </h1>
        <p className="body-large hero-subtitle">
          Physician-supervised GLP-1 therapy using Semaglutide (Ozempic®, Wegovy®) and Tirzepatide (Mounjaro®, Zepbound®) for sustainable, science-based weight management. Personalized, private, and convenient telemedicine care.
        </p>
        <div className="hero-cta">
          <button onClick={scrollToBooking} className="btn-primary">Book GLP-1 Evaluation</button>
          <button onClick={() => document.getElementById('services').scrollIntoView({ behavior: 'smooth' })} className="btn-secondary">View Pricing</button>
        </div>
        <p className="caption hero-note" style={{ marginTop: '1.5rem', opacity: 0.9 }}>
          Initial evaluation: Semaglutide $150 • Tirzepatide $279 • Medication billed separately by pharmacy
        </p>
      </div>
    </section>
  );
};

export default Hero;