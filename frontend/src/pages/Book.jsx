import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { AirlineMark } from '../components/FlightCard.jsx';
import { useToast } from '../components/Toaster.jsx';
import { clearSearchCache } from '../utils/flightSearch.js';
import { formatFlightDateLong, formatPrice, genderLabel } from '../utils/format.js';
import { hasDeparted } from '../utils/time.js';
import './pages.css';

// These mean the flight itself can no longer be booked, so the useful next
// step is another flight rather than trying again.
const FLIGHT_GONE = ['NO_SEATS_AVAILABLE', 'FLIGHT_IN_PAST', 'FLIGHT_INACTIVE'];

export default function Book() {
  const { flightId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [flight, setFlight] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [step, setStep] = useState(1);
  const [passenger, setPassenger] = useState({ name: user.name, age: '', gender: '' });
  const [formError, setFormError] = useState('');
  const [submitError, setSubmitError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let ignore = false;
    api('GET', '/flights/' + flightId)
      .then((out) => { if (!ignore) setFlight(out.flight); })
      .catch((err) => { if (!ignore) setLoadError(err); });
    return () => { ignore = true; };
  }, [flightId]);

  function toReview(e) {
    e.preventDefault();
    if (!passenger.name.trim()) {
      setFormError('Enter the passenger name as it appears on their ID.');
      return;
    }
    if (passenger.age !== '') {
      const age = Number(passenger.age);
      if (!Number.isInteger(age) || age < 0 || age > 120) {
        setFormError('Age must be a whole number between 0 and 120.');
        return;
      }
    }
    setFormError('');
    setStep(2);
  }

  async function confirm() {
    setBusy(true);
    setSubmitError(null);
    try {
      const body = { flight_id: flight._id, passenger_name: passenger.name.trim() };
      if (passenger.age !== '') body.passenger_age = Number(passenger.age);
      if (passenger.gender) body.passenger_gender = passenger.gender;

      const out = await api('POST', '/bookings', body);
      // A seat just changed hands, so every cached search is out of date.
      clearSearchCache();
      toast('Booking confirmed.', 'success');
      navigate('/bookings/' + out.booking.pnr, { replace: true, state: { justBooked: true } });
    } catch (err) {
      setSubmitError(err);
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <div className="container narrow">
        <div className="card empty">
          <h3>Flight not found</h3>
          <p>{loadError.message}</p>
          <Link to="/" className="btn btn--primary">Search flights</Link>
        </div>
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="container narrow">
        <div className="card card--pad stack">
          <span className="skeleton" style={{ width: 200, height: 18 }} />
          <span className="skeleton" style={{ width: '100%', height: 90 }} />
        </div>
      </div>
    );
  }

  const searchLink = '/search?' + new URLSearchParams({ from: flight.departure_city, to: flight.arrival_city, date: flight.flight_date.slice(0, 10) });
  const unavailable = !flight.is_active || hasDeparted(flight) || flight.available_seats === 0;

  return (
    <div className="container narrow">
      <Link to={'/flights/' + flight._id} className="back-link">← Flight details</Link>

      <div className="page-head">
        <div>
          <h1>Complete your booking</h1>
          <p>{flight.departure_city} to {flight.arrival_city} · {formatFlightDateLong(flight.flight_date)}</p>
        </div>
      </div>

      <ol className="stepper" aria-label="Booking steps">
        <li className={step === 1 ? 'is-current' : 'is-done'}><span>1</span> Passenger</li>
        <li className={step === 2 ? 'is-current' : ''}><span>2</span> Review &amp; confirm</li>
      </ol>

      <div className="book">
        <div className="book__main">
          {unavailable && (
            <div className="banner banner--warn">
              <span>
                This flight can no longer be booked. <Link to={searchLink}>See other flights on this route</Link>
              </span>
            </div>
          )}

          {!unavailable && step === 1 && (
            <form className="card card--pad stack" onSubmit={toReview}>
              <h2>Who is flying?</h2>
              <p className="text-2">One passenger per booking. Use the name on their government ID.</p>
              {formError && <div className="banner banner--error" role="alert">{formError}</div>}
              <div className="form-grid">
                <label className="field span-2">
                  <span>Full name</span>
                  <input className="input" required value={passenger.name} onChange={(e) => setPassenger({ ...passenger, name: e.target.value })} />
                </label>
                <label className="field">
                  <span>Age <span className="muted">(optional)</span></span>
                  <input className="input" type="number" min="0" max="120" inputMode="numeric" value={passenger.age} onChange={(e) => setPassenger({ ...passenger, age: e.target.value })} />
                </label>
                <label className="field">
                  <span>Gender <span className="muted">(optional)</span></span>
                  <select className="input" value={passenger.gender} onChange={(e) => setPassenger({ ...passenger, gender: e.target.value })}>
                    <option value="">Prefer not to say</option>
                    <option value="F">Female</option>
                    <option value="M">Male</option>
                    <option value="O">Other</option>
                  </select>
                </label>
              </div>
              <div className="row">
                <span className="spacer" />
                <button className="btn btn--primary btn--lg">Continue to review</button>
              </div>
            </form>
          )}

          {!unavailable && step === 2 && (
            <div className="card card--pad stack">
              <h2>Review your booking</h2>

              {submitError && (
                <div className="banner banner--error" role="alert">
                  <span>
                    {submitError.message}
                    {FLIGHT_GONE.includes(submitError.code) && (
                      <> <Link to={searchLink}>Find another flight</Link></>
                    )}
                  </span>
                </div>
              )}

              <dl className="review">
                <div><dt>Passenger</dt><dd>{passenger.name.trim()}</dd></div>
                <div><dt>Age</dt><dd>{passenger.age || '—'}</dd></div>
                <div><dt>Gender</dt><dd>{genderLabel(passenger.gender) || '—'}</dd></div>
                <div><dt>Booked by</dt><dd>{user.email}</dd></div>
              </dl>

              <div className="row">
                <button className="btn btn--ghost" onClick={() => setStep(1)} disabled={busy}>Edit passenger</button>
                <span className="spacer" />
                <button className="btn btn--primary btn--lg" onClick={confirm} disabled={busy}>
                  {busy ? 'Confirming…' : 'Confirm booking · ' + formatPrice(flight.price)}
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="book__summary card card--pad">
          <div className="row">
            <AirlineMark name={flight.airline_name} />
            <div>
              <strong>{flight.airline_name}</strong>
              <div className="muted mono" style={{ fontSize: 12 }}>{flight.flight_number}</div>
            </div>
          </div>
          <div className="summary__route">
            <div>
              <strong className="nums">{flight.departure_time_display}</strong>
              <span>{flight.departure_city}</span>
            </div>
            <span className="muted nums">{flight.duration_display}</span>
            <div style={{ textAlign: 'right' }}>
              <strong className="nums">{flight.arrival_time_display}</strong>
              <span>{flight.arrival_city}</span>
            </div>
          </div>
          <div className="summary__lines">
            <div><span className="text-2">Base fare × 1</span><span className="nums">{formatPrice(flight.price)}</span></div>
            <div className="summary__total"><span>Total</span><span className="nums">{formatPrice(flight.price)}</span></div>
          </div>
          <p className="muted" style={{ fontSize: 12 }}>
            Your seat is only held once you confirm. Cancel any time before departure.
          </p>
        </aside>
      </div>
    </div>
  );
}
