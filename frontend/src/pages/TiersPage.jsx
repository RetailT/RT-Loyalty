// src/pages/TiersPage.jsx — Real user data
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';
import { TIER_CONFIG, TIER_BENEFITS, TIER_ORDER } from '../utils/tierConfig';

export default function TiersPage() {
  const { user }     = useAuth();
  const { theme }    = useTheme();
  const { isMobile } = useResponsive();

  if (!user) return null;

  const currentTier = user.membershipTier || 'Bronze';
  const currentIdx  = TIER_ORDER.indexOf(currentTier);
  const tierCfg     = TIER_CONFIG[currentTier] || TIER_CONFIG.Bronze;
  const lifePts     = user.totalPoints || 0;
  const pct         = tierCfg.nextPoints ? Math.min(100,(lifePts/tierCfg.nextPoints)*100) : 100;

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding: isMobile?'24px 16px 100px':'32px 32px 60px' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ color:'#FF6B00', fontSize:10, fontFamily:"'Space Mono',monospace", letterSpacing:3, textTransform:'uppercase', marginBottom:4 }}>◫ Membership</div>
        <h1 style={{ color:theme.text, fontFamily:"'Bebas Neue',sans-serif", fontSize: isMobile?32:40, letterSpacing:2 }}>TIERS & BENEFITS</h1>
      </div>

      {/* Current tier status card */}
      <div style={{ background:tierCfg.gradient, borderRadius:16, padding: isMobile?'20px':'24px 28px', marginBottom:24, boxShadow:'0 12px 40px rgba(0,0,0,0.25)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, background:'rgba(255,255,255,0.06)', borderRadius:'50%' }} />
        <div style={{ position:'relative' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: tierCfg.next?16:0 }}>
            <div>
              <div style={{ color:'rgba(255,255,255,0.7)', fontSize:10, fontFamily:"'Space Mono',monospace", letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>Your Current Tier</div>
              <div style={{ color:'#fff', fontFamily:"'Bebas Neue',sans-serif", fontSize: isMobile?36:48, letterSpacing:3, lineHeight:1 }}>{tierCfg.icon} {currentTier}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ color:'rgba(255,255,255,0.7)', fontSize:10, fontFamily:"'Space Mono',monospace", marginBottom:4 }}>Lifetime Points</div>
              <div style={{ color:'#fff', fontFamily:"'Bebas Neue',sans-serif", fontSize:28, letterSpacing:1 }}>{lifePts.toLocaleString()}</div>
            </div>
          </div>
          {tierCfg.next && (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ color:'rgba(255,255,255,0.7)', fontSize:10, fontFamily:"'Space Mono',monospace" }}>{currentTier}</span>
                <span style={{ color:'rgba(255,255,255,0.7)', fontSize:10, fontFamily:"'Space Mono',monospace" }}>
                  {(tierCfg.nextPoints - lifePts).toLocaleString()} pts to {tierCfg.next}
                </span>
              </div>
              <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:4, height:8, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${pct}%`, background:'#fff', borderRadius:4, transition:'width 1s ease' }} />
              </div>
            </>
          )}
          {!tierCfg.next && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.2)', borderRadius:40, padding:'6px 16px', color:'#fff', fontSize:12, fontFamily:"'Space Mono',monospace" }}>
              🏆 Maximum Tier Achieved!
            </div>
          )}
        </div>
      </div>

      {/* All tier cards */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {TIER_ORDER.map(tierName => {
          const cfg        = TIER_CONFIG[tierName];
          const idx        = TIER_ORDER.indexOf(tierName);
          const isCurrent  = tierName === currentTier;
          const isUnlocked = idx <= currentIdx;
          const benefits   = TIER_BENEFITS[tierName] || [];

          return (
            <div key={tierName} style={{ background:theme.bgCard, border:`${isCurrent?2:1}px solid ${isCurrent?'rgba(255,107,0,0.5)':theme.border}`, borderRadius:16, overflow:'hidden', opacity: isUnlocked?1:0.55, transition:'all 0.2s', boxShadow: isCurrent?'0 4px 20px rgba(255,107,0,0.15)':'none' }}>
              <div style={{ background:cfg.gradient, padding: isMobile?'14px 16px':'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontSize:28 }}>{cfg.icon}</span>
                  <div>
                    <div style={{ color:'#fff', fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:2 }}>{tierName.toUpperCase()}</div>
                    <div style={{ color:'rgba(255,255,255,0.7)', fontSize:10, fontFamily:"'Space Mono',monospace" }}>
                      {cfg.min.toLocaleString()}{cfg.nextPoints?` – ${cfg.nextPoints.toLocaleString()}`:'+'} pts
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  {isCurrent && (
                    <div style={{ background:'rgba(255,255,255,0.2)', backdropFilter:'blur(4px)', padding:'5px 12px', borderRadius:40, color:'#fff', fontSize:10, fontFamily:"'Space Mono',monospace", letterSpacing:1 }}>
                      ✓ CURRENT
                    </div>
                  )}
                  {!isUnlocked && <span style={{ fontSize:18, opacity:0.7 }}>🔒</span>}
                </div>
              </div>
              <div style={{ padding: isMobile?'14px 16px':'16px 20px' }}>
                <div style={{ color:theme.textMuted, fontSize:9, letterSpacing:2, textTransform:'uppercase', fontFamily:"'Space Mono',monospace", marginBottom:10 }}>Benefits</div>
                <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'repeat(2,1fr)', gap:'6px 16px' }}>
                  {benefits.map(benefit => (
                    <div key={benefit} style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                      <span style={{ color: isUnlocked?'#FF6B00':theme.textFaint, fontSize:12, flexShrink:0, marginTop:1 }}>
                        {isUnlocked ? '◈' : '○'}
                      </span>
                      <span style={{ color: isUnlocked?theme.textSub:theme.textFaint, fontSize:12, lineHeight:1.5 }}>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}