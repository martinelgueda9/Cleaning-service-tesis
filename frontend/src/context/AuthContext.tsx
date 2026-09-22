import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { email: string } | null;
  token: string | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = '/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('marcelas_token');
  });

  const [user, setUser] = useState<{ email: string } | null>(() => {
    const saved = sessionStorage.getItem('marcelas_user');
    return saved ? JSON.parse(saved) : null;
  });

  const isAuthenticated = Boolean(token && user);

  useEffect(() => {
    if (token) {
      verifyToken(token);
    }
  }, []);

  async function verifyToken(currentToken: string) {
    try {
      let response: Response;
      try {
        response = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      } catch {
        response = await fetch(`http://localhost:3000${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      }

      if (!response.ok) {
        
        clearSession();
        return;
      }

      const result = await response.json();
      if (result.ok && result.data?.email) {
        const userData = { email: result.data.email };
        setUser(userData);
        sessionStorage.setItem('marcelas_user', JSON.stringify(userData));
      }
    } catch {
      
      console.warn('No se pudo verificar el token con el servidor');
    }
  }

  async function login(email: string, pass: string): Promise<void> {
    let response: Response;

    try {
      response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
    } catch {
      response = await fetch(`http://localhost:3000${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
    }

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.error || 'Credenciales incorrectas');
    }

    const newToken = result.data.token;
    const userData = result.data.user;

    setToken(newToken);
    setUser(userData);
    sessionStorage.setItem('marcelas_token', newToken);
    sessionStorage.setItem('marcelas_user', JSON.stringify(userData));
  }

  function logout() {
    clearSession();
  }

  function clearSession() {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('marcelas_token');
    sessionStorage.removeItem('marcelas_user');
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
