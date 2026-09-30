import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { formatFlightDate, formatPrice, hasDeparted } from '../../lib/format.js';

const FILTERS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Departed' },
  { id: 'withdrawn', label: 'Withdrawn' },
  { id: 'all', label: 'All' }
];

function matchesFilter(flight, filter) {
  if (filter === 'all') return true;
  if (filter === 'withdrawn') return !flight.is_active;
  if (!flight.is_active) return false;
  return filter === 'past' ? hasDeparted(flight) : !hasDeparted(flight);
}

function matchesText(flight, text) {
  if (!text) return true;
  const haystack = [flight.flight_number, flight.airline_name, flight.departure_city, flight.arrival_city].join(' ').toLowerCase();
  return haystack.includes(text.toLowerCase());
}

export default function AdminFlightsPage() {
  const location = useLocation();
  const [flights, setFlights] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('upcoming');
  const [text, setText] = useState('');
  const [confirmingId, setConfirmingId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [rowError, setRowError] = useState(null);
  const saved = location.state && location.state.saved;

  useEffect(() => {
    api('GET', '/flights').then(setFlights).catch(setError);
  }, []);

  function replaceFlight(updated) {
    setFlights((list) => list.map((f) => (f._id === updated._id ? { ...f, ...updated } : f)));
  }

  async function withdraw(flight) {
    setBusyId(flight._id);
    setRowError(null);
    try {
      await api('DELETE', '/flights/' + flight._id);
      replaceFlight({ _id: flight._id, is_active: false });
      setConfirmingId(null);
    } catch (err) {
      setRowError({ id: flight._id, message: err.message });
    } finally {
      setBusyId(null);
    }
  }

  async function reinstate(flight) {
    setBusyId(flight._id);
    setRowError(null);
    try {
      const data = await api('PUT', '/flights/' + flight._id, { is_active: true });
      replaceFlight(data.flight);
    } catch (err) {
      setRowError({ id: flight._id, message: err.message });
    } finally {
      setBusyId(null);
    }
  }

  const counts = {};
  if (flights) {
    for (const f of FILTERS) counts[f.id] = flights.filter((fl) => matchesFilter(fl, f.id)).length;
  }
  const visible = flights ? flights.filter((f) => matchesFilter(f, filter) && matchesText(f, text)) : [];

  return (
    <div className="admin">
      <header className="page-head">
        <div>
          <h1>Flights</h1>
          <p>Every flight on the schedule, including withdrawn ones. Withdrawing takes a flight off sale; existing bookings keep it.</p>
        </div>
        <Link to="/admin/flights/new" className="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.75" /></svg>
          New flight
        </Link>
      </header>

      {saved && (
        <p className="ticket-banner" role="status">Flight {saved} saved.</p>
      )}

      <div className="admin-tools">
        <div className="segmented" role="tablist" aria-label="Show flights">
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
              {flights && <span className="num">{counts[f.id]}</span>}
            </button>
          ))}
        </div>
        <div className="field admin-search">
          <label className="visually-hidden" htmlFor="flight-filter">Filter flights</label>
          <input id="flight-filter" className="input" placeholder="Filter by flight, airline or city code" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
      </div>

      {error ? (
        <div className="notice notice-info" role="alert">
          <p className="notice-title">Could not load flights</p>
          <p>{error.message}</p>
        </div>
      ) : flights === null ? (
        <div className="skeleton" style={{ height: 320 }} aria-busy="true" />
      ) : visible.length === 0 ? (
        <div className="results-empty">
          <h2>No flights match</h2>
          <p>{text ? 'Nothing matches that filter. Clear it to see every flight in this group.' : 'There are no flights in this group yet.'}</p>
          {text && <button type="button" className="btn" onClick={() => setText('')}>Clear filter</button>}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Flight</th>
                <th scope="col">Route</th>
                <th scope="col">Times</th>
                <th scope="col" className="is-num">Sold</th>
                <th scope="col" className="is-num">Left</th>
                <th scope="col" className="is-num">Fare</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((f) => {
                const departed = hasDeparted(f);
                const state = !f.is_active ? 'withdrawn' : departed ? 'departed' : f.available_seats === 0 ? 'soldout' : 'onsale';
                return (
                  <tr key={f._id} className={'is-' + state}>
                    <td className="num">{formatFlightDate(f.flight_date, 'short')}</td>
                    <td>
                      <span className="cell-strong num">{f.flight_number}</span>
                      <span className="cell-sub">{f.airline_name}</span>
                    </td>
                    <td className="cell-route">{f.departure_city} <span aria-hidden="true">→</span><span className="visually-hidden">to</span> {f.arrival_city}</td>
                    <td className="num">{f.departure_time_display}–{f.arrival_time_display}</td>
                    <td className="is-num num">{f.total_seats - f.available_seats}</td>
                    <td className="is-num num">{f.available_seats}<span className="cell-sub">of {f.total_seats}</span></td>
                    <td className="is-num num">{formatPrice(f.price)}</td>
                    <td>
                      <span className={'status-tag is-' + state}>
                        {{ withdrawn: 'Withdrawn', departed: 'Departed', soldout: 'Sold out', onsale: 'On sale' }[state]}
                      </span>
                    </td>
                    <td className="cell-actions">
                      {confirmingId === f._id ? (
                        <span className="row-confirm">
                          <span>Take off sale?</span>
                          <button type="button" className="btn btn-primary" onClick={() => withdraw(f)} disabled={busyId === f._id}>
                            {busyId === f._id ? 'Withdrawing…' : 'Withdraw'}
                          </button>
                          <button type="button" className="btn" onClick={() => setConfirmingId(null)}>Keep</button>
                        </span>
                      ) : (
                        <>
                          <Link to={'/admin/flights/' + f._id + '/edit'} className="btn btn-quiet">Edit</Link>
                          {f.is_active ? (
                            <button type="button" className="btn btn-quiet" onClick={() => setConfirmingId(f._id)}>Withdraw</button>
                          ) : (
                            <button type="button" className="btn btn-quiet" onClick={() => reinstate(f)} disabled={busyId === f._id}>
                              {busyId === f._id ? 'Reinstating…' : 'Reinstate'}
                            </button>
                          )}
                        </>
                      )}
                      {rowError && rowError.id === f._id && <span className="field-error" role="alert">{rowError.message}</span>}
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
