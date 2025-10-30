import React from 'react';
import { mockHowItWorks } from '../mock';
import '../styles/HowItWorks.css';
import { Calendar, FileText, Video, CheckCircle, CreditCard } from 'lucide-react';

const HowItWorks = () => {
  const iconMap = {
    Calendar,
    FileText,
    Video,
    CheckCircle,
    CreditCard
  };

  return (
    <section id="how-it-works" className="how-it-works-section">
      <div className="container">
        <div className="section-header">
          <h2 className="heading-1">How It Works</h2>
          <p className="body-large">
            Four simple steps from booking to personalized care
          </p>
        </div>

        <div className="steps-grid">
          {mockHowItWorks.map((step, index) => {
            const Icon = iconMap[step.icon];
            return (
              <div key={index} className="step-card hover-lift">
                <div className="step-number font-mono">{step.step}</div>
                <div className="step-icon">
                  <Icon size={32} />
                </div>
                <h3 className="heading-2">{step.title}</h3>
                <p className="body-medium">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;