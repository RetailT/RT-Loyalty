import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getMe } from '../api';

const AuthContext = createContext();
const INACTIVITY_LIMIT = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem('loyalty_token'));
  const [loading, setLoading] = useState(!!localStorage.getItem('loyalty_token'));
  const [sessionExpired, setSessionExpired] = useState(false);
  const inactivityTimer = useRef(null);

  const logout = useCallback((expired = false) => {
    const reason = expired ? 'Session expired (30min inactivity)' : 'User logged out';
    console.log(`🔴 ${reason} — ${new Date().toLocaleTimeString()}`);
    const tk = localStorage.getItem('loyalty_token');
    if (tk) {
      try {
        const payload = JSON.parse(atob(tk.split('.')[1]));
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:10000'}/api/portal/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name:        payload.name,
            phone:       payload.phone,
            companyCode: payload.companyCode,
            companyName: payload.companyName,
            reason,
          }),
        }).catch(() => {});
      } catch {}
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('loyalty_token');
    localStorage.removeItem('loyalty_last_active');
    if (expired) setSessionExpired(true);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
  }, []);

  const resetTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    localStorage.setItem('loyalty_last_active', Date.now().toString());
    inactivityTimer.current = setTimeout(() => logout(true), INACTIVITY_LIMIT);
  }, [logout]);

  useEffect(() => {
    if (!token) return;
    const events = ['mousemove','mousedown','keydown','touchstart','scroll','click'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    const lastActive = parseInt(localStorage.getItem('loyalty_last_active') || '0');
    if (lastActive && Date.now() - lastActive > INACTIVITY_LIMIT) { logout(true); return; }
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [token, resetTimer, logout]);

  const fetchUser = useCallback(async (tk) => {
    try {
      const res = await getMe(tk);
      if (res.success) setUser(res.customer);
      else throw new Error('failed');
    } catch {
      localStorage.removeItem('loyalty_token');
      setToken(null); setUser(null);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (token) fetchUser(token);
    else setLoading(false);
  }, [token, fetchUser]);

  const login = (customerData, jwt) => {
    setUser(customerData);
    setToken(jwt);
    setSessionExpired(false);
    localStorage.setItem('loyalty_token', jwt);
    localStorage.setItem('loyalty_last_active', Date.now().toString());
  };

  const refreshUser = () => token && fetchUser(token);

  return (
    <AuthContext.Provider value={{ user, token, login, logout: () => logout(false), refreshUser, isLoggedIn: !!token && !!user, loading, sessionExpired, clearSessionExpired: () => setSessionExpired(false) }}>
      {children}
      {sessionExpired && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:'36px 32px', maxWidth:380, width:'100%', textAlign:'center', boxShadow:'0 24px 80px rgba(0,0,0,0.2)' }}>
            <div style={{ width:56, height:56, background:'linear-gradient(135deg, var(--primary), var(--primary-dark))', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, margin:'0 auto 16px' }}>⏱</div>
            <h2 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, letterSpacing:2, color:'#111', marginBottom:8 }}>SESSION EXPIRED</h2>
            <p style={{ color:'#666', fontSize:13, lineHeight:1.7, marginBottom:24 }}>Please log in again to continue.</p>
            <button
              autoFocus
              onClick={() => setSessionExpired(false)}
              style={{ width:'100%', padding:'13px', background:'linear-gradient(135deg, var(--primary), var(--primary-dark))', border:'none', borderRadius:10, color:'#fff', fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:2, textTransform:'uppercase', cursor:'pointer' }}
            >
              Log In Again →
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);