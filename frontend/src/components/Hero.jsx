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
          Subscription-Based Care<br />That Puts You First
        </h1>
        <p className="body-large hero-subtitle">
          Choose your level of care. Unlimited access to expert clinicians, transparent pricing, and personalized treatment plans—from basic visits to comprehensive concierge medicine.
        </p>
        <div className="hero-cta">
          <button onClick={scrollToBooking} className="btn-primary">Book Your Visit</button>
          <button onClick={() => document.getElementById('about').scrollIntoView({ behavior: 'smooth' })} className="btn-secondary">Learn More</button>
        </div>
      </div>
    </section>
  );
};

export default Hero;