import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '⬡' },
  { id: 'customers', label: 'Customers', icon: '◈' },
  { id: 'scan',      label: 'QR Scanner', icon: '⊞' },
  { id: 'reports',   label: 'Reports',   icon: '◫' },
];

export default function Navbar({ currentPage, onNavigate }) {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{
      background: theme.navBg,
      borderBottom: `1px solid ${theme.navBorder}`,
      padding: '0 2rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 64, position: 'sticky', top: 0, zIndex: 100,
      boxShadow: theme.navShadow,
      transition: 'background 0.3s, border-color 0.3s',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
           onClick={() => onNavigate('dashboard')}>
        <div style={{
          width: 36, height: 36,
          background: 'linear-gradient(135deg, #FF6B00, #FF8C00)',
          borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 900, color: '#fff',
          boxShadow: '0 4px 14px rgba(255,107,0,0.35)',
        }}>R</div>
        <div>
          <div style={{ color: theme.text, fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, lineHeight: 1, transition: 'color 0.3s' }}>RETAILCO</div>
          <div style={{ color: '#FF6B00', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', fontFamily: 'monospace' }}>LOYALTY SYSTEM</div>
        </div>
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 4 }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => onNavigate(item.id)}
            style={{
              background: currentPage === item.id
                ? 'linear-gradient(135deg, rgba(255,107,0,0.12), rgba(255,140,0,0.06))'
                : 'transparent',
              border: currentPage === item.id ? '1px solid rgba(255,107,0,0.35)' : `1px solid transparent`,
              color: currentPage === item.id ? '#FF6B00' : theme.textMuted,
              padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
              fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: 1,
              textTransform: 'uppercase', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
            onMouseEnter={e => {
              if (currentPage !== item.id) {
                e.currentTarget.style.background = theme.bgAccent;
                e.currentTarget.style.color = theme.textSub;
              }
            }}
            onMouseLeave={e => {
              if (currentPage !== item.id) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = theme.textMuted;
              }
            }}
          >
            <span>{item.icon}</span>{item.label}
          </button>
        ))}
      </div>

      {/* Right side: toggle + user */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <ThemeToggle />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: theme.text, fontSize: 12, fontWeight: 600, transition: 'color 0.3s' }}>{user?.name}</div>
            <div style={{ color: '#FF6B00', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>{user?.role}</div>
          </div>
          <div onClick={() => setMenuOpen(!menuOpen)} style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #FF6B00, #FF8C00)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(255,107,0,0.35)',
          }}>
            {user?.name?.charAt(0) || 'A'}
          </div>
          {menuOpen && (
            <div style={{
              position: 'absolute', top: 48, right: 0,
              background: theme.bgCard, border: `1px solid ${theme.border}`,
              borderRadius: 12, overflow: 'hidden', minWidth: 190,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              zIndex: 200,
            }}>
              <div style={{ padding: '10px 16px', color: theme.textMuted, fontSize: 11, borderBottom: `1px solid ${theme.border}` }}>
                {user?.email}
              </div>
              <button onClick={() => { logout(); setMenuOpen(false); }} style={{
                width: '100%', padding: '10px 16px', background: 'transparent',
                border: 'none', color: '#e53e3e', cursor: 'pointer',
                textAlign: 'left', fontSize: 13, fontFamily: "'Space Mono', monospace",
              }}>
                ⏻ Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}