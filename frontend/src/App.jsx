import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider }          from './context/ThemeContext';
import { AuthProvider, useAuth }  from './context/AuthContext';
import { CompanyProvider }        from './context/CompanyContext';  // ← add
import useResponsive              from './hooks/useResponsive';

import Navbar       from './components/Navbar';
import Footer       from './components/Footer';
import BottomNav    from './components/BottomNav';

import LandingPage      from './pages/LandingPage';
import LoginPage        from './pages/LoginPage';
import DashboardPage    from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import PromotionsPage   from './pages/PromotionsPage';
import TermsPage        from './pages/TermsPage';
import ProfilePage      from './pages/ProfilePage';
import QRPage           from './pages/QRPage';

const PROTECTED = ['dashboard', 'transactions', 'promotions', 'profile', 'qr'];
const PUBLIC    = ['landing', 'login', 'terms'];

function getPageFromHash() {
  const hash  = window.location.hash.replace('#', '').trim();
  const valid = [...PROTECTED, ...PUBLIC];
  return valid.includes(hash) ? hash : 'landing';
}

function AppContent() {
  const [page, setPage]         = useState(getPageFromHash);
  const { isLoggedIn, loading } = useAuth();
  const { isMobile }            = useResponsive();

  const navigate = useCallback((p) => {
    setPage(p);
    window.location.hash = p;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onHashChange = () => setPage(getPageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (!loading && !isLoggedIn && PROTECTED.includes(page)) {
      navigate('login');
    }
  }, [page, isLoggedIn, loading, navigate]);

  useEffect(() => {
    if (!loading && isLoggedIn && (page === 'login' || page === 'landing')) {
      navigate('dashboard');
    }
  }, [isLoggedIn, loading, page, navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48,
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 auto 16px',
            fontFamily: "'Bebas Neue',sans-serif"
          }}>RT</div>
          <div style={{
            width: 36, height: 36,
            border: '3px solid color-mix(in srgb, var(--primary) 20%, transparent)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto'
          }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'landing':      return <LandingPage      onNavigate={navigate} />;
      case 'login':        return <LoginPage        onNavigate={navigate} />;
      case 'dashboard':    return <DashboardPage    onNavigate={navigate} />;
      case 'transactions': return <TransactionsPage onNavigate={navigate} />;
      case 'promotions':   return <PromotionsPage   onNavigate={navigate} />;
      case 'terms':        return <TermsPage        onNavigate={navigate} />;
      case 'profile':      return <ProfilePage      onNavigate={navigate} />;
      case 'qr':           return <QRPage           onNavigate={navigate} />;
      default:             return <LandingPage      onNavigate={navigate} />;
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
    <CompanyProvider>          {/* ← add */}
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </CompanyProvider>
  );
}