import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { FormField, SubmitButton, MopLoader } from '../components/common';
import logoMNavy from '../assets/logo_m_navy.jpg';
import cleaningBg from '../assets/login_cleaning.png';

const MIN_LOADER_MS = 1400;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/admin');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Incorrect email or password');
      return;
    }

    setError('');
    setIsLoading(true);

    const minDelay = wait(MIN_LOADER_MS);

    try {
      await login(email, password);
      await minDelay;
      navigate('/admin');
    } catch (err: any) {
      console.error('Login error:', err);
      await minDelay;
      setError(err?.message || 'Incorrect email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      {isLoading && <MopLoader />}

      <aside className="admin-login-left">
        <div
          className="admin-login-photo"
          style={{ backgroundImage: `url(${cleaningBg})` }}
          aria-hidden="true"
        />
        <div className="admin-login-shade" aria-hidden="true" />

        <Link to="/" className="admin-login-brand" aria-label="Marcela's Cleaning Services – go to home page">
          <img src={logoMNavy} alt="" className="admin-login-logo" />
          <div className="admin-login-brand-text">
            <span className="admin-login-brand-title">Marcela's</span>
            <span className="admin-login-brand-subtitle">Cleaning Services</span>
          </div>
        </Link>

        <p className="admin-login-footnote">
          © {new Date().getFullYear()} Marcela's Cleaning Services
        </p>
      </aside>

      <main className="admin-login-right">
        <div className="admin-login-container">
          <Link to="/" className="admin-back-link">
            <ArrowLeft size={15} />
            Back to website
          </Link>

          <header className="admin-login-header">
            <h1 className="admin-login-title">Welcome back</h1>
            <p className="admin-login-subtitle">Sign in to your admin account to continue.</p>
          </header>

          <form onSubmit={handleSubmit} className="admin-login-form" noValidate>
            <FormField htmlFor="admin-email" label="Email address">
              <div className="admin-input-wrapper">
                <Mail size={17} className="admin-input-icon" aria-hidden="true" />
                <input
                  id="admin-email"
                  type="email"
                  className="admin-login-input"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="you@example.com"
                  autoFocus
                  autoComplete="username"
                  aria-invalid={!!error}
                />
              </div>
            </FormField>

            <FormField htmlFor="admin-password" label="Password">
              <div className="admin-input-wrapper">
                <Lock size={17} className="admin-input-icon" aria-hidden="true" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  className="admin-login-input admin-login-input--password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-invalid={!!error}
                  required
                />
                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </FormField>

            <div className="admin-error-slot" aria-live="polite">
              {error && (
                <div className="admin-error-text" role="alert">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <SubmitButton
              loading={isLoading}
              loadingText="Signing in..."
              spinner="mop"
              className="admin-login-btn"
            >
              Sign in
              <ArrowRight size={17} />
            </SubmitButton>
          </form>

          <p className="admin-login-help">
            <ShieldCheck size={14} />
            Restricted area. Authorized staff only.
          </p>
        </div>
      </main>
    </div>
  );
};
