import React, { useState, useEffect } from 'react';
import { ThemeProvider }    from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import useResponsive        from './hooks/useResponsive';

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

const PROTECTED = ['dashboard','transactions','rewards','profile','tiers'];

function AppContent() {
  const [page, setPage] = useState('landing');
  const { isLoggedIn }  = useAuth();
  const { isMobile }    = useResponsive();

  const navigate = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Redirect protected pages if not logged in
  useEffect(() => {
    if (PROTECTED.includes(page) && !isLoggedIn) {
      setPage('login');
    }
  }, [page, isLoggedIn]);

  // Auto-redirect to dashboard after login
  useEffect(() => {
    if (isLoggedIn && (page === 'login' || page === 'landing')) {
      setPage('dashboard');
    }
  }, [isLoggedIn]);

  const renderPage = () => {
    switch (page) {
      case 'landing':      return <LandingPage      onNavigate={navigate} />;
      case 'login':        return <LoginPage         onNavigate={navigate} />;
      case 'dashboard':    return <DashboardPage     onNavigate={navigate} />;
      case 'transactions': return <TransactionsPage  onNavigate={navigate} />;
      case 'rewards':      return <RewardsPage        onNavigate={navigate} />;
      case 'profile':      return <ProfilePage        onNavigate={navigate} />;
      case 'tiers':        return <TiersPage          onNavigate={navigate} />;
      default:             return <LandingPage        onNavigate={navigate} />;
    }
  };

  const showFooter  = !isLoggedIn;
  const showBottomNav = isLoggedIn && isMobile;

  return (
    <>
      <Navbar currentPage={page} onNavigate={navigate} />
      <main style={{ minHeight: 'calc(100vh - 64px)' }}>
        {renderPage()}
      </main>
      {showFooter && <Footer onNavigate={navigate} />}
      {showBottomNav && <BottomNav currentPage={page} onNavigate={navigate} />}
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
