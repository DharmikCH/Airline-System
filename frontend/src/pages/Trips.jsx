import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useToast } from '../components/Toaster.jsx';
import { cityName } from '../utils/cities.js';
import { clearSearchCache } from '../utils/flightSearch.js';
import { formatPrice } from '../utils/format.js';
import { departureInstant, hasDeparted } from '../utils/time.js';
import './pages.css';

const TABS = [
  ['upcoming', 'Upcoming'],
  ['past', 'Past'],
  ['cancelled', 'Cancelled']
];

// Which tab a booking belongs in. Upcoming versus past uses the same
// departure rule as the backend, so a trip is never shown as cancellable
// after the API would refuse to cancel it.
function tabFor(booking) {
  if (booking.status === 'cancelled') return 'cancelled';
  return hasDeparted(booking.flight_id) ? 'past' : 'upcoming';
}

const dayNum = new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', day: 'numeric' });
const monthShort = new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', month: 'short' });
const weekday = new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', weekday: 'short' });

export default function Trips() {
  const toast = useToast();
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('upcoming');
  const [cancelling, setCancelling] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let ignore = false;
    // /bookings/my populates flight_id with the full flight, display fields
    // included, so the whole list needs just this one request.
    api('GET', '/bookings/my')
      .then((list) => { if (!ignore) setBookings(list); })
      .catch((err) => { if (!ignore) setError(err); });
    return () => { ignore = true; };
  }, []);

  async function cancel() {
    setBusy(true);
    try {
      const out = await api('PUT', '/bookings/cancel/' + cancelling._id);
      setBookings((list) => list.map((b) => (b._id === cancelling._id ? { ...b, status: out.booking.status } : b)));
      clearSearchCache();
      toast('Booking ' + cancelling.pnr + ' has been cancelled.', 'success');
      setCancelling(null);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  const groups = { upcoming: [], past: [], cancelled: [] };
  (bookings || []).forEach((b) => groups[tabFor(b)].push(b));
  groups.upcoming.sort((a, b) => departureInstant(a.flight_id) - departureInstant(b.flight_id));
  groups.past.sort((a, b) => departureInstant(b.flight_id) - departureInstant(a.flight_id));

  const list = groups[tab];

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>My trips</h1>
          <p>Every booking made from your account.</p>
        </div>
        <span className="spacer" />
        <Link to="/" className="btn btn--primary">Book a flight</Link>
      </div>

      {error && <div className="banner banner--error" role="alert">{error.message}</div>}

      <div className="tabs" role="tablist">
        {TABS.map(([value, label]) => (
          <button key={value} role="tab" className="tab" aria-selected={tab === value} onClick={() => setTab(value)}>
            {label}
            {bookings && <span className="count nums">{groups[value].length}</span>}
          </button>
        ))}
      </div>

      {!bookings && !error && (
        <div className="stack">
          {[0, 1].map((i) => <span key={i} className="skeleton" style={{ height: 96, borderRadius: 12 }} />)}
        </div>
      )}

      {bookings && list.length === 0 && (
        <div className="card empty">
          <h3>
            {tab === 'upcoming' && 'No upcoming trips'}
            {tab === 'past' && 'No past trips yet'}
            {tab === 'cancelled' && 'No cancelled bookings'}
          </h3>
          <p>{tab === 'upcoming' ? 'Where to next?' : 'Nothing to show here.'}</p>
          {tab === 'upcoming' && <Link to="/" className="btn btn--primary">Search flights</Link>}
        </div>
      )}

      <div className="trips">
        {list.map((b, i) => {
          const f = b.flight_id;
          const date = new Date(f.flight_date);
          return (
            <article key={b._id} className={'trip enter' + (b.status === 'cancelled' ? ' trip--cancelled' : '')} style={{ animationDelay: Math.min(i * 40, 240) + 'ms' }}>
              <div className="trip__date">
                <span className="trip__weekday">{weekday.format(date)}</span>
                <span className="trip__day nums">{dayNum.format(date)}</span>
                <span className="trip__month">{monthShort.format(date)}</span>
              </div>
              <div className="trip__body">
                <div className="trip__route">
                  <strong>{cityName(f.departure_city)}</strong>
                  <span className="muted">→</span>
                  <strong>{cityName(f.arrival_city)}</strong>
                </div>
                <div className="trip__meta text-2">
                  <span className="nums">{f.departure_time_display} – {f.arrival_time_display}</span>
                  <span>{f.airline_name} {f.flight_number}</span>
                  <span>{b.passenger_name}</span>
                </div>
              </div>
              <div className="trip__side">
                <span className="trip__pnr mono">{b.pnr}</span>
                <span className="muted nums" style={{ fontSize: 13 }}>{formatPrice(f.price)}</span>
              </div>
              <div className="trip__actions">
                <Link to={'/bookings/' + b.pnr} className="btn btn--ghost btn--sm">View ticket</Link>
                {tab === 'upcoming' && (
                  <button className="btn btn--quiet btn--sm danger-text" onClick={() => setCancelling(b)}>Cancel</button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <ConfirmDialog
        open={Boolean(cancelling)}
        title={cancelling ? 'Cancel booking ' + cancelling.pnr + '?' : ''}
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
        danger
        busy={busy}
        onConfirm={cancel}
        onClose={() => setCancelling(null)}
      >
        {cancelling && (
          <p>
            {cancelling.passenger_name}'s seat on {cancelling.flight_id.flight_number} from{' '}
            {cityName(cancelling.flight_id.departure_city)} to {cityName(cancelling.flight_id.arrival_city)} will be
            released. This cannot be undone.
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
