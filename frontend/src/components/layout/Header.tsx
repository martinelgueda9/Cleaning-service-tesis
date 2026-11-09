import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Phone } from 'lucide-react';
import logoMNavy from '../../assets/logo_m_navy.jpg';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = ['Home', 'Services', 'About us', 'Contact'];

  const [activeSection, setActiveSection] = useState<'Home' | 'Services' | 'About us' | 'Contact'>('Home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      if (location.pathname !== '/') {
        return;
      }

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
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
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
    setMobileMenuOpen(false);
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
    <header className={`app-header ${isScrolled ? 'app-header--scrolled' : ''}`}>
      <div className="header-container">

        <div className="header-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src={logoMNavy} alt="Marcela's M Emblem" className="header-logo-m-standalone" />
          <div className="brand-text">
            <span className="brand-title-original">Marcela's</span>
            <span className="brand-subtitle-original">— CLEANING SERVICES —</span>
          </div>
        </div>

        <div className="header-right-group">
          <nav className="header-nav-inline">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                className={`nav-btn ${activeTab === item ? 'active' : ''}`}
                onClick={() => handleNavClick(item)}
              >
                <span>{item}</span>
              </button>
            ))}
          </nav>

          <a href="tel:+13202493106" className="header-phone-link" aria-label="Call +1 (320) 249-3106">
            <Phone size={16} className="phone-icon" />
            <span className="phone-number">+1 (320) 249-3106</span>
          </a>

          <button
            type="button"
            className="btn-quote-header"
            onClick={() => navigate('/quote')}
          >
            Get a Free Quote
          </button>
        </div>

        <div className="header-mobile-actions">
          <a href="tel:+13202493106" className="header-mobile-phone-btn" aria-label="Call directly">
            <Phone size={18} />
          </a>

          <button
            type="button"
            className="btn-quote-header btn-quote-header--mobile"
            onClick={() => navigate('/quote')}
          >
            Quote
          </button>

          <button
            type="button"
            className="header-burger-btn"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="header-mobile-drawer">
          <nav className="header-mobile-nav">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                className={`mobile-nav-btn ${activeTab === item ? 'active' : ''}`}
                onClick={() => handleNavClick(item)}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="header-mobile-drawer-footer">
            <a href="tel:+13202493106" className="header-drawer-phone">
              <Phone size={18} />
              <span>+1 (320) 249-3106</span>
            </a>
            <button
              type="button"
              className="btn-quote-header full-width"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/quote');
              }}
            >
              Get a Free Quote
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
