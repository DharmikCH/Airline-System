import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';

// The mark: two airport fixes joined by the magenta airway.
export function AirwayMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="7" cy="25" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="25" cy="7" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M9.5 22.5 22.5 9.5" stroke="var(--magenta)" strokeWidth="3" />
    </svg>
  );
}

export default function Shell() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="shell">
      <a className="skip-link" href="#main">Skip to content</a>

      <header className="masthead">
        <Link to="/" className="brand" aria-label="Airway, search flights">
          <AirwayMark />
          <span className="brand-word">Airway</span>
        </Link>

        <nav className="mainnav" aria-label="Main">
          <NavLink to="/" end>Search</NavLink>
          {user && <NavLink to="/trips">My trips</NavLink>}
          {user && <NavLink to="/find">Find a booking</NavLink>}
          {isAdmin && <NavLink to="/admin/flights">Flights</NavLink>}
          {isAdmin && <NavLink to="/admin/bookings">Bookings</NavLink>}
        </nav>

        <div className="account">
          {user ? (
            <>
              <span className="account-name">
                {user.name}
                {isAdmin && <span className="role-tag">Admin</span>}
              </span>
              <button type="button" className="btn btn-quiet" onClick={handleLogout}>Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-quiet">Sign in</Link>
              <Link to="/register" className="btn">Create account</Link>
            </>
          )}
        </div>
      </header>

      <main id="main" className="page">
        <Outlet />
      </main>

      <footer className="chart-margin">
        <span>Airway · Domestic schedule, seven airports</span>
        <span>Chart drawn from airport coordinates · Not for navigation</span>
      </footer>
    </div>
  );
}
