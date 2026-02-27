import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';
import { MOCK_USER } from '../utils/mockData';

export default function LoginPage({ onNavigate }) {
  const { login }        = useAuth();
  const { theme, mode }  = useTheme();
  const { isMobile }     = useResponsive();

  const [step, setStep]       = useState('phone');
  const [phone, setPhone]     = useState('');
  const [otp, setOtp]         = useState(['','','','','','']);
  const [isNew, setIsNew]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer]     = useState(0);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer]);

  const handleSendOTP = () => {
    if (phone.length < 9) { setError('Please enter a valid mobile number'); return; }
    setError('');
    setLoading(true);
    // POST /api/auth/send-otp  { mobile_number: `+94${phone}` }
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
      setTimer(120);
    }, 1200);
  };

  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx+1}`)?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0)
      document.getElementById(`otp-${idx-1}`)?.focus();
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Enter the 6-digit OTP'); return; }
    setError('');
    setLoading(true);
    // POST /api/auth/verify-otp  { mobile_number, otp: code }
    setTimeout(() => {
      setLoading(false);
      login(MOCK_USER, 'mock_jwt_token');
      onNavigate('dashboard');
    }, 1000);
  };

  const inputStyle = {
    background: mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
    border: `1px solid ${theme.border}`,
    borderRadius: 10, color: theme.text,
    fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: isMobile ? '24px 16px' : '48px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Card */}
        <div style={{
          background: theme.bgCard, border: `1px solid ${theme.border}`,
          borderRadius: 20, padding: isMobile ? '28px 20px' : '36px 32px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
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
            }}>R</div>
            <h1 style={{ color: theme.text, fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, letterSpacing: 2, marginBottom: 4 }}>
              {step === 'phone' ? 'WELCOME BACK' : 'VERIFY OTP'}
            </h1>
            <p style={{ color: theme.textMuted, fontSize: 12, fontFamily: "'Space Mono',monospace" }}>
              {step === 'phone' ? 'Enter your mobile number to continue' : `OTP sent to 0${phone}`}
            </p>
          </div>

          {step === 'phone' ? (
            <>
              {/* Phone */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', color: theme.textMuted, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'Space Mono',monospace", marginBottom: 8 }}>
                  Mobile Number
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ ...inputStyle, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, fontSize: 13, color: theme.textSub }}>
                    🇱🇰 +94
                  </div>
                  <input
                    type="tel" inputMode="numeric"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,9))}
                    placeholder="7X XXX XXXX"
                    style={{ ...inputStyle, flex: 1, padding: '12px 14px', fontSize: 15 }}
                    onFocus={e => e.target.style.borderColor = '#FF6B00'}
                    onBlur={e  => e.target.style.borderColor = theme.border}
                  />
                </div>
              </div>

              {/* New user toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
                <input
                  type="checkbox" checked={isNew}
                  onChange={e => setIsNew(e.target.checked)}
                  style={{ accentColor: '#FF6B00', width: 15, height: 15 }}
                />
                <span style={{ color: theme.textMuted, fontSize: 12 }}>I'm new — create an account for me</span>
              </label>

              {error && <div style={{ color: theme.errorText, fontSize: 11, marginBottom: 12, fontFamily: "'Space Mono',monospace" }}>{error}</div>}

              <button
                onClick={handleSendOTP}
                disabled={phone.length < 9 || loading}
                style={{
                  width: '100%', padding: '14px',
                  background: phone.length >= 9 ? 'linear-gradient(135deg,#FF6B00,#FF8C00)' : theme.bgAccent,
                  border: 'none', borderRadius: 10,
                  color: phone.length >= 9 ? '#fff' : theme.textFaint,
                  fontFamily: "'Space Mono',monospace", fontSize: 11,
                  letterSpacing: 2, textTransform: 'uppercase',
                  cursor: phone.length >= 9 ? 'pointer' : 'not-allowed',
                  boxShadow: phone.length >= 9 ? '0 8px 24px rgba(255,107,0,0.3)' : 'none',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {loading ? (
                  <>
                    <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Sending OTP...
                  </>
                ) : (
                  isNew ? 'Join Now & Send OTP →' : 'Send OTP →'
                )}
              </button>
            </>
          ) : (
            <>
              {/* OTP inputs */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text" inputMode="numeric"
                    maxLength={1} value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    style={{
                      ...inputStyle,
                      width: isMobile ? 42 : 48, height: isMobile ? 48 : 54,
                      textAlign: 'center', fontSize: 20, fontWeight: 900,
                      borderWidth: digit ? 2 : 1,
                      borderColor: digit ? '#FF6B00' : theme.border,
                    }}
                  />
                ))}
              </div>

              {/* Resend */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                {timer > 0 ? (
                  <span style={{ color: theme.textMuted, fontSize: 12, fontFamily: "'Space Mono',monospace" }}>
                    Resend in <span style={{ color: '#FF6B00' }}>{timer}s</span>
                  </span>
                ) : (
                  <button
                    onClick={() => { setTimer(60); setOtp(['','','','','','']); }}
                    style={{ background: 'none', border: 'none', color: '#FF6B00', fontSize: 12, cursor: 'pointer', fontFamily: "'Space Mono',monospace" }}
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              {error && <div style={{ color: theme.errorText, fontSize: 11, marginBottom: 12, fontFamily: "'Space Mono',monospace" }}>{error}</div>}

              <button
                onClick={handleVerify}
                disabled={otp.join('').length < 6 || loading}
                style={{
                  width: '100%', padding: '14px',
                  background: otp.join('').length === 6 ? 'linear-gradient(135deg,#FF6B00,#FF8C00)' : theme.bgAccent,
                  border: 'none', borderRadius: 10,
                  color: otp.join('').length === 6 ? '#fff' : theme.textFaint,
                  fontFamily: "'Space Mono',monospace", fontSize: 11,
                  letterSpacing: 2, textTransform: 'uppercase',
                  cursor: otp.join('').length === 6 ? 'pointer' : 'not-allowed',
                  boxShadow: otp.join('').length === 6 ? '0 8px 24px rgba(255,107,0,0.3)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s',
                }}
              >
                {loading ? (
                  <>
                    <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Verifying...
                  </>
                ) : 'Verify & Login →'}
              </button>

              <button
                onClick={() => { setStep('phone'); setOtp(['','','','','','']); setError(''); }}
                style={{ width: '100%', marginTop: 10, padding: '10px', background: 'none', border: 'none', color: theme.textMuted, fontSize: 12, cursor: 'pointer', fontFamily: "'Space Mono',monospace" }}
              >
                ← Change number
              </button>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', color: theme.textFaint, fontSize: 11, marginTop: 16, lineHeight: 1.6 }}>
          By continuing, you agree to Retail's{' '}
          <span style={{ color: '#FF6B00', cursor: 'pointer' }}>Terms of Service</span> and{' '}
          <span style={{ color: '#FF6B00', cursor: 'pointer' }}>Privacy Policy</span>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
