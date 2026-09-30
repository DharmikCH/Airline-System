import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FewSeatsIcon } from '../components/FlightRow.jsx';
import RouteInset from '../components/RouteInset.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { findCity, formatTrack, routeGeometry } from '../lib/cities.js';
import { flightDateInput, flightStatus, formatFlightDate, formatPrice } from '../lib/format.js';
import { searchUrl } from '../lib/lastSearch.js';

// What each backend refusal means to a passenger, and what they can do next.
const REFUSALS = {
  NO_SEATS_AVAILABLE: {
    title: 'The last seat has just gone',
    text: 'Another passenger booked it moments before you. The seat count below is now up to date.'
  },
  FLIGHT_IN_PAST: {
    title: 'This flight has already departed',
    text: 'Bookings close at departure. Look for a later flight on the same route.'
  },
  FLIGHT_INACTIVE: {
    title: 'This flight has been withdrawn',
    text: 'The airline has taken it off sale. Look for another flight on the same route.'
  }
};

const STATUS_NOTICE = {
  soldout: {
    title: 'Sold out',
    text: 'Every seat on this flight is booked.'
  },
  departed: REFUSALS.FLIGHT_IN_PAST,
  withdrawn: REFUSALS.FLIGHT_INACTIVE
};

const GENDERS = ['Female', 'Male', 'Other'];

