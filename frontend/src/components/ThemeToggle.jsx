import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ compact = false }) {
  const { mode, toggle, theme } = useTheme();
  const isDark = mode === 'dark';

  if (compact) {
    return (
      <button onClick={toggle} title={isDark ? 'Switch to Light' : 'Switch to Dark'} style={{
        background: isDark ? '#1a1a1a' : '#f0f0f0',
        border: `1px solid ${theme.border}`,
        borderRadius: 8, width: 34, height: 34,
        cursor: 'pointer', fontSize: 15,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
      }}>
        {isDark ? '☀️' : '🌙'}
      </button>
    );
  }

  return (
    <button onClick={toggle} title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: isDark ? '#1a1a1a' : '#f0f0f0',
      border: `1px solid ${theme.border}`,
      borderRadius: 40, padding: '5px 14px 5px 6px',
      cursor: 'pointer', transition: 'all 0.3s',
    }}>
      <div style={{
        width: 36, height: 20,
        background: isDark ? '#FF6B00' : '#d0d0d0',
        borderRadius: 20, position: 'relative',
        transition: 'background 0.3s', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: 3,
          left: isDark ? 19 : 3,
          width: 14, height: 14,
          background: '#fff', borderRadius: '50%',
          transition: 'left 0.3s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8,
        }}>
          {isDark ? '🌙' : '☀️'}
        </div>
      </div>
      <span style={{
        color: theme.textMuted, fontSize: 11,
        fontFamily: "'Space Mono', monospace",
        letterSpacing: 1, textTransform: 'uppercase', userSelect: 'none',
      }}>
        {isDark ? 'Dark' : 'Light'}
      </span>
    </button>
  );
}
