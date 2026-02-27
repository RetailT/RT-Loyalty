import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { mockCustomers } from '../utils/mockData';

export default function ReportsPage() {
  const { theme } = useTheme();
  const [period, setPeriod] = useState('30d');

  const totalPoints   = mockCustomers.reduce((s, c) => s + c.totalPoints,   0);
  const totalRedeemed = mockCustomers.reduce((s, c) => s + c.redeemedPoints, 0);
  const totalAvail    = mockCustomers.reduce((s, c) => s + c.availablePoints,0);
  const redemptionRate = Math.round((totalRedeemed / totalPoints) * 100);

  const tierData = [
    { name: 'Platinum', color: '#8b5cf6' },
    { name: 'Gold',     color: '#f59e0b' },
    { name: 'Silver',   color: '#64748b' },
    { name: 'Bronze',   color: '#d97706' },
  ].map(t => ({
    ...t,
    count:  mockCustomers.filter(c => c.membershipTier === t.name).length,
    points: mockCustomers.filter(c => c.membershipTier === t.name).reduce((s, c) => s + c.availablePoints, 0),
  }));

  const topCustomers = [...mockCustomers].sort((a, b) => b.totalPoints - a.totalPoints);
  const barMax       = Math.max(...topCustomers.map(c => c.totalPoints));

  const allTx = mockCustomers
    .flatMap(c => c.transactions.map(t => ({ ...t, customerName: c.name })))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const txColor  = (type) => type === 'earned' ? theme.successText : type === 'redeemed' ? theme.redText : type === 'bonus' ? '#FF6B00' : theme.textMuted;
  const txBg     = (type) => type === 'earned' ? theme.successBg : type === 'redeemed' ? theme.errorBg : type === 'bonus' ? 'rgba(255,107,0,0.08)' : theme.bgAccent;
  const txBorder = (type) => type === 'earned' ? theme.successBorder : type === 'redeemed' ? theme.errorBorder : type === 'bonus' ? 'rgba(255,107,0,0.3)' : theme.border;

  return (
    <div style={{ padding: 32, maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ color: '#FF6B00', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", marginBottom: 8 }}>◫ Analytics</div>
          <h1 style={{ color: theme.text, fontSize: 36, fontWeight: 900, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2, margin: '0 0 4px 0' }}>LOYALTY REPORTS</h1>
          <p style={{ color: theme.textMuted, margin: 0, fontSize: 13 }}>Track points activity, redemptions, and member growth</p>
        </div>
        <div style={{ display: 'flex', gap: 4, background: theme.bgSubtle, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 4 }}>
          {['7d','30d','90d'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '8px 16px', borderRadius: 7,
              background: period === p ? 'linear-gradient(135deg, #FF6B00, #FF8C00)' : 'transparent',
              border: 'none', color: period === p ? '#fff' : theme.textMuted,
              fontSize: 12, fontWeight: period === p ? 800 : 400,
              cursor: 'pointer', fontFamily: "'Space Mono', monospace", transition: 'all 0.2s',
            }}>
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Points Issued', value: totalPoints.toLocaleString(),   color: '#FF6B00', icon: '⬡' },
          { label: 'Available Balance',   value: totalAvail.toLocaleString(),    color: '#f59e0b', icon: '◈' },
          { label: 'Total Redeemed',      value: totalRedeemed.toLocaleString(), color: theme.redText, icon: '◫' },
          { label: 'Redemption Rate',     value: `${redemptionRate}%`,           color: theme.successText, icon: '⊞' },
        ].map(stat => (
          <div key={stat.label} style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 20, position: 'relative', overflow: 'hidden', boxShadow: theme.shadow }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: `radial-gradient(circle, ${stat.color}14, transparent)`, borderRadius: '50%' }} />
            <div style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", marginBottom: 6 }}>{stat.icon} {stat.label}</div>
            <div style={{ color: stat.color, fontSize: 28, fontWeight: 900, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Tier distribution */}
        <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 24, boxShadow: theme.shadow }}>
          <div style={{ color: '#FF6B00', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", marginBottom: 4 }}>◈ Breakdown</div>
          <div style={{ color: theme.text, fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Points by Tier</div>
          {tierData.map(tier => (
            <div key={tier.name} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: tier.color, fontSize: 12, fontFamily: "'Space Mono', monospace" }}>★ {tier.name}</span>
                <div>
                  <span style={{ color: theme.textSub, fontSize: 12 }}>{tier.points.toLocaleString()} pts</span>
                  <span style={{ color: theme.textMuted, fontSize: 11, marginLeft: 8 }}>{tier.count} members</span>
                </div>
              </div>
              <div style={{ background: theme.bgAccent, borderRadius: 4, height: 8, overflow: 'hidden' }}>
                <div style={{ width: totalAvail ? `${(tier.points / totalAvail) * 100}%` : '0%', height: '100%', background: `linear-gradient(90deg, ${tier.color}, ${tier.color}bb)`, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Leaderboard */}
        <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 24, boxShadow: theme.shadow }}>
          <div style={{ color: '#FF6B00', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", marginBottom: 4 }}>⬡ Leaderboard</div>
          <div style={{ color: theme.text, fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Top Members by Points</div>
          {topCustomers.map((c, i) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 26, height: 26, flexShrink: 0,
                background: i === 0 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : i === 1 ? 'linear-gradient(135deg, #9ca3af, #6b7280)' : i === 2 ? 'linear-gradient(135deg, #d97706, #b45309)' : theme.bgAccent,
                borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: i < 3 ? '#fff' : theme.textMuted, fontSize: 11, fontWeight: 900,
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: theme.text, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  <span style={{ color: '#FF6B00', fontSize: 13, fontWeight: 800, fontFamily: "'Bebas Neue', sans-serif", flexShrink: 0, marginLeft: 8 }}>{c.totalPoints.toLocaleString()}</span>
                </div>
                <div style={{ background: theme.bgAccent, borderRadius: 3, height: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${(c.totalPoints / barMax) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #FF6B00, #FF8C00)', borderRadius: 3 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions table */}
      <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: theme.shadow }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.border}`, background: theme.bgSubtle }}>
          <div style={{ color: '#FF6B00', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", marginBottom: 4 }}>◫ Log</div>
          <div style={{ color: theme.text, fontWeight: 700, fontSize: 16 }}>All Transactions</div>
        </div>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 1fr 80px', padding: '10px 24px', borderBottom: `1px solid ${theme.divider}` }}>
            {['Customer','Date','Description','Store','Points'].map(h => (
              <div key={h} style={{ color: theme.textFaint, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'Space Mono', monospace" }}>{h}</div>
            ))}
          </div>
          {allTx.map((tx, i) => (
            <div key={tx.id}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 1fr 80px', padding: '12px 24px', borderBottom: i < allTx.length - 1 ? `1px solid ${theme.divider}` : 'none', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = theme.rowHover)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 24, height: 24, flexShrink: 0, background: 'linear-gradient(135deg, #FF6B00, #FF8C00)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#fff' }}>
                  {tx.customerName.charAt(0)}
                </div>
                <span style={{ color: theme.text, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.customerName}</span>
              </div>
              <div style={{ color: theme.textMuted, fontSize: 12, display: 'flex', alignItems: 'center' }}>{new Date(tx.date).toLocaleDateString()}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ background: txBg(tx.type), border: `1px solid ${txBorder(tx.type)}`, borderRadius: 4, padding: '2px 6px', fontSize: 9, fontFamily: "'Space Mono', monospace", color: txColor(tx.type), letterSpacing: 1, textTransform: 'uppercase', flexShrink: 0 }}>
                  {tx.type}
                </div>
                <span style={{ color: theme.textSub, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</span>
              </div>
              <div style={{ color: theme.textMuted, fontSize: 12, display: 'flex', alignItems: 'center' }}>{tx.store}</div>
              <div style={{ color: tx.points > 0 ? theme.successText : theme.redText, fontSize: 14, fontWeight: 800, fontFamily: "'Bebas Neue', sans-serif", display: 'flex', alignItems: 'center' }}>
                {tx.points > 0 ? '+' : ''}{tx.points}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}