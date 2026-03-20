import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme, useCardHover } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';
import { getMyTransactions } from '../api';
import { fs, fh, fm } from '../utils/fontScale';

const TYPE_META = {
  en:  { label:'EARNED',           icon:'🛒' },
  rm:  { label:'REDEEMED',         icon:'🎁' },
  pd:  { label:'DISCOUNT',         icon:'💰' },
  sdb: { label:'BIRTHDAY DISCOUNT',icon:'🎂' },
};

function SummaryCard({ label, value, color, bg, border }) {
  const { cardProps } = useCardHover({ borderRadius:14 });
  return (
    <div {...cardProps} style={{ ...cardProps.style, cursor:'default', background: bg, border:`1px solid ${border}`, padding:'14px 16px' }}>
      <div style={{ color:'#888', fontSize:12, fontFamily:"'Space Mono',monospace", letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>{label}</div>
      {/* <div style={{ color, fontFamily:"'Bebas Neue',sans-serif", fontSize:32, letterSpacing:2, lineHeight:1 }}>{value} <span style={{ fontSize:16 }}>PTS</span></div> */}
    </div>
  );
}

export default function TransactionsPage() {
  const { token }             = useAuth();
  const { theme }             = useTheme();
  const { isMobile }          = useResponsive();
  const [txs, setTxs]         = useState([]);
  const [filter, setFilter]   = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => { setTxs([]); setPage(1); setHasMore(true); }, [filter]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);

    let apiType = undefined;
    if (filter === 'earn')     apiType = 'earn';
    if (filter === 'redeem')   apiType = 'redeem';
    if (filter === 'discount') apiType = 'discount';
    if (filter === 'birthday') apiType = 'birthday';

    const params = { page, limit:20, ...(apiType ? { type: apiType } : {}) };

    getMyTransactions(token, params)
      .then(r => {
        const data = r.data || [];
        // All tab — EN and RM only
        let filtered = data;
        if (filter === 'all') {
          filtered = data.filter(t => {
            const id = (t.ID||'').trim().toLowerCase();
            return id === 'en' || id === 'rm';
          });
        }
        setTxs(prev => page===1 ? filtered : [...prev, ...filtered]);
        setHasMore(data.length === 20);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, filter, page]);

  const txColor  = t => t==='en'?theme.successText:t==='rd'||t==='rm'?theme.redText:t==='pd'||t==='sdb'?'var(--primary)':theme.textMuted;
  const txBg     = t => t==='en'?theme.successBg:t==='rd'||t==='rm'?theme.errorBg:'color-mix(in srgb, var(--primary) 8%, transparent)';
  const txBorder = t => t==='en'?theme.successBorder:t==='rd'||t==='rm'?theme.errorBorder:'color-mix(in srgb, var(--primary) 25%, transparent)';

  // Summary — EN = earned, RM = redeemed (negative values)
  const totalEarned   = txs.filter(t=>(t.ID||'').trim().toLowerCase()==='en')
                           .reduce((s,t)=>s+parseFloat(t.RATE||0),0);
  const totalRedeemed = txs.filter(t=>(t.ID||'').trim().toLowerCase()==='rm')
                           .reduce((s,t)=>s+Math.abs(parseFloat(t.RATE||0)),0);

  const filters = [
    { val:'all',      lbl:'All'              },
    { val:'earn',     lbl:'Earned'           },
    { val:'redeem',   lbl:'Redeemed'         },
    { val:'discount', lbl:'Discount'         },
    { val:'birthday', lbl:'Birthday Discount'},
  ];

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding: isMobile?'24px 16px 100px':'32px 32px 60px' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ color:'var(--primary)', fontSize:12, fontFamily:"'Space Mono',monospace", letterSpacing:3, textTransform:'uppercase', marginBottom:4 }}>◈ Points Activity</div>
        <h1 style={{ color:theme.text, fontFamily:"'Bebas Neue',sans-serif", fontSize: isMobile?37:46, letterSpacing:2 }}>TRANSACTION HISTORY</h1>
      </div>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
        <SummaryCard label="Total Earned"   value={`+${totalEarned.toFixed(2)}`}   color={theme.successText} bg={theme.successBg} border={theme.successBorder} />
        <SummaryCard label="Total Redeemed" value={`-${totalRedeemed.toFixed(2)}`} color={theme.redText}     bg={theme.errorBg}   border={theme.errorBorder}   />
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {filters.map(({ val, lbl }) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding:'6px 14px', borderRadius:8,
            background: filter===val ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))' : theme.bgAccent,
            border:`1px solid ${filter===val ? 'transparent' : theme.border}`,
            color: filter===val ? '#fff' : theme.textMuted,
            fontFamily:"'Space Mono',monospace", fontSize:12, letterSpacing:1, textTransform:'uppercase',
            cursor:'pointer', transition:'all 0.2s',
          }}>{lbl}</button>
        ))}
      </div>

      {/* List */}
      <div style={{ background:theme.bgCard, border:`1px solid ${theme.border}`, borderRadius:16, overflow:'hidden' }}>
        {loading && txs.length===0 ? (
          <div style={{ padding:40, textAlign:'center', color:theme.textFaint, fontFamily:"'Space Mono',monospace", fontSize:14 }}>Loading...</div>
        ) : txs.length===0 ? (
          <div style={{ padding:40, textAlign:'center', color:theme.textFaint, fontFamily:"'Space Mono',monospace", fontSize:14 }}>No transactions found</div>
        ) : txs.map((tx, i) => {
          const type = (tx.ID||'EN').trim().toLowerCase();
          const meta = TYPE_META[type] || { label:'TXN', icon:'◈' };
          const pts  = parseFloat(tx.RATE||0);
          const isEarn = type === 'en';
          return (
            <div key={tx.IDX||i} style={{ display:'flex', alignItems:'center', gap:12, padding: isMobile?'14px 16px':'16px 20px', borderBottom: i<txs.length-1?`1px solid ${theme.border}`:'none', transition:'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background=theme.bgSubtle}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <div style={{ width:40, height:40, borderRadius:10, flexShrink:0, background:txBg(type), border:`1px solid ${txBorder(type)}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
                {meta.icon}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <span style={{ color:theme.textSub, fontSize:15, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {tx.COMPANY_NAME || tx.INVOICENO || 'Transaction'}
                  </span>
                  <span style={{ background:txBg(type), border:`1px solid ${txBorder(type)}`, borderRadius:4, padding:'1px 6px', color:txColor(type), fontSize:10, fontFamily:"'Space Mono',monospace", letterSpacing:1, flexShrink:0 }}>
                    {meta.label}
                  </span>
                </div>
                <div style={{ color:theme.textFaint, fontSize:12, fontFamily:"'Space Mono',monospace" }}>
                  {(tx.INVOICE_DATE||'').slice(0,10)}
                  {tx.INVOICENO ? ` · ${tx.INVOICENO}` : ''}
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ color:txColor(type), fontFamily:"'Bebas Neue',sans-serif", fontSize:25, letterSpacing:1, lineHeight:1 }}>
                  {isEarn ? '+' : ''}{pts.toFixed(2)}
                </div>
                {/* <div style={{ color:theme.textFaint, fontSize:10, fontFamily:"'Space Mono',monospace" }}>PTS</div> */}
              </div>
            </div>
          );
        })}
        {hasMore && !loading && (
          <button onClick={() => setPage(p=>p+1)} style={{ width:'100%', padding:'14px', background:'transparent', border:'none', borderTop:`1px solid ${theme.border}`, color:'var(--primary)', fontFamily:"'Space Mono',monospace", fontSize:13, letterSpacing:1, cursor:'pointer' }}>
            LOAD MORE →
          </button>
        )}
        {loading && txs.length>0 && (
          <div style={{ padding:12, textAlign:'center', color:theme.textFaint, fontSize:14 }}>Loading...</div>
        )}
      </div>
    </div>
  );
}