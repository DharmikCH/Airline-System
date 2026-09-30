import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { safeNext } from '../auth/RequireAuth.jsx';
import { Logo } from '../components/Layout.jsx';
import { useToast } from '../components/Toaster.jsx';
import './pages.css';

// The accounts seed.js creates, so a demo never starts with typing.
const DEMO_ACCOUNTS = [
  ['Asha (passenger)', 'asha@example.com', 'Test@123'],
  ['Ravi (passenger)', 'ravi@example.com', 'Test@123'],
  ['Admin', 'admin@airbook.com', 'Admin@123']
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to={next} replace />;
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const signedIn = await login(email.trim(), password);
      toast('Welcome back, ' + signedIn.name + '.', 'success');
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="container auth">
      <div className="auth__card card">
        <Logo />
        <h1>Log in</h1>
        <p className="text-2">
          {next !== '/' ? 'Log in to continue where you left off.' : 'Welcome back. Manage your trips and book faster.'}
        </p>

        {error && <div className="banner banner--error" role="alert">{error}</div>}

        <form className="stack" onSubmit={submit}>
          <label className="field">
            <span>Email</span>
            <input className="input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="field">
            <span>Password</span>
            <input className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button className="btn btn--primary btn--lg btn--block" disabled={busy}>
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="auth__switch text-2">
          New to Airbook?{' '}
          <Link to={'/register' + (next !== '/' ? '?next=' + encodeURIComponent(next) : '')}>Create an account</Link>
        </p>

        <details className="demo">
          <summary>Use a demo account</summary>
          <div className="demo__list">
            {DEMO_ACCOUNTS.map(([label, demoEmail, demoPassword]) => (
              <button
                key={demoEmail}
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setEmail(demoEmail);
                  setPassword(demoPassword);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
