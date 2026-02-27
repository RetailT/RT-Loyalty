import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const tierStyle = {
  Bronze:   { color: '#92400e', bg: '#fef3c7', border: '#fde68a' },
  Silver:   { color: '#475569', bg: '#f1f5f9', border: '#cbd5e1' },
  Gold:     { color: '#b45309', bg: '#fef9c3', border: '#fde047' },
  Platinum: { color: '#4338ca', bg: '#ede9fe', border: '#c4b5fd' },
};

export default function CustomerCard({ customer, onClick }) {
  const { theme } = useTheme();
  const [hovered, setHovered] = useState(false);
  const ts = tierStyle[customer.membershipTier];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: theme.bgCard,
        border: `1px solid ${hovered ? '#FFD4A8' : theme.border}`,
        borderRadius: 16, padding: 20, cursor: 'pointer',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? theme.shadowHover : theme.shadow,
        transition: 'all 0.3s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44,
            background: 'linear-gradient(135deg, #FF6B00, #FF8C00)',
            borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 900, color: '#fff',
            boxShadow: '0 4px 12px rgba(255,107,0,0.3)',
          }}>
            {customer.name.charAt(0)}
          </div>
          <div>
            <div style={{ color: theme.text, fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{customer.name}</div>
            <div style={{ color: theme.textMuted, fontSize: 11, fontFamily: "'Space Mono', monospace" }}>{customer.membershipId}</div>
          </div>
        </div>
        <div style={{
          background: ts.bg, border: `1px solid ${ts.border}`,
          borderRadius: 6, padding: '3px 10px',
          fontSize: 10, fontFamily: "'Space Mono', monospace",
          letterSpacing: 1, color: ts.color, textTransform: 'uppercase',
        }}>
          ★ {customer.membershipTier}
        </div>
      </div>

      {/* Points */}
      <div style={{
        background: theme.pointsBg,
        border: `1px solid ${theme.pointsBorder}`,
        borderRadius: 12, padding: 14, marginBottom: 14,
      }}>
        <div style={{ color: '#FF6B00', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4, fontFamily: "'Space Mono', monospace" }}>Available Points</div>
        <div style={{ color: '#FF6B00', fontSize: 30, fontWeight: 900, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1 }}>
          {customer.availablePoints.toLocaleString()}
        </div>
        <div style={{ color: theme.textFaint, fontSize: 11, marginTop: 2 }}>Total earned: {customer.totalPoints.toLocaleString()} pts</div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ color: theme.textFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Phone</div>
          <div style={{ color: theme.textSub, fontSize: 11 }}>{customer.phone}</div>
        </div>
        <div style={{ width: 1, background: theme.border }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ color: theme.textFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Last Active</div>
          <div style={{ color: theme.textSub, fontSize: 11 }}>{new Date(customer.lastActivity).toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  );
}