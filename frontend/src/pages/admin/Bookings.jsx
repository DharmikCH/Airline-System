import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { formatFlightDate, formatTimestamp } from '../../utils/format.js';
import AdminNav from './AdminNav.jsx';
import { StatusBadge } from './Dashboard.jsx';
import './admin.css';

export default function Bookings() {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let ignore = false;
    // /bookings/all populates both the user and the flight on every booking,
    // so one request is enough for the whole table.
    api('GET', '/bookings/all')
      .then((list) => { if (!ignore) setBookings(list); })
      .catch((err) => { if (!ignore) setError(err); });
    return () => { ignore = true; };
  }, []);

  const q = query.trim().toLowerCase();
  const shown = (bookings || []).filter((b) => {
    if (status !== 'all' && b.status !== status) return false;
    if (!q) return true;
    const haystack = [
      b.pnr,
      b.passenger_name,
      b.user_id && b.user_id.name,
      b.user_id && b.user_id.email,
      b.flight_id && b.flight_id.flight_number
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(q);
  });

  return (
    <div className="container">
      <AdminNav />
      <div className="page-head">
        <div>
          <h1>Bookings</h1>
          <p>{bookings ? bookings.length + ' bookings across all passengers.' : 'Loading bookings…'}</p>
        </div>
      </div>

      {error && <div className="banner banner--error" role="alert">{error.message}</div>}

      <div className="admin-filters">
        <input
          className="input"
          placeholder="PNR, passenger, account or flight"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search bookings"
        />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="all">Any status</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="card">
        {!bookings && !error && <div className="stack" style={{ padding: 18 }}>{[0, 1, 2, 3].map((i) => <span key={i} className="skeleton" style={{ height: 36 }} />)}</div>}
        {bookings && shown.length === 0 && <p className="empty">No bookings match.</p>}
        {bookings && shown.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>PNR</th><th>Passenger</th><th>Account</th><th>Flight</th><th>Flight date</th><th>Status</th><th>Booked</th></tr>
              </thead>
              <tbody>
                {shown.map((b) => (
                  <tr key={b._id}>
                    <td className="mono cell-strong">{b.pnr}</td>
                    <td>{b.passenger_name}</td>
                    <td>
                      {b.user_id ? (
                        <>
                          <div>{b.user_id.name}</div>
                          <div className="muted cell-sub">{b.user_id.email}</div>
                        </>
                      ) : '—'}
                    </td>
                    <td className="nowrap">
                      {b.flight_id ? (
                        <>
                          <div>{b.flight_id.flight_number}</div>
                          <div className="muted cell-sub">{b.flight_id.departure_city} → {b.flight_id.arrival_city}</div>
                        </>
                      ) : '—'}
                    </td>
                    <td className="nowrap">{b.flight_id ? formatFlightDate(b.flight_id.flight_date) : '—'}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td className="muted nowrap">{formatTimestamp(b.booking_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
