import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme, useCardHover } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';
import { getMyTransactions } from '../api';

const TYPE_META = {
  en: { label:'EARNED',   icon:'🛒', type:'earn'   },
  rd: { label:'REDEEMED', icon:'🎁', type:'redeem' },
};

function SummaryCard({ label, value, color, bg, border }) {
  const { cardProps } = useCardHover({ borderRadius:14 });
  return (
    <div {...cardProps} style={{ ...cardProps.style, cursor:'default', background: bg, border:`1px solid ${border}`, padding:'14px 16px' }}>
      <div style={{ color:'#888', fontSize:10, fontFamily:"'Space Mono',monospace", letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>{label}</div>
      <div style={{ color, fontFamily:"'Bebas Neue',sans-serif", fontSize:28, letterSpacing:2, lineHeight:1 }}>{value} <span style={{ fontSize:14 }}>PTS</span></div>
    </div>
  );
}

export default function TransactionsPage() {
  const { token }           = useAuth();
  const { theme }           = useTheme();
  const { isMobile }        = useResponsive();
  const [txs, setTxs]       = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => { setTxs([]); setPage(1); setHasMore(true); }, [filter]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const params = { page, limit:20, ...(filter!=='all'?{ type:filter }:{}) };
    getMyTransactions(token, params)
      .then(r => {
        const data = r.data || [];
        setTxs(prev => page===1 ? data : [...prev,...data]);
        setHasMore(data.length===20);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, filter, page]);

  const txColor  = t => t==='en'?theme.successText:t==='rd'?theme.redText:'#FF6B00';
  const txBg     = t => t==='en'?theme.successBg:t==='rd'?theme.errorBg:'rgba(255,107,0,0.08)';
  const txBorder = t => t==='en'?theme.successBorder:t==='rd'?theme.errorBorder:'rgba(255,107,0,0.25)';

  const totalEarned   = txs.filter(t=>(t.ID||'').toLowerCase()==='en').reduce((s,t)=>s+parseFloat(t.RATE||0),0);
  const totalRedeemed = txs.filter(t=>(t.ID||'').toLowerCase()==='rd').reduce((s,t)=>s+parseFloat(t.RATE||0),0);

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding: isMobile?'24px 16px 100px':'32px 32px 60px' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ color:'#FF6B00', fontSize:10, fontFamily:"'Space Mono',monospace", letterSpacing:3, textTransform:'uppercase', marginBottom:4 }}>◈ Points Activity</div>
        <h1 style={{ color:theme.text, fontFamily:"'Bebas Neue',sans-serif", fontSize: isMobile?32:40, letterSpacing:2 }}>TRANSACTION HISTORY</h1>
      </div>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
        <SummaryCard label="Total Earned"   value={`+${totalEarned.toFixed(2)}`}   color={theme.successText} bg={theme.successBg} border={theme.successBorder} />
        <SummaryCard label="Total Redeemed" value={`-${totalRedeemed.toFixed(2)}`} color={theme.redText}     bg={theme.errorBg}   border={theme.errorBorder}   />
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {[['all','All'],['earn','Earned'],['redeem','Redeemed']].map(([val,lbl]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding:'6px 14px', borderRadius:8,
            background: filter===val?'linear-gradient(135deg,#FF6B00,#FF8C00)':theme.bgAccent,
            border:`1px solid ${filter===val?'transparent':theme.border}`,
            color: filter===val?'#fff':theme.textMuted,
            fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:1, textTransform:'uppercase',
            cursor:'pointer', transition:'all 0.2s',
          }}>{lbl}</button>
        ))}
      </div>

      {/* List */}
      <div style={{ background:theme.bgCard, border:`1px solid ${theme.border}`, borderRadius:16, overflow:'hidden' }}>
        {loading && txs.length===0 ? (
          <div style={{ padding:40, textAlign:'center', color:theme.textFaint, fontFamily:"'Space Mono',monospace", fontSize:12 }}>Loading...</div>
        ) : txs.length===0 ? (
          <div style={{ padding:40, textAlign:'center', color:theme.textFaint, fontFamily:"'Space Mono',monospace", fontSize:12 }}>No transactions found</div>
        ) : txs.map((tx, i) => {
          const type = (tx.ID||'EN').toLowerCase();
          const meta = TYPE_META[type] || { label:'TXN', icon:'◈' };
          const pts  = parseFloat(tx.RATE||0);
          return (
            <div key={tx.IDX||i} style={{ display:'flex', alignItems:'center', gap:12, padding: isMobile?'14px 16px':'16px 20px', borderBottom: i<txs.length-1?`1px solid ${theme.border}`:'none', transition:'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background=theme.bgSubtle}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <div style={{ width:40, height:40, borderRadius:10, flexShrink:0, background:txBg(type), border:`1px solid ${txBorder(type)}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
                {meta.icon}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <span style={{ color:theme.textSub, fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {tx.COMPANY_NAME || tx.INVOICENO || 'Transaction'}
                  </span>
                  <span style={{ background:txBg(type), border:`1px solid ${txBorder(type)}`, borderRadius:4, padding:'1px 6px', color:txColor(type), fontSize:9, fontFamily:"'Space Mono',monospace", letterSpacing:1, flexShrink:0 }}>
                    {meta.label}
                  </span>
                </div>
                <div style={{ color:theme.textFaint, fontSize:10, fontFamily:"'Space Mono',monospace" }}>
                  {(tx.INVOICE_DATE||'').slice(0,10)}
                  {tx.INVOICENO ? ` · ${tx.INVOICENO}` : ''}
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ color:txColor(type), fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:1, lineHeight:1 }}>
                  {type==='en'?'+':'-'}{pts.toFixed(2)}
                </div>
                <div style={{ color:theme.textFaint, fontSize:9, fontFamily:"'Space Mono',monospace" }}>PTS</div>
              </div>
            </div>
          );
        })}
        {hasMore && !loading && (
          <button onClick={() => setPage(p=>p+1)} style={{ width:'100%', padding:'14px', background:'transparent', border:'none', borderTop:`1px solid ${theme.border}`, color:'#FF6B00', fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:1, cursor:'pointer' }}>
            LOAD MORE →
          </button>
        )}
        {loading && txs.length>0 && (
          <div style={{ padding:12, textAlign:'center', color:theme.textFaint, fontSize:12 }}>Loading...</div>
        )}
      </div>
    </div>
  );
}