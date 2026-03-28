const API = process.env.REACT_APP_API_URL || 'http://localhost:10000';

const MAIN_DOMAINS = ['rtpos.web.lk', 'www.rtpos.web.lk'];

function getCleanHost() {
  return window.location.hostname.replace(/^www\./, '').toLowerCase().trim();
}

function getSlug() {
  const host = getCleanHost();
  const parts = host.split('.');
  const DEFAULT_SLUG = process.env.REACT_APP_DEFAULT_SHOP || 'retailtarget';

  if (host === 'localhost' || host === '127.0.0.1' || parts.length < 2) {
    return new URLSearchParams(window.location.search).get('shop') || DEFAULT_SLUG;
  }

  if (host.includes('vercel.app')) {
    return new URLSearchParams(window.location.search).get('shop') || DEFAULT_SLUG;
  }

  // Main domain — backend detect, slug is ignored
  if (MAIN_DOMAINS.includes(host)) return null;

  return host;
}

function baseHeaders(token) {
  const slug = getSlug();
  const h = { 'Content-Type': 'application/json' };
  if (slug) h['X-Shop-Slug'] = slug; // if null not header
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

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

export const getMyTransactions = async (token, params = {}) => {
  const qs  = new URLSearchParams(params).toString();
  const res = await fetch(`${API}/api/portal/transactions${qs ? '?' + qs : ''}`, { headers: baseHeaders(token) });
  return res.json();
};

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

export const getPromotions = async (token) => {
  const res = await fetch(`${API}/api/portal/promotions`, { headers: baseHeaders(token) });
  return res.json();
};