import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { useToast } from '../../components/Toaster.jsx';
import { CITIES } from '../../utils/cities.js';
import { clearSearchCache } from '../../utils/flightSearch.js';
import { formatFlightDate, formatPrice } from '../../utils/format.js';
import { hasDeparted } from '../../utils/time.js';
import AdminNav from './AdminNav.jsx';
import './admin.css';

// A seat meter. The fill carries the state, and the track is a lighter step
// of the same colour, so how full a flight is reads across the whole bar.
function SeatMeter({ flight }) {
  const sold = flight.total_seats - flight.available_seats;
  const pct = Math.round((sold / flight.total_seats) * 100);
  const state = flight.available_seats === 0 ? 'full' : flight.available_seats <= 5 ? 'low' : 'ok';
  return (
    <div className="seat-meter">
      <span className="nums">{flight.available_seats} / {flight.total_seats}</span>
      <span className={'meter meter--' + state} title={pct + '% sold'}>
        <span style={{ width: pct + '%' }} />
      </span>
    </div>
  );
}

function statusOf(f) {
  if (!f.is_active) return ['Withdrawn', 'badge--err'];
  if (hasDeparted(f)) return ['Departed', ''];
  return ['Scheduled', 'badge--ok'];
}

export default function Flights() {
  const toast = useToast();
  const [flights, setFlights] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ q: '', from: '', to: '', status: 'all', when: 'upcoming' });
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let ignore = false;
    // GET /api/flights exists for exactly this screen: search needs a route
    // and a date, so it could never show the whole schedule at once.
    api('GET', '/flights')
      .then((list) => { if (!ignore) setFlights(list); })
      .catch((err) => { if (!ignore) setError(err); });
    return () => { ignore = true; };
  }, []);

  function replaceFlight(updated) {
    setFlights((list) => list.map((f) => (f._id === updated._id ? updated : f)));
  }

  async function deactivate() {
    setBusy(true);
    try {
      const out = await api('DELETE', '/flights/' + target._id);
      // The delete is soft, so reflect it locally rather than refetching.
      replaceFlight({ ...target, is_active: false });
      clearSearchCache();
      toast(out.message, 'success');
      setTarget(null);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function reactivate(flight) {
    try {
      const out = await api('PUT', '/flights/' + flight._id, { is_active: true });
      replaceFlight(out.flight);
      clearSearchCache();
      toast(flight.flight_number + ' is back on sale.', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  const q = filters.q.trim().toLowerCase();
  const shown = (flights || []).filter((f) => {
    if (q && !(f.flight_number.toLowerCase().includes(q) || f.airline_name.toLowerCase().includes(q))) return false;
    if (filters.from && f.departure_city !== filters.from) return false;
    if (filters.to && f.arrival_city !== filters.to) return false;
    if (filters.status === 'active' && !f.is_active) return false;
    if (filters.status === 'inactive' && f.is_active) return false;
    if (filters.when === 'upcoming' && hasDeparted(f)) return false;
    if (filters.when === 'past' && !hasDeparted(f)) return false;
    return true;
  });

  const set = (field) => (e) => setFilters({ ...filters, [field]: e.target.value });

  return (
    <div className="container">
      <AdminNav />
      <div className="page-head">
        <div>
          <h1>Flights</h1>
          <p>{flights ? flights.length + ' flights in the schedule, including withdrawn ones.' : 'Loading the schedule…'}</p>
        </div>
        <span className="spacer" />
        <Link to="/admin/flights/new" className="btn btn--primary">Add a flight</Link>
      </div>

      {error && <div className="banner banner--error" role="alert">{error.message}</div>}

      <div className="admin-filters">
        <input className="input" placeholder="Flight number or airline" value={filters.q} onChange={set('q')} aria-label="Search flights" />
        <select className="input" value={filters.from} onChange={set('from')} aria-label="From">
          <option value="">Any origin</option>
          {CITIES.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.name}</option>)}
        </select>
        <select className="input" value={filters.to} onChange={set('to')} aria-label="To">
          <option value="">Any destination</option>
          {CITIES.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.name}</option>)}
        </select>
        <select className="input" value={filters.status} onChange={set('status')} aria-label="Status">
          <option value="all">Any status</option>
          <option value="active">On sale</option>
          <option value="inactive">Withdrawn</option>
        </select>
        <select className="input" value={filters.when} onChange={set('when')} aria-label="When">
          <option value="upcoming">Upcoming</option>
          <option value="past">Departed</option>
          <option value="all">All dates</option>
        </select>
      </div>

      <div className="card">
        {!flights && !error && <div className="stack" style={{ padding: 18 }}>{[0, 1, 2, 3].map((i) => <span key={i} className="skeleton" style={{ height: 36 }} />)}</div>}
        {flights && shown.length === 0 && <p className="empty">No flights match these filters.</p>}
        {flights && shown.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th><th>Flight</th><th>Route</th><th>Times</th><th>Seats left</th><th>Fare</th><th>Status</th><th />
                </tr>
              </thead>
              <tbody>
                {shown.map((f) => {
                  const [label, cls] = statusOf(f);
                  return (
                    <tr key={f._id} className={f.is_active ? '' : 'is-dim'}>
                      <td className="nowrap">{formatFlightDate(f.flight_date)}</td>
                      <td>
                        <div className="cell-strong">{f.flight_number}</div>
                        <div className="muted cell-sub">{f.airline_name}</div>
                      </td>
                      <td className="nowrap">{f.departure_city} → {f.arrival_city}</td>
                      <td className="nowrap nums">
                        {f.departure_time_display}–{f.arrival_time_display}
                        <div className="muted cell-sub">{f.duration_display}</div>
                      </td>
                      <td><SeatMeter flight={f} /></td>
                      <td className="nums">{formatPrice(f.price)}</td>
                      <td><span className={'badge ' + cls}>{label}</span></td>
                      <td className="actions">
                        <Link to={'/admin/flights/' + f._id + '/edit'} className="btn btn--ghost btn--sm">Edit</Link>
                        {f.is_active ? (
                          <button className="btn btn--quiet btn--sm danger-text" onClick={() => setTarget(f)}>Withdraw</button>
                        ) : (
                          <button className="btn btn--quiet btn--sm" onClick={() => reactivate(f)}>Restore</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(target)}
        title={target ? 'Withdraw ' + target.flight_number + '?' : ''}
        confirmLabel="Withdraw flight"
        cancelLabel="Keep on sale"
        danger
        busy={busy}
        onConfirm={deactivate}
        onClose={() => setTarget(null)}
      >
        <p>
          It will disappear from search and can no longer be booked. Existing bookings stay as they are, and you can
          restore the flight later.
        </p>
      </ConfirmDialog>
    </div>
  );
}
