import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { formatFlightDate, formatPrice, hasDeparted } from '../lib/format.js';

// A booking whose flight record is missing (should not happen, but MongoDB
// has no foreign keys) is shown with what the booking itself knows.
function TripRow({ booking }) {
  const flight = booking.flight_id && typeof booking.flight_id === 'object' ? booking.flight_id : null;
  const cancelled = booking.status === 'cancelled';
  const departed = flight ? hasDeparted(flight) : false;
  const state = cancelled ? 'cancelled' : departed ? 'departed' : 'upcoming';

  return (
    <li className={'trip-row is-' + state}>
      <Link to={'/bookings/' + booking.pnr} className="trip-link">
        <span className="trip-pnr num">{booking.pnr}</span>
        {flight ? (
          <>
            <span className="trip-route">
              <span className="trip-code">{flight.departure_city}</span>
              <span className="trip-line" aria-hidden="true" />
              <span className="trip-code">{flight.arrival_city}</span>
            </span>
            <span className="trip-when">
              <span className="num">{formatFlightDate(flight.flight_date)}</span>
              <span className="num trip-times">{flight.departure_time_display} – {flight.arrival_time_display}</span>
            </span>
            <span className="trip-flight">
              {flight.flight_number}
              <span className="trip-sub">{booking.passenger_name}</span>
            </span>
            <span className="trip-price num">{formatPrice(flight.price)}</span>
          </>
        ) : (
          <span className="trip-route">Flight details unavailable</span>
        )}
        <span className={'trip-state is-' + state}>
          {cancelled ? 'Cancelled' : departed ? 'Departed' : 'Confirmed'}
        </span>
      </Link>
    </li>
  );
}

export default function TripsPage() {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api('GET', '/bookings/my').then(setBookings).catch(setError);
  }, []);

  const upcoming = [];
  const past = [];
  if (bookings) {
    for (const b of bookings) {
      const flight = typeof b.flight_id === 'object' ? b.flight_id : null;
      const isUpcoming = b.status === 'confirmed' && flight && !hasDeparted(flight);
      (isUpcoming ? upcoming : past).push(b);
    }
    // Soonest flight first for the trips still to come.
    upcoming.sort((a, b) =>
      new Date(a.flight_id.flight_date) - new Date(b.flight_id.flight_date) ||
      a.flight_id.departure_time - b.flight_id.departure_time
    );
  }

  return (
    <div className="trips">
      <header className="page-head">
        <div>
          <h1>My trips</h1>
          <p>Open a booking to see its ticket or cancel it.</p>
        </div>
        <Link to="/find" className="btn">Find a booking by PNR</Link>
      </header>

      {error ? (
        <div className="notice notice-info" role="alert">
          <p className="notice-title">Could not load your trips</p>
          <p>{error.message}</p>
        </div>
      ) : bookings === null ? (
        <div aria-busy="true" className="trip-skeletons">
          <div className="skeleton" /><div className="skeleton" /><div className="skeleton" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="results-empty">
          <h2>No trips yet</h2>
          <p>Draw a route on the chart, pick a flight, and your booking will be listed here with its PNR.</p>
          <Link to="/" className="btn btn-primary">Search flights</Link>
        </div>
      ) : (
        <>
          <section className="trip-group" aria-labelledby="up-h">
            <h2 id="up-h" className="trip-group-head">
              Upcoming <span className="num">{upcoming.length}</span>
            </h2>
            {upcoming.length === 0 ? (
              <p className="trip-none">Nothing booked ahead. <Link to="/">Search flights</Link></p>
            ) : (
              <ul className="trip-list">{upcoming.map((b) => <TripRow key={b._id} booking={b} />)}</ul>
            )}
          </section>

          {past.length > 0 && (
            <section className="trip-group" aria-labelledby="past-h">
              <h2 id="past-h" className="trip-group-head">
                Past and cancelled <span className="num">{past.length}</span>
              </h2>
              <ul className="trip-list">{past.map((b) => <TripRow key={b._id} booking={b} />)}</ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
