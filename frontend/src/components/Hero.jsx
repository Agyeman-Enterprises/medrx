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
          src="https://images.unsplash.com/photo-1758691461916-dc7894eb8f94" 
          alt="Professional telemedicine consultation"
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
          Medicine That Listens,<br />Technology That Serves
        </h1>
        <p className="body-large hero-subtitle">
          Trusted clinical expertise meets AI-powered care. Same-day visits, transparent pricing, and personalized treatment plans—no 15-minute rushes.
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