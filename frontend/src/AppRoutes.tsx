import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PipelineProvider } from './contexts/PipelineContext';
import { AuthPage } from './components/AuthPage';
import { LandingPage } from './components/LandingPage';
import { Header } from './components/Header';
import App from './App';

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <PipelineProvider>
          <Routes>
            {/* Landing page - public */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Auth routes - public */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            <Route path="/register" element={<Navigate to="/auth" replace />} />
            
            {/* Main app - accessible to everyone (guest mode) */}
            <Route
              path="/app"
              element={
                <div className="min-h-screen">
                  <Header />
                  <App />
                </div>
              }
            />
            
            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PipelineProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;
