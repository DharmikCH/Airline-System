import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/format.js';
import { arrivesNextDay } from '../utils/time.js';
import './flights.css';

export function AirlineMark({ name }) {
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return <span className="airline-mark" aria-hidden="true">{initials}</span>;
}

export function SeatsLeft({ flight }) {
  if (flight.available_seats === 0) {
    return <span className="badge badge--err">Sold out</span>;
  }
  if (flight.available_seats <= 5) {
    return <span className="badge badge--warn">Only {flight.available_seats} left</span>;
  }
  return <span className="muted seats-left nums">{flight.available_seats} seats left</span>;
}

export default function FlightCard({ flight, style }) {
  const soldOut = flight.available_seats === 0;

  return (
    <article className="flight enter" style={style}>
      <div className="flight__airline">
        <AirlineMark name={flight.airline_name} />
        <div className="flight__carrier">
          <strong>{flight.airline_name}</strong>
          <span className="muted mono">{flight.flight_number}</span>
        </div>
      </div>

      <div className="flight__route">
        <div className="flight__point">
          <span className="flight__time nums">{flight.departure_time_display}</span>
          <span className="flight__code">{flight.departure_city}</span>
        </div>
        <div className="flight__line">
          <span className="nums">{flight.duration_display}</span>
          <i aria-hidden="true" />
          <span className="muted">Non-stop</span>
        </div>
        <div className="flight__point flight__point--end">
          <span className="flight__time nums">
            {flight.arrival_time_display}
            {arrivesNextDay(flight) && <sup title="Arrives the next day">+1</sup>}
          </span>
          <span className="flight__code">{flight.arrival_city}</span>
        </div>
      </div>

      <div className="flight__buy">
        <div className="flight__price-block">
          <span className="flight__price nums">{formatPrice(flight.price)}</span>
          <SeatsLeft flight={flight} />
        </div>
        <div className="flight__actions">
          <Link to={'/flights/' + flight._id} className="btn btn--quiet btn--sm">Details</Link>
          {soldOut ? (
            <button className="btn btn--primary btn--sm" disabled>Book</button>
          ) : (
            <Link to={'/book/' + flight._id} className="btn btn--primary btn--sm">Book</Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function FlightCardSkeleton() {
  return (
    <div className="flight flight--skeleton" aria-hidden="true">
      <div className="flight__airline">
        <span className="skeleton" style={{ width: 36, height: 36, borderRadius: 10 }} />
        <div className="stack" style={{ gap: 6 }}>
          <span className="skeleton" style={{ width: 90, height: 12 }} />
          <span className="skeleton" style={{ width: 60, height: 10 }} />
        </div>
      </div>
      <div className="flight__route">
        <span className="skeleton" style={{ width: 56, height: 22 }} />
        <span className="skeleton" style={{ flex: 1, height: 2, margin: '0 16px' }} />
        <span className="skeleton" style={{ width: 56, height: 22 }} />
      </div>
      <div className="flight__buy">
        <span className="skeleton" style={{ width: 80, height: 22 }} />
      </div>
    </div>
  );
}
