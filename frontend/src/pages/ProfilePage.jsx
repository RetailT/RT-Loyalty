import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme, useCardHover } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';
import { updateMe } from '../api';
import { fs, fh, fm } from '../utils/fontScale';

export default function ProfilePage({ onNavigate }) {
  const { user, token, logout, refreshUser } = useAuth();
  const { theme, mode } = useTheme();
  const { isMobile }    = useResponsive();

  const { cardProps: avatarCardProps }   = useCardHover({ borderRadius:16, padding: isMobile?'16px':'20px 24px', display:'flex', alignItems:'center', gap:16, marginBottom:16 });
  const { cardProps: infoCardProps }     = useCardHover({ borderRadius:16, padding: isMobile?'16px':'20px 24px', marginBottom:16 });
  const { cardProps: summaryCardProps }  = useCardHover({ borderRadius:16, padding: isMobile?'16px':'20px 24px', marginBottom:16 });

  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');
  const [form, setForm] = useState({
    email:         user?.email         || '',
    city:          user?.city          || '',
    occupation:    user?.occupation    || '',
    date_of_birth: user?.dateOfBirth   ? user.dateOfBirth.slice(0,10) : '',
  });

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await updateMe(token, {
        email:         form.email         || undefined,
        city:          form.city          || undefined,
        occupation:    form.occupation    || undefined,
        dob:           form.date_of_birth || undefined,
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

  const inputStyle = (active) => ({
    width:'100%', padding:'12px 14px', borderRadius:10, fontSize:15,
    background: active ? (mode==='dark'?'#1a1a1a':'#f5f5f5') : theme.bgSubtle,
    border:`1px solid ${active?'#FF6B00':theme.border}`,
    color: active ? theme.text : theme.textSub,
    outline:'none', transition:'all 0.2s', boxSizing:'border-box',
    cursor: active ? 'text' : 'default',
  });

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding: isMobile?'24px 16px 100px':'32px 32px 60px' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ color:'#FF6B00', fontSize:12, fontFamily:"'Space Mono',monospace", letterSpacing:3, textTransform:'uppercase', marginBottom:4 }}>◉ Account</div>
        <h1 style={{ color:theme.text, fontFamily:"'Bebas Neue',sans-serif", fontSize: isMobile?37:46, letterSpacing:2 }}>MY PROFILE</h1>
      </div>

      {/* Avatar card */}
      <div {...avatarCardProps} style={{ ...avatarCardProps.style, cursor:'default' }}>
        <div style={{ width:60, height:60, borderRadius:16, flexShrink:0, background:'linear-gradient(135deg,#FF6B00,#FF8C00)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, fontWeight:900, color:'#fff', fontFamily:"'Bebas Neue',sans-serif", boxShadow:'0 8px 24px rgba(255,107,0,0.35)' }}>
          {user.name?.charAt(0)||'U'}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:theme.text, fontFamily:"'Bebas Neue',sans-serif", fontSize:23, letterSpacing:1, marginBottom:2 }}>{user.name}</div>
          <div style={{ color:theme.textMuted, fontSize:14, fontFamily:"'Space Mono',monospace", marginBottom:8 }}>{user.phone}</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <span style={{ background:'rgba(255,107,0,0.08)', border:'1px solid rgba(255,107,0,0.25)', borderRadius:6, padding:'3px 10px', color:'#FF6B00', fontSize:10, fontFamily:"'Space Mono',monospace", letterSpacing:2, textTransform:'uppercase' }}>
              🏪 {user.loyaltyType || 'Member'}
            </span>
            <span style={{ background:theme.successBg, border:`1px solid ${theme.successBorder}`, borderRadius:6, padding:'3px 10px', color:theme.successText, fontSize:10, fontFamily:"'Space Mono',monospace", letterSpacing:2, textTransform:'uppercase' }}>
              ● Active
            </span>
          </div>
        </div>
      </div>

      {saved && <div style={{ background:theme.successBg, border:`1px solid ${theme.successBorder}`, borderRadius:10, padding:'12px 16px', color:theme.successText, fontSize:14, fontFamily:"'Space Mono',monospace", marginBottom:16 }}>✓ Profile updated successfully</div>}
      {error && <div style={{ background:theme.errorBg,   border:`1px solid ${theme.errorBorder}`,   borderRadius:10, padding:'12px 16px', color:theme.errorText,   fontSize:14, fontFamily:"'Space Mono',monospace", marginBottom:16 }}>⚠ {error}</div>}

      {/* Editable fields */}
      <div {...infoCardProps} style={{ ...infoCardProps.style, cursor:'default' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ color:'#FF6B00' }}>◈</span>
            <span style={{ color:theme.text, fontWeight:700, fontSize:15 }}>Personal Information</span>
          </div>
          <button 
            onClick={() => editing ? handleSave() : setEditing(true)} 
            disabled={saving}
            onMouseEnter={e => {
              if (!editing) {
                e.currentTarget.style.background = 'linear-gradient(135deg,#FF6B00,#FF8C00)';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={e => {
              if (!editing) {
                e.currentTarget.style.background = theme.bgAccent;
                e.currentTarget.style.borderColor = theme.border;
                e.currentTarget.style.color = theme.textMuted;
              }
            }}
            style={{
              background: editing ? 'linear-gradient(135deg,#FF6B00,#FF8C00)' : theme.bgAccent,
              border: `1px solid ${editing ? 'transparent' : theme.border}`,
              borderRadius: 8, padding: '7px 16px',
              color: editing ? '#fff' : theme.textMuted,
              fontFamily: "'Space Mono',monospace", fontSize: 10, 
              letterSpacing: 1, textTransform: 'uppercase',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Edit Profile'}
          </button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:14 }}>
          {[
            { label:'Email Address', field:'email',         type:'email' },
            { label:'City',          field:'city',          type:'text'  },
            { label:'Occupation',    field:'occupation',    type:'text'  },
            { label:'Date of Birth', field:'date_of_birth', type:'date'  },
          ].map(({ label, field, type }) => (
            <div key={field}>
              <label style={{ display:'block', color:theme.textMuted, fontSize:12, letterSpacing:2, textTransform:'uppercase', fontFamily:"'Space Mono',monospace", marginBottom:6 }}>{label}</label>
              <input type={type} value={form[field]} onChange={e => setForm({ ...form, [field]:e.target.value })} disabled={!editing} style={inputStyle(editing)} />
            </div>
          ))}
        </div>
        {editing && (
          <button onClick={() => { setEditing(false); setError(''); }} style={{ marginTop:12, background:'none', border:'none', color:theme.textMuted, fontSize:14, cursor:'pointer', fontFamily:"'Space Mono',monospace" }}>
            ← Cancel
          </button>
        )}
      </div>

      {/* Account summary */}
      <div {...summaryCardProps} style={{ ...summaryCardProps.style, cursor:'default' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
          <span style={{ color:'#FF6B00' }}>◫</span>
          <span style={{ color:theme.text, fontWeight:700, fontSize:15 }}>Account Summary</span>
        </div>
        {[
          ['Card / Serial No.',   user.serialNo       || '—'],
          ['Mobile Number',       user.phone          || '—'],
          ['Shop',                user.companyName    || '—'],
          ['Loyalty Type',        user.loyaltyType    || '—'],
          ['Lifetime Points',     `${(user.totalPoints||0).toLocaleString()} pts`],
          ['Available Points',    `${(user.availablePoints||0).toLocaleString()} pts`],
          ['Redeemed Points',     `${(user.redeemedPoints||0).toLocaleString()} pts`],
        ].map(([lbl, val]) => (
          <div key={lbl} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${theme.border}` }}>
            <span style={{ color:theme.textMuted, fontSize:13, fontFamily:"'Space Mono',monospace" }}>{lbl}</span>
            <span style={{ color:theme.textSub, fontSize:14, fontWeight:600, textAlign:'right', maxWidth:'55%' }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Logout */}
      <button onClick={handleLogout} style={{ width:'100%', padding:'14px', background:theme.errorBg, border:`1px solid ${theme.errorBorder}`, borderRadius:12, color:theme.errorText, fontFamily:"'Space Mono',monospace", fontSize:13, letterSpacing:2, textTransform:'uppercase', cursor:'pointer', transition:'all 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.background='rgba(248,113,113,0.15)'}
        onMouseLeave={e => e.currentTarget.style.background=theme.errorBg}>
        ⏻ Sign Out
      </button>
    </div>
  );
}