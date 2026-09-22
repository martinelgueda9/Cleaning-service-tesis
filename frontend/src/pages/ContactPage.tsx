import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const ContactPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/', { replace: true });
    setTimeout(() => {
      const el = document.getElementById('contact');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  }, [navigate]);

  return null;
};
