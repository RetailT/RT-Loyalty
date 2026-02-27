import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function StatsCard({ title, value, subtitle, icon, color = '#FF6B00', trend }) {
  const { theme } = useTheme();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: theme.bgCard,
        border: `1px solid ${hovered ? color + '55' : theme.border}`,
        borderRadius: 16, padding: 20,
        position: 'relative', overflow: 'hidden',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? `0 8px 32px ${color}18` : theme.shadow,
        transition: 'all 0.3s',
      }}
    >
      <div style={{
        position: 'absolute', top: -24, right: -24,
        width: 100, height: 100,
        background: `radial-gradient(circle, ${color}18, transparent 70%)`,
        borderRadius: '50%',
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{
            color: theme.textMuted, fontSize: 10, letterSpacing: 2,
            textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", marginBottom: 8,
          }}>
            {title}
          </div>
          <div style={{
            color: theme.text, fontSize: 30, fontWeight: 900,
            fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1, lineHeight: 1,
          }}>
            {value}
          </div>
          {subtitle && (
            <div style={{ color: theme.textFaint, fontSize: 11, marginTop: 6 }}>{subtitle}</div>
          )}
          {trend && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8,
              background: trend.value >= 0 ? theme.successBg : theme.errorBg,
              border: `1px solid ${trend.value >= 0 ? theme.successBorder : theme.errorBorder}`,
              borderRadius: 6, padding: '3px 8px', fontSize: 11,
              color: trend.value >= 0 ? theme.successText : theme.errorText,
              fontFamily: "'Space Mono', monospace",
            }}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </div>
          )}
        </div>
        <div style={{
          width: 44, height: 44,
          background: `${color}18`,
          border: `1px solid ${color}30`,
          borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
