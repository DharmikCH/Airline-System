import { NavLink } from 'react-router-dom';
import './admin.css';

export default function AdminNav() {
  return (
    <nav className="admin-nav" aria-label="Admin">
      <span className="badge badge--brand">Admin</span>
      <NavLink to="/admin" end>Overview</NavLink>
      <NavLink to="/admin/flights">Flights</NavLink>
      <NavLink to="/admin/bookings">Bookings</NavLink>
    </nav>
  );
}
