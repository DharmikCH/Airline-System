import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api, setSessionExpiredHandler } from './api.js';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [expired, setExpired] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  // The token lasts 24 hours. When the backend rejects it, sign out and
  // remember why, so the login page can say so instead of looking random.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      logout();
      setExpired(true);
    });
  }, [logout]);

  async function login(email, password) {
    const data = await api('POST', '/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    setExpired(false);
    return data.user;
  }

  const value = { user, isAdmin: user?.role === 'admin', login, logout, expired };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

// Wrap a page that needs a login. Visitors who are not signed in go to
// /login and come back to the page they asked for afterwards.
export function RequireAuth({ admin = false, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (admin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}
