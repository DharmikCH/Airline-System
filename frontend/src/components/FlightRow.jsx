import { Link } from 'react-router-dom';
import { formatPrice, flightStatus } from '../lib/format.js';

// The chart symbol for an obstacle, used here to flag a nearly full flight.
export function FewSeatsIcon() {
  return (
    <svg width="12" height="11" viewBox="0 0 12 11" aria-hidden="true">
      <path d="M6 1 11 10H1Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

const STATUS_TEXT = {
  soldout: 'Sold out',
  departed: 'Departed',
  withdrawn: 'Withdrawn'
};

// One flight in the results list, ruled along the route axis:
// departure on the left, arrival on the right, the airway between them.
export default function FlightRow({ flight }) {
  const status = flightStatus(flight);
  const blocked = STATUS_TEXT[status];

  return (
    <li className={'flight-row is-' + status}>
      <div className="fr-end">
        <span className="fr-time num">{flight.departure_time_display}</span>
        <span className="fr-code">{flight.departure_city}</span>
      </div>

      <div className="fr-axis" aria-hidden="true">
        <span className="fr-duration num">{flight.duration_display}</span>
        <span className="fr-line" />
        <span className="fr-nonstop">Non-stop</span>
      </div>

      <div className="fr-end fr-end-arr">
        <span className="fr-time num">{flight.arrival_time_display}</span>
        <span className="fr-code">{flight.arrival_city}</span>
      </div>

      <div className="fr-carrier">
        <span className="fr-airline">{flight.airline_name}</span>
        <span className="fr-number num">{flight.flight_number}</span>
      </div>

      <div className="fr-seats">
        {blocked ? (
          <span className="fr-blocked">{blocked}</span>
        ) : status === 'few' ? (
          <span className="fr-few"><FewSeatsIcon /> {flight.available_seats} {flight.available_seats === 1 ? 'seat' : 'seats'} left</span>
        ) : (
          <span className="fr-open num">{flight.available_seats} seats</span>
        )}
      </div>

      <div className="fr-fare">
        <span className="fr-price num">{formatPrice(flight.price)}</span>
        <span className="label">One way</span>
      </div>

      <div className="fr-action">
        {blocked ? (
          <Link to={'/flights/' + flight._id} className="btn">Details</Link>
        ) : (
          <Link to={'/flights/' + flight._id} className="btn btn-primary">
            Select
            <span className="visually-hidden"> {flight.flight_number}, departing {flight.departure_time_display}</span>
          </Link>
        )}
      </div>
    </li>
  );
}

export function FlightRowSkeleton() {
  return (
    <li className="flight-row is-loading" aria-hidden="true">
      <div className="skeleton sk-block" />
      <div className="skeleton sk-line" />
      <div className="skeleton sk-block" />
      <div className="skeleton sk-text" />
      <div className="skeleton sk-text" />
      <div className="skeleton sk-text" />
      <div className="skeleton sk-btn" />
    </li>
  );
}
