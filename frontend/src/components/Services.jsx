import React from 'react';
import { MEDRX_SERVICES } from '../mock';
import '../styles/Services.css';
import { Scale, Heart, Sparkles } from 'lucide-react';

const Services = () => {
  const getIconForService = (serviceId) => {
    switch (serviceId) {
      case 'glp1-weight-loss':
        return Scale;
      case 'hormone-health':
        return Heart;
      case 'hair-loss':
        return Sparkles;
      default:
        return Heart;
    }
  };

  const scrollToBooking = (serviceId) => {
    // Store the selected service ID in sessionStorage
    if (serviceId) {
      sessionStorage.setItem('selectedService', serviceId);
    }
    
    const element = document.getElementById('booking');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      // Trigger a custom event to notify Booking component
      window.dispatchEvent(new CustomEvent('serviceSelected', { detail: { serviceId } }));
    }
  };

  return (
    <section id="services" className="services-section">
      <div className="container">
        <div className="section-header">
          <h2 className="heading-1">Our Services</h2>
          <p className="body-large">
            $175 consultation fee • Medications and labs billed separately • Prescription only
          </p>
        </div>

        <div className="services-grid">
          {MEDRX_SERVICES.map((service) => {
            const Icon = getIconForService(service.id);
            return (
              <div 
                key={service.id} 
                className={`service-card ${service.color} hover-lift clickable-card`}
                onClick={() => scrollToBooking(service.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    scrollToBooking(service.id);
                  }
                }}
              >
                <div className="service-header">
                  <div className="service-icon">
                    <Icon size={32} />
                  </div>
                  <div className="service-price">
                    <span className="price-amount">${service.price}</span>
                    <span className="caption">{service.billingPeriod}</span>
                  </div>
                </div>
                <h3 className="heading-2 service-title">{service.name}</h3>
                <p className="body-medium service-description">{service.description}</p>
                <p className="service-duration caption">{service.duration} • Video consultation</p>
                <ul className="service-features">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="body-medium">
                      <span className="feature-bullet">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <p className="service-note caption">{service.note}</p>
                <div className="service-card-footer">
                  <span className="service-cta-text">Click to book →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;