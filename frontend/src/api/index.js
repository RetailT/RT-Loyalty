// src/api/index.js — POSBACK based portal API
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const authHeader = token => ({ 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` });

// ── Auth ──────────────────────────────────────────────────────────────────────
export const sendOTP = async (email, phone) => {
  const res  = await fetch(`${API}/api/portal/auth/send-otp`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ phone }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const verifyOTP = async (email, phone, otp) => {
  const res  = await fetch(`${API}/api/portal/auth/verify-otp`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ phone, otp }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

// ── Customer ──────────────────────────────────────────────────────────────────
export const getMe = async (token) => {
  const res  = await fetch(`${API}/api/portal/me`, { headers: authHeader(token) });
  return res.json();
};

export const updateMe = async (token, body) => {
  const res  = await fetch(`${API}/api/portal/me`, {
    method:'PUT', headers: authHeader(token), body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

// ── Transactions ──────────────────────────────────────────────────────────────
export const getMyTransactions = async (token, params = {}) => {
  const qs  = new URLSearchParams(params).toString();
  const res = await fetch(`${API}/api/portal/transactions${qs?'?'+qs:''}`, { headers: authHeader(token) });
  return res.json();
};

// ── Rewards ───────────────────────────────────────────────────────────────────
export const getRewards = async (token) => {
  const res = await fetch(`${API}/api/portal/rewards`, { headers: authHeader(token) });
  return res.json();
};

export const redeemReward = async (token, rewardId) => {
  const res  = await fetch(`${API}/api/portal/redeem`, {
    method:'POST', headers: authHeader(token), body: JSON.stringify({ reward_id: rewardId }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const getMyRedemptions = async (token) => {
  const res = await fetch(`${API}/api/portal/redemptions`, { headers: authHeader(token) });
  return res.json();
};