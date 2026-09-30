import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useToast } from './Toaster.jsx';
import './layout.css';

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Airbook home">
      <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
        <rect width="24" height="24" rx="7" fill="var(--brand)" />
        <path
          d="M17.8 6.2c.5-.5.5-1.3 0-1.8s-1.3-.5-1.8 0l-2.9 2.9-6.3-2-1.2 1.2 5 3.1-2.6 2.6-1.9-.3-.9.9 2.4 1.3 1.3 2.4.9-.9-.3-1.9 2.6-2.6 3.1 5 1.2-1.2-2-6.3 2.9-2.9z"
          fill="var(--on-brand)"
        />
      </svg>
      <span>Airbook</span>
    </Link>
  );
}

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  function handleLogout() {
    logout();
    toast('You have been logged out.');
    navigate('/');
  }

  return (
    <header className="header">
      <div className="container header__inner">
        <Logo />

        <nav className="nav" aria-label="Main">
          <NavLink to="/" end>Book</NavLink>
          <NavLink to="/trips">My trips</NavLink>
          <NavLink to="/manage">Manage booking</NavLink>
          {user && user.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
        </nav>

        <div className="header__account">
          {user ? (
            <>
              <span className="avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>
              <span className="header__name">{user.name}</span>
              <button className="btn btn--quiet btn--sm" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn--quiet btn--sm">Log in</Link>
              <Link to="/register" className="btn btn--primary btn--sm">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div>
          <Logo />
          <p className="muted footer__tag">Domestic flights across seven Indian cities.</p>
        </div>
        <nav className="footer__links" aria-label="Footer">
          <Link to="/">Book a flight</Link>
          <Link to="/trips">My trips</Link>
          <Link to="/manage">Manage booking</Link>
        </nav>
      </div>
      <div className="container footer__legal muted">
        Airbook is a Software Engineering course project, Dayananda Sagar University. Not a real airline.
      </div>
    </footer>
  );
}

export default function Layout() {
  const location = useLocation();

  return (
    <>
      <Header />
      {/* Keyed on the path so each new page replays its short fade-in. Query
          changes (like picking another day) keep the same key, so the page
          does not flash while its data updates. */}
      <main key={location.pathname} className="page">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
