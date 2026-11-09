import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { FormField, TextInput, SubmitButton } from '../components/common';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Incorrect email or password');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/admin');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Incorrect email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-page">

      <div className="admin-login-stripe" aria-hidden="true" />

      <div className="admin-login-left" aria-hidden="true" />

      <div className="admin-login-right">
        <div className="admin-login-container">

          <h1 className="admin-login-title">Sign in</h1>

          <form onSubmit={handleSubmit} className="admin-login-form" noValidate>

            <FormField htmlFor="admin-email" label="Email address">
              <TextInput
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="admin@gmail.com"
                autoFocus
                autoComplete="username"
                className="admin-login-input"
              />
            </FormField>

            <div className="admin-login-field-gap" />

            <FormField htmlFor="admin-password" label="Password">
              <div className="admin-input-wrapper">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  className="admin-login-input"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FormField>

            <div className="admin-login-actions">
              <SubmitButton
                loading={isLoading}
                loadingText="Signing in..."
                label="Sign in"
                className="admin-login-btn"
              />
              <Link to="/" className="admin-back-link">
                Back to website
              </Link>
            </div>

            <div className="admin-error-slot" aria-live="polite">
              {error && <span className="admin-error-text">{error}</span>}
            </div>
          </form>
        </div>
      </div>

    </div>
  );
};
