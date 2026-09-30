import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { formatFlightDate, formatPrice, formatTimestamp } from '../../utils/format.js';
import { hasDeparted } from '../../utils/time.js';
import AdminNav from './AdminNav.jsx';
import './admin.css';

// Headline figures are compacted (₹1.2L rather than ₹1,23,400), with the
// exact value one hover away in the title.
const compactRupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  maximumFractionDigits: 1
});
const compactCount = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });

function StatTile({ label, value, exact, note }) {
  return (
    <div className="kpi card">
      <span className="kpi__label">{label}</span>
      <span className="kpi__value" title={exact}>{value}</span>
      {note && <span className="kpi__note">{note}</span>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    Promise.all([api('GET', '/bookings/all'), api('GET', '/flights')])
      .then(([bookings, flights]) => { if (!ignore) setData({ bookings, flights }); })
      .catch((err) => { if (!ignore) setError(err); });
    return () => { ignore = true; };
  }, []);

  let stats = null;
  if (data) {
    const confirmed = data.bookings.filter((b) => b.status === 'confirmed');
    const cancelled = data.bookings.length - confirmed.length;
    const revenue = confirmed.reduce((sum, b) => sum + (b.flight_id ? b.flight_id.price : 0), 0);
    const upcoming = data.flights.filter((f) => f.is_active && !hasDeparted(f));
    const withdrawn = data.flights.filter((f) => !f.is_active).length;
    const capacity = upcoming.reduce((sum, f) => sum + f.total_seats, 0);
    const sold = upcoming.reduce((sum, f) => sum + (f.total_seats - f.available_seats), 0);
    const filled = capacity ? Math.round((sold / capacity) * 100) : 0;
    stats = { confirmed: confirmed.length, cancelled, revenue, upcoming: upcoming.length, withdrawn, filled, sold, capacity };
  }

  return (
    <div className="container">
      <AdminNav />
      <div className="page-head">
        <div>
          <h1>Overview</h1>
          <p>Bookings and schedule at a glance.</p>
        </div>
        <span className="spacer" />
        <Link to="/admin/flights/new" className="btn btn--primary">Add a flight</Link>
      </div>

      {error && <div className="banner banner--error" role="alert">{error.message}</div>}

      <div className="kpis">
        {!stats && !error && [0, 1, 2, 3].map((i) => <span key={i} className="skeleton" style={{ height: 112, borderRadius: 12 }} />)}
        {stats && (
          <>
            <StatTile
              label="Confirmed bookings"
              value={compactCount.format(stats.confirmed)}
              exact={String(stats.confirmed)}
              note={stats.cancelled + ' cancelled'}
            />
            <StatTile
              label="Revenue"
              value={compactRupees.format(stats.revenue)}
              exact={formatPrice(stats.revenue)}
              note="From confirmed bookings"
            />
            <StatTile
              label="Upcoming flights"
              value={compactCount.format(stats.upcoming)}
              exact={String(stats.upcoming)}
              note={stats.withdrawn ? stats.withdrawn + ' withdrawn' : 'None withdrawn'}
            />
            <StatTile
              label="Seats filled"
              value={stats.filled + '%'}
              exact={stats.sold + ' of ' + stats.capacity + ' seats'}
              note="Across upcoming flights"
            />
          </>
        )}
      </div>

      <section className="card admin-section">
        <div className="admin-section__head">
          <h2>Recent bookings</h2>
          <Link to="/admin/bookings">View all</Link>
        </div>
        {data && data.bookings.length === 0 && <p className="empty">No bookings yet.</p>}
        {data && data.bookings.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>PNR</th><th>Passenger</th><th>Flight</th><th>Date</th><th>Status</th><th>Booked</th></tr>
              </thead>
              <tbody>
                {data.bookings.slice(0, 6).map((b) => (
                  <tr key={b._id}>
                    <td className="mono">{b.pnr}</td>
                    <td>{b.passenger_name}</td>
                    <td>{b.flight_id ? b.flight_id.flight_number + ' · ' + b.flight_id.departure_city + '–' + b.flight_id.arrival_city : '—'}</td>
                    <td>{b.flight_id ? formatFlightDate(b.flight_id.flight_date) : '—'}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td className="muted">{formatTimestamp(b.booking_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// Status colours are reserved for status and always come with the word, so
// the state never depends on colour alone.
export function StatusBadge({ status }) {
  return status === 'confirmed'
    ? <span className="badge badge--ok">Confirmed</span>
    : <span className="badge badge--err">Cancelled</span>;
}
