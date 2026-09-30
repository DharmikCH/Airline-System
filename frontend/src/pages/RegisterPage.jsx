import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';

export default function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  function set(field, value) {
    setForm({ ...form, [field]: value });
    setErrors({ ...errors, [field]: undefined });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = 'Enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter an email address like name@example.com.';
    if (!form.password) next.password = 'Choose a password.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    setServerError(null);
    try {
      const body = { name: form.name.trim(), email: form.email.trim(), password: form.password };
      if (form.phone.trim()) body.phone = form.phone.trim();
      await api('POST', '/auth/register', body);
      // Registration does not sign you in, so hand over to the login page
      // with the email filled in and the original destination kept.
      navigate('/login', { replace: true, state: { ...location.state, registered: true, email: body.email } });
    } catch (err) {
      setBusy(false);
      if (err.code === 'EMAIL_ALREADY_REGISTERED') {
        setErrors({ email: 'That email already has an account. Sign in instead.' });
      } else {
        setServerError(err.message);
      }
    }
  }

  function fieldProps(field) {
    return {
      id: 'r-' + field,
      className: 'input',
      value: form[field],
      onChange: (e) => set(field, e.target.value),
      'aria-invalid': Boolean(errors[field]),
      'aria-describedby': errors[field] ? 'r-' + field + '-err' : undefined
    };
  }

  return (
    <div className="auth">
      <div className="auth-sheet">
        <h1>Create an account</h1>
        <p className="auth-lede">You need an account to book, so your trips and PNRs stay together.</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="label" htmlFor="r-name">Full name</label>
            <input {...fieldProps('name')} autoComplete="name" />
            {errors.name && <span id="r-name-err" className="field-error">{errors.name}</span>}
          </div>
          <div className="field">
            <label className="label" htmlFor="r-email">Email</label>
            <input {...fieldProps('email')} type="email" autoComplete="email" />
            {errors.email && (
              <span id="r-email-err" className="field-error">
                {errors.email}
                {errors.email.startsWith('That email already') && <> <Link to="/login" state={{ ...location.state, email: form.email }}>Sign in</Link></>}
              </span>
            )}
          </div>
          <div className="field">
            <label className="label" htmlFor="r-phone">Phone <span className="field-hint">(optional)</span></label>
            <input {...fieldProps('phone')} type="tel" autoComplete="tel" />
          </div>
          <div className="field">
            <label className="label" htmlFor="r-password">Password</label>
            <input {...fieldProps('password')} type="password" autoComplete="new-password" />
            {errors.password && <span id="r-password-err" className="field-error">{errors.password}</span>}
          </div>
          {serverError && <p className="field-error" role="alert">{serverError}</p>}
          <button type="submit" className="btn btn-primary btn-large" disabled={busy} data-busy={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login" state={location.state}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
