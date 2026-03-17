import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';
import { getPromotions } from '../api';

function PromotionCard({ promo, theme, mode }) {
  const hasDiscount = promo.discountPrc > 0 || promo.discountAmt > 0;
  const discountLabel = promo.discountPrc > 0
    ? `${promo.discountPrc}% OFF`
    : promo.discountAmt > 0
    ? `Rs. ${promo.discountAmt} OFF`
    : null;

  const originalPrice = parseFloat(promo.unitPrice || 0);
  const discountedPrice = promo.discountPrc > 0
    ? originalPrice - (originalPrice * promo.discountPrc / 100)
    : promo.discountAmt > 0
    ? originalPrice - promo.discountAmt
    : originalPrice;

  return (
    <div style={{
      background: theme.bgCard,
      border: `1px solid ${theme.border}`,
      borderRadius: 16,
      overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(255,107,0,0.12)'; e.currentTarget.style.borderColor='rgba(255,107,0,0.3)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.borderColor=theme.border; }}>

      {/* Color banner */}
      <div style={{ height:6, background:'linear-gradient(90deg,#FF6B00,#FF8C00)' }} />

      <div style={{ padding:16 }}>
        {/* Discount badge */}
        {discountLabel && (
          <div style={{ display:'inline-flex', alignItems:'center', background:'rgba(255,107,0,0.1)', border:'1px solid rgba(255,107,0,0.25)', borderRadius:20, padding:'3px 10px', marginBottom:10 }}>
            <span style={{ color:'#FF6B00', fontSize:10, fontFamily:"'Space Mono',monospace", fontWeight:700, letterSpacing:1 }}> {discountLabel}</span>
          </div>
        )}

        {/* Product name */}
        <div style={{ color:theme.text, fontWeight:700, fontSize:13, marginBottom:4, lineHeight:1.4 }}>
          {promo.productName || promo.productCode}
        </div>
        <div style={{ color:theme.textFaint, fontSize:10, fontFamily:"'Space Mono',monospace", marginBottom:12 }}>
          {promo.productCode}
        </div>

        {/* Price */}
        <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
          <div style={{ color:'#FF6B00', fontFamily:"'Bebas Neue',sans-serif", fontSize:24, letterSpacing:1 }}>
            Rs. {discountedPrice.toFixed(2)}
          </div>
          {hasDiscount && (
            <div style={{ color:theme.textFaint, fontSize:12, textDecoration:'line-through' }}>
              Rs. {originalPrice.toFixed(2)}
            </div>
          )}
        </div>

        {/* Date range */}
        {(promo.dateFrom || promo.dateTo) && (
          <div style={{ marginTop:10, padding:'6px 10px', background: mode==='dark'?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)', borderRadius:8 }}>
            <div style={{ color:theme.textFaint, fontSize:10, fontFamily:"'Space Mono',monospace" }}>
              {promo.dateFrom && `From ${promo.dateFrom.slice(0,10)}`}
              {promo.dateFrom && promo.dateTo && ' → '}
              {promo.dateTo && promo.dateTo.slice(0,10)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PromotionsPage() {
  const { token }        = useAuth();
  const { theme, mode }  = useTheme();
  const { isMobile }     = useResponsive();
  const [promos, setPromos]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');

  useEffect(() => {
    if (!token) return;
    getPromotions(token)
      .then(r => setPromos(r.data || []))
      .catch(e => setError(e.message || 'Failed to load promotions'))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = promos.filter(p =>
    (p.productName || p.productCode || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.productCode || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding: isMobile?'24px 16px 100px':'32px 32px 60px' }}>

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ color:theme.textMuted, fontSize:12, fontFamily:"'Space Mono',monospace", marginBottom:4 }}>Current Deals</div>
        <h1 style={{ color:theme.text, fontFamily:"'Bebas Neue',sans-serif", fontSize: isMobile?32:40, letterSpacing:2, lineHeight:1, marginBottom:16 }}>
          PROMOTIONS
        </h1>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
          style={{
            width:'100%', padding:'10px 14px', boxSizing:'border-box',
            background: mode==='dark'?'#1a1a1a':'#f5f5f5',
            border:`1px solid ${theme.border}`, borderRadius:10,
            color:theme.text, fontSize:13, outline:'none',
            fontFamily:'inherit',
          }}
          onFocus={e => e.target.style.borderColor='#FF6B00'}
          onBlur={e  => e.target.style.borderColor=theme.border}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding:60, textAlign:'center', color:theme.textFaint, fontFamily:"'Space Mono',monospace", fontSize:12 }}>
          Loading promotions...
        </div>
      ) : error ? (
        <div style={{ padding:40, textAlign:'center', color:theme.errorText, fontSize:13 }}>⚠ {error}</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding:60, textAlign:'center', color:theme.textFaint, fontFamily:"'Space Mono',monospace", fontSize:12 }}>
          {search ? 'No promotions found.' : 'No active promotions at this time.'}
        </div>
      ) : (
        <>
          <div style={{ color:theme.textFaint, fontSize:11, fontFamily:"'Space Mono',monospace", marginBottom:16 }}>
            {filtered.length} promotion{filtered.length !== 1 ? 's' : ''} available
          </div>
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${isMobile?2:3},1fr)`, gap:14 }}>
            {filtered.map((p, i) => (
              <PromotionCard key={p.idx || i} promo={p} theme={theme} mode={mode} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}