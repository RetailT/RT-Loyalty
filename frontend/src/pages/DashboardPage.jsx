// src/pages/DashboardPage.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';
import StatsCard from '../components/StatsCard';
import { getMyTransactions } from '../api';
import { TIER_CONFIG } from '../utils/tierConfig';

const txColor   = (type, theme) => type==='earn'?theme.successText:type==='redeem'?theme.redText:'#FF6B00';
const txBg      = (type, theme) => type==='earn'?theme.successBg:type==='redeem'?theme.errorBg:'rgba(255,107,0,0.08)';
const txBorderC = (type, theme) => type==='earn'?theme.successBorder:type==='redeem'?theme.errorBorder:'rgba(255,107,0,0.25)';

// ── QR Code display using canvas (no extra package needed) ──────────────────
function QRDisplay({ value, size = 160 }) {
  const canvasRef = React.useRef(null);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!value) return;
    let cancelled = false;
    import('qrcode').then(QRCode => {
      if (cancelled) return;
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: { dark: '#111111', light: '#ffffff' },
      }, (err) => {
        if (cancelled) return;
        if (err) setError(true);
        else setQrLoaded(true);
      });
    }).catch(() => setError(true));
    return () => { cancelled = true; };
  }, [value, size]);

  if (error) return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: 12, color: '#999', fontSize: 11, fontFamily: "'Space Mono',monospace", textAlign: 'center', padding: 8 }}>
      QR unavailable
    </div>
  );

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <canvas ref={canvasRef} style={{ display: 'block', borderRadius: 12 }} />
      {!qrLoaded && (
        <div style={{ position: 'absolute', inset: 0, background: '#f5f5f5', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 24, height: 24, border: '3px solid rgba(255,107,0,0.2)', borderTopColor: '#FF6B00', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}
    </div>
  );
}

export default function DashboardPage({ onNavigate }) {
  const { user, token }  = useAuth();
  const { theme, mode }  = useTheme();
  const { isMobile }     = useResponsive();
  const [txs, setTxs]    = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (!token) return;
    getMyTransactions(token, { limit: 5 })
      .then(r => setTxs(r.data || []))
      .catch(() => {})
      .finally(() => setLoadingTx(false));
  }, [token]);

  if (!user) return null;

  const tier    = user.membershipTier || 'Bronze';
  const tierCfg = TIER_CONFIG[tier] || TIER_CONFIG.Bronze;
  const avail   = user.availablePoints  || 0;
  const lifePts = user.totalPoints      || 0;
  const pct     = tierCfg.nextPoints ? Math.min(100, (lifePts / tierCfg.nextPoints) * 100) : 100;
  const toNext  = tierCfg.nextPoints ? (tierCfg.nextPoints - lifePts).toLocaleString() : null;

  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const thisMonthPts = txs.filter(t => (t.TYPE||'').toLowerCase()==='earn' && (t.TX_DATE||'').startsWith(monthStr)).reduce((s,t) => s+(t.POINTS||0), 0);
  const earnCount    = txs.filter(t => (t.TYPE||'').toLowerCase()==='earn').length;

  const quickLinks = [
    { label:'Transaction History', sub:'All point activities', icon:'◈', page:'transactions' },
    { label:'Rewards Catalog',     sub:'Browse & redeem',     icon:'⊞', page:'rewards'      },
    { label:'Tiers & Benefits',    sub:'View your perks',     icon:'◫', page:'tiers'        },
    { label:'My Profile',          sub:'Edit your details',   icon:'◉', page:'profile'      },
  ];

  // QR value — use membershipId or qrCode from user
  const qrValue = user.qrCode ? String(user.qrCode) : user.membershipId;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '24px 16px 100px' : '32px 32px 60px' }}>

      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: theme.textMuted, fontSize: 12, fontFamily: "'Space Mono',monospace", marginBottom: 4 }}>Good day,</div>
        <h1 style={{ color: theme.text, fontFamily: "'Bebas Neue',sans-serif", fontSize: isMobile ? 32 : 40, letterSpacing: 2, lineHeight: 1 }}>
          {user.name} 👋
        </h1>
      </div>

      {/* Points Hero + QR side by side on desktop */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto', gap: 16, marginBottom: 20, alignItems: 'stretch' }}>

        {/* Points Hero */}
        <div style={{ background: tierCfg.gradient, borderRadius: 20, padding: isMobile ? 20 : 28, position: 'relative', overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.3)' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, background: 'rgba(0,0,0,0.1)', borderRadius: '50%' }} />
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', fontFamily: "'Space Mono',monospace", marginBottom: 6 }}>Available Points</div>
              <div style={{ color: '#fff', fontFamily: "'Bebas Neue',sans-serif", fontSize: isMobile ? 56 : 72, letterSpacing: 2, lineHeight: 0.9 }}>{avail.toLocaleString()}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 6 }}>{lifePts.toLocaleString()} lifetime points</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', padding: '6px 14px', borderRadius: 40, color: '#fff', fontSize: 11, fontFamily: "'Space Mono',monospace", letterSpacing: 1, textTransform: 'uppercase' }}>
                {tierCfg.icon} {tier}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 6, fontFamily: "'Space Mono',monospace" }}>{user.membershipId}</div>
            </div>
          </div>
          {tierCfg.next && (
            <div style={{ position: 'relative', marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontFamily: "'Space Mono',monospace" }}>{tier}</span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontFamily: "'Space Mono',monospace" }}>{toNext} pts to {tierCfg.next}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: '#fff', borderRadius: 4, transition: 'width 1s ease' }} />
              </div>
            </div>
          )}
        </div>

        {/* QR Code Card */}
        <div style={{
          background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 20,
          padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 12, minWidth: isMobile ? 'auto' : 200,
          cursor: 'pointer', transition: 'all 0.2s',
        }}
          onClick={() => setShowQR(true)}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,107,0,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <div style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'Space Mono',monospace" }}>My QR Code</div>
          <QRDisplay value={qrValue} size={isMobile ? 120 : 140} />
          <div style={{ color: theme.textFaint, fontSize: 10, fontFamily: "'Space Mono',monospace", textAlign: 'center' }}>
            Tap to enlarge
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 3}, 1fr)`, gap: 12, marginBottom: 20 }}>
        <StatsCard title="This Month"   value={`+${thisMonthPts}`}   subtitle="points earned" icon="📈" />
        <StatsCard title="Transactions" value={earnCount}             subtitle="earn events"   icon="🧾" />
        <StatsCard title="Tier Expiry"  value={user.tierExpiry||'—'} subtitle="current tier"  icon="📅" />
      </div>

      {/* Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, gap: 12, marginBottom: 24 }}>
        {quickLinks.map(q => (
          <button key={q.page} onClick={() => onNavigate(q.page)} style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 14, padding: '16px 14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,107,0,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.transform = 'translateY(0)'; }}>
            <div style={{ fontSize: 20, color: '#FF6B00', marginBottom: 8 }}>{q.icon}</div>
            <div style={{ color: theme.text, fontWeight: 700, fontSize: 12, marginBottom: 2 }}>{q.label}</div>
            <div style={{ color: theme.textFaint, fontSize: 10, fontFamily: "'Space Mono',monospace" }}>{q.sub}</div>
          </button>
        ))}
      </div>

      {/* Recent Transactions */}
      <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#FF6B00' }}>◈</span>
            <span style={{ color: theme.text, fontWeight: 700, fontSize: 13 }}>Recent Activity</span>
          </div>
          <button onClick={() => onNavigate('transactions')} style={{ background: 'none', border: 'none', color: '#FF6B00', fontSize: 11, cursor: 'pointer', fontFamily: "'Space Mono',monospace", letterSpacing: 1 }}>SEE ALL →</button>
        </div>
        {loadingTx ? (
          <div style={{ padding: 40, textAlign: 'center', color: theme.textFaint, fontFamily: "'Space Mono',monospace", fontSize: 12 }}>Loading...</div>
        ) : txs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: theme.textFaint, fontFamily: "'Space Mono',monospace", fontSize: 12 }}>No transactions yet. Start shopping to earn points!</div>
        ) : txs.map((tx, i) => {
          const type = (tx.TYPE || 'earn').toLowerCase();
          return (
            <div key={tx.IDX || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: i < txs.length - 1 ? `1px solid ${theme.border}` : 'none', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = theme.bgSubtle}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: txBg(type, theme), border: `1px solid ${txBorderC(type, theme)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                {type === 'earn' ? '🛒' : type === 'redeem' ? '🎁' : '⭐'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: theme.textSub, fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.DESCRIPTION || 'Transaction'}</div>
                <div style={{ color: theme.textFaint, fontSize: 10, fontFamily: "'Space Mono',monospace", marginTop: 2 }}>{tx.TX_DATE?.slice(0, 10) || ''}</div>
              </div>
              <div style={{ color: txColor(type, theme), fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, fontWeight: 900, flexShrink: 0 }}>
                {(tx.POINTS || 0) > 0 ? '+' : ''}{tx.POINTS || 0}
              </div>
            </div>
          );
        })}
      </div>

      {/* QR Enlarge Modal */}
      {showQR && (
        <div onClick={() => setShowQR(false)} style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 24, padding: 32,
            textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,0.3)', maxWidth: 320, width: '100%',
          }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: 2, color: '#111', marginBottom: 4 }}>MY QR CODE</div>
            <div style={{ color: '#888', fontSize: 11, fontFamily: "'Space Mono',monospace", marginBottom: 20 }}>{user.membershipId}</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <QRDisplay value={qrValue} size={220} />
            </div>
            <div style={{ color: '#FF6B00', fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, marginBottom: 4 }}>{user.name}</div>
            <div style={{ color: '#888', fontSize: 11, fontFamily: "'Space Mono',monospace", marginBottom: 20 }}>{tier} Member</div>
            <button onClick={() => setShowQR(false)} style={{
              width: '100%', padding: '12px', background: 'linear-gradient(135deg,#FF6B00,#FF8C00)',
              border: 'none', borderRadius: 10, color: '#fff',
              fontFamily: "'Space Mono',monospace", fontSize: 11, letterSpacing: 2,
              textTransform: 'uppercase', cursor: 'pointer',
            }}>Close</button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}