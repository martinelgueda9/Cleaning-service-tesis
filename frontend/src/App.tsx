import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { QuotePage } from './pages/QuotePage';
import { LoginPage } from './pages/LoginPage';
import { ContactPage } from './pages/ContactPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <Layout>
                <HomePage />
              </Layout>
            }
          />
          <Route
            path="/quote"
            element={
              <Layout>
                <QuotePage />
              </Layout>
            }
          />
          <Route
            path="/cotizacion"
            element={
              <Layout>
                <QuotePage />
              </Layout>
            }
          />
          <Route
            path="/contact"
            element={
              <Layout>
                <ContactPage />
              </Layout>
            }
          />
          <Route
            path="/contacto"
            element={
              <Layout>
                <ContactPage />
              </Layout>
            }
          />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

