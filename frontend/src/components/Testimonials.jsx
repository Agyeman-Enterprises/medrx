import React from 'react';
import { TESTIMONIALS } from '../mock';
import '../styles/Testimonials.css';
import { Star } from 'lucide-react';

const Testimonials = () => {
  return (
    <section id="testimonials" className="testimonials-section">
      <div className="container">
        <div className="section-header">
          <h2 className="heading-1">Patient Success Stories</h2>
          <p className="body-large">
            Real results from real patients
          </p>
        </div>

        <div className="testimonials-grid">
          {TESTIMONIALS.map((testimonial) => (
            <div key={testimonial.id} className="testimonial-card hover-lift">
              <div className="testimonial-header">
                <div className="patient-avatar">
                  {testimonial.initials}
                </div>
                <div className="patient-info">
                  <div className="patient-initials">{testimonial.initials}</div>
                  <div className="patient-location caption">{testimonial.location}</div>
                </div>
                <div className="rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
              </div>
              <div className="service-badge caption">{testimonial.service}</div>
              <p className="testimonial-text body-medium">"{testimonial.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
