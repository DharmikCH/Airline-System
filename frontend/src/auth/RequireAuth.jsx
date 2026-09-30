import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

// Wraps a page that needs a signed-in user. Anyone else is sent to login with
// ?next= set, so they land back on this exact page afterwards.
//
// This is a convenience, not security: the backend checks the token and role
// on every request regardless of what the browser shows.
export default function RequireAuth({ children, admin = false }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={'/login?next=' + next} replace />;
  }

  if (admin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Only follow ?next= to a path inside this site. Without this check a link
// like /login?next=//evil.example would bounce users off-site after login.
export function safeNext(value) {
  if (value && value.startsWith('/') && !value.startsWith('//')) {
    return value;
  }
  return '/';
}
