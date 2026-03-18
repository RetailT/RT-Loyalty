import React, { createContext, useContext, useState } from 'react';

const darkTheme = {
  bg:'#0a0a0a', bgCard:'#1e1e1e', bgSubtle:'#252525', bgAccent:'#2a2a2a',
  navBg:'rgba(10,10,10,0.95)', navBorder:'#2a2a2a', navShadow:'0 1px 0 rgba(255,107,0,0.12)',
  modalBg:'rgba(0,0,0,0.75)', pointsBg:'rgba(255,107,0,0.10)', pointsBorder:'rgba(255,107,0,0.3)',
  text:'#ffffff', textSub:'#e8e8e8', textMuted:'#c0c0c0', textFaint:'#888888',
  border:'#3a3a3a', borderHover:'#FF6B00',
  successText:'#34d399', successBg:'rgba(52,211,153,0.10)', successBorder:'rgba(52,211,153,0.3)',
  errorText:'#f87171', errorBg:'rgba(248,113,113,0.10)', errorBorder:'rgba(248,113,113,0.3)',
  redText:'#f87171', shadow:'0 4px 24px rgba(0,0,0,0.6)', shadowHover:'0 8px 40px rgba(255,107,0,0.20)',
  cardHoverBg:'#252525', cardHoverTransform:'translateY(-2px)',
};

const lightTheme = {
  bg:'#fafafa', bgCard:'#ffffff', bgSubtle:'#f5f5f5', bgAccent:'#f0f0f0',
  navBg:'rgba(255,255,255,0.95)', navBorder:'#e8e8e8', navShadow:'0 1px 0 rgba(0,0,0,0.06)',
  modalBg:'rgba(0,0,0,0.4)', pointsBg:'rgba(255,107,0,0.06)', pointsBorder:'rgba(255,107,0,0.2)',
  text:'#111111', textSub:'#333333', textMuted:'#666666', textFaint:'#999999',
  border:'#e5e5e5', borderHover:'#FF6B00',
  successText:'#059669', successBg:'rgba(5,150,105,0.08)', successBorder:'rgba(5,150,105,0.25)',
  errorText:'#dc2626', errorBg:'rgba(220,38,38,0.08)', errorBorder:'rgba(220,38,38,0.25)',
  redText:'#dc2626', shadow:'0 4px 24px rgba(0,0,0,0.08)', shadowHover:'0 8px 40px rgba(255,107,0,0.12)',
  cardHoverBg:'#fff9f5', cardHoverTransform:'translateY(-2px)',
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');
  const theme  = mode === 'dark' ? darkTheme : lightTheme;
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

// ── useCardHover hook — cards 
// Usage:
//   const { cardProps } = useCardHover();
//   <div {...cardProps} style={{ ...cardProps.style, ...yourOtherStyles }}>
export function useCardHover(extraStyle = {}) {
  const { theme } = useTheme();
  const [hovered, setHovered] = useState(false);

  const cardProps = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    style: {
      background:   hovered ? theme.cardHoverBg  : theme.bgCard,
      border:       `1px solid ${hovered ? theme.borderHover : theme.border}`,
      boxShadow:    hovered ? theme.shadowHover  : theme.shadow,
      transform:    hovered ? theme.cardHoverTransform : 'translateY(0)',
      transition:   'all 0.2s ease',
      cursor:       'pointer',
      color:        theme.text, 
      ...extraStyle,
    },
  };

  return { hovered, cardProps };
}