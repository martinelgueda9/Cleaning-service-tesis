import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { FormField, TextInput, SubmitButton } from '../components/common';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { isAuthenticated, user, login, logout } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Correo o contraseña incorrectos');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch {
      setError('Correo o contraseña incorrectos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setEmail('');
    setPassword('');
    setError('');
  };

  return (
    <div className="admin-login-page">
      
      <div className="admin-login-stripe" aria-hidden="true" />

      <div className="admin-login-container">

        <h1 className="admin-login-title">Iniciar sesión</h1>

        {isAuthenticated ? (
          <div className="admin-auth-active">
            <p className="admin-auth-info">
              Sesión activa como <strong>{user?.email}</strong>
            </p>
            <div className="admin-login-actions">
              <button
                type="button"
                onClick={handleLogout}
                className="admin-login-btn"
              >
                Cerrar sesión
              </button>
              <Link to="/" className="admin-back-link">
                Volver al sitio
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="admin-login-form" noValidate>
            
            <FormField
              htmlFor="admin-email"
              label="Correo electrónico"
            >
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

            <FormField
              htmlFor="admin-password"
              label="Contraseña"
            >
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
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FormField>

            <div className="admin-login-actions">
              <SubmitButton
                loading={isLoading}
                loadingText="Entrando..."
                label="Entrar"
                className="admin-login-btn"
              />
              <Link to="/" className="admin-back-link">
                Volver al sitio
              </Link>
            </div>

            <div className="admin-error-slot" aria-live="polite">
              {error && <span className="admin-error-text">{error}</span>}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
