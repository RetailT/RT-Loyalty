import React, { useEffect, useState } from 'react';
import { useTheme, useCardHover } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';

function getSlug() {
  const host  = window.location.hostname;
  const parts = host.split('.');
  if (host === 'localhost' || host === '127.0.0.1' || host.includes('vercel.app')) {
    return new URLSearchParams(window.location.search).get('shop') || '';
  }
  return parts[0];
}

function BenefitCard({ b }) {
  const { cardProps } = useCardHover({ borderRadius:16, padding:20 });
  return (
    <div {...cardProps}>
      <div style={{ fontSize:32, marginBottom:12 }}>{b.icon}</div>
      <div style={{ color:'inherit', fontWeight:700, fontSize:15, marginBottom:6 }}>{b.title}</div>
      <div style={{ fontSize:14, lineHeight:1.6 }}>{b.desc}</div>
    </div>
  );
}

export default function LandingPage({ onNavigate }) {
  const { theme, mode } = useTheme();
  const { isMobile }    = useResponsive();
  const [company, setCompany] = useState(null);

  useEffect(() => {
    const API  = process.env.REACT_APP_API_URL || 'http://localhost:10000';
    const slug = getSlug();
    const headers = { 'Content-Type': 'application/json' };
    if (slug) headers['X-Shop-Slug'] = slug;

    // ✅ cache: 'no-store' — always fetch fresh, no 304 cache issue
    fetch(`${API}/api/portal/company`, { headers, cache: 'no-store' })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        if (d.success && d.company) setCompany(d.company);
      })
      .catch(err => console.warn('[LandingPage] company fetch failed:', err.message));
  }, []);

  const benefits = [
    { icon:'🏪', title:'Earn at 500+ Stores', desc:'All participating Retail POS outlets across Sri Lanka' },
    { icon:'💎', title:'Tier Rewards',         desc:'Point Card → Product Discount Card → Total Discount Card → Points & Product Discount exclusive perks' },
    { icon:'🎁', title:'Redeem Anytime',       desc:'Vouchers, discounts, free items and more' },
    { icon:'📱', title:'Mobile First',         desc:'Login with just your mobile number — no password needed' },
  ];

  return (
    <div>
      {/* Hero */}
      <section style={{ background: mode==='dark'?'linear-gradient(160deg,#0a0a0a 0%,#111 40%,#1a0a00 100%)':'linear-gradient(160deg,#fff 0%,#fff8f0 100%)', padding: isMobile?'60px 16px 48px':'100px 32px 80px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'10%', left:'50%', transform:'translateX(-50%)', width:500, height:300, background:'radial-gradient(ellipse,rgba(255,107,0,0.08),transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'relative', maxWidth:700, margin:'0 auto' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 14px', borderRadius:40, background:'rgba(255,107,0,0.08)', border:'1px solid rgba(255,107,0,0.25)', color:'#FF6B00', fontSize:13, fontFamily:"'Space Mono',monospace", letterSpacing:2, textTransform:'uppercase', marginBottom:24 }}>
            ◈ Sri Lanka's Retail Loyalty Network
          </div>
          <h1 style={{
            color:theme.text, fontFamily:"'Bebas Neue',sans-serif",
            fontSize: isMobile?64:92, letterSpacing:3, lineHeight:0.95, marginBottom:20,
            background: mode==='dark' ? 'linear-gradient(135deg,rgba(255,107,0,0.18),rgba(255,140,0,0.10))' : 'linear-gradient(135deg,rgba(255,107,0,0.12),rgba(255,140,0,0.06))',
            border:`1px solid rgba(255,107,0,0.35)`, borderRadius:20,
            padding: isMobile?'28px 20px':'36px 40px',
            boxShadow:'0 8px 32px rgba(255,107,0,0.15)',
          }}>
            SHOP MORE.<br/><span style={{ color:'#FF6B00' }}>EARN MORE.</span><br/>REWARD YOURSELF.
          </h1>
          <p style={{ color:theme.textMuted, fontSize: isMobile?16:18, lineHeight:1.8, maxWidth:480, margin:'0 auto 36px' }}>
            Earn points every time you shop and watch them add up. Easily check your balance, track your history, and manage all your points in one simple, convenient place.
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => onNavigate('login')} style={{ padding:'14px 32px', borderRadius:10, background:'linear-gradient(135deg,#FF6B00,#FF8C00)', border:'none', color:'#fff', fontFamily:"'Space Mono',monospace", fontSize:13, letterSpacing:2, textTransform:'uppercase', cursor:'pointer', boxShadow:'0 8px 32px rgba(255,107,0,0.35)', transition:'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
              Login to Account →
            </button>
            <button onClick={() => onNavigate('qr')} style={{ padding:'14px 32px', borderRadius:10, background:'transparent', border:`1px solid ${theme.border}`, color:theme.textSub, fontFamily:"'Space Mono',monospace", fontSize:13, letterSpacing:2, textTransform:'uppercase', cursor:'pointer', transition:'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#FF6B00'; e.currentTarget.style.color='#FF6B00'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=theme.border; e.currentTarget.style.color=theme.textSub; }}>
              Check My Points 📱
            </button>
          </div>
          <div style={{ display:'flex', justifyContent:'center', gap: isMobile?24:48, marginTop:56, flexWrap:'wrap' }}>
            {[['500K+','Members'],['2.5M+','Points Earned'],['500+','Stores'],['5','Card Types']].map(([num,lbl]) => (
              <div key={lbl} style={{ textAlign:'center' }}>
                <div style={{ color:'#FF6B00', fontFamily:"'Bebas Neue',sans-serif", fontSize: isMobile?32:41, letterSpacing:2, lineHeight:1 }}>{num}</div>
                <div style={{ color:theme.textFaint, fontSize:12, fontFamily:"'Space Mono',monospace", letterSpacing:1, textTransform:'uppercase', marginTop:4 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section style={{ maxWidth:1100, margin:'0 auto', padding: isMobile?'48px 16px':'72px 32px' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <h2 style={{ color:theme.text, fontFamily:"'Bebas Neue',sans-serif", fontSize: isMobile?37:48, letterSpacing:2, marginBottom:8 }}>WHY JOIN RETAIL LOYALTY?</h2>
          <p style={{ color:theme.textMuted, fontSize:15 }}>Everything you need to make every rupee count</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr 1fr':'repeat(4,1fr)', gap:16 }}>
          {benefits.map(b => <BenefitCard key={b.title} b={b} />)}
        </div>
      </section>

      {/* Company Info — original layout, phone added */}
      {company && (
        <section style={{ background: mode==='dark'?'#111':'#fff8f0', borderTop:`1px solid rgba(255,107,0,0.15)`, borderBottom:`1px solid rgba(255,107,0,0.15)` }}>
          <div style={{ maxWidth:700, margin:'0 auto', padding: isMobile?'20px 24px':'24px 48px' }}>
            <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent: isMobile?'flex-start':'space-between', gap:20 }}>

              {/* Company name */}
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:44, height:44, background:'linear-gradient(135deg,#FF6B00,#FF8C00)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:23, flexShrink:0 }}>🏪</div>
                <div>
                  <div style={{ color:theme.textMuted, fontSize:12, fontFamily:"'Space Mono',monospace", letterSpacing:2, textTransform:'uppercase', marginBottom:2 }}>Your Store</div>
                  <div style={{ color:theme.text, fontWeight:700, fontSize: isMobile?16:18 }}>{company.name}</div>
                </div>
              </div>

              {!isMobile && <div style={{ width:1, height:36, background:theme.border }} />}

              {/* Address */}
              {company.address && (
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, background:'rgba(255,107,0,0.08)', border:'1px solid rgba(255,107,0,0.2)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>📍</div>
                  <div>
                    <div style={{ color:theme.textMuted, fontSize:12, fontFamily:"'Space Mono',monospace", letterSpacing:1, textTransform:'uppercase', marginBottom:2 }}>Address</div>
                    <div style={{ color:theme.textSub, fontSize:15 }}>{company.address}</div>
                  </div>
                </div>
              )}

              {!isMobile && company.phone && <div style={{ width:1, height:36, background:theme.border }} />}

              {/* ✅ Phone — now shows because backend returns correct PHONE column */}
              {company.phone && (
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, background:'rgba(255,107,0,0.08)', border:'1px solid rgba(255,107,0,0.2)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>📞</div>
                  <div>
                    <div style={{ color:theme.textMuted, fontSize:12, fontFamily:"'Space Mono',monospace", letterSpacing:1, textTransform:'uppercase', marginBottom:2 }}>Hotline</div>
                    <div style={{ color:theme.textSub, fontSize:15 }}>{company.phone}</div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ maxWidth:800, margin:'0 auto', padding: isMobile?'48px 16px':'72px 32px', textAlign:'center' }}>
        <div style={{ background:'linear-gradient(135deg,#FF6B00,#FF8C00)', borderRadius:24, padding: isMobile?'36px 24px':'48px 40px', boxShadow:'0 24px 60px rgba(255,107,0,0.25)' }}>
          <h2 style={{ color:'#fff', fontFamily:"'Bebas Neue',sans-serif", fontSize: isMobile?41:55, letterSpacing:3, marginBottom:12 }}>START EARNING TODAY</h2>
          <p style={{ color:'rgba(255,255,255,0.8)', fontSize:16, marginBottom:28 }}>Sign in with your mobile number. No password required.</p>
          <button onClick={() => onNavigate('login')} style={{ padding:'14px 36px', borderRadius:10, background:'#fff', border:'none', color:'#FF6B00', fontFamily:"'Space Mono',monospace", fontSize:14, letterSpacing:2, textTransform:'uppercase', fontWeight:700, cursor:'pointer', boxShadow:'0 8px 24px rgba(0,0,0,0.15)', transition:'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
            Login Now — It's Free →
          </button>
        </div>
      </section>
    </div>
  );
}