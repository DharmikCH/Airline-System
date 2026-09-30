import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { formatFlightDate } from '../../lib/format.js';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'cancelled', label: 'Cancelled' }
];

// /bookings/all populates both user_id and flight_id as full objects. Either
// can still be missing if a record was removed by hand, so read them safely.
function flightOf(b) {
  return b.flight_id && typeof b.flight_id === 'object' ? b.flight_id : null;
}

function userOf(b) {
  return b.user_id && typeof b.user_id === 'object' ? b.user_id : null;
}

function matchesText(b, text) {
  if (!text) return true;
  const f = flightOf(b);
  const u = userOf(b);
  const haystack = [b.pnr, b.passenger_name, u && u.email, u && u.name, f && f.flight_number, f && f.departure_city, f && f.arrival_city]
    .filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(text.toLowerCase());
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [text, setText] = useState('');

  useEffect(() => {
    api('GET', '/bookings/all').then(setBookings).catch(setError);
  }, []);

  const counts = {};
  if (bookings) {
    counts.all = bookings.length;
    counts.confirmed = bookings.filter((b) => b.status === 'confirmed').length;
    counts.cancelled = bookings.filter((b) => b.status === 'cancelled').length;
  }
  const visible = bookings
    ? bookings.filter((b) => (filter === 'all' || b.status === filter) && matchesText(b, text))
    : [];

  return (
    <div className="admin">
      <header className="page-head">
        <div>
          <h1>Bookings</h1>
          <p>Every booking made on Airway, newest first.</p>
        </div>
      </header>

      <div className="admin-tools">
        <div className="segmented" role="tablist" aria-label="Show bookings">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={filter === f.id ? 'is-active' : ''}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              {bookings && <span className="num">{counts[f.id]}</span>}
            </button>
          ))}
        </div>
        <div className="field admin-search">
          <label className="visually-hidden" htmlFor="booking-filter">Filter bookings</label>
          <input id="booking-filter" className="input" placeholder="Filter by PNR, passenger, email or flight" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
      </div>

      {error ? (
        <div className="notice notice-info" role="alert">
          <p className="notice-title">Could not load bookings</p>
          <p>{error.message}</p>
        </div>
      ) : bookings === null ? (
        <div className="skeleton" style={{ height: 320 }} aria-busy="true" />
      ) : visible.length === 0 ? (
        <div className="results-empty">
          <h2>No bookings match</h2>
          <p>{text ? 'Nothing matches that filter.' : 'No bookings in this group yet.'}</p>
          {text && <button type="button" className="btn" onClick={() => setText('')}>Clear filter</button>}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">PNR</th>
                <th scope="col">Passenger</th>
                <th scope="col">Account</th>
                <th scope="col">Flight</th>
                <th scope="col">Route</th>
                <th scope="col">Flight date</th>
                <th scope="col">Booked</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((b) => {
                const f = flightOf(b);
                const u = userOf(b);
                return (
                  <tr key={b._id} className={'is-' + b.status}>
                    <td><span className="cell-pnr num">{b.pnr}</span></td>
                    <td>
                      <span className="cell-strong">{b.passenger_name}</span>
                      {(b.passenger_age != null || b.passenger_gender) && (
                        <span className="cell-sub">{[b.passenger_age, b.passenger_gender].filter((v) => v != null && v !== '').join(' · ')}</span>
                      )}
                    </td>
                    <td>
                      {u ? (<><span>{u.name}</span><span className="cell-sub">{u.email}</span></>) : <span className="cell-sub">Account removed</span>}
                    </td>
                    <td className="num">{f ? f.flight_number : '—'}</td>
                    <td className="cell-route">{f ? <>{f.departure_city} <span aria-hidden="true">→</span><span className="visually-hidden">to</span> {f.arrival_city}</> : '—'}</td>
                    <td className="num">{f ? formatFlightDate(f.flight_date, 'short') + ' · ' + f.departure_time_display : '—'}</td>
                    <td className="num">{formatFlightDate(b.booking_date, 'short')}</td>
                    <td>
                      <span className={'status-tag is-' + b.status}>{b.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
