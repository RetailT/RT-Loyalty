// src/api/index.js
const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const h = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const sendOTP    = (email)        => fetch(`${BASE}/api/portal/auth/send-otp`,   { method:'POST', headers:h(), body:JSON.stringify({ email }) }).then(handle);
export const verifyOTP  = (email, otp)   => fetch(`${BASE}/api/portal/auth/verify-otp`, { method:'POST', headers:h(), body:JSON.stringify({ email, otp }) }).then(handle);
export const getMe      = (token)        => fetch(`${BASE}/api/portal/me`,               { headers:h(token) }).then(handle);
export const updateMe   = (token, data)  => fetch(`${BASE}/api/portal/me`,               { method:'PUT', headers:h(token), body:JSON.stringify(data) }).then(handle);
export const getRewards = (token)        => fetch(`${BASE}/api/portal/rewards`,          { headers:h(token) }).then(handle);
export const getMyRedemptions = (token)  => fetch(`${BASE}/api/portal/redemptions`,      { headers:h(token) }).then(handle);
export const redeemReward = (token, rid) => fetch(`${BASE}/api/portal/redeem`,           { method:'POST', headers:h(token), body:JSON.stringify({ reward_id: rid }) }).then(handle);
export const getMyTransactions = (token, params={}) => {
  const q = new URLSearchParams(params).toString();
  return fetch(`${BASE}/api/portal/transactions${q?'?'+q:''}`, { headers:h(token) }).then(handle);
};