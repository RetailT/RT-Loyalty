import React from 'react';
import { useTheme } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';

const navLinks = [
  { label:'Dashboard',   page:'dashboard',    icon:'⬡' },
  { label:'History',     page:'transactions', icon:'◈' },
  { label:'Promotions',  page:'promotions',   icon:'⊞' },
  { label:'T&Cs',        page:'terms',        icon:'◫' },
  { label:'My QR',       page:'qr',           icon:'▦' },
  { label:'Profile',     page:'profile',      icon:'◉' },
];

export default function Footer({ onNavigate, currentPage }) {
  const { theme, mode } = useTheme();
  const { isMobile }    = useResponsive();
  const year = new Date().getFullYear();
  const showNav = currentPage && !['login', 'landing', 'register'].includes(currentPage);

  return (
    <footer style={{ background: mode==='dark'?'#0a0a0a':'#ffffff', borderTop:`1px solid ${theme.border}`, marginTop: showNav ? 48 : 0, transition:'background 0.3s' }}>
      {showNav && (
        <div style={{ maxWidth:1100, margin:'0 auto', padding: isMobile?'32px 16px 24px':'48px 32px 32px' }}>
          {isMobile ? (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                <div style={{ width:38, height:38, background:'linear-gradient(135deg, var(--primary), var(--primary-dark))', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:900, color:'#fff', boxShadow:'0 4px 12px color-mix(in srgb, var(--primary) 30%, transparent)' }}>RT</div>
                <div>
                  <div style={{ color:theme.text, fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:2, lineHeight:1 }}>RETAIL</div>
                  <div style={{ color:'var(--primary)', fontSize:10, letterSpacing:3, textTransform:'uppercase', fontFamily:'monospace' }}>LOYALTY PORTAL</div>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:8 }}>
                {navLinks.map(l => (
                  <button key={l.page} onClick={() => onNavigate && onNavigate(l.page)} style={{ background: mode==='dark'?'#111':'#f8f8f8', border:`1px solid ${theme.border}`, borderRadius:10, padding:'12px 6px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                    <span style={{ fontSize:18, color:'var(--primary)' }}>{l.icon}</span>
                    <span style={{ color:theme.textMuted, fontSize:11, fontFamily:"'Space Mono',monospace" }}>{l.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', justifyContent:'space-between', gap:48, alignItems:'flex-start' }}>
              {/* Brand block */}
              <div style={{ flex:'0 0 auto', maxWidth:360 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                  <div style={{ width:42, height:42, background:'linear-gradient(135deg, var(--primary), var(--primary-dark))', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:900, color:'#fff', boxShadow:'0 4px 14px color-mix(in srgb, var(--primary) 35%, transparent)' }}>RT</div>
                  <div>
                    <div style={{ color:theme.text, fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:2, lineHeight:1 }}>RETAIL</div>
                    <div style={{ color:'var(--primary)', fontSize:10, letterSpacing:3, textTransform:'uppercase', fontFamily:'monospace' }}>LOYALTY PORTAL</div>
                  </div>
                </div>
                <p style={{ color:theme.textMuted, fontSize:14, lineHeight:1.8, maxWidth:300 }}>
                  Earn points every time you shop and watch them add up. Easily check your balance, track your history, and manage all your points in one simple, convenient place.
                </p>
              </div>

              {/* Nav links */}
              <div style={{ flex:'0 0 auto' }}>
                <div style={{ color:theme.textMuted, fontSize:11, letterSpacing:3, textTransform:'uppercase', fontFamily:"'Space Mono',monospace", marginBottom:18 }}>Navigation</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0px 56px', alignItems:'start' }}>
                  {navLinks.map(l => (
                    <button key={l.page} onClick={() => onNavigate && onNavigate(l.page)}
                      style={{ background:'transparent', border:'none', color:theme.textMuted, fontSize:14, display:'flex', alignItems:'center', gap:10, padding:'9px 0', cursor:'pointer', transition:'color 0.2s', justifyContent:'flex-start', textAlign:'left', whiteSpace:'nowrap' }}
                      onMouseEnter={e => e.currentTarget.style.color='var(--primary)'}
                      onMouseLeave={e => e.currentTarget.style.color=theme.textMuted}>
                      <span style={{ width:30, height:30, background: mode==='dark'?'#1a1a1a':'#f0f0f0', border:`1px solid ${theme.border}`, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>{l.icon}</span>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ borderTop: showNav ? `1px solid ${theme.border}` : 'none' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding: isMobile?'14px 16px':'16px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
          <div style={{ color:theme.textFaint, fontSize: isMobile?11:13 }}>© {year} Retail Target Software Solutions (Pvt) Ltd.</div>
          <div style={{ color:theme.textFaint, fontSize: isMobile?11:13 }}>Powered by <span style={{ color:'var(--primary)' }}>RT POS</span></div>
        </div>
      </div>
    </footer>
  );
}