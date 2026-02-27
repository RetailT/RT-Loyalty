import React from 'react';
import { useTheme } from '../context/ThemeContext';

const tabs = [
  { id: 'dashboard',    icon: '⬡', label: 'Home'    },
  { id: 'transactions', icon: '◈', label: 'History'  },
  { id: 'rewards',      icon: '⊞', label: 'Rewards'  },
  { id: 'tiers',        icon: '◫', label: 'Tiers'    },
  { id: 'profile',      icon: '◉', label: 'Profile'  },
];

export default function BottomNav({ currentPage, onNavigate }) {
  const { theme, mode } = useTheme();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 90,
      background: mode === 'dark' ? '#0a0a0a' : '#ffffff',
      borderTop: `1px solid ${theme.border}`,
      display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(t => {
        const active = currentPage === t.id;
        return (
          <button key={t.id} onClick={() => onNavigate(t.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '8px 4px', gap: 3, border: 'none',
            background: 'transparent', cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            <span style={{
              fontSize: 18, lineHeight: 1,
              color: active ? '#FF6B00' : theme.textFaint,
              transition: 'color 0.2s',
            }}>
              {t.icon}
            </span>
            <span style={{
              fontSize: 9, fontFamily: "'Space Mono',monospace",
              letterSpacing: 0.5, textTransform: 'uppercase',
              color: active ? '#FF6B00' : theme.textFaint,
              transition: 'color 0.2s',
            }}>
              {t.label}
            </span>
            {active && (
              <div style={{ width: 16, height: 2, background: '#FF6B00', borderRadius: 1, marginTop: 1 }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
