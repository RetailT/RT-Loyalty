const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Take Subdomain slug — backend X-Shop-Slug header dev mode support — and fetch company info
function getSlug() {
  const host  = window.location.hostname;
  const parts = host.split('.');
  if (host === 'localhost' || host === '127.0.0.1' || parts.length < 2) {
    return new URLSearchParams(window.location.search).get('shop') || 'keells-nugegoda';
  }
  
  // Vercel preview URLs ignore
  if (host.includes('vercel.app')) {
    return new URLSearchParams(window.location.search).get('shop') || 'keells-nugegoda';
  }
  
  return parts[0];
}

function baseHeaders(token) {
  const h = { 'Content-Type': 'application/json', 'X-Shop-Slug': getSlug() };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

// ── Auth ──────────────────────────────────────────────────
export const sendOTP = async (_email, phone) => {
  const res  = await fetch(`${API}/api/portal/auth/send-otp`, {
    method: 'POST', headers: baseHeaders(),
    body: JSON.stringify({ phone }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const verifyOTP = async (_email, phone, otp) => {
  const res  = await fetch(`${API}/api/portal/auth/verify-otp`, {
    method: 'POST', headers: baseHeaders(),
    body: JSON.stringify({ phone, otp }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

// ── Customer ──────────────────────────────────────────────
export const getMe = async (token) => {
  const res = await fetch(`${API}/api/portal/me`, { headers: baseHeaders(token) });
  return res.json();
};

export const updateMe = async (token, body) => {
  const res  = await fetch(`${API}/api/portal/me`, {
    method: 'PUT', headers: baseHeaders(token), body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

// ── Transactions ──────────────────────────────────────────
export const getMyTransactions = async (token, params = {}) => {
  const qs  = new URLSearchParams(params).toString();
  const res = await fetch(`${API}/api/portal/transactions${qs ? '?' + qs : ''}`, { headers: baseHeaders(token) });
  return res.json();
};

// ── Rewards ───────────────────────────────────────────────
export const getRewards = async (token) => {
  const res = await fetch(`${API}/api/portal/rewards`, { headers: baseHeaders(token) });
  return res.json();
};

export const redeemReward = async (token, rewardId) => {
  const res  = await fetch(`${API}/api/portal/redeem`, {
    method: 'POST', headers: baseHeaders(token), body: JSON.stringify({ reward_id: rewardId }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const getMyRedemptions = async (token) => {
  const res = await fetch(`${API}/api/portal/redemptions`, { headers: baseHeaders(token) });
  return res.json();
};

// ── Promotions ────────────────────────────────────────────
export const getPromotions = async (token) => {
  const res = await fetch(`${API}/api/portal/promotions`, { headers: baseHeaders(token) });
  return res.json();
};