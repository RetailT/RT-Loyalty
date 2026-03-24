import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';
import { getPromotions } from '../api';

/* ─── Single promotion card ─────────────────────────────────────────────── */
function PromotionCard({ promo, theme, mode }) {
  const isPD  = promo.type === 'PD';
  const isPDP = promo.type === 'PDP';

  const badge = isPD
    ? `Rs. ${promo.discountAmt.toFixed(2)} OFF`
    : isPDP
    ? `${promo.discountPrc}% OFF`
    : null;

  return (
    <div
      style={{
        background: theme.bgCard,
        border: `1px solid ${theme.border}`,
        borderRadius: 16,
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 8px 24px color-mix(in srgb, var(--primary) 14%, transparent)';
        e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--primary) 40%, transparent)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = theme.border;
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: 5, background: 'linear-gradient(90deg, var(--primary), var(--primary-dark))' }} />

      <div style={{ padding: 16 }}>

        {/* Badge */}
        {badge && (
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
            borderRadius: 20, padding: '3px 10px', marginBottom: 10,
          }}>
            <span style={{
              color: 'var(--primary)', fontSize: 12,
              fontFamily: "'Space Mono',monospace", fontWeight: 700, letterSpacing: 1,
            }}>{badge}</span>
          </div>
        )}

        {/* Product name */}
        <div style={{ color: theme.text, fontWeight: 700, fontSize: 15, marginBottom: 3, lineHeight: 1.4 }}>
          {promo.productName || promo.productCode}
        </div>
        <div style={{ color: theme.textFaint, fontSize: 12, fontFamily: "'Space Mono',monospace", marginBottom: 12 }}>
          {promo.productCode}
        </div>

        {/* Price block */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{
            color: 'var(--primary)', fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 26, letterSpacing: 1,
          }}>
            Rs. {promo.finalPrice.toFixed(2)}
          </div>
          {(promo.discountAmt > 0 || promo.discountPrc > 0) && (
            <div style={{ color: theme.textFaint, fontSize: 13, textDecoration: 'line-through' }}>
              Rs. {promo.unitPrice.toFixed(2)}
            </div>
          )}
        </div>

        {/* Savings line */}
        {isPD && promo.discountAmt > 0 && (
          <div style={{ color: 'var(--primary)', fontSize: 12, marginTop: 4, fontWeight: 600 }}>
            Save Rs. {promo.discountAmt.toFixed(2)}
          </div>
        )}
        {isPDP && promo.discountPrc > 0 && (
          <div style={{ color: 'var(--primary)', fontSize: 12, marginTop: 4, fontWeight: 600 }}>
            Save {promo.discountPrc}% &nbsp;·&nbsp; Rs. {(promo.unitPrice - promo.finalPrice).toFixed(2)} off
          </div>
        )}

        {/* Date range */}
        {(promo.dateFrom || promo.dateTo) && (
          <div style={{
            marginTop: 10, padding: '6px 10px',
            background: mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            borderRadius: 8,
          }}>
            <div style={{ color: theme.textFaint, fontSize: 11, fontFamily: "'Space Mono',monospace" }}>
              {promo.dateFrom && `From ${String(promo.dateFrom).slice(0, 10)}`}
              {promo.dateFrom && promo.dateTo && ' → '}
              {promo.dateTo && String(promo.dateTo).slice(0, 10)}
            </div>
          </div>
        )}

        {/* T&C */}
        <div style={{ color: theme.textFaint, fontSize: 10, marginTop: 8, fontStyle: 'italic' }}>
          * Terms &amp; conditions apply
        </div>
      </div>
    </div>
  );
}

