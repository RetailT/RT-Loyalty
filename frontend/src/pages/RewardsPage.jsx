// src/pages/RewardsPage.jsx — Real API
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';
import { getRewards, redeemReward } from '../api';

const ICON_MAP = { Voucher:'🎟️', Food:'🍦', Discount:'💰', Gift:'🎁', Coffee:'☕', Drink:'🥤' };

export default function RewardsPage() {
  const { token, user, refreshUser } = useAuth();
  const { theme }    = useTheme();
  const { isMobile } = useResponsive();
  const [rewards, setRewards]         = useState([]);
  const [currentPts, setCurrentPts]   = useState(0);
  const [loading, setLoading]         = useState(true);
  const [redeemingId, setRedeemingId] = useState(null);
  const [success, setSuccess]         = useState('');
  const [error, setError]             = useState('');

  const load = () => {
    if (!token) return;
    setLoading(true);
    getRewards(token)
      .then(r => { setRewards(r.rewards||[]); setCurrentPts(r.currentPoints||0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]);

  const handleRedeem = async (reward) => {
    setRedeemingId(reward.IDX); setError(''); setSuccess('');
    try {
      const res = await redeemReward(token, reward.IDX);
      setSuccess(res.message || `Redeemed "${reward.TITLE}"!`);
      setCurrentPts(res.currentPoints);
      refreshUser();
      load();
    } catch (e) {
      setError(e.message || 'Redemption failed.');
    } finally {
      setRedeemingId(null);
      setTimeout(() => { setSuccess(''); setError(''); }, 4000);
    }
  };

  const pts = currentPts || user?.availablePoints || 0;

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding: isMobile?'24px 16px 100px':'32px 32px 60px' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ color:'#FF6B00', fontSize:10, fontFamily:"'Space Mono',monospace", letterSpacing:3, textTransform:'uppercase', marginBottom:4 }}>⊞ Redeem</div>
        <h1 style={{ color:theme.text, fontFamily:"'Bebas Neue',sans-serif", fontSize: isMobile?32:40, letterSpacing:2 }}>REWARDS CATALOG</h1>
      </div>

      {/* Balance banner */}
      <div style={{ background:'linear-gradient(135deg,#FF6B00,#FF8C00)', borderRadius:16, padding: isMobile?'16px 20px':'20px 28px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, boxShadow:'0 8px 32px rgba(255,107,0,0.3)' }}>
        <div>
          <div style={{ color:'rgba(255,255,255,0.75)', fontSize:10, fontFamily:"'Space Mono',monospace", letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>Available Balance</div>
          <div style={{ color:'#fff', fontFamily:"'Bebas Neue',sans-serif", fontSize: isMobile?40:52, letterSpacing:2, lineHeight:1 }}>
            {pts.toLocaleString()} <span style={{ fontSize:18, opacity:0.8 }}>PTS</span>
          </div>
        </div>
        <div style={{ fontSize:40, opacity:0.9 }}>💰</div>
      </div>

      {/* Alerts */}
      {success && <div style={{ background:theme.successBg, border:`1px solid ${theme.successBorder}`, borderRadius:10, padding:'12px 16px', color:theme.successText, fontSize:12, fontFamily:"'Space Mono',monospace", marginBottom:16 }}>✓ {success}</div>}
      {error   && <div style={{ background:theme.errorBg,   border:`1px solid ${theme.errorBorder}`,   borderRadius:10, padding:'12px 16px', color:theme.errorText,   fontSize:12, fontFamily:"'Space Mono',monospace", marginBottom:16 }}>⚠ {error}</div>}

      {loading ? (
        <div style={{ padding:48, textAlign:'center', color:theme.textFaint, fontFamily:"'Space Mono',monospace", fontSize:12 }}>Loading rewards...</div>
      ) : rewards.length===0 ? (
        <div style={{ background:theme.bgCard, border:`1px solid ${theme.border}`, borderRadius:16, padding:48, textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🎁</div>
          <p style={{ color:theme.textMuted, fontFamily:"'Space Mono',monospace", fontSize:12 }}>No rewards available right now. Check back soon!</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${isMobile?1:2},1fr)`, gap:16 }}>
          {rewards.map(reward => {
            const affordable = pts >= (reward.POINTS_COST||0);
            const busy       = redeemingId === reward.IDX;
            const icon       = ICON_MAP[reward.CATEGORY] || '🎁';
            return (
              <div key={reward.IDX} style={{ background:theme.bgCard, border:`1px solid ${theme.border}`, borderRadius:16, padding:20, transition:'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='rgba(255,107,0,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor=theme.border}>
                <div style={{ display:'flex', gap:16, marginBottom:16 }}>
                  <div style={{ width:56, height:56, borderRadius:14, flexShrink:0, background:theme.bgAccent, border:`1px solid ${theme.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>{icon}</div>
                  <div>
                    <div style={{ color:theme.text, fontWeight:700, fontSize:14, marginBottom:4 }}>{reward.TITLE}</div>
                    <div style={{ display:'inline-block', background:'rgba(255,107,0,0.08)', border:'1px solid rgba(255,107,0,0.2)', borderRadius:4, padding:'2px 8px', color:'#FF6B00', fontSize:10, fontFamily:"'Space Mono',monospace", letterSpacing:1, textTransform:'uppercase', marginBottom:4 }}>{reward.CATEGORY}</div>
                    <div style={{ color: affordable?'#FF6B00':theme.textFaint, fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:1 }}>{(reward.POINTS_COST||0).toLocaleString()} PTS</div>
                  </div>
                </div>
                {reward.DESCRIPTION && <p style={{ color:theme.textMuted, fontSize:12, lineHeight:1.5, marginBottom:12 }}>{reward.DESCRIPTION}</p>}
                {reward.VALID_UNTIL && <p style={{ color:theme.textFaint, fontSize:10, fontFamily:"'Space Mono',monospace", marginBottom:12 }}>Valid until {reward.VALID_UNTIL?.slice(0,10)}</p>}
                <button onClick={() => affordable && !busy && handleRedeem(reward)} disabled={!affordable||busy}
                  style={{ width:'100%', padding:'12px', background: affordable?'linear-gradient(135deg,#FF6B00,#FF8C00)':theme.bgAccent, border:`1px solid ${affordable?'transparent':theme.border}`, borderRadius:10, color: affordable?'#fff':theme.textFaint, fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:2, textTransform:'uppercase', cursor: affordable&&!busy?'pointer':'not-allowed', boxShadow: affordable?'0 6px 20px rgba(255,107,0,0.25)':'none', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.2s' }}>
                  {busy
                    ? <><Spin />Redeeming...</>
                    : affordable
                      ? 'Redeem Now'
                      : `Need ${((reward.POINTS_COST||0)-pts).toLocaleString()} more pts`}
                </button>
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Spin() {
  return <div style={{ width:12, height:12, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />;
}