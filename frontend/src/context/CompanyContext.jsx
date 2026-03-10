// Subdomain shop identify company info provide
import React, { createContext, useContext, useState, useEffect } from 'react';

const CompanyContext = createContext();
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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

export function CompanyProvider({ children }) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const slug = getSlug();

  useEffect(() => {
    fetch(`${API}/api/portal/company?shop=${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setCompany(d.company);
        else setError(d.message || 'Shop not found');
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <CompanyContext.Provider value={{ company, loading, error, slug }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => useContext(CompanyContext);