import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../api.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import TicketView from '../components/TicketView.jsx';
import { useToast } from '../components/Toaster.jsx';
import { clearSearchCache } from '../utils/flightSearch.js';
import { hasDeparted } from '../utils/time.js';
import './pages.css';

export default function Ticket() {
  const { pnr } = useParams();
  const location = useLocation();
  const toast = useToast();
  const justBooked = Boolean(location.state && location.state.justBooked);

  const [booking, setBooking] = useState(null);
  const [flight, setFlight] = useState(null);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        // The PNR lookup returns flight_id as a plain id, so the flight is a
        // second request. The README documents which endpoints populate.
        const out = await api('GET', '/bookings/pnr/' + encodeURIComponent(pnr));
        const flightOut = await api('GET', '/flights/' + out.booking.flight_id);
        if (!ignore) {
          setBooking(out.booking);
          setFlight(flightOut.flight);
        }
      } catch (err) {
        if (!ignore) setError(err);
      }
    }
    load();
    return () => { ignore = true; };
  }, [pnr]);

  async function cancel() {
    setBusy(true);
    try {
      const out = await api('PUT', '/bookings/cancel/' + booking._id);
      setBooking(out.booking);
      clearSearchCache();
      toast('Booking ' + booking.pnr + ' has been cancelled.', 'success');
      setConfirming(false);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    const notFound = error.code === 'BOOKING_NOT_FOUND';
    return (
      <div className="container narrow">
        <div className="card empty">
          <h3>{notFound ? 'Booking not found' : 'Could not load this booking'}</h3>
          <p>
            {notFound
              ? 'There is no booking with reference ' + pnr.toUpperCase() + ' on your account.'
              : error.message}
          </p>
          <Link to="/manage" className="btn btn--primary">Try another reference</Link>
        </div>
      </div>
    );
  }

  if (!booking || !flight) {
    return (
      <div className="container narrow">
        <span className="skeleton" style={{ display: 'block', width: '100%', height: 280, borderRadius: 18 }} />
      </div>
    );
  }

  const canCancel = booking.status === 'confirmed' && !hasDeparted(flight);

  return (
    <div className="container narrow">
      {justBooked && booking.status === 'confirmed' && (
        <div className="banner banner--success confirm-banner">
          <span>
            <strong>You're booked.</strong> Keep your reference <strong className="mono">{booking.pnr}</strong> handy.
            You can find this ticket any time in My trips.
          </span>
        </div>
      )}

      <div className="page-head">
        <div>
          <h1>Your ticket</h1>
          <p>Booking reference {booking.pnr}</p>
        </div>
      </div>

      <TicketView booking={booking} flight={flight} />

      <div className="row ticket-actions">
        <Link to="/trips" className="btn btn--ghost">All my trips</Link>
        <Link to="/" className="btn btn--quiet">Book another flight</Link>
        <span className="spacer" />
        {canCancel && (
          <button className="btn btn--ghost danger-text" onClick={() => setConfirming(true)}>
            Cancel booking
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        title={'Cancel booking ' + booking.pnr + '?'}
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
        danger
        busy={busy}
        onConfirm={cancel}
        onClose={() => setConfirming(false)}
      >
        <p>
          {booking.passenger_name}'s seat on {flight.flight_number} will be released. This cannot be undone.
        </p>
      </ConfirmDialog>
    </div>
  );
}
