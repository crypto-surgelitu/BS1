import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import ChatbotWidget from './components/ChatbotWidget';

const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PreferencesPage = lazy(() => import('./pages/PreferencesPage'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPasswordPin = lazy(() => import('./pages/ResetPasswordPin'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-[#0B4F6C] rounded-full animate-spin"></div>
      <p className="text-gray-500 font-medium animate-pulse">Loading...</p>
    </div>
  </div>
);

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.includes('/admin') || location.pathname.includes('/super-admin');
  
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password-pin" element={<ResetPasswordPin />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* User dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/preferences" element={<PreferencesPage />} />

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />

          {/* 404 fallback */}
          <Route path="*" element={
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
              <div style={{ background: 'white', padding: '48px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                <h1 style={{ fontSize: '4rem', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>404</h1>
                <p style={{ color: '#6b7280', marginBottom: '24px' }}>Page not found. You might be using the wrong URL.</p>
                <Link to="/login" style={{ display: 'inline-block', padding: '10px 24px', background: '#0B4F6C', color: 'white', borderRadius: '8px', textDecoration: 'none' }}>
                  Back to Login
                </Link>
              </div>
            </div>
          } />
        </Routes>
      </Suspense>
      {!isAdminRoute && <ChatbotWidget />}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
