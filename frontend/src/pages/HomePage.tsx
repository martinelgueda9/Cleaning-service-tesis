import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ServicesSection } from '../components/services/ServicesSection';
import { AboutSection } from '../components/about/AboutSection';
import { ContactSection } from '../components/contact/ContactSection';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page-container">
      <div className="main-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Professional Cleaning Services in Saint Cloud, MN
          </h1>

          <p className="hero-description">
            Welcome to Marcela's Cleaning! We take care of your home and workspace with dedicated, detailed, and trustworthy cleaning services tailored to your lifestyle and needs.
          </p>

          <div className="hero-action-bottom-right" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn-primary btn-hero-cta"
              onClick={() => navigate('/quote')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>Get a Free Quote</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <ServicesSection />
      <AboutSection />
      <ContactSection />
    </div>
  );
};

