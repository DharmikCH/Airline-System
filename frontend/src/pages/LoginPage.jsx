import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';

export default function LoginPage() {
  const { user, login, expired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state && location.state.from) || null;
  const justRegistered = Boolean(location.state && location.state.registered);

  const [email, setEmail] = useState((location.state && location.state.email) || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to={from || (user.role === 'admin' ? '/admin/flights' : '/')} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const signedIn = await login(email.trim(), password);
      navigate(from || (signedIn.role === 'admin' ? '/admin/flights' : '/'), { replace: true });
    } catch (err) {
      setBusy(false);
      setError(err.code === 'INVALID_CREDENTIALS' ? 'That email and password do not match an account.' : err.message);
    }
  }

  return (
    <div className="auth">
      <div className="auth-sheet">
        <h1>Sign in</h1>

        {expired && !error && (
          <div className="notice notice-info" role="status">
            <p>Your session ended after 24 hours. Sign in again to carry on.</p>
          </div>
        )}
        {justRegistered && !error && (
          <div className="notice notice-info" role="status">
            <p>Account created. Sign in with your new password.</p>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="label" htmlFor="l-email">Email</label>
            <input id="l-email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(error)} />
          </div>
          <div className="field">
            <label className="label" htmlFor="l-pass">Password</label>
            <input id="l-pass" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? 'l-err' : undefined} />
          </div>
          {error && <p id="l-err" className="field-error" role="alert">{error}</p>}
          <button type="submit" className="btn btn-primary btn-large" disabled={busy} data-busy={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          No account yet? <Link to="/register" state={location.state}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
