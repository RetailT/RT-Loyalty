import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext(null);

export const themes = {
  dark: {
    name: 'dark',
    bg:          '#070707',
    bgCard:      '#111111',
    bgCardHover: '#161616',
    bgInput:     '#0a0a0a',
    bgSubtle:    '#0d0d0d',
    bgAccent:    '#1a1a1a',
    border:      '#1e1e1e',
    borderHover: '#2a2a2a',
    text:        '#ffffff',
    textSub:     '#aaaaaa',
    textMuted:   '#666666',
    textFaint:   '#444444',
    navBg:       '#0a0a0a',
    navBorder:   '#1e1e1e',
    navShadow:   '0 4px 32px rgba(0,0,0,0.6)',
    shadow:      '0 1px 4px rgba(0,0,0,0.4)',
    shadowHover: '0 12px 40px rgba(255,107,0,0.15)',
    inputBorder: '#2a2a2a',
    pointsBg:    '#0a0a0a',
    pointsBorder:'#1a1a1a',
    rowHover:    '#111111',
    divider:     '#111111',
    modalBg:     'rgba(0,0,0,0.85)',
    successBg:   'rgba(0,200,100,0.1)',
    successBorder:'rgba(0,200,100,0.3)',
    successText: '#00c864',
    errorBg:     'rgba(255,68,68,0.1)',
    errorBorder: 'rgba(255,68,68,0.3)',
    errorText:   '#ff4444',
    greenText:   '#00c864',
    redText:     '#ff4444',
    liveDot:     '#00c864',
  },
  light: {
    name: 'light',
    bg:          '#f5f5f5',
    bgCard:      '#ffffff',
    bgCardHover: '#fafafa',
    bgInput:     '#f9f9f9',
    bgSubtle:    '#f8f8f8',
    bgAccent:    '#f0f0f0',
    border:      '#e5e5e5',
    borderHover: '#d0d0d0',
    text:        '#111111',
    textSub:     '#444444',
    textMuted:   '#888888',
    textFaint:   '#bbbbbb',
    navBg:       '#ffffff',
    navBorder:   '#e5e5e5',
    navShadow:   '0 1px 12px rgba(0,0,0,0.06)',
    shadow:      '0 1px 4px rgba(0,0,0,0.06)',
    shadowHover: '0 12px 40px rgba(255,107,0,0.12)',
    inputBorder: '#d5d5d5',
    pointsBg:    '#FFF7F0',
    pointsBorder:'#FFE4CC',
    rowHover:    '#fafafa',
    divider:     '#f0f0f0',
    modalBg:     'rgba(0,0,0,0.5)',
    successBg:   'rgba(22,163,74,0.08)',
    successBorder:'rgba(22,163,74,0.25)',
    successText: '#16a34a',
    errorBg:     'rgba(220,38,38,0.08)',
    errorBorder: 'rgba(220,38,38,0.25)',
    errorText:   '#dc2626',
    greenText:   '#16a34a',
    redText:     '#dc2626',
    liveDot:     '#16a34a',
  },
};

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');
  const theme = themes[mode];
  const toggle = () => setMode(m => m === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, mode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}