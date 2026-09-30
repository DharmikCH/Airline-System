import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { safeNext } from '../auth/RequireAuth.jsx';
import { Logo } from '../components/Layout.jsx';
import { useToast } from '../components/Toaster.jsx';
import './pages.css';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to={next} replace />;
  }

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const details = { name: form.name.trim(), email: form.email.trim(), password: form.password };
      if (form.phone.trim()) details.phone = form.phone.trim();
      const signedIn = await register(details);
      toast('Account created. Welcome aboard, ' + signedIn.name + '.', 'success');
      navigate(next, { replace: true });
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <div className="container auth">
      <div className="auth__card card">
        <Logo />
        <h1>Create your account</h1>
        <p className="text-2">Book flights and keep every trip in one place.</p>

        {error && (
          <div className="banner banner--error" role="alert">
            <span>
              {error.message}
              {error.code === 'EMAIL_ALREADY_REGISTERED' && (
                <> <Link to={'/login?next=' + encodeURIComponent(next)}>Log in instead</Link></>
              )}
            </span>
          </div>
        )}

        <form className="stack" onSubmit={submit}>
          <label className="field">
            <span>Full name</span>
            <input className="input" autoComplete="name" required value={form.name} onChange={update('name')} />
          </label>
          <label className="field">
            <span>Email</span>
            <input className="input" type="email" autoComplete="email" required value={form.email} onChange={update('email')} />
          </label>
          <label className="field">
            <span>Phone <span className="muted">(optional)</span></span>
            <input className="input" type="tel" autoComplete="tel" value={form.phone} onChange={update('phone')} />
          </label>
          <label className="field">
            <span>Password</span>
            <input className="input" type="password" autoComplete="new-password" required value={form.password} onChange={update('password')} />
          </label>
          <button className="btn btn--primary btn--lg btn--block" disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth__switch text-2">
          Already have an account?{' '}
          <Link to={'/login' + (next !== '/' ? '?next=' + encodeURIComponent(next) : '')}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
