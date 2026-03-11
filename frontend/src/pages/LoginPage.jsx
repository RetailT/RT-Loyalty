import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme, useCardHover } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';
import { sendOTP, verifyOTP } from '../api';

export default function LoginPage({ onNavigate }) {
  const { login }        = useAuth();
  const { theme, mode }  = useTheme();
  const { isMobile }     = useResponsive();
  const { cardProps }    = useCardHover({ borderRadius: 20, padding: isMobile ? '28px 20px' : '36px 32px' });

  const [step, setStep]       = useState('phone');
  const [phone, setPhone]     = useState('');
  const [otp, setOtp]         = useState(['','','','','','']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer]     = useState(0);
  const [error, setError]     = useState('');
  const [devOtp, setDevOtp]   = useState('');
  const [hasEmail, setHasEmail] = useState(true);

  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer]);

  const isValidPhone = (v) => /^[0-9]{9,12}$/.test(v.replace(/[\s\-()/]/g, ''));

  const handleSendOTP = async () => {
    if (!isValidPhone(phone)) { setError('Please enter a valid mobile number'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await sendOTP(null, phone.trim());
      if (res.dev_otp) setDevOtp(res.dev_otp);
      setHasEmail(res.hasEmail);
      setStep('otp');
      setTimer(120);
    } catch (e) {
      setError(e.message || 'No loyalty account found for this number.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0)
      document.getElementById(`otp-${idx - 1}`)?.focus();
    if (e.key === 'Enter') handleVerify();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Enter the 6-digit OTP'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await verifyOTP(null, phone.trim(), code);
      login(res.customer, res.token);
      onNavigate('dashboard');
    } catch (e) {
      setError(e.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    background: mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
    border: `1px solid ${theme.border}`,
    borderRadius: 10, color: theme.text,
    fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 0.2s',
  };

  const phoneReady = isValidPhone(phone);
  const otpReady   = otp.join('').length === 6;

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: isMobile ? '24px 16px' : '48px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* ── Card with hover effect ── */}
        <div {...cardProps} style={{
          ...cardProps.style,
          cursor: 'default', // login card click cursor default
        }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 56, height: 56, margin: '0 auto 14px',
              background: 'linear-gradient(135deg,#FF6B00,#FF8C00)',
              borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 900, color: '#fff',
              boxShadow: '0 8px 24px rgba(255,107,0,0.4)',
              fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1,
            }}>RT</div>
            <h1 style={{ color: theme.text, fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, letterSpacing: 2, marginBottom: 4 }}>
              {step === 'phone' ? 'WELCOME BACK' : 'VERIFY OTP'}
            </h1>
            <p style={{ color: theme.textMuted, fontSize: 12, fontFamily: "'Space Mono',monospace" }}>
              {step === 'phone'
                ? 'Enter your mobile number to continue'
                : `OTP sent to ${phone}`}
            </p>
          </div>

          {/* ── PHONE STEP ── */}
          {step === 'phone' && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', color: theme.textMuted, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'Space Mono',monospace", marginBottom: 8 }}>
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                  placeholder="07X XXX XXXX"
                  autoFocus
                  style={{ ...inp, width: '100%', padding: '12px 14px', fontSize: 15, boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#FF6B00'}
                  onBlur={e  => e.target.style.borderColor = theme.border}
                />
              </div>

              {error && (
                <div style={{ color: theme.errorText, fontSize: 11, marginBottom: 12, fontFamily: "'Space Mono',monospace" }}>
                  ⚠ {error}
                </div>
              )}

              <button
                onClick={handleSendOTP}
                disabled={!phoneReady || loading}
                style={{
                  width: '100%', padding: '14px',
                  background: phoneReady ? 'linear-gradient(135deg,#FF6B00,#FF8C00)' : theme.bgAccent,
                  border: 'none', borderRadius: 10,
                  color: phoneReady ? '#fff' : theme.textFaint,
                  fontFamily: "'Space Mono',monospace", fontSize: 11,
                  letterSpacing: 2, textTransform: 'uppercase',
                  cursor: phoneReady ? 'pointer' : 'not-allowed',
                  boxShadow: phoneReady ? '0 8px 24px rgba(255,107,0,0.3)' : 'none',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {loading ? <><Spin /> Sending OTP...</> : 'Send OTP →'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, padding: '10px 12px', background: 'rgba(255,107,0,0.06)', border: '1px solid rgba(255,107,0,0.15)', borderRadius: 8 }}>
                <span>📱</span>
                <span style={{ color: theme.textMuted, fontSize: 11, lineHeight: 1.5 }}>
                  We'll send a 6-digit OTP code to verify your identity.
                </span>
              </div>
            </>
          )}

          {/* ── OTP STEP ── */}
          {step === 'otp' && (
            <>
              {devOtp && (
                <div style={{ background: 'rgba(0,200,100,0.08)', border: '1px solid rgba(0,200,100,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, textAlign: 'center' }}>
                  <p style={{ color: '#00c864', fontSize: 10, fontFamily: "'Space Mono',monospace", marginBottom: 4 }}>DEV MODE — YOUR OTP</p>
                  <p style={{ color: '#00c864', fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, letterSpacing: 8 }}>{devOtp}</p>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(255,107,0,0.06)', border: '1px solid rgba(255,107,0,0.15)', borderRadius: 10, marginBottom: 20 }}>
                <span style={{ fontSize: 18 }}>📱</span>
                <div>
                  <div style={{ color: theme.text, fontSize: 12, fontWeight: 600 }}>{phone}</div>
                  <div style={{ color: theme.textMuted, fontSize: 10, fontFamily: "'Space Mono',monospace" }}>
                    {hasEmail ? 'Check your email for the OTP' : 'OTP generated (no email on file)'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: isMobile ? 6 : 8, justifyContent: 'center', marginBottom: 20 }}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx} id={`otp-${idx}`}
                    type="text" inputMode="numeric"
                    maxLength={1} value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    autoFocus={idx === 0}
                    style={{
                      ...inp,
                      width: isMobile ? 42 : 48, height: isMobile ? 48 : 54,
                      textAlign: 'center', fontSize: 20, fontWeight: 900,
                      borderWidth: digit ? 2 : 1,
                      borderColor: digit ? '#FF6B00' : theme.border,
                    }}
                  />
                ))}
              </div>

              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                {timer > 0 ? (
                  <span style={{ color: theme.textMuted, fontSize: 12, fontFamily: "'Space Mono',monospace" }}>
                    Resend in <span style={{ color: '#FF6B00' }}>{timer}s</span>
                  </span>
                ) : (
                  <button
                    onClick={() => { setTimer(120); setOtp(['','','','','','']); handleSendOTP(); }}
                    style={{ background: 'none', border: 'none', color: '#FF6B00', fontSize: 12, cursor: 'pointer', fontFamily: "'Space Mono',monospace" }}
                  >
                    Resend OTP →
                  </button>
                )}
              </div>

              {error && (
                <div style={{ color: theme.errorText, fontSize: 11, marginBottom: 12, fontFamily: "'Space Mono',monospace" }}>
                  ⚠ {error}
                </div>
              )}

              <button
                onClick={handleVerify}
                disabled={!otpReady || loading}
                style={{
                  width: '100%', padding: '14px',
                  background: otpReady ? 'linear-gradient(135deg,#FF6B00,#FF8C00)' : theme.bgAccent,
                  border: 'none', borderRadius: 10,
                  color: otpReady ? '#fff' : theme.textFaint,
                  fontFamily: "'Space Mono',monospace", fontSize: 11,
                  letterSpacing: 2, textTransform: 'uppercase',
                  cursor: otpReady ? 'pointer' : 'not-allowed',
                  boxShadow: otpReady ? '0 8px 24px rgba(255,107,0,0.3)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s',
                }}
              >
                {loading ? <><Spin /> Verifying...</> : 'Verify & Login →'}
              </button>

              <button
                onClick={() => { setStep('phone'); setOtp(['','','','','','']); setError(''); setDevOtp(''); }}
                style={{ width: '100%', marginTop: 10, padding: '10px', background: 'none', border: 'none', color: theme.textMuted, fontSize: 12, cursor: 'pointer', fontFamily: "'Space Mono',monospace" }}
              >
                ← Change number
              </button>
            </>
          )}

        </div>

        <p style={{ textAlign: 'center', color: theme.textFaint, fontSize: 11, marginTop: 16, lineHeight: 1.6 }}>
          By continuing, you agree to RetailCo's{' '}
          <span style={{ color: '#FF6B00', cursor: 'pointer' }}>Terms of Service</span> and{' '}
          <span style={{ color: '#FF6B00', cursor: 'pointer' }}>Privacy Policy</span>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Spin() {
  return <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />;
}