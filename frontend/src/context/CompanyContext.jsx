import React, { createContext, useContext, useState, useEffect } from 'react';

const CompanyContext = createContext();
const API = process.env.REACT_APP_API_URL || 'http://localhost:10000';
const MAIN_DOMAINS = ['rtpos.web.lk', 'www.rtpos.web.lk'];

const DEFAULTS = {
  primaryColor:   '#e53e3e',
  secondaryColor: '#2d3748',
  logoUrl:        null,
};

function getSlug() {
  const host = window.location.hostname.replace(/^www\./, '').toLowerCase().trim();
  const DEFAULT_SLUG = 'retailtarget';

  if (host === 'localhost' || host === '127.0.0.1' || host.includes('vercel.app')) {
    return new URLSearchParams(window.location.search).get('shop') || DEFAULT_SLUG;
  }

  // Main domain — null return, header not sent, backend detect
  if (MAIN_DOMAINS.includes(host)) return null;

  return host;
}

function darkenColor(hex, amount = 30) {
  const clean = hex.replace('#', '');
  const num   = parseInt(clean, 16);
  const r     = Math.max(0, (num >> 16) - amount);
  const g     = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b     = Math.max(0, (num & 0xff) - amount);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function applyColors(company) {
  const root    = document.documentElement;
  const primary = company.primaryColor || DEFAULTS.primaryColor;
  root.style.setProperty('--primary',      primary);
  root.style.setProperty('--primary-dark', darkenColor(primary, 30));
  root.style.setProperty('--secondary',    company.secondaryColor || DEFAULTS.secondaryColor);
}

export function CompanyProvider({ children }) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const slug = getSlug();
  const cacheKey = `company_colors_${slug || 'main'}`;

  useEffect(() => {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try { applyColors(JSON.parse(cached)); } catch {}
    }
  }, [cacheKey]);

  useEffect(() => {
    // if slug null header not sent — backend domain detect 
    const headers = { 'Content-Type': 'application/json' };
    if (slug) headers['X-Shop-Slug'] = slug;

    fetch(`${API}/api/portal/company`, { headers })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setCompany(d.company);
          applyColors(d.company);
          localStorage.setItem(cacheKey, JSON.stringify(d.company));
        } else {
          setError(d.message || 'Shop not found');
          applyColors(DEFAULTS);
        }
      })
      .catch(e => {
        setError(e.message);
        applyColors(DEFAULTS);
      })
      .finally(() => setLoading(false));
  }, [slug, cacheKey]);

  return (
    <CompanyContext.Provider value={{ company, loading, error, slug }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => useContext(CompanyContext);