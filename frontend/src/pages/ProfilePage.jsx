// src/pages/ProfilePage.jsx — Real API
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';
import { updateMe } from '../api';
import { TIER_CONFIG } from '../utils/tierConfig';

export default function ProfilePage({ onNavigate }) {
  const { user, token, logout, refreshUser } = useAuth();
  const { theme, mode } = useTheme();
  const { isMobile }    = useResponsive();

  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');
  const [form, setForm]       = useState({
    name:          user?.name          || '',
    email:         user?.email         || '',
    date_of_birth: user?.dateOfBirth   || '',
    phone:         user?.phone         || '',
  });

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await updateMe(token, {
        name:          form.name          || undefined,
        email:         form.email         || undefined,
        date_of_birth: form.date_of_birth || undefined,
        phone:         form.phone         || undefined,
      });
      await refreshUser();
      setSaved(true); setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.message || 'Failed to save profile.');
    } finally { setSaving(false); }
  };

  const handleLogout = () => { logout(); onNavigate('landing'); };

  if (!user) return null;

  const tierCfg = TIER_CONFIG[user.membershipTier] || TIER_CONFIG.Bronze;

  const inputStyle = (active) => ({
    width:'100%', padding:'12px 14px', borderRadius:10, fontSize:13,
    background: active ? (mode==='dark'?'#1a1a1a':'#f5f5f5') : theme.bgSubtle,
    border:`1px solid ${active?'#FF6B00':theme.border}`,
    color: active ? theme.text : theme.textSub,
    outline:'none', transition:'all 0.2s', boxSizing:'border-box',
    cursor: active ? 'text' : 'default',
  });

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding: isMobile?'24px 16px 100px':'32px 32px 60px' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ color:'#FF6B00', fontSize:10, fontFamily:"'Space Mono',monospace", letterSpacing:3, textTransform:'uppercase', marginBottom:4 }}>◉ Account</div>
        <h1 style={{ color:theme.text, fontFamily:"'Bebas Neue',sans-serif", fontSize: isMobile?32:40, letterSpacing:2 }}>MY PROFILE</h1>
      </div>

      {/* Avatar card */}
      <div style={{ background:theme.bgCard, border:`1px solid ${theme.border}`, borderRadius:16, padding: isMobile?'16px':'20px 24px', display:'flex', alignItems:'center', gap:16, marginBottom:16 }}>
        <div style={{ width:60, height:60, borderRadius:16, flexShrink:0, background:'linear-gradient(135deg,#FF6B00,#FF8C00)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:900, color:'#fff', fontFamily:"'Bebas Neue',sans-serif", boxShadow:'0 8px 24px rgba(255,107,0,0.35)' }}>
          {user.name?.charAt(0)||'U'}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:theme.text, fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:1, marginBottom:2 }}>{user.name}</div>
          <div style={{ color:theme.textMuted, fontSize:12, fontFamily:"'Space Mono',monospace", marginBottom:8 }}>{user.email}</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <span style={{ background:'rgba(255,107,0,0.08)', border:'1px solid rgba(255,107,0,0.25)', borderRadius:6, padding:'3px 10px', color:'#FF6B00', fontSize:9, fontFamily:"'Space Mono',monospace", letterSpacing:2, textTransform:'uppercase' }}>
              {tierCfg.icon} {user.membershipTier} Member
            </span>
            <span style={{ background:theme.successBg, border:`1px solid ${theme.successBorder}`, borderRadius:6, padding:'3px 10px', color:theme.successText, fontSize:9, fontFamily:"'Space Mono',monospace", letterSpacing:2, textTransform:'uppercase' }}>
              ● Active
            </span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {saved  && <div style={{ background:theme.successBg, border:`1px solid ${theme.successBorder}`, borderRadius:10, padding:'12px 16px', color:theme.successText, fontSize:12, fontFamily:"'Space Mono',monospace", marginBottom:16 }}>✓ Profile updated successfully</div>}
      {error  && <div style={{ background:theme.errorBg,   border:`1px solid ${theme.errorBorder}`,   borderRadius:10, padding:'12px 16px', color:theme.errorText,   fontSize:12, fontFamily:"'Space Mono',monospace", marginBottom:16 }}>⚠ {error}</div>}

      {/* Form */}
      <div style={{ background:theme.bgCard, border:`1px solid ${theme.border}`, borderRadius:16, padding: isMobile?'16px':'20px 24px', marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ color:'#FF6B00' }}>◈</span>
            <span style={{ color:theme.text, fontWeight:700, fontSize:13 }}>Personal Information</span>
          </div>
          <button onClick={() => editing ? handleSave() : setEditing(true)} disabled={saving} style={{
            background: editing?'linear-gradient(135deg,#FF6B00,#FF8C00)':theme.bgAccent,
            border:`1px solid ${editing?'transparent':theme.border}`,
            borderRadius:8, padding:'7px 16px',
            color: editing?'#fff':theme.textMuted,
            fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:1, textTransform:'uppercase',
            cursor:'pointer', boxShadow: editing?'0 4px 12px rgba(255,107,0,0.3)':'none', transition:'all 0.2s',
          }}>
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Edit Profile'}
          </button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:14 }}>
          {[
            { label:'Full Name',      field:'name',          type:'text'  },
            { label:'Email Address',  field:'email',         type:'email' },
            { label:'Phone Number',   field:'phone',         type:'tel'   },
            { label:'Date of Birth',  field:'date_of_birth', type:'date'  },
          ].map(({ label, field, type }) => (
            <div key={field} style={{ gridColumn: field==='name'&&!isMobile?'span 2':undefined }}>
              <label style={{ display:'block', color:theme.textMuted, fontSize:10, letterSpacing:2, textTransform:'uppercase', fontFamily:"'Space Mono',monospace", marginBottom:6 }}>{label}</label>
              <input type={type} value={form[field]} onChange={e => setForm({ ...form, [field]:e.target.value })} disabled={!editing} style={inputStyle(editing)}
                onFocus={e  => editing && (e.target.style.boxShadow='0 0 0 2px rgba(255,107,0,0.15)')}
                onBlur={e   => (e.target.style.boxShadow='none')}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Account Summary */}
      <div style={{ background:theme.bgCard, border:`1px solid ${theme.border}`, borderRadius:16, padding: isMobile?'16px':'20px 24px', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
          <span style={{ color:'#FF6B00' }}>◫</span>
          <span style={{ color:theme.text, fontWeight:700, fontSize:13 }}>Account Summary</span>
        </div>
        <div>
          {[
            ['Membership ID',    user.membershipId   || '—'],
            ['Member Since',     user.joinDate?.slice(0,10) || '—'],
            ['Lifetime Points',  `${(user.totalPoints||0).toLocaleString()} pts`],
            ['Available Points', `${(user.availablePoints||0).toLocaleString()} pts`],
            ['Redeemed Points',  `${(user.redeemedPoints||0).toLocaleString()} pts`],
            ['Current Tier',     `${user.membershipTier||'Bronze'} ${user.tierExpiry?`(expires ${user.tierExpiry?.slice(0,10)})`:''}` ],
            ['Last Activity',    user.lastActivity?.slice(0,10) || '—'],
            ['Account Status',   (user.status||'active').toUpperCase()],
          ].map(([lbl, val]) => (
            <div key={lbl} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${theme.border}` }}>
              <span style={{ color:theme.textMuted, fontSize:11, fontFamily:"'Space Mono',monospace" }}>{lbl}</span>
              <span style={{ color:theme.textSub, fontSize:12, fontWeight:600, textAlign:'right', maxWidth:'55%' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button onClick={handleLogout} style={{ width:'100%', padding:'14px', background:theme.errorBg, border:`1px solid ${theme.errorBorder}`, borderRadius:12, color:theme.errorText, fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:2, textTransform:'uppercase', cursor:'pointer', transition:'all 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.background='rgba(248,113,113,0.15)'}
      onMouseLeave={e => e.currentTarget.style.background=theme.errorBg}>
        ⏻ Sign Out
      </button>
    </div>
  );
}