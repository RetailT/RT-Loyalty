import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import useResponsive from '../hooks/useResponsive';

const navItems = [
  { id: 'dashboard',    label: 'Dashboard',    icon: '⬡' },
  { id: 'transactions', label: 'History',       icon: '◈' },
  { id: 'rewards',      label: 'Rewards',       icon: '⊞' },
  { id: 'tiers',        label: 'Tiers',         icon: '◫' },
  { id: 'profile',      label: 'Profile',       icon: '◉' },
];

export default function Navbar({ currentPage, onNavigate }) {
  const { user, logout }           = useAuth();
  const { theme }                  = useTheme();
  const { isMobile, isTablet }     = useResponsive();
  const [menuOpen, setMenuOpen]    = useState(false);
  const [tabletNav, setTabletNav]  = useState(false);

  const handleNav = (page) => {
    onNavigate(page);
    setMenuOpen(false);
    setTabletNav(false);
  };

  const handleLogout = () => {
    logout();
    onNavigate('landing');
    setMenuOpen(false);
  };

  return (
    <>
      <nav style={{
        background: theme.navBg,
        borderBottom: `1px solid ${theme.navBorder}`,
        padding: isMobile ? '0 16px' : '0 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64, position: 'sticky', top: 0, zIndex: 100,
        boxShadow: theme.navShadow,
        backdropFilter: 'blur(10px)',
        transition: 'background 0.3s',
      }}>
        {/* Logo */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          onClick={() => handleNav(user ? 'dashboard' : 'landing')}
        >
          <div style={{
            width: 34, height: 34,
            background: 'linear-gradient(135deg,#FF6B00,#FF8C00)',
            borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 900, color: '#fff',
            boxShadow: '0 4px 12px rgba(255,107,0,0.35)', flexShrink: 0,
          }}>R</div>
          <div>
            <div style={{ color: theme.text, fontFamily: "'Bebas Neue',sans-serif", fontSize: isMobile ? 16 : 18, letterSpacing: 2, lineHeight: 1 }}>
              RETAIL
            </div>
            {!isMobile && (
              <div style={{ color: '#FF6B00', fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', fontFamily: 'monospace' }}>
                LOYALTY PORTAL
              </div>
            )}
          </div>
        </div>

        {/* Desktop nav links */}
        {!isMobile && !isTablet && user && (
          <div style={{ display: 'flex', gap: 4 }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => handleNav(item.id)} style={{
                background: currentPage === item.id
                  ? 'linear-gradient(135deg,rgba(255,107,0,0.12),rgba(255,140,0,0.06))'
                  : 'transparent',
                border: currentPage === item.id
                  ? '1px solid rgba(255,107,0,0.35)'
                  : '1px solid transparent',
                color: currentPage === item.id ? '#FF6B00' : theme.textMuted,
                padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: 1,
                textTransform: 'uppercase', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
              onMouseEnter={e => { if (currentPage !== item.id) { e.currentTarget.style.background = theme.bgAccent; e.currentTarget.style.color = theme.textSub; }}}
              onMouseLeave={e => { if (currentPage !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.textMuted; }}}>
                <span>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
          <ThemeToggle compact={isMobile} />

          {user ? (
            <>
              {!isMobile && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: theme.text, fontSize: 12, fontWeight: 600 }}>{user?.name}</div>
                  <div style={{ color: '#FF6B00', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
                    {user?.tier_level} Member
                  </div>
                </div>
              )}

              {/* Avatar dropdown */}
              <div style={{ position: 'relative' }}>
                <div onClick={() => setMenuOpen(!menuOpen)} style={{
                  width: 34, height: 34,
                  background: 'linear-gradient(135deg,#FF6B00,#FF8C00)',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 900, fontSize: 13, cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(255,107,0,0.35)',
                }}>
                  {user?.name?.charAt(0) || 'U'}
                </div>
                {menuOpen && (
                  <div style={{
                    position: 'absolute', top: 42, right: 0,
                    background: theme.bgCard, border: `1px solid ${theme.border}`,
                    borderRadius: 12, overflow: 'hidden', minWidth: 180,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 200,
                  }}>
                    <div style={{ padding: '10px 16px', color: theme.textMuted, fontSize: 11, borderBottom: `1px solid ${theme.border}` }}>
                      {user?.mobile_number}
                    </div>
                    {(isMobile || isTablet) && navItems.map(item => (
                      <button key={item.id} onClick={() => handleNav(item.id)} style={{
                        width: '100%', padding: '10px 16px',
                        background: currentPage === item.id ? 'rgba(255,107,0,0.08)' : 'transparent',
                        border: 'none',
                        color: currentPage === item.id ? '#FF6B00' : theme.textSub,
                        cursor: 'pointer', textAlign: 'left', fontSize: 13,
                        display: 'flex', alignItems: 'center', gap: 8,
                        borderBottom: `1px solid ${theme.border}`,
                      }}>
                        <span>{item.icon}</span>{item.label}
                      </button>
                    ))}
                    <button onClick={handleLogout} style={{
                      width: '100%', padding: '10px 16px',
                      background: 'transparent', border: 'none',
                      color: theme.errorText, cursor: 'pointer',
                      textAlign: 'left', fontSize: 13,
                      fontFamily: "'Space Mono',monospace",
                    }}>
                      ⏻ Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button onClick={() => handleNav('login')} style={{
              background: 'linear-gradient(135deg,#FF6B00,#FF8C00)',
              border: 'none', borderRadius: 8, padding: '8px 18px',
              color: '#fff', fontSize: 12, fontWeight: 700,
              fontFamily: "'Space Mono',monospace", letterSpacing: 1,
              cursor: 'pointer', textTransform: 'uppercase',
              boxShadow: '0 4px 12px rgba(255,107,0,0.3)',
            }}>
              Login
            </button>
          )}

          {/* Tablet hamburger */}
          {isTablet && user && (
            <button onClick={() => setTabletNav(!tabletNav)} style={{
              background: theme.bgAccent, border: `1px solid ${theme.border}`,
              borderRadius: 8, padding: '7px 10px', cursor: 'pointer',
              color: theme.text, fontSize: 16,
            }}>
              {tabletNav ? '✕' : '☰'}
            </button>
          )}
        </div>
      </nav>

      {/* Tablet dropdown nav */}
      {isTablet && tabletNav && user && (
        <div style={{
          background: theme.navBg, borderBottom: `1px solid ${theme.border}`,
          padding: '8px 16px', display: 'flex', gap: 6, flexWrap: 'wrap',
          zIndex: 99, position: 'sticky', top: 64,
          boxShadow: theme.navShadow,
        }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => handleNav(item.id)} style={{
              background: currentPage === item.id ? 'rgba(255,107,0,0.12)' : theme.bgAccent,
              border: `1px solid ${currentPage === item.id ? 'rgba(255,107,0,0.35)' : theme.border}`,
              color: currentPage === item.id ? '#FF6B00' : theme.textMuted,
              padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
              fontFamily: "'Space Mono',monospace", fontSize: 11, letterSpacing: 1,
              textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
