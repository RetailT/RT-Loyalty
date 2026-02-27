import React from 'react';
import StatsCard from '../components/StatsCard';
import { useTheme } from '../context/ThemeContext';
import { mockCustomers } from '../utils/mockData';

export default function DashboardPage({ onNavigate }) {
  const { theme } = useTheme();
  const totalPoints = mockCustomers.reduce((s, c) => s + c.totalPoints, 0);
  const tierCounts  = mockCustomers.reduce((acc, c) => { acc[c.membershipTier] = (acc[c.membershipTier] || 0) + 1; return acc; }, {});

  const recent = mockCustomers
    .flatMap(c => c.transactions.map(t => ({ ...t, customerName: c.name })))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  const txColor = (type) => {
    if (type === 'earned')   return theme.successText;
    if (type === 'redeemed') return theme.redText;
    if (type === 'bonus')    return '#FF6B00';
    return theme.textMuted;
  };

  return (
    <div style={{ padding: 32, maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ color: '#FF6B00', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", marginBottom: 8 }}>◈ Overview</div>
        <h1 style={{ color: theme.text, fontSize: 36, fontWeight: 900, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2, margin: '0 0 4px 0' }}>LOYALTY DASHBOARD</h1>
        <p style={{ color: theme.textMuted, margin: 0, fontSize: 13 }}>Monitor customer loyalty activity and points across all branches</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
        <StatsCard title="Total Members"   value={mockCustomers.length}         subtitle="Registered customers"      icon="◈"  color="#FF6B00" trend={{ value: 12, label: 'this month' }} />
        <StatsCard title="Total Points"    value={totalPoints.toLocaleString()} subtitle="Across all members"        icon="⬡"  color="#f59e0b" trend={{ value: 8,  label: 'vs last month' }} />
        <StatsCard title="Active Today"    value={3}                            subtitle="Members with transactions" icon="◫"  color="#10b981" trend={{ value: 5,  label: 'vs yesterday' }} />
        <StatsCard title="Redemptions"     value={14}                           subtitle="This week"                 icon="⊞"  color="#8b5cf6" trend={{ value: -3, label: 'vs last week' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent transactions */}
        <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: theme.shadow, transition: 'background 0.3s' }}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: '#FF6B00', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", marginBottom: 4 }}>◈ Live Feed</div>
              <div style={{ color: theme.text, fontWeight: 700, fontSize: 16 }}>Recent Transactions</div>
            </div>
            <div style={{ background: theme.successBg, border: `1px solid ${theme.successBorder}`, borderRadius: 6, padding: '4px 10px', color: theme.liveDot, fontSize: 10, fontFamily: "'Space Mono', monospace", display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, background: theme.liveDot, borderRadius: '50%' }} />LIVE
            </div>
          </div>
          <div>
            {recent.map((tx, i) => (
              <div key={tx.id}
                style={{ padding: '12px 24px', borderBottom: i < recent.length - 1 ? `1px solid ${theme.divider}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = theme.rowHover)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #FF6B00, #FF8C00)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                    {tx.customerName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ color: theme.text, fontSize: 13, fontWeight: 600 }}>{tx.customerName}</div>
                    <div style={{ color: theme.textMuted, fontSize: 11 }}>{tx.description} · {tx.store}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: txColor(tx.type), fontSize: 14, fontWeight: 800, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1 }}>
                    {tx.points > 0 ? '+' : ''}{tx.points.toLocaleString()}
                  </div>
                  <div style={{ color: theme.textFaint, fontSize: 10 }}>{new Date(tx.date).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Tier distribution */}
          <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 24, boxShadow: theme.shadow, transition: 'background 0.3s' }}>
            <div style={{ color: '#FF6B00', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", marginBottom: 4 }}>◈ Breakdown</div>
            <div style={{ color: theme.text, fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Membership Tiers</div>
            {[
              { tier: 'Platinum', color: '#8b5cf6' },
              { tier: 'Gold',     color: '#f59e0b' },
              { tier: 'Silver',   color: '#64748b' },
              { tier: 'Bronze',   color: '#d97706' },
            ].map(({ tier, color }) => {
              const count = tierCounts[tier] || 0;
              const pct   = Math.round((count / mockCustomers.length) * 100);
              return (
                <div key={tier} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ color, fontSize: 12, fontFamily: "'Space Mono', monospace" }}>★ {tier}</span>
                    <span style={{ color: theme.textMuted, fontSize: 12 }}>{count} members · {pct}%</span>
                  </div>
                  <div style={{ background: theme.bgAccent, borderRadius: 3, height: 5, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${color}, ${color}bb)`, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick actions */}
          <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 24, boxShadow: theme.shadow, transition: 'background 0.3s' }}>
            <div style={{ color: '#FF6B00', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", marginBottom: 4 }}>⊞ Actions</div>
            <div style={{ color: theme.text, fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Quick Access</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: '⊞', label: 'Scan Customer QR Code', page: 'scan',      color: '#FF6B00' },
                { icon: '◈', label: 'Browse All Customers',  page: 'customers', color: '#10b981' },
                { icon: '◫', label: 'View Reports',          page: 'reports',   color: '#8b5cf6' },
              ].map(({ icon, label, page, color }) => (
                <button key={page} onClick={() => onNavigate(page)} style={{
                  background: theme.bgSubtle, border: `1px solid ${theme.border}`,
                  borderRadius: 10, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', width: '100%',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color + '55'; e.currentTarget.style.background = color + '0c'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.background = theme.bgSubtle; }}
                >
                  <span style={{ color, fontSize: 16 }}>{icon}</span>
                  <span style={{ color: theme.textSub, fontSize: 13 }}>{label}</span>
                  <span style={{ color: theme.textFaint, marginLeft: 'auto' }}>→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}