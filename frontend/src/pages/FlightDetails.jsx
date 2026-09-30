import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { AirlineMark, SeatsLeft } from '../components/FlightCard.jsx';
import { cityName } from '../utils/cities.js';
import { formatFlightDateLong, formatPrice } from '../utils/format.js';
import { arrivesNextDay, hasDeparted } from '../utils/time.js';
import './pages.css';

export default function FlightDetails() {
  const { id } = useParams();
  const [state, setState] = useState({ loading: true, flight: null, error: null });

  useEffect(() => {
    let ignore = false;
    api('GET', '/flights/' + id)
      .then((out) => {
        if (!ignore) setState({ loading: false, flight: out.flight, error: null });
      })
      .catch((err) => {
        if (!ignore) setState({ loading: false, flight: null, error: err });
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  if (state.loading) {
    return (
      <div className="container narrow">
        <div className="card card--pad stack">
          <span className="skeleton" style={{ width: 180, height: 16 }} />
          <span className="skeleton" style={{ width: '100%', height: 60 }} />
          <span className="skeleton" style={{ width: '60%', height: 14 }} />
        </div>
      </div>
    );
  }

  if (state.error) {
    const missing = state.error.code === 'FLIGHT_NOT_FOUND' || state.error.code === 'INVALID_ID';
    return (
      <div className="container narrow">
        <div className="card empty">
          <h3>{missing ? 'Flight not found' : 'Could not load this flight'}</h3>
          <p>{missing ? 'That flight does not exist, or the link is wrong.' : state.error.message}</p>
          <Link to="/" className="btn btn--primary">Search flights</Link>
        </div>
      </div>
    );
  }

  const f = state.flight;
  const departed = hasDeparted(f);
  const bookable = f.is_active && !departed && f.available_seats > 0;
  const searchLink = '/search?' + new URLSearchParams({ from: f.departure_city, to: f.arrival_city, date: f.flight_date.slice(0, 10) });

  return (
    <div className="container narrow">
      <Link to={searchLink} className="back-link">← Other flights on this route</Link>

      <div className="card detail">
        <div className="detail__head">
          <div className="row">
            <AirlineMark name={f.airline_name} />
            <div>
              <h2>{f.airline_name}</h2>
              <span className="muted mono">{f.flight_number}</span>
            </div>
          </div>
          <SeatsLeft flight={f} />
        </div>

        {!f.is_active && <div className="banner banner--warn">This flight has been withdrawn and can no longer be booked.</div>}
        {f.is_active && departed && <div className="banner banner--info">This flight has already departed.</div>}

        <div className="detail__route">
          <div>
            <span className="detail__code">{f.departure_city}</span>
            <span className="text-2">{cityName(f.departure_city)}</span>
            <span className="detail__time nums">{f.departure_time_display}</span>
          </div>
          <div className="detail__mid">
            <span className="nums">{f.duration_display}</span>
            <i aria-hidden="true" />
            <span className="muted">Non-stop</span>
          </div>
          <div className="detail__end">
            <span className="detail__code">{f.arrival_city}</span>
            <span className="text-2">{cityName(f.arrival_city)}</span>
            <span className="detail__time nums">
              {f.arrival_time_display}
              {arrivesNextDay(f) && <sup>+1 day</sup>}
            </span>
          </div>
        </div>

        <dl className="detail__facts">
          <div><dt>Date</dt><dd>{formatFlightDateLong(f.flight_date)}</dd></div>
          <div><dt>Duration</dt><dd className="nums">{f.duration_display}</dd></div>
          <div><dt>Aircraft capacity</dt><dd className="nums">{f.total_seats} seats</dd></div>
          <div><dt>Seats available</dt><dd className="nums">{f.available_seats}</dd></div>
        </dl>

        <div className="detail__buy">
          <div>
            <span className="muted">Fare per passenger</span>
            <div className="detail__price">{formatPrice(f.price)}</div>
          </div>
          {bookable ? (
            <Link to={'/book/' + f._id} className="btn btn--primary btn--lg">Book this flight</Link>
          ) : (
            <button className="btn btn--primary btn--lg" disabled>
              {f.available_seats === 0 ? 'Sold out' : 'Unavailable'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
