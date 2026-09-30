import { cityName } from '../utils/cities.js';
import { formatFlightDateLong, formatPrice, formatTimestamp, genderLabel } from '../utils/format.js';
import { arrivesNextDay } from '../utils/time.js';
import './ticket.css';

// A boarding-pass styled view of one booking. Used by the confirmation page,
// Manage booking and My trips, so a ticket looks the same everywhere.
export default function TicketView({ booking, flight }) {
  const cancelled = booking.status === 'cancelled';
  const extra = [booking.passenger_age ? booking.passenger_age + ' yrs' : null, genderLabel(booking.passenger_gender)]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className={'ticket' + (cancelled ? ' ticket--cancelled' : '')}>
      <div className="ticket__main">
        <div className="ticket__top">
          <span className="ticket__brand">Airbook · E-ticket</span>
          {cancelled ? (
            <span className="badge badge--err">Cancelled</span>
          ) : (
            <span className="badge badge--ok">Confirmed</span>
          )}
        </div>

        <div className="ticket__route">
          <div className="ticket__end">
            <span className="ticket__code">{flight.departure_city}</span>
            <span className="ticket__city">{cityName(flight.departure_city)}</span>
            <span className="ticket__time nums">{flight.departure_time_display}</span>
          </div>
          <div className="ticket__path">
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
                transform="rotate(90 12 12)"
              />
            </svg>
            <span className="nums">{flight.duration_display}</span>
          </div>
          <div className="ticket__end ticket__end--right">
            <span className="ticket__code">{flight.arrival_city}</span>
            <span className="ticket__city">{cityName(flight.arrival_city)}</span>
            <span className="ticket__time nums">
              {flight.arrival_time_display}
              {arrivesNextDay(flight) && <sup>+1</sup>}
            </span>
          </div>
        </div>

        <dl className="ticket__meta">
          <div>
            <dt>Passenger</dt>
            <dd>{booking.passenger_name}{extra && <span className="muted"> · {extra}</span>}</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>{formatFlightDateLong(flight.flight_date)}</dd>
          </div>
          <div>
            <dt>Flight</dt>
            <dd>{flight.airline_name} <span className="mono">{flight.flight_number}</span></dd>
          </div>
          <div>
            <dt>Fare</dt>
            <dd className="nums">{formatPrice(flight.price)}</dd>
          </div>
        </dl>
      </div>

      <div className="ticket__stub">
        <span className="ticket__label">Booking reference</span>
        <span className="ticket__pnr">{booking.pnr}</span>
        <span className="ticket__label">Booked {formatTimestamp(booking.booking_date)}</span>
      </div>

      {cancelled && <div className="ticket__stamp" aria-hidden="true">Cancelled</div>}
    </article>
  );
}
