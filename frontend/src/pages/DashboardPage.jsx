import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme, useCardHover } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';
import StatsCard from '../components/StatsCard';
import { getMyTransactions } from '../api';
import { fs, fh, fm } from '../utils/fontScale';

const txColor   = (type, theme) => type==='en'?theme.successText:type==='rm'?theme.redText:'#FF6B00';
const txBg      = (type, theme) => type==='en'?theme.successBg:type==='rm'?theme.errorBg:'rgba(255,107,0,0.08)';
const txBorderC = (type, theme) => type==='en'?theme.successBorder:type==='rm'?theme.errorBorder:'rgba(255,107,0,0.25)';

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
        width: size, margin: 2,
        color: { dark: '#111111', light: '#ffffff' },
      }, (err) => {
        if (cancelled) return;
        if (err) setError(true); else setQrLoaded(true);
      });
    }).catch(() => setError(true));
    return () => { cancelled = true; };
  }, [value, size]);
  if (error) return <div style={{ width:size, height:size, display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f5f5', borderRadius:12, color:'#999', fontSize:13, textAlign:'center', padding:8 }}>QR unavailable</div>;
  return (
    <div style={{ position:'relative', display:'inline-block' }}>
      <canvas ref={canvasRef} style={{ display:'block', borderRadius:12 }} />
      {!qrLoaded && <div style={{ position:'absolute', inset:0, background:'#f5f5f5', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ width:24, height:24, border:'3px solid rgba(255,107,0,0.2)', borderTopColor:'#FF6B00', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /></div>}
    </div>
  );
}

function QuickLinkCard({ q, onNavigate }) {
  const { cardProps } = useCardHover({ borderRadius:14, padding:'16px 14px', textAlign:'left' });
  return (
    <button onClick={() => onNavigate(q.page)} {...cardProps} style={{ ...cardProps.style, width:'100%', border: cardProps.style.border }}>
      <div style={{ fontSize:23, color:'#FF6B00', marginBottom:8 }}>{q.icon}</div>
      <div style={{ color:'inherit', fontWeight:700, fontSize:14, marginBottom:2 }}>{q.label}</div>
      <div style={{ fontSize:12, fontFamily:"'Space Mono',monospace" }}>{q.sub}</div>
    </button>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5  && hour < 12) return { text: 'Good morning,',   emoji: '☀️' };
  if (hour >= 12 && hour < 17) return { text: 'Good afternoon,', emoji: '🌤️' };
  if (hour >= 17 && hour < 24) return { text: 'Good evening,',   emoji: '🌆' };
  return                              { text: 'Working late?',    emoji: '🌙' };
}

export default function DashboardPage({ onNavigate }) {
  const { user, token }  = useAuth();
  const { theme }        = useTheme();
  const { isMobile }     = useResponsive();
  const [txs, setTxs]    = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);

  useEffect(() => {
    if (!token) return;
    getMyTransactions(token, { limit: 5 })
      .then(r => setTxs(r.data || []))
      .catch(() => {})
      .finally(() => setLoadingTx(false));
  }, [token]);

  if (!user) return null;

  const avail   = user.availablePoints || 0;
  const lifePts = user.totalPoints     || 0;
  const greeting = getGreeting();

  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const thisMonthPts = txs
    .filter(t => (t.ID||'').trim().toUpperCase()==='EN' && (t.INVOICE_DATE||'').startsWith(monthStr))
    .reduce((s,t) => s+parseFloat(t.RATE||0), 0);
  const earnCount = txs.filter(t => (t.ID||'').trim().toUpperCase()==='EN').length;

  const quickLinks = [
    { label:'Transaction History', sub:'All point activities', icon:'◈', page:'transactions' },
    { label:'My QR Code',          sub:'Scan to earn points',  icon:'▦', page:'qr'           },
    { label:'Promotions',          sub:'View promotions',      icon:'⊞', page:'promotions'   },
    { label:'My Profile',          sub:'Edit your details',    icon:'◉', page:'profile'      },
  ];

  const statsCols = isMobile ? 2 : 3;

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding: isMobile?'24px 16px 100px':'32px 32px 60px' }}>

      {/* Greeting */}
      <div style={{ marginBottom:24 }}>
        <div style={{ color:theme.textMuted, fontSize:14, fontFamily:"'Space Mono',monospace", marginBottom:4 }}>
          {greeting.text}
        </div>
        <h1 style={{ color:theme.text, fontFamily:"'Bebas Neue',sans-serif", fontSize: isMobile?37:46, letterSpacing:2, lineHeight:1 }}>
          {user.name} {greeting.emoji}
        </h1>
      </div>

      {/* Points Hero */}
      <div style={{ marginBottom:12 }}>
        <div
          onClick={() => onNavigate('qr')}
          style={{ background:'linear-gradient(135deg,#FF6B00,#FF8C00)', borderRadius:20, padding: isMobile?20:28, position:'relative', overflow:'hidden', boxShadow:'0 16px 48px rgba(255,107,0,0.3)', cursor:'pointer' }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:140, height:140, background:'rgba(255,255,255,0.05)', borderRadius:'50%' }} />
          <div style={{ position:'absolute', bottom:-20, left:-20, width:100, height:100, background:'rgba(0,0,0,0.1)', borderRadius:'50%' }} />
          <div style={{ position:'relative', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
            <div>
              <div style={{ color:'rgba(255,255,255,0.7)', fontSize:12, letterSpacing:3, textTransform:'uppercase', fontFamily:"'Space Mono',monospace", marginBottom:6 }}>Available Points</div>
              <div style={{ color:'#fff', fontFamily:"'Bebas Neue',sans-serif", fontSize: isMobile?64:83, letterSpacing:2, lineHeight:0.9 }}>{avail.toLocaleString()}</div>
              <div style={{ color:'rgba(255,255,255,0.6)', fontSize:14, marginTop:6 }}>{lifePts.toLocaleString()} lifetime points</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.15)', backdropFilter:'blur(4px)', padding:'6px 14px', borderRadius:40, color:'#fff', fontSize:13, fontFamily:"'Space Mono',monospace", letterSpacing:1, textTransform:'uppercase' }}>
                🏪 {user.loyaltyType || 'Member'}
              </div>
              <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, marginTop:6, fontFamily:"'Space Mono',monospace" }}>{user.serialNo}</div>
              <div style={{ color:'rgba(255,255,255,0.7)', fontSize:14, marginTop:2, fontFamily:"'Space Mono',monospace", fontWeight:600 }}>{user.companyName}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${statsCols},1fr)`, gap:12, marginBottom:20 }}>
        <StatsCard title="This Month"   value={`+${thisMonthPts.toFixed(2)}`} subtitle="points earned" icon="📈" />
        <StatsCard title="Transactions" value={earnCount}                      subtitle="earn events"   icon="🧾" />
        {!isMobile && <StatsCard title="Shop" value={user.companyName||'—'} subtitle="your store" icon="🏪" />}
      </div>

      {/* Quick Links */}
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`, gap:12, marginBottom:24 }}>
        {quickLinks.map(q => (
          <QuickLinkCard key={q.page} q={q} onNavigate={onNavigate} />
        ))}
      </div>

      {/* Recent Transactions — EN and RM only */}
      <div style={{ background:theme.bgCard, border:`1px solid ${theme.border}`, borderRadius:16, overflow:'hidden' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', borderBottom:`1px solid ${theme.border}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ color:'#FF6B00' }}>◈</span>
            <span style={{ color:theme.text, fontWeight:700, fontSize:15 }}>Recent Activity</span>
          </div>
          <button onClick={() => onNavigate('transactions')} style={{ background:'none', border:'none', color:'#FF6B00', fontSize:13, cursor:'pointer', fontFamily:"'Space Mono',monospace", letterSpacing:1 }}>SEE ALL →</button>
        </div>
        {loadingTx ? (
          <div style={{ padding:40, textAlign:'center', color:theme.textFaint, fontFamily:"'Space Mono',monospace", fontSize:14 }}>Loading...</div>
        ) : txs.filter(t => ['en','rm'].includes((t.ID||'').trim().toLowerCase())).length===0 ? (
          <div style={{ padding:40, textAlign:'center', color:theme.textFaint, fontFamily:"'Space Mono',monospace", fontSize:14 }}>No transactions yet. Start shopping to earn points!</div>
        ) : txs
            .filter(t => ['en','rm'].includes((t.ID||'').trim().toLowerCase()))
            .map((tx, i, arr) => {
          const type = (tx.ID||'EN').trim().toLowerCase();
          const pts  = parseFloat(tx.RATE||0);
          return (
            <div key={tx.IDX||i} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px', borderBottom: i<arr.length-1?`1px solid ${theme.border}`:'none', transition:'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background=theme.bgSubtle}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, background:txBg(type,theme), border:`1px solid ${txBorderC(type,theme)}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
                {type==='en'?'🛒':'⚙'}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:theme.textSub, fontSize:14, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tx.COMPANY_NAME||tx.INVOICENO||'Transaction'}</div>
                <div style={{ color:theme.textFaint, fontSize:12, fontFamily:"'Space Mono',monospace", marginTop:2 }}>{(tx.INVOICE_DATE||'').slice(0,10)}</div>
              </div>
              <div style={{ color:txColor(type,theme), fontFamily:"'Bebas Neue',sans-serif", fontSize:21, fontWeight:900, flexShrink:0 }}>
                {type==='en'?'+':''}{pts.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}