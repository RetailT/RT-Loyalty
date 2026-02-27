import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';
import { MOCK_REWARDS, MOCK_USER } from '../utils/mockData';

export default function RewardsPage() {
  const { theme } = useTheme();
  const { isMobile } = useResponsive();
  const [redeemingId, setRedeemingId] = useState(null);
  const [redeemedIds, setRedeemedIds] = useState([]);

  const handleRedeem = (reward) => {
    setRedeemingId(reward.id);
    // POST /api/customer/redeem { reward_id: reward.id }
    setTimeout(() => {
      setRedeemingId(null);
      setRedeemedIds(prev => [...prev, reward.id]);
    }, 1200);
  };

  const canAfford = (pts) => MOCK_USER.current_points >= pts;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '24px 16px 100px' : '32px 32px 60px' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: '#FF6B00', fontSize: 10, fontFamily: "'Space Mono',monospace", letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>
          ⊞ Redeem
        </div>
        <h1 style={{ color: theme.text, fontFamily: "'Bebas Neue',sans-serif", fontSize: isMobile ? 32 : 40, letterSpacing: 2 }}>
          REWARDS CATALOG
        </h1>
      </div>

      {/* Balance banner */}
      <div style={{
        background: 'linear-gradient(135deg,#FF6B00,#FF8C00)',
        borderRadius: 16, padding: isMobile ? '16px 20px' : '20px 28px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 24, boxShadow: '0 8px 32px rgba(255,107,0,0.3)',
      }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, fontFamily: "'Space Mono',monospace", letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
            Available Balance
          </div>
          <div style={{ color: '#fff', fontFamily: "'Bebas Neue',sans-serif", fontSize: isMobile ? 40 : 52, letterSpacing: 2, lineHeight: 1 }}>
            {MOCK_USER.current_points.toLocaleString()}
            <span style={{ fontSize: 18, marginLeft: 8, opacity: 0.8 }}>PTS</span>
          </div>
        </div>
        <div style={{ fontSize: 40, opacity: 0.9 }}>💰</div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 1 : 2},1fr)`, gap: 16 }}>
        {MOCK_REWARDS.map(reward => {
          const affordable = canAfford(reward.points);
          const redeemed   = redeemedIds.includes(reward.id);
          const loading    = redeemingId === reward.id;

          return (
            <div key={reward.id} style={{
              background: redeemed ? theme.successBg : theme.bgCard,
              border: `1px solid ${redeemed ? theme.successBorder : theme.border}`,
              borderRadius: 16, padding: '20px',
              transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                  background: theme.bgAccent, border: `1px solid ${theme.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28,
                }}>
                  {reward.icon}
                </div>
                <div>
                  <div style={{ color: theme.text, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{reward.title}</div>
                  <div style={{
                    display: 'inline-block',
                    background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)',
                    borderRadius: 4, padding: '2px 8px',
                    color: '#FF6B00', fontSize: 10, fontFamily: "'Space Mono',monospace", letterSpacing: 1,
                    textTransform: 'uppercase', marginBottom: 4,
                  }}>
                    {reward.category}
                  </div>
                  <div style={{
                    color: affordable ? '#FF6B00' : theme.textFaint,
                    fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: 1,
                  }}>
                    {reward.points.toLocaleString()} PTS
                  </div>
                </div>
              </div>

              <button
                onClick={() => !redeemed && affordable && !loading && handleRedeem(reward)}
                disabled={!affordable || loading || redeemed}
                style={{
                  width: '100%', padding: '12px',
                  background: redeemed
                    ? theme.successBg
                    : affordable
                      ? 'linear-gradient(135deg,#FF6B00,#FF8C00)'
                      : theme.bgAccent,
                  border: `1px solid ${redeemed ? theme.successBorder : affordable ? 'transparent' : theme.border}`,
                  borderRadius: 10,
                  color: redeemed ? theme.successText : affordable ? '#fff' : theme.textFaint,
                  fontFamily: "'Space Mono',monospace", fontSize: 11,
                  letterSpacing: 2, textTransform: 'uppercase',
                  cursor: affordable && !redeemed && !loading ? 'pointer' : 'not-allowed',
                  boxShadow: affordable && !redeemed ? '0 6px 20px rgba(255,107,0,0.25)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s',
                }}
              >
                {loading ? (
                  <>
                    <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Redeeming...
                  </>
                ) : redeemed ? (
                  '✓ Redeemed!'
                ) : affordable ? (
                  'Redeem Now'
                ) : (
                  `Need ${(reward.points - MOCK_USER.current_points).toLocaleString()} more pts`
                )}
              </button>
            </div>
          );
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
