import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('loyalty_token'));

  useEffect(() => {
    if (token && !user) {
      // In production: fetch /api/customer/me with token
      setUser(MOCK_USER);
    }
  }, [token]);

  const login = (userData, jwt) => {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem('loyalty_token', jwt);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('loyalty_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Mock user — replace with API call
const MOCK_USER = {
  name:                 'Kavinda Perera',
  mobile_number:        '0712345678',
  email:                'kavinda@gmail.com',
  date_of_birth:        '1992-05-15',
  join_date:            '2023-01-10',
  current_points:       3450,
  lifetime_points:      12800,
  tier_level:           'Silver',
  tier_expiry:          '2025-12-31',
  status:               'active',
  last_transaction_date:'2024-12-18',
};
