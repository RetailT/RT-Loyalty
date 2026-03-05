// src/pages/LoginPage.jsx — Real API
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';
import { sendOTP, verifyOTP } from '../api';

export default function LoginPage({ onNavigate }) {
  const { login }        = useAuth();
  const { theme, mode }  = useTheme();
  const { isMobile }     = useResponsive();

  const [step, setStep]     = useState('email');
  const [email, setEmail]   = useState('');
  const [otp, setOtp]       = useState(['','','','','','']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer]   = useState(0);
  const [error, setError]   = useState('');
  const [devOtp, setDevOtp] = useState('');

  useEffect(() => {
    if (timer > 0) { const t = setTimeout(() => setTimer(timer-1), 1000); return () => clearTimeout(t); }
  }, [timer]);

  const isValidEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSendOTP = async () => {
    if (!isValidEmail(email)) { setError('Please enter a valid email address'); return; }
    setError(''); setLoading(true);
    try {
      const res = await sendOTP(email.trim().toLowerCase());
      if (res._dev_otp) setDevOtp(res._dev_otp); // show in dev mode
      setStep('otp'); setTimer(120);
    } catch (e) {
      setError(e.message || 'No loyalty account found for this email.');
    } finally { setLoading(false); }
  };

  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[idx] = val.slice(-1); setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx+1}`)?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key==='Backspace' && !otp[idx] && idx>0) document.getElementById(`otp-${idx-1}`)?.focus();
    if (e.key==='Enter') handleVerify();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Enter the 6-digit OTP'); return; }
    setError(''); setLoading(true);
    try {
      const res = await verifyOTP(email.trim().toLowerCase(), code);
      login(res.customer, res.token);
      onNavigate('dashboard');
    } catch (e) {
      setError(e.message || 'Invalid or expired OTP.');
    } finally { setLoading(false); }
  };

  const inp = {
    background: mode==='dark'?'#1a1a1a':'#f5f5f5',
    border:`1px solid ${theme.border}`, borderRadius:10,
    color:theme.text, fontFamily:'inherit', outline:'none', transition:'border-color 0.2s',
  };
  const emailReady = isValidEmail(email);
  const otpReady   = otp.join('').length === 6;

  return (
    <div style={{ minHeight:'calc(100vh - 64px)', display:'flex', alignItems:'center', justifyContent:'center', padding: isMobile?'24px 16px':'48px 16px' }}>
      <div style={{ width:'100%', maxWidth:420 }}>
        <div style={{ background:theme.bgCard, border:`1px solid ${theme.border}`, borderRadius:20, padding: isMobile?'28px 20px':'36px 32px', boxShadow:'0 24px 80px rgba(0,0,0,0.12)' }}>

          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:28 }}>
            <div style={{ width:56, height:56, margin:'0 auto 14px', background:'linear-gradient(135deg,#FF6B00,#FF8C00)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:900, color:'#fff', boxShadow:'0 8px 24px rgba(255,107,0,0.4)', fontFamily:"'Bebas Neue',sans-serif", letterSpacing:1 }}>R</div>
            <h1 style={{ color:theme.text, fontFamily:"'Bebas Neue',sans-serif", fontSize:26, letterSpacing:2, marginBottom:4 }}>
              {step==='email' ? 'WELCOME BACK' : 'VERIFY OTP'}
            </h1>
            <p style={{ color:theme.textMuted, fontSize:12, fontFamily:"'Space Mono',monospace" }}>
              {step==='email' ? 'Enter your email address to continue' : `OTP sent to ${email}`}
            </p>
          </div>

          {step==='email' ? (
            <>
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', color:theme.textMuted, fontSize:10, letterSpacing:2, textTransform:'uppercase', fontFamily:"'Space Mono',monospace", marginBottom:8 }}>Email Address</label>
                <input type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  onKeyDown={e => e.key==='Enter' && handleSendOTP()}
                  placeholder="you@example.com" autoFocus
                  style={{ ...inp, width:'100%', padding:'12px 14px', fontSize:15, boxSizing:'border-box' }}
                  onFocus={e => e.target.style.borderColor='#FF6B00'}
                  onBlur={e  => e.target.style.borderColor=theme.border}
                />
              </div>

              {error && <div style={{ color:theme.errorText, fontSize:11, marginBottom:12, fontFamily:"'Space Mono',monospace" }}>⚠ {error}</div>}

              <button onClick={handleSendOTP} disabled={!emailReady||loading} style={{
                width:'100%', padding:'14px',
                background: emailReady ? 'linear-gradient(135deg,#FF6B00,#FF8C00)' : theme.bgAccent,
                border:'none', borderRadius:10,
                color: emailReady ? '#fff' : theme.textFaint,
                fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:2, textTransform:'uppercase',
                cursor: emailReady ? 'pointer' : 'not-allowed',
                boxShadow: emailReady ? '0 8px 24px rgba(255,107,0,0.3)' : 'none',
                transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              }}>
                {loading ? <><Spin />Sending OTP...</> : 'Send OTP →'}
              </button>

              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:16, padding:'10px 12px', background:'rgba(255,107,0,0.06)', border:'1px solid rgba(255,107,0,0.15)', borderRadius:8 }}>
                <span>📧</span>
                <span style={{ color:theme.textMuted, fontSize:11, lineHeight:1.5 }}>We'll send a 6-digit code to your email. Check your inbox.</span>
              </div>
            </>
          ) : (
            <>
              {/* Dev OTP hint */}
              {devOtp && (
                <div style={{ background:theme.successBg, border:`1px solid ${theme.successBorder}`, borderRadius:10, padding:'10px 14px', marginBottom:16, textAlign:'center' }}>
                  <p style={{ color:theme.successText, fontSize:10, fontFamily:"'Space Mono',monospace", marginBottom:4 }}>DEV MODE — YOUR OTP</p>
                  <p style={{ color:theme.successText, fontFamily:"'Bebas Neue',sans-serif", fontSize:32, letterSpacing:8 }}>{devOtp}</p>
                </div>
              )}

              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(255,107,0,0.06)', border:'1px solid rgba(255,107,0,0.15)', borderRadius:10, marginBottom:20 }}>
                <span style={{ fontSize:18 }}>📧</span>
                <div>
                  <div style={{ color:theme.text, fontSize:12, fontWeight:600 }}>{email}</div>
                  <div style={{ color:theme.textMuted, fontSize:10, fontFamily:"'Space Mono',monospace" }}>Check your inbox for the OTP</div>
                </div>
              </div>

              {/* OTP boxes */}
              <div style={{ display:'flex', gap: isMobile?6:8, justifyContent:'center', marginBottom:20 }}>
                {otp.map((digit, idx) => (
                  <input key={idx} id={`otp-${idx}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    autoFocus={idx===0}
                    style={{ ...inp, width: isMobile?42:48, height: isMobile?48:54, textAlign:'center', fontSize:20, fontWeight:900, borderWidth: digit?2:1, borderColor: digit?'#FF6B00':theme.border }}
                  />
                ))}
              </div>

              <div style={{ textAlign:'center', marginBottom:20 }}>
                {timer > 0
                  ? <span style={{ color:theme.textMuted, fontSize:12, fontFamily:"'Space Mono',monospace" }}>Resend in <span style={{ color:'#FF6B00' }}>{timer}s</span></span>
                  : <button onClick={() => { setTimer(120); setOtp(['','','','','','']); handleSendOTP(); }} style={{ background:'none', border:'none', color:'#FF6B00', fontSize:12, cursor:'pointer', fontFamily:"'Space Mono',monospace" }}>Resend OTP →</button>
                }
              </div>

              {error && <div style={{ color:theme.errorText, fontSize:11, marginBottom:12, fontFamily:"'Space Mono',monospace" }}>⚠ {error}</div>}

              <button onClick={handleVerify} disabled={!otpReady||loading} style={{
                width:'100%', padding:'14px',
                background: otpReady ? 'linear-gradient(135deg,#FF6B00,#FF8C00)' : theme.bgAccent,
                border:'none', borderRadius:10,
                color: otpReady ? '#fff' : theme.textFaint,
                fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:2, textTransform:'uppercase',
                cursor: otpReady ? 'pointer' : 'not-allowed',
                boxShadow: otpReady ? '0 8px 24px rgba(255,107,0,0.3)' : 'none',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.2s',
              }}>
                {loading ? <><Spin />Verifying...</> : 'Verify & Login →'}
              </button>

              <button onClick={() => { setStep('email'); setOtp(['','','','','','']); setError(''); setDevOtp(''); }}
                style={{ width:'100%', marginTop:10, padding:'10px', background:'none', border:'none', color:theme.textMuted, fontSize:12, cursor:'pointer', fontFamily:"'Space Mono',monospace" }}>
                ← Change email
              </button>
            </>
          )}
        </div>
        <p style={{ textAlign:'center', color:theme.textFaint, fontSize:11, marginTop:16, lineHeight:1.6 }}>
          By continuing, you agree to Retail's <span style={{ color:'#FF6B00', cursor:'pointer' }}>Terms of Service</span> and <span style={{ color:'#FF6B00', cursor:'pointer' }}>Privacy Policy</span>
        </p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Spin() {
  return <div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />;
}