/* ─── Tab button ─────────────────────────────────────────────────────────── */
function TabBtn({ label, count, active, onClick, theme }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '8px 18px',
        borderRadius: 10,
        flexShrink: 0,                   /* ← never shrink inside scroll row */
        border: active
          ? '1px solid color-mix(in srgb, var(--primary) 40%, transparent)'
          : `1px solid ${theme.border}`,
        background: active
          ? 'color-mix(in srgb, var(--primary) 10%, transparent)'
          : 'transparent',
        color: active ? 'var(--primary)' : theme.textFaint,
        fontFamily: "'Space Mono',monospace",
        fontSize: 13, fontWeight: active ? 700 : 400,
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
      <span style={{
        background: active ? 'var(--primary)' : theme.border,
        color: active ? '#fff' : theme.textFaint,
        borderRadius: 99, padding: '1px 7px', fontSize: 11,
        fontWeight: 700,
        transition: 'all 0.15s',
      }}>
        {count}
      </span>
    </button>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function PromotionsPage() {
  const { token }       = useAuth();
  const { theme, mode } = useTheme();
  const { isMobile }    = useResponsive();

  const [promos,  setPromos]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');
  const [tab, setTab]         = useState('all');

  useEffect(() => {
    if (!token) return;
    getPromotions(token)
      .then(r => setPromos(r.data || []))
      .catch(e => setError(e.message || 'Failed to load promotions'))
      .finally(() => setLoading(false));
  }, [token]);

  const searched = promos.filter(p => {
    const q = search.toLowerCase();
    return (
      (p.productName || '').toLowerCase().includes(q) ||
      (p.productCode || '').toLowerCase().includes(q)
    );
  });

  const filtered = tab === 'all'
    ? searched
    : tab === 'PDP'
    ? searched.filter(p => p.type === 'PDP' || p.type === 'DPSP1' || p.type === 'DPSP')
    : searched.filter(p => p.type === tab);

  const countAll = searched.length;
  const countPD  = searched.filter(p => p.type === 'PD').length;
  const countPDP = searched.filter(p => p.type === 'PDP' || p.type === 'DPSP1' || p.type === 'DPSP').length;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '24px 16px 100px' : '32px 32px 60px' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: theme.textMuted, fontSize: 14, fontFamily: "'Space Mono',monospace", marginBottom: 4 }}>
          Current Deals
        </div>
        <h1 style={{
          color: theme.text, fontFamily: "'Bebas Neue',sans-serif",
          fontSize: isMobile ? 37 : 46, letterSpacing: 2, lineHeight: 1, marginBottom: 16,
        }}>
          PROMOTIONS
        </h1>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
          style={{
            width: '100%', padding: '10px 14px', boxSizing: 'border-box',
            background: mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
            border: `1px solid ${theme.border}`, borderRadius: 10,
            color: theme.text, fontSize: 15, outline: 'none',
            fontFamily: 'inherit',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
          onBlur={e  => (e.target.style.borderColor = theme.border)}
        />
      </div>

      {/* Tabs — horizontally scrollable */}
      {!loading && !error && (
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
          overflowX: 'auto',           /* ← horizontal scroll */
          flexWrap: 'nowrap',          /* ← keep all tabs on one line */
          WebkitOverflowScrolling: 'touch',
          /* hide scrollbar visually but keep it functional */
          scrollbarWidth: 'none',      /* Firefox */
          msOverflowStyle: 'none',     /* IE/Edge */
          paddingBottom: 2,            /* prevent clipping of button shadows */
        }}>
          <TabBtn label="All"             count={countAll} active={tab === 'all'} onClick={() => setTab('all')} theme={theme} />
          <TabBtn label="Discount Amount" count={countPD}  active={tab === 'PD'}  onClick={() => setTab('PD')}  theme={theme} />
          <TabBtn label="% Discount"      count={countPDP} active={tab === 'PDP'} onClick={() => setTab('PDP')} theme={theme} />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: theme.textFaint, fontFamily: "'Space Mono',monospace", fontSize: 14 }}>
          Loading promotions...
        </div>
      ) : error ? (
        <div style={{ padding: 40, textAlign: 'center', color: theme.errorText, fontSize: 15 }}>⚠ {error}</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: theme.textFaint, fontFamily: "'Space Mono',monospace", fontSize: 14 }}>
          {search ? 'No promotions found.' : 'No active promotions at this time.'}
        </div>
      ) : (
        <>
          <div style={{ color: theme.textFaint, fontSize: 13, fontFamily: "'Space Mono',monospace", marginBottom: 16 }}>
            {filtered.length} promotion{filtered.length !== 1 ? 's' : ''} available
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 3}, 1fr)`, gap: 14 }}>
            {filtered.map((p, i) => (
              <PromotionCard key={p.idx || i} promo={p} theme={theme} mode={mode} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}