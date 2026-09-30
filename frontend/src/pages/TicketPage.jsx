import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import PnrMark from '../components/PnrMark.jsx';
import RouteInset from '../components/RouteInset.jsx';
import { api } from '../lib/api.js';
import { findCity } from '../lib/cities.js';
import { flightStatus, formatFlightDate, formatPrice, hasDeparted } from '../lib/format.js';

export default function TicketPage() {
  const { pnr } = useParams();
  const location = useLocation();
  const justBooked = Boolean(location.state && location.state.justBooked);

  const [booking, setBooking] = useState(null);
  const [flight, setFlight] = useState(null);
  const [error, setError] = useState(null);

  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [justCancelled, setJustCancelled] = useState(false);

  // The PNR endpoint returns flight_id as a plain id string, so the flight
  // details come from a second request.
  useEffect(() => {
    let stale = false;
    setError(null);
    api('GET', '/bookings/pnr/' + encodeURIComponent(pnr))
      .then(async (data) => {
        if (stale) return;
        setBooking(data.booking);
        const f = await api('GET', '/flights/' + data.booking.flight_id);
        if (!stale) setFlight(f.flight);
      })
      .catch((err) => { if (!stale) setError(err); });
    return () => { stale = true; };
  }, [pnr]);

  async function cancelBooking() {
    setCancelling(true);
    setCancelError(null);
    try {
      const data = await api('PUT', '/bookings/cancel/' + booking._id);
      setBooking(data.booking);
      setJustCancelled(true);
      setConfirming(false);
      // The seat went back on sale; refresh the count shown on the ticket.
      const f = await api('GET', '/flights/' + booking.flight_id);
      setFlight(f.flight);
    } catch (err) {
      if (err.code === 'BOOKING_NOT_CONFIRMED') {
        // Already cancelled, perhaps in another tab. Show the real state.
        setBooking({ ...booking, status: 'cancelled' });
        setConfirming(false);
      } else {
        setCancelError(err);
      }
    } finally {
      setCancelling(false);
    }
  }

  if (error) {
    const notFound = error.code === 'BOOKING_NOT_FOUND';
    return (
      <div className="ticket-page">
        <div className="notice notice-info" role="alert">
          <p className="notice-title">{notFound ? 'No booking with that PNR' : 'Could not load this booking'}</p>
          <p>{notFound ? 'Check the six characters, and make sure you are signed in to the account that made the booking.' : error.message}</p>
        </div>
        <div className="ticket-actions">
          <Link to="/find" className="btn btn-primary">Try another PNR</Link>
          <Link to="/trips" className="btn">My trips</Link>
        </div>
      </div>
    );
  }

  if (!booking || !flight) {
    return (
      <div className="ticket-page" aria-busy="true">
        <div className="skeleton" style={{ height: 180 }} />
        <div className="skeleton" style={{ height: 240 }} />
      </div>
    );
  }

  const cancelled = booking.status === 'cancelled';
  const departed = hasDeparted(flight);
  const origin = findCity(flight.departure_city);
  const destination = findCity(flight.arrival_city);

  return (
    <article className={'ticket-page' + (cancelled ? ' is-cancelled' : '')}>
      {justBooked && !cancelled && (
        <p className="ticket-banner" role="status">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M3 9.5 7 13l8-9" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
          Booked. Your seat is reserved and this PNR is yours.
        </p>
      )}
      {justCancelled && (
        <p className="ticket-banner is-cancel" role="status">
          Booking cancelled. The seat has gone back on sale.
        </p>
      )}

      <div className="ticket">
        <header className="ticket-head">
          <div className="ticket-pnr">
            <span className="label">PNR · Booking reference</span>
            <PnrMark pnr={booking.pnr} reveal={justBooked && !cancelled} />
            <p className="ticket-pnr-note">
              Airway PNRs never use O, I, 0 or 1, so this code cannot be misread over the phone or off a printout.
            </p>
          </div>
          <div className={'ticket-status is-' + booking.status}>
            <span className="label">Status</span>
            <span className="ticket-status-word">{cancelled ? 'Cancelled' : departed ? 'Departed' : 'Confirmed'}</span>
          </div>
        </header>

        <div className="plate-top ticket-top">
          <div className="ticket-route">
            <div className="plate-end">
              <span className="plate-time num">{flight.departure_time_display}</span>
              <span className="plate-code">{flight.departure_city}</span>
              <span className="plate-city">{origin ? origin.name : ''}</span>
            </div>
            <div className="plate-leg">
              <span className="plate-leg-duration">{flight.duration_display}</span>
              <span className="route-line" aria-hidden="true" />
              <span className="plate-leg-data">{formatFlightDate(flight.flight_date)}</span>
            </div>
            <div className="plate-end plate-end-arr">
              <span className="plate-time num">{flight.arrival_time_display}</span>
              <span className="plate-code">{flight.arrival_city}</span>
              <span className="plate-city">{destination ? destination.name : ''}</span>
            </div>
          </div>
          <div className="plate-plan">
            <RouteInset from={flight.departure_city} to={flight.arrival_city} />
          </div>
        </div>

        <dl className="plate-strip ticket-facts">
          <div>
            <dt className="label">Passenger</dt>
            <dd>{booking.passenger_name}</dd>
          </div>
          {booking.passenger_age != null && (
            <div>
              <dt className="label">Age</dt>
              <dd>{booking.passenger_age}</dd>
            </div>
          )}
          {booking.passenger_gender && (
            <div>
              <dt className="label">Gender</dt>
              <dd>{booking.passenger_gender}</dd>
            </div>
          )}
          <div>
            <dt className="label">Flight</dt>
            <dd>{flight.flight_number} · {flight.airline_name}</dd>
          </div>
          <div>
            <dt className="label">Fare</dt>
            <dd>{formatPrice(flight.price)}</dd>
          </div>
          <div>
            <dt className="label">Booked on</dt>
            <dd>{new Date(booking.booking_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</dd>
          </div>
        </dl>

        {flightStatus(flight) === 'withdrawn' && !cancelled && (
          <div className="ticket-note">
            <div className="notice notice-refusal">
              <p className="notice-title">The airline has withdrawn this flight</p>
              <p>Your booking is still on record. Cancel it to release the seat, or contact the airline.</p>
            </div>
          </div>
        )}
      </div>

      <div className="ticket-actions">
        {!cancelled && !departed && !confirming && (
          <button type="button" className="btn" onClick={() => setConfirming(true)}>Cancel booking</button>
        )}
        <button type="button" className="btn" onClick={() => window.print()}>Print ticket</button>
        <Link to="/trips" className="btn btn-quiet">All my trips</Link>
      </div>

      {confirming && (
        <div className="cancel-confirm" role="group" aria-labelledby="cancel-q">
          <p id="cancel-q" className="notice-title">Cancel {booking.pnr}?</p>
          <p>{booking.passenger_name}’s seat on {flight.flight_number} goes back on sale straight away. This cannot be undone.</p>
          {cancelError && (
            <p className="field-error" role="alert">
              {cancelError.code === 'FLIGHT_ALREADY_DEPARTED' ? 'This flight has already departed, so it can no longer be cancelled.' : cancelError.message}
            </p>
          )}
          <div className="ticket-actions">
            <button type="button" className="btn btn-primary" onClick={cancelBooking} disabled={cancelling} data-busy={cancelling}>
              {cancelling ? 'Cancelling…' : 'Yes, cancel booking'}
            </button>
            <button type="button" className="btn" onClick={() => setConfirming(false)} disabled={cancelling}>Keep booking</button>
          </div>
        </div>
      )}
    </article>
  );
}
