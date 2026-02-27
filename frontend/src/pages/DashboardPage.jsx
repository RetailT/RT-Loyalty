import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';
import StatsCard from '../components/StatsCard';
import { MOCK_USER, MOCK_TRANSACTIONS, TIER_CONFIG } from '../utils/mockData';

const txColor = (type, theme) =>
  type === 'earn' ? theme.successText : type === 'redeem' ? theme.redText : '#FF6B00';

const txBg = (type, theme) =>
  type === 'earn' ? theme.successBg : type === 'redeem' ? theme.errorBg : 'rgba(255,107,0,0.08)';

export default function DashboardPage({ onNavigate }) {
  const { theme, mode } = useTheme();
  const { isMobile }    = useResponsive();

  const tier    = MOCK_USER.tier_level;
  const tierCfg = TIER_CONFIG[tier];
  const pct     = tierCfg.nextPoints
    ? Math.min(100, (MOCK_USER.lifetime_points / tierCfg.nextPoints) * 100)
    : 100;
  const toNext = tierCfg.nextPoints
    ? (tierCfg.nextPoints - MOCK_USER.lifetime_points).toLocaleString()
    : null;

  const thisMonthPts = MOCK_TRANSACTIONS
    .filter(t => t.date.startsWith('2024-12') && t.points > 0)
    .reduce((s, t) => s + t.points, 0);

  const quickLinks = [
    { label: 'Transaction History', sub: 'All point activities',   icon: '◈', page: 'transactions' },
    { label: 'Rewards Catalog',     sub: 'Browse & redeem',        icon: '⊞', page: 'rewards'      },
    { label: 'Tiers & Benefits',    sub: 'View your perks',        icon: '◫', page: 'tiers'        },
    { label: 'My Profile',          sub: 'Edit your details',      icon: '◉', page: 'profile'      },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '24px 16px 100px' : '32px 32px 60px' }}>

      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: theme.textMuted, fontSize: 12, fontFamily: "'Space Mono',monospace", marginBottom: 4 }}>
          Good day,
        </div>
        <h1 style={{ color: theme.text, fontFamily: "'Bebas Neue',sans-serif", fontSize: isMobile ? 32 : 40, letterSpacing: 2, lineHeight: 1 }}>
          {MOCK_USER.name} 👋
        </h1>
      </div>

      {/* ── Main Points Card ── */}
      <div style={{
        background: tierCfg.gradient,
        borderRadius: 20, padding: isMobile ? 20 : 28,
        marginBottom: 20, position: 'relative', overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, background: 'rgba(0,0,0,0.1)', borderRadius: '50%' }} />

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', fontFamily: "'Space Mono',monospace", marginBottom: 6 }}>
              Current Points
            </div>
            <div style={{ color: '#fff', fontFamily: "'Bebas Neue',sans-serif", fontSize: isMobile ? 56 : 72, letterSpacing: 2, lineHeight: 0.9 }}>
              {MOCK_USER.current_points.toLocaleString()}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 6 }}>
              {MOCK_USER.lifetime_points.toLocaleString()} lifetime points
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
              padding: '6px 14px', borderRadius: 40,
              color: '#fff', fontSize: 11, fontFamily: "'Space Mono',monospace",
              letterSpacing: 1, textTransform: 'uppercase',
            }}>
              {tierCfg.icon} {tier}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 6, fontFamily: "'Space Mono',monospace" }}>
              Member since {MOCK_USER.join_date}
            </div>
          </div>
        </div>

        {/* Progress */}
        {tierCfg.next && (
          <div style={{ position: 'relative', marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontFamily: "'Space Mono',monospace" }}>{tier}</span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontFamily: "'Space Mono',monospace" }}>
                {toNext} pts to {tierCfg.next}
              </span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: '#fff', borderRadius: 4, transition: 'width 1s ease' }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 3},1fr)`, gap: 12, marginBottom: 20 }}>
        <StatsCard title="This Month"    value={`+${thisMonthPts}`} subtitle="points earned"               icon="📈" />
        <StatsCard title="Total Visits"  value={MOCK_TRANSACTIONS.filter(t=>t.type==='earn').length}        icon="🧾" subtitle="transactions" />
        <StatsCard title="Tier Expiry"   value="DEC 2025"           subtitle="renews annually"              icon="📅" />
      </div>

      {/* ── Quick Links ── */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4},1fr)`, gap: 12, marginBottom: 24 }}>
        {quickLinks.map(q => (
          <button key={q.page} onClick={() => onNavigate(q.page)} style={{
            background: theme.bgCard, border: `1px solid ${theme.border}`,
            borderRadius: 14, padding: '16px 14px',
            cursor: 'pointer', textAlign: 'left',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,107,0,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.transform = 'translateY(0)'; }}>
            <div style={{ fontSize: 20, color: '#FF6B00', marginBottom: 8 }}>{q.icon}</div>
            <div style={{ color: theme.text, fontWeight: 700, fontSize: 12, marginBottom: 2 }}>{q.label}</div>
            <div style={{ color: theme.textFaint, fontSize: 10, fontFamily: "'Space Mono',monospace" }}>{q.sub}</div>
          </button>
        ))}
      </div>

      {/* ── Recent Transactions ── */}
      <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#FF6B00' }}>◈</span>
            <span style={{ color: theme.text, fontWeight: 700, fontSize: 13 }}>Recent Activity</span>
          </div>
          <button onClick={() => onNavigate('transactions')} style={{
            background: 'none', border: 'none', color: '#FF6B00',
            fontSize: 11, cursor: 'pointer', fontFamily: "'Space Mono',monospace",
            letterSpacing: 1,
          }}>
            SEE ALL →
          </button>
        </div>

        {MOCK_TRANSACTIONS.slice(0, 5).map(tx => (
          <div key={tx.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 20px', borderBottom: `1px solid ${theme.border}`,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: txBg(tx.type, theme),
              border: `1px solid ${tx.type === 'earn' ? theme.successBorder : tx.type === 'redeem' ? theme.errorBorder : 'rgba(255,107,0,0.25)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>
              {tx.type === 'earn' ? '🛒' : tx.type === 'redeem' ? '🎁' : '⭐'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: theme.textSub, fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.shop}</div>
              <div style={{ color: theme.textFaint, fontSize: 10, fontFamily: "'Space Mono',monospace", marginTop: 2 }}>{tx.date}</div>
            </div>
            <div style={{ color: txColor(tx.type, theme), fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, fontWeight: 900, flexShrink: 0 }}>
              {tx.points > 0 ? '+' : ''}{tx.points}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
