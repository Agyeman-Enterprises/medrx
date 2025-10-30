import React from 'react';
import { mockServices } from '../mock';
import '../styles/Services.css';
import { Video, Phone, Calendar, FileText, Heart, Activity } from 'lucide-react';

const Services = () => {
  const getIconForService = (serviceId) => {
    if (serviceId === '1') return Phone;
    return Activity;
  };

  return (
    <section id="services" className="services-section">
      <div className="container">
        <div className="section-header">
          <h2 className="heading-1">Our Services</h2>
          <p className="body-large">
            Choose the care model that fits your needs. All visits include secure video or phone consultation.
          </p>
        </div>

        <div className="services-grid">
          {mockServices.map((service) => {
            const Icon = getIconForService(service.id);
            return (
              <div key={service.id} className={`service-card ${service.color} hover-lift`}>
                <div className="service-header">
                  <div className="service-icon">
                    <Icon size={28} />
                  </div>
                  <div className="service-price">
                    <span className="price-amount">${service.price}</span>
                    <span className="caption">per visit</span>
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