import React from 'react';
import { useTheme } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';
import { TIER_CONFIG } from '../utils/mockData';

export default function LandingPage({ onNavigate }) {
  const { theme, mode } = useTheme();
  const { isMobile }    = useResponsive();

  const benefits = [
    { icon: '🏪', title: 'Earn at 500+ Stores', desc: 'All participating Retail POS outlets across Sri Lanka' },
    { icon: '💎', title: 'Tier Rewards',         desc: 'Bronze → Silver → Gold → Platinum exclusive perks' },
    { icon: '🎁', title: 'Redeem Anytime',       desc: 'Vouchers, discounts, free items and more' },
    { icon: '📱', title: 'Mobile First',         desc: 'Login with just your phone number — no password needed' },
  ];

  const tiers = [
    { name: 'Bronze',   icon: '🥉', range: '0 – 4,999 pts'     },
    { name: 'Silver',   icon: '🥈', range: '5,000 – 9,999 pts' },
    { name: 'Gold',     icon: '🥇', range: '10,000 – 24,999'   },
    { name: 'Platinum', icon: '💎', range: '25,000+ pts'        },
  ];

  return (
    <div>
      {/* ── Hero ── */}
      <section style={{
        background: mode === 'dark'
          ? 'linear-gradient(160deg,#0a0a0a 0%,#111 40%,#1a0a00 100%)'
          : 'linear-gradient(160deg,#fff 0%,#fff8f0 100%)',
        padding: isMobile ? '60px 16px 48px' : '100px 32px 80px',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* Glow */}
        <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 300, background: 'radial-gradient(ellipse,rgba(255,107,0,0.08),transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 700, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 14px', borderRadius: 40,
            background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.25)',
            color: '#FF6B00', fontSize: 11, fontFamily: "'Space Mono',monospace",
            letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24,
          }}>
            ◈ Sri Lanka's Retail Loyalty Network
          </div>

          <h1 style={{
            color: theme.text,
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: isMobile ? 56 : 80,
            letterSpacing: 3, lineHeight: 0.95,
            marginBottom: 20,
          }}>
            SHOP MORE.<br />
            <span style={{ color: '#FF6B00' }}>EARN MORE.</span><br />
            REWARD YOURSELF.
          </h1>

          <p style={{ color: theme.textMuted, fontSize: isMobile ? 14 : 16, lineHeight: 1.8, maxWidth: 480, margin: '0 auto 36px' }}>
            Join Retail Loyalty and earn points every time you shop. Check your balance, view history, and redeem rewards — all in one place.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate('login')} style={{
              padding: '14px 32px', borderRadius: 10,
              background: 'linear-gradient(135deg,#FF6B00,#FF8C00)',
              border: 'none', color: '#fff',
              fontFamily: "'Space Mono',monospace", fontSize: 11,
              letterSpacing: 2, textTransform: 'uppercase',
              cursor: 'pointer', boxShadow: '0 8px 32px rgba(255,107,0,0.35)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              Login to Account →
            </button>
            <button onClick={() => onNavigate('login')} style={{
              padding: '14px 32px', borderRadius: 10,
              background: 'transparent',
              border: `1px solid ${theme.border}`,
              color: theme.textSub,
              fontFamily: "'Space Mono',monospace", fontSize: 11,
              letterSpacing: 2, textTransform: 'uppercase',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF6B00'; e.currentTarget.style.color = '#FF6B00'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.textSub; }}>
              Join with Mobile 📱
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? 24 : 48, marginTop: 56, flexWrap: 'wrap' }}>
            {[['500K+','Members'],['2.5M+','Points Earned'],['500+','Stores'],['4','Reward Tiers']].map(([num,lbl]) => (
              <div key={lbl} style={{ textAlign: 'center' }}>
                <div style={{ color: '#FF6B00', fontFamily: "'Bebas Neue',sans-serif", fontSize: isMobile ? 28 : 36, letterSpacing: 2, lineHeight: 1 }}>{num}</div>
                <div style={{ color: theme.textFaint, fontSize: 10, fontFamily: "'Space Mono',monospace", letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '48px 16px' : '72px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ color: theme.text, fontFamily: "'Bebas Neue',sans-serif", fontSize: isMobile ? 32 : 42, letterSpacing: 2, marginBottom: 8 }}>
            WHY JOIN RETAIL LOYALTY?
          </h2>
          <p style={{ color: theme.textMuted, fontSize: 13 }}>Everything you need to make every rupee count</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 16 }}>
          {benefits.map(b => (
            <div key={b.title} style={{
              background: theme.bgCard, border: `1px solid ${theme.border}`,
              borderRadius: 16, padding: 20,
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,107,0,0.4)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{b.icon}</div>
              <div style={{ color: theme.text, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{b.title}</div>
              <div style={{ color: theme.textMuted, fontSize: 12, lineHeight: 1.6 }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tiers ── */}
      <section style={{ background: mode === 'dark' ? '#111' : '#f8f8f8', padding: isMobile ? '48px 16px' : '72px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ color: theme.text, fontFamily: "'Bebas Neue',sans-serif", fontSize: isMobile ? 32 : 42, letterSpacing: 2, marginBottom: 8 }}>
              LOYALTY TIERS
            </h2>
            <p style={{ color: theme.textMuted, fontSize: 13 }}>Earn more, unlock better rewards</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4},1fr)`, gap: 16 }}>
            {tiers.map(t => {
              const cfg = TIER_CONFIG[t.name];
              return (
                <div key={t.name} style={{
                  background: theme.bgCard, border: `1px solid ${theme.border}`,
                  borderRadius: 16, padding: '24px 20px', textAlign: 'center',
                }}>
                  <div style={{
                    width: 52, height: 52, margin: '0 auto 14px',
                    background: cfg.gradient, borderRadius: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                  }}>
                    {t.icon}
                  </div>
                  <div style={{ color: theme.text, fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2 }}>{t.name.toUpperCase()}</div>
                  <div style={{ color: theme.textFaint, fontSize: 10, fontFamily: "'Space Mono',monospace", marginTop: 4 }}>{t.range}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '48px 16px' : '72px 32px', textAlign: 'center' }}>
        <div style={{
          background: 'linear-gradient(135deg,#FF6B00,#FF8C00)',
          borderRadius: 24, padding: isMobile ? '36px 24px' : '48px 40px',
          boxShadow: '0 24px 60px rgba(255,107,0,0.25)',
        }}>
          <h2 style={{ color: '#fff', fontFamily: "'Bebas Neue',sans-serif", fontSize: isMobile ? 36 : 48, letterSpacing: 3, marginBottom: 12 }}>
            START EARNING TODAY
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 28 }}>
            Sign up with just your mobile number. No password required.
          </p>
          <button onClick={() => onNavigate('login')} style={{
            padding: '14px 36px', borderRadius: 10,
            background: '#fff', border: 'none',
            color: '#FF6B00', fontFamily: "'Space Mono',monospace",
            fontSize: 12, letterSpacing: 2, textTransform: 'uppercase',
            fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            Join Now — It's Free →
          </button>
        </div>
      </section>
    </div>
  );
}
