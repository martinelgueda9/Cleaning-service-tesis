import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Phone } from 'lucide-react';
import { ServicesSection } from '../components/services/ServicesSection';
import { AboutSection } from '../components/about/AboutSection';
import { ContactSection } from '../components/contact/ContactSection';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page-container">

      <section className="main-hero">
        <div className="hero-container">

          <div className="hero-content">
            <h1 className="hero-title">
              Professional Cleaning Services in Saint Cloud, MN
            </h1>

            <p className="hero-description">
              Welcome to Marcela's Cleaning! We take care of your home and workspace with dedicated, detailed, and trustworthy cleaning services tailored to your lifestyle and needs.
            </p>

            <div className="hero-actions-group">
              <button
                type="button"
                className="btn-primary btn-hero-cta"
                onClick={() => navigate('/quote')}
              >
                <span>Get a Free Quote</span>
                <ArrowRight size={18} />
              </button>

              <a
                href="tel:+13202493106"
                className="btn-secondary btn-hero-secondary"
              >
                <Phone size={18} />
                <span>Call +1 (320) 249-3106</span>
              </a>
            </div>
          </div>

          <div className="hero-media-wrapper">
            <div className="hero-img-placeholder" />
          </div>
        </div>
      </section>

      <div className="home-sections-wrapper">
        <ServicesSection />
        <AboutSection />
        <ContactSection />
      </div>
    </div>
  );
};
