import React from 'react';
import aboutUsImage from '../../assets/about_us.png';
import '../../styles/about.css';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="about-home-section">
      <div className="about-container">
        <div className="about-grid">
          
          <div className="about-text-column">
            <h2 className="about-title">Dedicated Cleaning Professionals You Can Trust</h2>
            
            <p className="about-description">
              Welcome to Marcela's Cleaning! We are a dedicated team of cleaning professionals serving Saint Cloud, MN, and surrounding areas. Our mission is simple: to deliver pristine, healthy, and comfortable environments so you can focus on what matters most.
            </p>

            <p className="about-description">
              Whether caring for family homes, maintaining corporate offices, or executing comprehensive move-in/move-out cleans, our experienced staff approaches every project with meticulous attention to detail, efficiency, and absolute respect for your space.
            </p>
          </div>

          <div className="about-image-column">
            <div className="about-photo-wrapper">
              <div className="about-photo-card">
                <img
                  src={aboutUsImage}
                  alt="About Marcela's Cleaning Services"
                  className="about-photo-image"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
