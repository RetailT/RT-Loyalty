import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';

function QRDisplay({ value, size = 220 }) {
  const canvasRef = useRef(null);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [error, setError]       = useState(false);

  useEffect(() => {
    if (!value) return;
    let cancelled = false;
    import('qrcode').then(QRCode => {
      if (cancelled) return;
      QRCode.toCanvas(canvasRef.current, value, {
        width: size, margin: 2,
        color: { dark: '#111111', light: '#ffffff' },
      }, (err) => {
        if (cancelled) return;
        if (err) setError(true); else setQrLoaded(true);
      });
    }).catch(() => setError(true));
    return () => { cancelled = true; };
  }, [value, size]);

  if (error) return (
    <div style={{ width:size, height:size, display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f5f5', borderRadius:16, color:'#999', fontSize:12, textAlign:'center', padding:16 }}>
      QR unavailable
    </div>
  );

  return (
    <div style={{ position:'relative', display:'inline-block' }}>
      <canvas ref={canvasRef} style={{ display:'block', borderRadius:16 }} />
      {!qrLoaded && (
        <div style={{ position:'absolute', inset:0, background:'#f5f5f5', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:32, height:32, border:'3px solid rgba(255,107,0,0.2)', borderTopColor:'#FF6B00', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        </div>
      )}
    </div>
  );
}

export default function QRPage() {
  const { user }         = useAuth();
  const { theme, mode }  = useTheme();
  const { isMobile }     = useResponsive();

  if (!user) return null;

  return (
    <div style={{ maxWidth:500, margin:'0 auto', padding: isMobile?'32px 16px 100px':'48px 32px 60px' }}>

      {/* Header */}
      <div style={{ marginBottom:32, textAlign:'center' }}>
        <div style={{ color:theme.textMuted, fontSize:12, fontFamily:"'Space Mono',monospace", marginBottom:4 }}>Loyalty Card</div>
        <h1 style={{ color:theme.text, fontFamily:"'Bebas Neue',sans-serif", fontSize:36, letterSpacing:2, lineHeight:1 }}>
          MY QR CODE
        </h1>
      </div>

      {/* Card */}
      <div style={{
        background: theme.bgCard,
        border: `1px solid ${theme.border}`,
        borderRadius: 24,
        padding: isMobile ? 24 : 36,
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
      }}>
        {/* Shop badge */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,107,0,0.08)', border:'1px solid rgba(255,107,0,0.2)', padding:'6px 16px', borderRadius:40, marginBottom:24 }}>
          <span>🏪</span>
          <span style={{ color:'#FF6B00', fontSize:11, fontFamily:"'Space Mono',monospace", letterSpacing:1, textTransform:'uppercase' }}>{user.companyName}</span>
        </div>

        {/* QR */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:24 }}>
          <div style={{ padding:16, background:'#fff', borderRadius:20, boxShadow:'0 4px 20px rgba(0,0,0,0.1)' }}>
            <QRDisplay value={user.serialNo} size={isMobile ? 180 : 220} />
          </div>
        </div>

        {/* Name */}
        <div style={{ color:theme.text, fontFamily:"'Bebas Neue',sans-serif", fontSize:28, letterSpacing:2, marginBottom:4 }}>
          {user.name}
        </div>

        {/* Serial No */}
        <div style={{ color:theme.textMuted, fontSize:12, fontFamily:"'Space Mono',monospace", letterSpacing:2, marginBottom:16 }}>
          {user.serialNo}
        </div>

        {/* Loyalty type badge */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'linear-gradient(135deg,rgba(255,107,0,0.12),rgba(255,140,0,0.06))', border:'1px solid rgba(255,107,0,0.25)', padding:'8px 20px', borderRadius:40 }}>
          <span style={{ color:'#FF6B00', fontSize:12, fontFamily:"'Space Mono',monospace", letterSpacing:1, textTransform:'uppercase' }}>
            {user.loyaltyType || 'Member'}
          </span>
        </div>

        {/* Divider */}
        <div style={{ borderTop:`1px dashed ${theme.border}`, margin:'24px 0' }} />

        {/* Points summary */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div style={{ background: mode==='dark'?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)', borderRadius:12, padding:'14px 12px' }}>
            <div style={{ color:theme.textMuted, fontSize:10, fontFamily:"'Space Mono',monospace", letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Available</div>
            <div style={{ color:'#FF6B00', fontFamily:"'Bebas Neue',sans-serif", fontSize:28, letterSpacing:1 }}>
              {(user.availablePoints || 0).toLocaleString()}
            </div>
            <div style={{ color:theme.textFaint, fontSize:10 }}>points</div>
          </div>
          <div style={{ background: mode==='dark'?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)', borderRadius:12, padding:'14px 12px' }}>
            <div style={{ color:theme.textMuted, fontSize:10, fontFamily:"'Space Mono',monospace", letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Lifetime</div>
            <div style={{ color:theme.text, fontFamily:"'Bebas Neue',sans-serif", fontSize:28, letterSpacing:1 }}>
              {(user.totalPoints || 0).toLocaleString()}
            </div>
            <div style={{ color:theme.textFaint, fontSize:10 }}>points</div>
          </div>
        </div>

        {/* Scan hint */}
        <div style={{ marginTop:20, color:theme.textFaint, fontSize:11, fontFamily:"'Space Mono',monospace", lineHeight:1.6 }}>
          Show this QR code at the counter to earn points
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}