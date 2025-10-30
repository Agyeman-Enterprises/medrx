import React from 'react';
import '../styles/About.css';
import { Heart, Shield, Clock, Users } from 'lucide-react';

const About = () => {
  const commitments = [
    {
      icon: Heart,
      title: 'Personal Care',
      description: 'Thorough intakes, not 15-minute rushes. Time to listen and understand your whole story.'
    },
    {
      icon: Shield,
      title: 'Transparent Pricing',
      description: 'Clear costs upfront. No surprise bills or hidden fees. Just honest healthcare.'
    },
    {
      icon: Clock,
      title: 'Evidence-Based',
      description: 'Modern therapies including GLP-1 and hormone health, grounded in clinical research.'
    },
    {
      icon: Users,
      title: 'Seamless Coordination',
      description: 'Labs, prescriptions, and follow-ups—all handled smoothly with clear communication.'
    }
  ];

  return (
    <section id="about" className="about-section">
      <div className="container">
        <div className="about-header">
          <h2 className="heading-1">About MedRx</h2>
          <p className="body-large about-intro">
            At MedRx, we bring back what medicine lost: time to listen, space to understand, and technology that serves the patient—not the other way around.
          </p>
          <p className="body-medium about-description">
            Our clinicians practice whole-person care informed by modern tools: voice-dictation intake, structured summaries, precision scheduling, and secure telehealth. We operate from Guam with timezone-aware availability for <strong>Hawaii and California</strong>, ensuring care fits your life.
          </p>
        </div>

        <div className="commitments-grid">
          {commitments.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="commitment-card hover-lift">
                <div className="commitment-icon">
                  <Icon size={24} />
                </div>
                <h3 className="heading-2">{item.title}</h3>
                <p className="body-medium">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default About;