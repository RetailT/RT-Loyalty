// src/App.jsx
import React, { useState, useEffect } from 'react';
import { ThemeProvider }          from './context/ThemeContext';
import { AuthProvider, useAuth }  from './context/AuthContext';
import useResponsive              from './hooks/useResponsive';

import Navbar       from './components/Navbar';
import Footer       from './components/Footer';
import BottomNav    from './components/BottomNav';

import LandingPage      from './pages/LandingPage';
import LoginPage        from './pages/LoginPage';
import DashboardPage    from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import RewardsPage      from './pages/RewardsPage';
import ProfilePage      from './pages/ProfilePage';
import TiersPage        from './pages/TiersPage';

const PROTECTED = ['dashboard', 'transactions', 'rewards', 'profile', 'tiers'];

// Read current page from URL hash  e.g.  /#dashboard  →  'dashboard'
function getPageFromHash() {
  const hash = window.location.hash.replace('#', '').trim();
  const valid = ['landing', 'login', 'dashboard', 'transactions', 'rewards', 'profile', 'tiers'];
  return valid.includes(hash) ? hash : 'landing';
}

function AppContent() {
  const [page, setPage]         = useState(getPageFromHash);
  const { isLoggedIn, loading } = useAuth();
  const { isMobile }            = useResponsive();

  // Keep URL hash in sync when page state changes
  const navigate = (p) => {
    setPage(p);
    window.location.hash = p;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Listen for browser back/forward buttons
  useEffect(() => {
    const onHashChange = () => setPage(getPageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Guard: redirect to login if trying to access protected page while logged out
  useEffect(() => {
    if (!loading && PROTECTED.includes(page) && !isLoggedIn) {
      navigate('login');
    }
  }, [page, isLoggedIn, loading]);

  // Guard: redirect to dashboard if already logged in and on login/landing
  useEffect(() => {
    if (!loading && isLoggedIn && (page === 'login' || page === 'landing')) {
      navigate('dashboard');
    }
  }, [isLoggedIn, loading]);

  // Loading spinner while restoring session from localStorage
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#FF6B00,#FF8C00)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 auto 16px', fontFamily: "'Bebas Neue',sans-serif" }}>RT</div>
          <div style={{ width: 36, height: 32, border: '3px solid rgba(255,107,0,0.2)', borderTopColor: '#FF6B00', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'landing':      return <LandingPage      onNavigate={navigate} />;
      case 'login':        return <LoginPage         onNavigate={navigate} />;
      case 'dashboard':    return <DashboardPage     onNavigate={navigate} />;
      case 'transactions': return <TransactionsPage  onNavigate={navigate} />;
      case 'rewards':      return <RewardsPage       onNavigate={navigate} />;
      case 'profile':      return <ProfilePage       onNavigate={navigate} />;
      case 'tiers':        return <TiersPage         onNavigate={navigate} />;
      default:             return <LandingPage       onNavigate={navigate} />;
    }
  };

  return (
    <>
      <Navbar currentPage={page} onNavigate={navigate} />
      <main style={{ minHeight: 'calc(100vh - 64px)' }}>{renderPage()}</main>
      <Footer onNavigate={navigate} currentPage={page} />
      {isLoggedIn && isMobile && <BottomNav currentPage={page} onNavigate={navigate} />}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}