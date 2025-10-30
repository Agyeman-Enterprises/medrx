import React, { useState } from 'react';
import { mockServices, mockOneOffServices, mockSubscriptions } from '../mock';
import '../styles/Services.css';
import { Video, Phone, Calendar, FileText, Heart, Activity, Users, Zap } from 'lucide-react';

const Services = () => {
  const [viewMode, setViewMode] = useState('all'); // 'all', 'oneoff', 'subscription'

  const getIconForService = (serviceId, type) => {
    if (type === 'oneoff') {
      return serviceId === 'oneoff-1' ? Phone : Activity;
    }
    return Users;
  };

  const displayServices = viewMode === 'all' 
    ? mockServices 
    : viewMode === 'oneoff' 
      ? mockOneOffServices 
      : mockSubscriptions;

  return (
    <section id="services" className="services-section">
      <div className="container">
        <div className="section-header">
          <h2 className="heading-1">Our Services</h2>
          <p className="body-large">
            Choose between one-time visits or subscription plans that fit your healthcare needs
          </p>
          
          {/* Service Type Toggle */}
          <div className="service-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => setViewMode('all')}
            >
              All Services
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'oneoff' ? 'active' : ''}`}
              onClick={() => setViewMode('oneoff')}
            >
              Pay-Per-Visit
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'subscription' ? 'active' : ''}`}
              onClick={() => setViewMode('subscription')}
            >
              Monthly Plans
            </button>
          </div>
        </div>

        <div className="services-grid">
          {displayServices.map((service) => {
            const Icon = getIconForService(service.id, service.type);
            return (
              <div key={service.id} className={`service-card ${service.color} hover-lift`}>
                <div className="service-type-badge">
                  {service.type === 'oneoff' ? 'Pay Per Visit' : 'Monthly Subscription'}
                </div>
                <div className="service-header">
                  <div className="service-icon">
                    <Icon size={28} />
                  </div>
                  <div className="service-price">
                    <span className="price-amount">${service.price}</span>
                    <span className="caption">{service.billingPeriod}</span>
                  </div>
                </div>
                <h3 className="heading-2 service-title">{service.title}</h3>
                <p className="body-medium service-description">{service.description}</p>
                <ul className="service-features">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="body-medium">
                      <Heart size={16} className="feature-icon" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;