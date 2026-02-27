import React from 'react';
import { useTheme } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';

const navLinks = [
  { label: 'Dashboard',    page: 'dashboard',    icon: '⬡' },
  { label: 'History',      page: 'transactions', icon: '◈' },
  { label: 'Rewards',      page: 'rewards',      icon: '⊞' },
  { label: 'Tiers',        page: 'tiers',        icon: '◫' },
];

export default function Footer({ onNavigate }) {
  const { theme, mode } = useTheme();
  const { isMobile }    = useResponsive();
  const year = new Date().getFullYear();

  return (
    <footer style={{
      background: mode === 'dark' ? '#0a0a0a' : '#ffffff',
      borderTop: `1px solid ${theme.border}`,
      marginTop: 48,
      transition: 'background 0.3s',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '32px 16px 24px' : '48px 32px 32px' }}>
        {isMobile ? (
          <div>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#FF6B00,#FF8C00)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff', boxShadow: '0 4px 12px rgba(255,107,0,0.3)' }}>R</div>
              <div>
                <div style={{ color: theme.text, fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, lineHeight: 1 }}>RETAIL</div>
                <div style={{ color: '#FF6B00', fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', fontFamily: 'monospace' }}>LOYALTY PORTAL</div>
              </div>
            </div>
            {/* Nav grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 8 }}>
              {navLinks.map(l => (
                <button key={l.page} onClick={() => onNavigate && onNavigate(l.page)} style={{
                  background: mode === 'dark' ? '#111' : '#f8f8f8',
                  border: `1px solid ${theme.border}`, borderRadius: 10,
                  padding: '10px 6px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                  <span style={{ fontSize: 16, color: '#FF6B00' }}>{l.icon}</span>
                  <span style={{ color: theme.textMuted, fontSize: 9, fontFamily: "'Space Mono',monospace" }}>{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 48, alignItems: 'flex-start' }}>
            {/* Brand */}
            <div style={{ flex: '0 0 auto', maxWidth: 360 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 42, height: 42, background: 'linear-gradient(135deg,#FF6B00,#FF8C00)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff', boxShadow: '0 4px 14px rgba(255,107,0,0.35)' }}>R</div>
                <div>
                  <div style={{ color: theme.text, fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 2, lineHeight: 1 }}>RETAIL</div>
                  <div style={{ color: '#FF6B00', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', fontFamily: 'monospace' }}>LOYALTY PORTAL</div>
                </div>
              </div>
              <p style={{ color: theme.textMuted, fontSize: 13, lineHeight: 1.8, maxWidth: 300 }}>
                Earn points every time you shop. Check your balance, view history and redeem rewards — all in one place.
              </p>
            </div>

            {/* Navigation */}
            <div style={{ flex: '0 0 auto', textAlign: 'right' }}>
              <div style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', fontFamily: "'Space Mono',monospace", marginBottom: 16 }}>Navigation</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                {navLinks.map(l => (
                  <button key={l.page} onClick={() => onNavigate && onNavigate(l.page)} style={{
                    background: 'transparent', border: 'none',
                    color: theme.textMuted, fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 0', cursor: 'pointer', transition: 'color 0.2s',
                    flexDirection: 'row-reverse',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#FF6B00')}
                  onMouseLeave={e => (e.currentTarget.style.color = theme.textMuted)}>
                    <span style={{ width: 28, height: 28, background: mode === 'dark' ? '#1a1a1a' : '#f0f0f0', border: `1px solid ${theme.border}`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>{l.icon}</span>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ borderTop: `1px solid ${theme.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '14px 16px' : '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ color: theme.textFaint, fontSize: isMobile ? 10 : 12 }}>
            © {year} Retail Target Software Solutions (Pvt) Ltd.
          </div>
          <div style={{ color: theme.textFaint, fontSize: isMobile ? 10 : 12 }}>
            Powered by <span style={{ color: '#FF6B00' }}>RT POS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
