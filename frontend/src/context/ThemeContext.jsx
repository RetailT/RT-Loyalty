import React, { createContext, useContext, useState } from 'react';

const darkTheme = {
  // Backgrounds
  bg:          '#0a0a0a',
  bgCard:      '#111111',
  bgSubtle:    '#161616',
  bgAccent:    '#1a1a1a',
  navBg:       'rgba(10,10,10,0.95)',
  navBorder:   '#1f1f1f',
  navShadow:   '0 1px 0 rgba(255,107,0,0.08)',
  modalBg:     'rgba(0,0,0,0.7)',
  pointsBg:    'rgba(255,107,0,0.06)',
  pointsBorder:'rgba(255,107,0,0.2)',

  // Text
  text:        '#f5f5f5',
  textSub:     '#d0d0d0',
  textMuted:   '#888888',
  textFaint:   '#555555',

  // Border
  border:      '#222222',

  // States
  successText:  '#34d399',
  successBg:    'rgba(52,211,153,0.08)',
  successBorder:'rgba(52,211,153,0.25)',
  errorText:    '#f87171',
  errorBg:      'rgba(248,113,113,0.08)',
  errorBorder:  'rgba(248,113,113,0.25)',
  redText:      '#f87171',

  // Shadow
  shadow:       '0 4px 24px rgba(0,0,0,0.4)',
  shadowHover:  '0 8px 40px rgba(255,107,0,0.15)',
};

const lightTheme = {
  bg:          '#fafafa',
  bgCard:      '#ffffff',
  bgSubtle:    '#f5f5f5',
  bgAccent:    '#f0f0f0',
  navBg:       'rgba(255,255,255,0.95)',
  navBorder:   '#e8e8e8',
  navShadow:   '0 1px 0 rgba(0,0,0,0.06)',
  modalBg:     'rgba(0,0,0,0.4)',
  pointsBg:    'rgba(255,107,0,0.06)',
  pointsBorder:'rgba(255,107,0,0.2)',

  text:        '#111111',
  textSub:     '#333333',
  textMuted:   '#666666',
  textFaint:   '#999999',

  border:      '#e5e5e5',

  successText:  '#059669',
  successBg:    'rgba(5,150,105,0.08)',
  successBorder:'rgba(5,150,105,0.25)',
  errorText:    '#dc2626',
  errorBg:      'rgba(220,38,38,0.08)',
  errorBorder:  'rgba(220,38,38,0.25)',
  redText:      '#dc2626',

  shadow:       '0 4px 24px rgba(0,0,0,0.08)',
  shadowHover:  '0 8px 40px rgba(255,107,0,0.12)',
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('dark');
  const theme = mode === 'dark' ? darkTheme : lightTheme;
  const toggle = () => setMode(m => m === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, mode, toggle }}>
      <div style={{ background: theme.bg, minHeight: '100vh', transition: 'background 0.3s' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
