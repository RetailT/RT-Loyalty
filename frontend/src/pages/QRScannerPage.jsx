import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { mockCustomers } from '../utils/mockData';

const tierAccent = { Bronze: '#d97706', Silver: '#64748b', Gold: '#f59e0b', Platinum: '#8b5cf6' };

export default function QRScannerPage() {
  const { theme } = useTheme();
  const [scanning, setScanning] = useState(false);
  const [manualId, setManualId] = useState('');
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const lookup = async (code) => {
    setLoading(true); setError(''); setResult(null);
    await new Promise(r => setTimeout(r, 1500));
    const customer = mockCustomers.find(c => c.qrCode === code || c.membershipId === code);
    setLoading(false);
    if (customer) setResult(customer);
    else setError('No customer found with this QR code or membership ID.');
  };

  const handleScan = async (qrCode) => {
    setScanning(true);
    await new Promise(r => setTimeout(r, 800));
    setScanning(false);
    await lookup(qrCode);
  };

  const handleManual = async (e) => {
    e.preventDefault();
    if (manualId.trim()) await lookup(manualId.trim());
  };

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: '#FF6B00', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", marginBottom: 8 }}>⊞ Scanner</div>
        <h1 style={{ color: theme.text, fontSize: 36, fontWeight: 900, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2, margin: '0 0 4px 0' }}>QR CODE SCANNER</h1>
        <p style={{ color: theme.textMuted, margin: 0, fontSize: 13 }}>Scan customer QR codes to view loyalty details and points balance</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Viewport */}
        <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: theme.shadow, transition: 'background 0.3s' }}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.border}`, background: theme.bgSubtle }}>
            <div style={{ color: '#FF6B00', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", marginBottom: 2 }}>⊞ Camera</div>
            <div style={{ color: theme.text, fontWeight: 700, fontSize: 15 }}>QR Scanner Viewport</div>
          </div>
          <div style={{ padding: 24 }}>
            <div style={{
              width: '100%', aspectRatio: '1',
              background: theme.bgSubtle,
              border: `1px solid ${theme.border}`,
              borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden', marginBottom: 16,
            }}>
              {[
                { top: 14, left: 14,  borderTop: '3px solid #FF6B00', borderLeft:  '3px solid #FF6B00' },
                { top: 14, right: 14, borderTop: '3px solid #FF6B00', borderRight: '3px solid #FF6B00' },
                { bottom: 14, left: 14,  borderBottom: '3px solid #FF6B00', borderLeft:  '3px solid #FF6B00' },
                { bottom: 14, right: 14, borderBottom: '3px solid #FF6B00', borderRight: '3px solid #FF6B00' },
              ].map((s, i) => <div key={i} style={{ position: 'absolute', width: 24, height: 24, borderRadius: 2, ...s }} />)}

              {scanning && (
                <div style={{ position: 'absolute', left: 14, right: 14, height: 2, background: 'linear-gradient(90deg, transparent, #FF6B00, transparent)', animation: 'scan 1.5s ease-in-out infinite', boxShadow: '0 0 10px rgba(255,107,0,0.7)' }} />
              )}

              {loading ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#FF6B00', fontSize: 36, marginBottom: 10 }}>⟳</div>
                  <div style={{ color: theme.textMuted, fontSize: 13, fontFamily: "'Space Mono', monospace" }}>Looking up customer...</div>
                </div>
              ) : result ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <div style={{ fontSize: 48, color: theme.successText, marginBottom: 8 }}>✓</div>
                  <div style={{ color: theme.successText, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Customer Found!</div>
                  <div style={{ color: theme.textMuted, fontSize: 12 }}>{result.name}</div>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.15 }}>⊞</div>
                  <div style={{ color: theme.textFaint, fontSize: 12, fontFamily: "'Space Mono', monospace" }}>
                    {scanning ? 'SCANNING...' : 'AWAITING QR CODE'}
                  </div>
                </div>
              )}
            </div>

            <div style={{ background: theme.bgSubtle, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, background: scanning ? '#FF6B00' : result ? theme.liveDot : theme.borderHover, borderRadius: '50%', boxShadow: scanning ? '0 0 8px rgba(255,107,0,0.5)' : result ? `0 0 8px ${theme.liveDot}66` : 'none' }} />
              <span style={{ color: theme.textMuted, fontSize: 11, fontFamily: "'Space Mono', monospace" }}>
                {scanning ? 'SCANNING IN PROGRESS' : result ? 'SCAN COMPLETE' : 'CAMERA READY'}
              </span>
            </div>
          </div>
        </div>

        {/* Manual */}
        <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: theme.shadow, transition: 'background 0.3s' }}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.border}`, background: theme.bgSubtle }}>
            <div style={{ color: '#FF6B00', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", marginBottom: 2 }}>◈ Manual</div>
            <div style={{ color: theme.text, fontWeight: 700, fontSize: 15 }}>Lookup by ID</div>
          </div>
          <div style={{ padding: 24 }}>
            <form onSubmit={handleManual}>
              <label style={{ display: 'block', color: theme.textMuted, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", marginBottom: 8 }}>Membership ID</label>
              <input
                type="text" value={manualId} onChange={e => setManualId(e.target.value)}
                placeholder="LYL-2024-001"
                style={{ width: '100%', padding: '12px 16px', marginBottom: 12, background: theme.bgInput, border: `1px solid ${theme.inputBorder}`, borderRadius: 10, color: theme.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: "'Space Mono', monospace", transition: 'background 0.3s, border-color 0.2s' }}
                onFocus={e => (e.target.style.borderColor = '#FF6B00')}
                onBlur={e  => (e.target.style.borderColor = theme.inputBorder)}
              />
              <button type="submit" disabled={loading || !manualId.trim()} style={{
                width: '100%', padding: 12,
                background: 'linear-gradient(135deg, #FF6B00, #FF8C00)',
                border: 'none', borderRadius: 10, color: '#fff', fontSize: 12, fontWeight: 800,
                cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase',
                fontFamily: "'Space Mono', monospace",
                opacity: loading || !manualId.trim() ? 0.5 : 1,
                boxShadow: '0 4px 16px rgba(255,107,0,0.3)',
              }}>→ LOOKUP</button>
            </form>

            {error && <div style={{ marginTop: 12, background: theme.errorBg, border: `1px solid ${theme.errorBorder}`, borderRadius: 8, padding: '10px 14px', color: theme.errorText, fontSize: 12 }}>{error}</div>}

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
              <div style={{ flex: 1, height: 1, background: theme.border }} />
              <span style={{ color: theme.textFaint, fontSize: 11, fontFamily: "'Space Mono', monospace" }}>DEMO SCAN</span>
              <div style={{ flex: 1, height: 1, background: theme.border }} />
            </div>

            <div style={{ fontSize: 11, color: theme.textMuted, fontFamily: "'Space Mono', monospace", marginBottom: 10 }}>Select a customer to simulate QR scan:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {mockCustomers.map(c => (
                <button key={c.id} onClick={() => handleScan(c.qrCode)} disabled={loading} style={{
                  background: theme.bgSubtle, border: `1px solid ${theme.border}`, borderRadius: 8,
                  padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', transition: 'all 0.2s', width: '100%', opacity: loading ? 0.5 : 1,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,107,0,0.4)'; e.currentTarget.style.background = 'rgba(255,107,0,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.background = theme.bgSubtle; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #FF6B00, #FF8C00)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ color: theme.text, fontSize: 12, textAlign: 'left' }}>{c.name}</div>
                      <div style={{ color: theme.textMuted, fontSize: 10, textAlign: 'left', fontFamily: "'Space Mono', monospace" }}>{c.membershipId}</div>
                    </div>
                  </div>
                  <div style={{ color: tierAccent[c.membershipTier], fontSize: 9, fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}>★ {c.membershipTier}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {result && !loading && (
        <div style={{ background: theme.bgCard, border: `1px solid ${theme.successBorder}`, borderRadius: 20, padding: 24, boxShadow: `0 0 30px ${theme.successText}10`, transition: 'background 0.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ background: theme.successBg, border: `1px solid ${theme.successBorder}`, borderRadius: 8, padding: '6px 14px', color: theme.successText, fontSize: 11, fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}>
                ✓ SCAN SUCCESSFUL
              </div>
              <span style={{ color: theme.text, fontSize: 18, fontWeight: 700 }}>{result.name}</span>
            </div>
            <button onClick={() => setResult(null)} style={{ background: theme.bgAccent, border: `1px solid ${theme.border}`, color: theme.textMuted, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>Clear</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[
              { label: 'Membership ID',    value: result.membershipId,                     color: '#FF6B00' },
              { label: 'Available Points', value: result.availablePoints.toLocaleString(), color: '#f59e0b' },
              { label: 'Total Earned',     value: result.totalPoints.toLocaleString(),     color: theme.successText },
              { label: 'Member Tier',      value: `★ ${result.membershipTier}`,            color: tierAccent[result.membershipTier] },
            ].map(item => (
              <div key={item.label} style={{ background: theme.bgSubtle, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14 }}>
                <div style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, fontFamily: "'Space Mono', monospace" }}>{item.label}</div>
                <div style={{ color: item.color, fontSize: 18, fontWeight: 800, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1 }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[
              { label: 'Email',       value: result.email },
              { label: 'Phone',       value: result.phone },
              { label: 'Last Active', value: new Date(result.lastActivity).toLocaleDateString() },
            ].map(item => (
              <div key={item.label} style={{ background: theme.bgSubtle, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '12px 14px' }}>
                <span style={{ color: theme.textMuted, fontSize: 10, textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}>{item.label}: </span>
                <span style={{ color: theme.textSub, fontSize: 12 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0%   { top: 14px; }
          50%  { top: calc(100% - 16px); }
          100% { top: 14px; }
        }
      `}</style>
    </div>
  );
}