import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

export default function LoginPage({ onSuccess }) {
  const { login } = useAuth();
  const { theme, mode } = useTheme();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const ok = await login(email, password);
    setLoading(false);
    if (ok) onSuccess();
    else setError('Invalid credentials. Please try again.');
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', transition: 'background 0.3s' }}>
      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(${mode === 'dark' ? 'rgba(255,107,0,0.03)' : 'rgba(255,107,0,0.04)'} 1px, transparent 1px), linear-gradient(90deg, ${mode === 'dark' ? 'rgba(255,107,0,0.03)' : 'rgba(255,107,0,0.04)'} 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />
      <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 260, background: 'radial-gradient(ellipse, rgba(255,107,0,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Theme toggle top right */}
      <div style={{ position: 'absolute', top: 20, right: 24, zIndex: 10 }}>
        <ThemeToggle />
      </div>

      <div style={{ width: '100%', maxWidth: 420, padding: 20, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg, #FF6B00, #FF8C00)',
            borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 900, color: '#fff',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(255,107,0,0.4)',
          }}>R</div>
          <div style={{ color: theme.text, fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 4, marginBottom: 4, transition: 'color 0.3s' }}>RETAILCO</div>
          <div style={{ color: '#FF6B00', fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', fontFamily: "'Space Mono', monospace" }}>Loyalty Management System</div>
        </div>

        {/* Card */}
        <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 20, padding: 36, boxShadow: '0 8px 40px rgba(0,0,0,0.1)', transition: 'background 0.3s, border-color 0.3s' }}>
          <h2 style={{ color: theme.text, fontSize: 20, fontWeight: 800, margin: '0 0 4px 0', transition: 'color 0.3s' }}>Welcome back</h2>
          <p style={{ color: theme.textMuted, fontSize: 13, margin: '0 0 28px 0' }}>Sign in to access the loyalty dashboard</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: theme.textMuted, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", marginBottom: 8 }}>Email Address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@retailco.lk" required
                style={{ width: '100%', padding: '12px 16px', background: theme.bgInput, border: `1px solid ${theme.inputBorder}`, borderRadius: 10, color: theme.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s, background 0.3s' }}
                onFocus={e => (e.target.style.borderColor = '#FF6B00')}
                onBlur={e  => (e.target.style.borderColor = theme.inputBorder)}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', color: theme.textMuted, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", marginBottom: 8 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password" required
                  style={{ width: '100%', padding: '12px 44px 12px 16px', background: theme.bgInput, border: `1px solid ${theme.inputBorder}`, borderRadius: 10, color: theme.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s, background 0.3s' }}
                  onFocus={e => (e.target.style.borderColor = '#FF6B00')}
                  onBlur={e  => (e.target.style.borderColor = theme.inputBorder)}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: 14, padding: 4 }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: theme.errorBg, border: `1px solid ${theme.errorBorder}`, borderRadius: 8, padding: '10px 14px', color: theme.errorText, fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: 14,
              background: loading ? theme.bgAccent : 'linear-gradient(135deg, #FF6B00, #FF8C00)',
              border: 'none', borderRadius: 10,
              color: loading ? theme.textMuted : '#fff',
              fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: 2, textTransform: 'uppercase',
              fontFamily: "'Space Mono', monospace", transition: 'all 0.3s',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(255,107,0,0.4)',
            }}>
              {loading ? '● ● ●' : '→ SIGN IN'}
            </button>
          </form>

          <div style={{ marginTop: 20, padding: 12, background: theme.bgSubtle, borderRadius: 8, border: `1px solid ${theme.border}` }}>
            <div style={{ color: theme.textMuted, fontSize: 11, fontFamily: "'Space Mono', monospace", marginBottom: 4 }}>Demo Credentials</div>
            <div style={{ color: theme.textSub, fontSize: 12 }}>Email: any valid email</div>
            <div style={{ color: theme.textSub, fontSize: 12 }}>Password: any 4+ characters</div>
          </div>
        </div>
      </div>
    </div>
  );
}