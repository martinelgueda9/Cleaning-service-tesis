import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoMNavy from '../../assets/logo_m_navy.jpg';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = ['Home', 'Services', 'About us', 'Contact'];

  const [activeSection, setActiveSection] = React.useState<'Home' | 'Services' | 'About us' | 'Contact'>('Home');

  React.useEffect(() => {
    if (location.pathname !== '/') {
      return;
    }

    const handleScroll = () => {
      const servicesEl = document.getElementById('services');
      const aboutEl = document.getElementById('about');
      const contactEl = document.getElementById('contact');

      if (contactEl) {
        const contactRect = contactEl.getBoundingClientRect();
        if (contactRect.top <= window.innerHeight * 0.55) {
          setActiveSection('Contact');
          return;
        }
      }

      if (aboutEl) {
        const aboutRect = aboutEl.getBoundingClientRect();
        if (aboutRect.top <= window.innerHeight * 0.55) {
          setActiveSection('About us');
          return;
        }
      }

      if (servicesEl) {
        const servicesRect = servicesEl.getBoundingClientRect();
        if (servicesRect.top <= window.innerHeight * 0.55) {
          setActiveSection('Services');
          return;
        }
      }

      setActiveSection('Home');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/') {
      return activeSection;
    }
    return '';
  };

  const activeTab = getActiveTab();

  const handleNavClick = (item: string) => {
    if (item === 'Home') {
      if (location.pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/');
      }
    } else if (item === 'Services') {
      if (location.pathname === '/') {
        const servicesEl = document.getElementById('services');
        if (servicesEl) {
          servicesEl.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        navigate('/');
        setTimeout(() => {
          const servicesEl = document.getElementById('services');
          if (servicesEl) {
            servicesEl.scrollIntoView({ behavior: 'smooth' });
          }
        }, 150);
      }
    } else if (item === 'Contact') {
      if (location.pathname === '/') {
        const contactEl = document.getElementById('contact');
        if (contactEl) {
          contactEl.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        navigate('/');
        setTimeout(() => {
          const contactEl = document.getElementById('contact');
          if (contactEl) {
            contactEl.scrollIntoView({ behavior: 'smooth' });
          }
        }, 150);
      }
    } else if (item === 'About us') {
      if (location.pathname !== '/') {
        navigate('/');
      }
      setTimeout(() => {
        const aboutEl = document.getElementById('about');
        if (aboutEl) aboutEl.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src={logoMNavy} alt="Marcela's M Emblem" className="header-logo-m-standalone" />
          <div className="brand-text">
            <span className="brand-title-original">Marcela's</span>
            <span className="brand-subtitle-original">— CLEANING SERVICES —</span>
          </div>
        </div>

        <nav className="header-nav-center">
          {navItems.map((item) => (
            <button
              key={item}
              type="button"
              className={`nav-btn ${activeTab === item ? 'active' : ''}`}
              onClick={() => handleNavClick(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="header-contact">
          <button
            type="button"
            className="btn-quote-header"
            onClick={() => navigate('/quote')}
          >
            Get a Free Quote
          </button>

          <div className="header-phone-text">
            <svg className="phone-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span className="phone-number">+1 (320) 249-3106</span>
          </div>
        </div>
      </div>
    </header>
  );
};
