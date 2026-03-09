// src/pages/TiersPage.jsx — POSBACK loyalty type based
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';

const LOYALTY_TYPES = [
  { name:'1. POINT CARD',                  icon:'💳', desc:'Earn points on every purchase', color:'linear-gradient(135deg,#92400e,#b45309)' },
  { name:'2. PRODUCT DISCOUNT CARD',       icon:'💰', desc:'Get product discounts on purchases', color:'linear-gradient(135deg,#475569,#64748b)' },
  { name:'3. TOTAL DISCOUNT CARD',         icon:'🏷️', desc:'Total bill discount on every visit', color:'linear-gradient(135deg,#b45309,#d97706)' },
  { name:'4. POINT USING MOBILE NO',       icon:'📱', desc:'Earn points linked to your mobile number', color:'linear-gradient(135deg,#0369a1,#0284c7)' },
  { name:'5. POINTS AND PRODUCT DISCOUNT', icon:'⭐', desc:'Earn points & enjoy product discounts', color:'linear-gradient(135deg,#4338ca,#6366f1)' },
];

export default function TiersPage() {
  const { user }     = useAuth();
  const { theme }    = useTheme();
  const { isMobile } = useResponsive();

  if (!user) return null;

  const currentType = (user.loyaltyType || '').trim();
  const avail       = user.availablePoints || 0;
  const total       = user.totalPoints     || 0;
  const redeemed    = user.redeemedPoints  || 0;

  // Find current type config
  const currentCfg = LOYALTY_TYPES.find(t => t.name === currentType) || LOYALTY_TYPES[0];

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding: isMobile?'24px 16px 100px':'32px 32px 60px' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ color:'#FF6B00', fontSize:10, fontFamily:"'Space Mono',monospace", letterSpacing:3, textTransform:'uppercase', marginBottom:4 }}>◫ Membership</div>
        <h1 style={{ color:theme.text, fontFamily:"'Bebas Neue',sans-serif", fontSize: isMobile?32:40, letterSpacing:2 }}>LOYALTY TYPE & POINTS</h1>
      </div>

      {/* Current card */}
      <div style={{ background:currentCfg.color, borderRadius:16, padding: isMobile?'20px':'24px 28px', marginBottom:24, boxShadow:'0 12px 40px rgba(0,0,0,0.25)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, background:'rgba(255,255,255,0.06)', borderRadius:'50%' }} />
        <div style={{ position:'relative' }}>
          <div style={{ color:'rgba(255,255,255,0.7)', fontSize:10, fontFamily:"'Space Mono',monospace", letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Your Card Type</div>
          <div style={{ color:'#fff', fontFamily:"'Bebas Neue',sans-serif", fontSize: isMobile?24:32, letterSpacing:2, lineHeight:1.2, marginBottom:16 }}>
            {currentCfg.icon} {currentType || 'Standard Member'}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {[
              ['Available', avail.toLocaleString()],
              ['Lifetime',  total.toLocaleString()],
              ['Redeemed',  redeemed.toLocaleString()],
            ].map(([lbl,val]) => (
              <div key={lbl} style={{ background:'rgba(255,255,255,0.12)', borderRadius:10, padding:'12px' }}>
                <div style={{ color:'rgba(255,255,255,0.7)', fontSize:9, fontFamily:"'Space Mono',monospace", letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>{lbl}</div>
                <div style={{ color:'#fff', fontFamily:"'Bebas Neue',sans-serif", fontSize:24, letterSpacing:1 }}>{val}</div>
                <div style={{ color:'rgba(255,255,255,0.6)', fontSize:9, fontFamily:"'Space Mono',monospace" }}>pts</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All loyalty types */}
      <div style={{ marginBottom:16 }}>
        <div style={{ color:theme.textMuted, fontSize:11, fontFamily:"'Space Mono',monospace", letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>All Card Types</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {LOYALTY_TYPES.map(lt => {
            const isCurrent = lt.name === currentType;
            return (
              <div key={lt.name} style={{ background:theme.bgCard, border:`${isCurrent?2:1}px solid ${isCurrent?'rgba(255,107,0,0.5)':theme.border}`, borderRadius:14, padding:'16px 20px', display:'flex', alignItems:'center', gap:16, boxShadow: isCurrent?'0 4px 20px rgba(255,107,0,0.1)':'none' }}>
                <div style={{ width:44, height:44, borderRadius:12, background:lt.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                  {lt.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ color:theme.text, fontWeight:700, fontSize:12, marginBottom:2 }}>{lt.name}</div>
                  <div style={{ color:theme.textMuted, fontSize:11 }}>{lt.desc}</div>
                </div>
                {isCurrent && (
                  <div style={{ background:'rgba(255,107,0,0.08)', border:'1px solid rgba(255,107,0,0.25)', borderRadius:20, padding:'4px 12px', color:'#FF6B00', fontSize:9, fontFamily:"'Space Mono',monospace", letterSpacing:2, textTransform:'uppercase', flexShrink:0 }}>
                    ✓ YOUR CARD
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Shop info */}
      <div style={{ background:theme.bgCard, border:`1px solid ${theme.border}`, borderRadius:14, padding:'16px 20px' }}>
        <div style={{ color:'#FF6B00', fontSize:10, fontFamily:"'Space Mono',monospace", letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>Your Shop</div>
        {[
          ['Shop Name',    user.companyName  || '—'],
          ['Card / Serial No.', user.serialNo || '—'],
          ['Mobile',       user.phone        || '—'],
        ].map(([lbl,val]) => (
          <div key={lbl} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${theme.border}` }}>
            <span style={{ color:theme.textMuted, fontSize:11, fontFamily:"'Space Mono',monospace" }}>{lbl}</span>
            <span style={{ color:theme.textSub, fontSize:12, fontWeight:600 }}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}