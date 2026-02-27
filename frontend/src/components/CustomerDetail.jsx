import React from 'react';
import { useTheme } from '../context/ThemeContext';

const tierStyle = {
  Bronze:   { color: '#92400e', bg: '#fef3c7', border: '#fde68a' },
  Silver:   { color: '#475569', bg: '#f1f5f9', border: '#cbd5e1' },
  Gold:     { color: '#b45309', bg: '#fef9c3', border: '#fde047' },
  Platinum: { color: '#4338ca', bg: '#ede9fe', border: '#c4b5fd' },
};

const txMeta = {
  earned:   { label: 'EARNED'   },
  redeemed: { label: 'REDEEMED' },
  expired:  { label: 'EXPIRED'  },
  bonus:    { label: 'BONUS'    },
};

export default function CustomerDetail({ customer, onClose }) {
  const { theme } = useTheme();
  const ts  = tierStyle[customer.membershipTier];
  const pct = Math.min((customer.availablePoints / customer.totalPoints) * 100, 100);

  const txColor = (type) => {
    if (type === 'earned')   return theme.successText;
    if (type === 'redeemed') return theme.redText;
    if (type === 'bonus')    return '#FF6B00';
    return theme.textMuted;
  };
  const txBg = (type) => {
    if (type === 'earned')   return theme.successBg;
    if (type === 'redeemed') return theme.errorBg;
    if (type === 'bonus')    return 'rgba(255,107,0,0.08)';
    return theme.bgAccent;
  };
  const txBorder = (type) => {
    if (type === 'earned')   return theme.successBorder;
    if (type === 'redeemed') return theme.errorBorder;
    if (type === 'bonus')    return 'rgba(255,107,0,0.3)';
    return theme.border;
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: theme.modalBg,
        backdropFilter: 'blur(6px)',
        zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{
        background: theme.bgCard,
        border: `1px solid ${theme.border}`,
        borderRadius: 20,
        width: '100%', maxWidth: 720, maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
        transition: 'background 0.3s',
      }}>
        {/* Header */}
        <div style={{
          background: theme.bgSubtle,
          padding: 28, borderBottom: `1px solid ${theme.border}`,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{
              width: 60, height: 60,
              background: 'linear-gradient(135deg, #FF6B00, #FF8C00)',
              borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 900, color: '#fff',
              boxShadow: '0 6px 20px rgba(255,107,0,0.4)',
            }}>
              {customer.name.charAt(0)}
            </div>
            <div>
              <div style={{ color: theme.text, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{customer.name}</div>
              <div style={{ color: theme.textMuted, fontSize: 12, fontFamily: "'Space Mono', monospace", marginBottom: 8 }}>
                {customer.membershipId} · {customer.email}
              </div>
              <div style={{
                display: 'inline-flex',
                background: ts.bg, border: `1px solid ${ts.border}`,
                borderRadius: 6, padding: '3px 12px',
                fontSize: 10, fontFamily: "'Space Mono', monospace",
                letterSpacing: 2, color: ts.color, textTransform: 'uppercase',
              }}>
                ★ {customer.membershipTier} Member
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: theme.bgAccent, border: `1px solid ${theme.border}`,
            color: theme.textMuted, width: 36, height: 36,
            borderRadius: 8, cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        <div style={{ padding: 28 }}>
          {/* Points row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Available Points', value: customer.availablePoints.toLocaleString(), color: '#FF6B00' },
              { label: 'Total Earned',     value: customer.totalPoints.toLocaleString(),     color: theme.successText },
              { label: 'Total Redeemed',   value: customer.redeemedPoints.toLocaleString(),  color: theme.redText },
            ].map(item => (
              <div key={item.label} style={{ background: theme.bgSubtle, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <div style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, fontFamily: "'Space Mono', monospace" }}>{item.label}</div>
                <div style={{ color: item.color, fontSize: 26, fontWeight: 900, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1 }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Points bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: theme.textMuted, fontSize: 11, fontFamily: "'Space Mono', monospace" }}>Points Balance</span>
              <span style={{ color: '#FF6B00', fontSize: 11, fontFamily: "'Space Mono', monospace" }}>{Math.round(pct)}%</span>
            </div>
            <div style={{ background: theme.bgAccent, borderRadius: 4, height: 7, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: 'linear-gradient(90deg, #FF6B00, #FF8C00)',
                borderRadius: 4, boxShadow: '0 0 8px rgba(255,107,0,0.4)',
                transition: 'width 1s ease',
              }} />
            </div>
          </div>

          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Phone',         value: customer.phone },
              { label: 'Email',         value: customer.email },
              { label: 'Member Since',  value: new Date(customer.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
              { label: 'Last Activity', value: new Date(customer.lastActivity).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
            ].map(item => (
              <div key={item.label} style={{ background: theme.bgSubtle, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14 }}>
                <div style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4, fontFamily: "'Space Mono', monospace" }}>{item.label}</div>
                <div style={{ color: theme.textSub, fontSize: 13 }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Transactions */}
          <div>
            <div style={{ color: theme.text, fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#FF6B00' }}>◈</span> Transaction History
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {customer.transactions.map(tx => (
                <div key={tx.id} style={{
                  background: theme.bgSubtle, border: `1px solid ${theme.border}`,
                  borderRadius: 10, padding: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{
                      background: txBg(tx.type), border: `1px solid ${txBorder(tx.type)}`,
                      borderRadius: 6, padding: '3px 8px', fontSize: 9,
                      fontFamily: "'Space Mono', monospace", letterSpacing: 1,
                      color: txColor(tx.type), minWidth: 72, textAlign: 'center',
                    }}>
                      {txMeta[tx.type].label}
                    </div>
                    <div>
                      <div style={{ color: theme.textSub, fontSize: 13, marginBottom: 2 }}>{tx.description}</div>
                      <div style={{ color: theme.textMuted, fontSize: 11 }}>
                        {tx.store} · {new Date(tx.date).toLocaleDateString()}
                        {tx.amount ? ` · LKR ${tx.amount.toLocaleString()}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ color: tx.points > 0 ? theme.successText : theme.redText, fontSize: 16, fontWeight: 800, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1 }}>
                    {tx.points > 0 ? '+' : ''}{tx.points.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}