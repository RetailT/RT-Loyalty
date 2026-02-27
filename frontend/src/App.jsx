import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import LoginPage     from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import QRScannerPage from './pages/QRScannerPage';
import ReportsPage   from './pages/ReportsPage';
import Navbar        from './components/Navbar';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!isAuthenticated) {
    return <LoginPage onSuccess={() => setCurrentPage('dashboard')} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage onNavigate={setCurrentPage} />;
      case 'customers': return <CustomersPage />;
      case 'scan':      return <QRScannerPage />;
      case 'reports':   return <ReportsPage />;
      default:          return <DashboardPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, transition: 'background 0.3s' }}>
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main>{renderPage()}</main>
    </div>
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