export default function FlightPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [flight, setFlight] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const [name, setName] = useState(user ? user.name : '');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [refusal, setRefusal] = useState(null);

  function loadFlight() {
    return api('GET', '/flights/' + id)
      .then((data) => setFlight(data.flight))
      .catch(setLoadError);
  }

  useEffect(() => {
    loadFlight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleBook(event) {
    event.preventDefault();

    const errors = {};
    if (!name.trim()) errors.name = 'Enter the passenger’s name as it appears on their ID.';
    if (age !== '' && (!Number.isInteger(Number(age)) || Number(age) < 0 || Number(age) > 120)) {
      errors.age = 'Age must be a whole number between 0 and 120.';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setRefusal(null);
    try {
      const body = { flight_id: flight._id, passenger_name: name.trim() };
      if (age !== '') body.passenger_age = Number(age);
      if (gender) body.passenger_gender = gender;

      const data = await api('POST', '/bookings', body);
      navigate('/bookings/' + data.booking.pnr, { state: { justBooked: true } });
    } catch (err) {
      setSubmitting(false);
      if (REFUSALS[err.code]) {
        setRefusal(REFUSALS[err.code]);
        loadFlight();
      } else {
        setRefusal({ title: 'The booking did not go through', text: err.message });
      }
    }
  }

  if (loadError) {
    return (
      <div className="plate">
        <div className="notice notice-info" role="alert">
          <p className="notice-title">{loadError.code === 'FLIGHT_NOT_FOUND' || loadError.code === 'INVALID_ID' ? 'No such flight' : 'Could not load this flight'}</p>
          <p>{loadError.message}</p>
        </div>
        <Link to="/" className="btn plate-back">Back to search</Link>
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="plate" aria-busy="true">
        <div className="skeleton" style={{ height: 72 }} />
        <div className="skeleton" style={{ height: 200 }} />
        <div className="skeleton" style={{ height: 260 }} />
      </div>
    );
  }

  const status = flightStatus(flight);
  const bookable = status === 'open' || status === 'few';
  const geometry = routeGeometry(flight.departure_city, flight.arrival_city);
  const origin = findCity(flight.departure_city);
  const destination = findCity(flight.arrival_city);
  const backToResults = searchUrl({
    from: flight.departure_city,
    to: flight.arrival_city,
    date: flightDateInput(flight.flight_date)
  });

  return (
    <article className="plate">
      <Link to={backToResults} className="btn btn-quiet plate-back">
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M13 7H2M6 2 1 7l5 5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
        All flights on this route
      </Link>

      <div className="plate-sheet">
        <dl className="plate-strip">
          <div>
            <dt className="label">Flight</dt>
            <dd>{flight.flight_number}</dd>
          </div>
          <div>
            <dt className="label">Airline</dt>
            <dd>{flight.airline_name}</dd>
          </div>
          <div>
            <dt className="label">Date</dt>
            <dd>{formatFlightDate(flight.flight_date)}</dd>
          </div>
          <div className={status === 'few' ? 'is-few' : ''}>
            <dt className="label">Seats left</dt>
            <dd>
              {status === 'few' && <FewSeatsIcon />}
              {flight.available_seats} of {flight.total_seats}
              {status === 'few' && <span className="strip-note">Nearly full</span>}
            </dd>
          </div>
          {geometry && (
            <div>
              <dt className="label">Distance · Track</dt>
              <dd>{geometry.distance} NM · {formatTrack(geometry.track)}</dd>
            </div>
          )}
        </dl>

        <div className="plate-top">
          <div className="plate-profile">
            <div className="plate-end">
              <span className="plate-time num">{flight.departure_time_display}</span>
              <span className="plate-code">{flight.departure_city}</span>
              <span className="plate-city">{origin ? origin.airport : ''}</span>
            </div>
            <div className="plate-leg">
              <span className="plate-leg-duration">{flight.duration_display}</span>
              <span className="route-line" aria-hidden="true" />
              <span className="plate-leg-data">Non-stop</span>
            </div>
            <div className="plate-end plate-end-arr">
              <span className="plate-time num">{flight.arrival_time_display}</span>
              <span className="plate-code">{flight.arrival_city}</span>
              <span className="plate-city">{destination ? destination.airport : ''}</span>
            </div>
          </div>
          <div className="plate-plan">
            <RouteInset from={flight.departure_city} to={flight.arrival_city} />
          </div>
        </div>

        <div className="plate-body">
          <section className="plate-book" aria-labelledby="book-heading">
            <h1 id="book-heading">
              {bookable ? 'Book a seat' : STATUS_NOTICE[status].title}
            </h1>

            {refusal && (
              <div className="notice notice-refusal" role="alert">
                <p className="notice-title">{refusal.title}</p>
                <p>{refusal.text}</p>
              </div>
            )}

            {!bookable ? (
              <>
                {!refusal && (
                  <div className="notice notice-refusal">
                    <p className="notice-title">{STATUS_NOTICE[status].title}</p>
                    <p>{STATUS_NOTICE[status].text}</p>
                  </div>
                )}
                <Link to={backToResults} className="btn btn-primary" style={{ justifySelf: 'start' }}>
                  See other flights on this route
                </Link>
              </>
            ) : !user ? (
              <div className="plate-signin">
                <p>Sign in to book. You will come straight back to this flight.</p>
                <Link to="/login" state={{ from: location.pathname }} className="btn btn-primary btn-large">
                  Sign in to book
                </Link>
                <p className="field-hint">
                  New to Airway? <Link to="/register" state={{ from: location.pathname }}>Create an account</Link>
                </p>
              </div>
            ) : (
              <form className="book-form" onSubmit={handleBook} noValidate>
                <div className="field">
                  <label className="label" htmlFor="p-name">Passenger name</label>
                  <input
                    id="p-name"
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    aria-invalid={Boolean(fieldErrors.name)}
                    aria-describedby={fieldErrors.name ? 'p-name-err' : 'p-name-hint'}
                  />
                  {fieldErrors.name
                    ? <span id="p-name-err" className="field-error">{fieldErrors.name}</span>
                    : <span id="p-name-hint" className="field-hint">As it appears on their photo ID.</span>}
                </div>

                <div className="book-row">
                  <div className="field">
                    <label className="label" htmlFor="p-age">Age <span className="field-hint">(optional)</span></label>
                    <input
                      id="p-age"
                      className="input num"
                      inputMode="numeric"
                      value={age}
                      onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ''))}
                      maxLength={3}
                      aria-invalid={Boolean(fieldErrors.age)}
                      aria-describedby={fieldErrors.age ? 'p-age-err' : undefined}
                    />
                  </div>

                  <fieldset className="field gender-set">
                    <legend className="label">Gender <span className="field-hint">(optional)</span></legend>
                    <div className="gender-options">
                      {GENDERS.map((g) => (
                        <label key={g}>
                          <input
                            type="radio"
                            name="gender"
                            value={g}
                            checked={gender === g}
                            onChange={() => setGender(g)}
                            onClick={() => gender === g && setGender('')}
                          />
                          <span>{g}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
                {fieldErrors.age && <span id="p-age-err" className="field-error">{fieldErrors.age}</span>}

                <button type="submit" className="btn btn-primary btn-large" disabled={submitting} data-busy={submitting}>
                  {submitting ? 'Reserving your seat…' : 'Confirm booking · ' + formatPrice(flight.price)}
                </button>
              </form>
            )}
          </section>

          <aside className="plate-fare" aria-label="Fare">
            <span className="label">Fare, one passenger</span>
            <span className="plate-fare-total">{formatPrice(flight.price)}</span>
            <ul>
              <li>One way, non-stop, one passenger.</li>
              <li>Your seat is held the moment you confirm; no one else can take it.</li>
              <li>You get a six-letter PNR straight away. Cancel any time before departure.</li>
            </ul>
          </aside>
        </div>
      </div>
    </article>
  );
}
