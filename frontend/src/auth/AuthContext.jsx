import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setSessionExpiredHandler } from '../api.js';
import { useToast } from '../components/Toaster.jsx';

const AuthContext = createContext(null);

// The logged-in user is the only piece of state the whole app shares. The
// token and user live in localStorage so a refresh keeps you signed in.
function readStoredUser() {
  try {
    if (!localStorage.getItem('token')) return null;
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const navigate = useNavigate();
  const toast = useToast();

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  async function login(email, password) {
    const out = await api('POST', '/auth/login', { email, password });
    localStorage.setItem('token', out.token);
    localStorage.setItem('user', JSON.stringify(out.user));
    setUser(out.user);
    return out.user;
  }

  // Register returns only a message, so sign in straight afterwards with the
  // same details. That saves the user typing them twice.
  async function register(details) {
    await api('POST', '/auth/register', details);
    return login(details.email, details.password);
  }

  useEffect(() => {
    setSessionExpiredHandler(() => {
      logout();
      toast('Your session has expired. Please log in again.', 'error');
      navigate('/login');
    });
  }, [logout, navigate, toast]);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
