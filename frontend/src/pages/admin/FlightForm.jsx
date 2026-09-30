import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api.js';
import { useToast } from '../../components/Toaster.jsx';
import { CITIES } from '../../utils/cities.js';
import { clearSearchCache } from '../../utils/flightSearch.js';
import { addDaysISO, hhmmToMinutes, todayISO } from '../../utils/time.js';
import AdminNav from './AdminNav.jsx';
import './admin.css';

const AIRLINES = ['IndiGo', 'Air India', 'Vistara', 'SpiceJet', 'Akasa Air', 'Air India Express'];

const EMPTY = {
  flight_number: '',
  airline_name: '',
  departure_city: 'BLR',
  arrival_city: 'DEL',
  flight_date: addDaysISO(todayISO(), 1),
  departure_time: '',
  arrival_time: '',
  total_seats: '180',
  price: ''
};

// One form for both creating and editing. The URL decides which.
export default function FlightForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(editing ? null : EMPTY);
  const [original, setOriginal] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    let ignore = false;
    api('GET', '/flights/' + id)
      .then(({ flight }) => {
        if (ignore) return;
        setOriginal(flight);
        setForm({
          flight_number: flight.flight_number,
          airline_name: flight.airline_name,
          departure_city: flight.departure_city,
          arrival_city: flight.arrival_city,
          flight_date: flight.flight_date.slice(0, 10),
          // The API already supplies "HH:MM", which is exactly what a time
          // input wants, so no formatting happens here.
          departure_time: flight.departure_time_display,
          arrival_time: flight.arrival_time_display,
          total_seats: String(flight.total_seats),
          price: String(flight.price)
        });
      })
      .catch((err) => { if (!ignore) setError(err); });
    return () => { ignore = true; };
  }, [editing, id]);

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);

    if (form.departure_city === form.arrival_city) {
      setError({ message: 'Origin and destination must be different cities.' });
      return;
    }

    const body = {
      flight_number: form.flight_number.trim().toUpperCase(),
      airline_name: form.airline_name.trim(),
      departure_city: form.departure_city,
      arrival_city: form.arrival_city,
      // "YYYY-MM-DD" is read by the backend as midnight UTC, the same way
      // search reads its date, so the flight appears on the day chosen here.
      flight_date: form.flight_date,
      departure_time: hhmmToMinutes(form.departure_time),
      arrival_time: hhmmToMinutes(form.arrival_time),
      total_seats: Number(form.total_seats),
      price: Number(form.price)
    };

    setBusy(true);
    try {
      if (editing) {
        await api('PUT', '/flights/' + id, body);
        toast(body.flight_number + ' updated.', 'success');
      } else {
        await api('POST', '/flights', body);
        toast(body.flight_number + ' added to the schedule.', 'success');
      }
      clearSearchCache();
      navigate('/admin/flights');
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <div className="container narrow">
      <AdminNav />
      <Link to="/admin/flights" className="back-link">← All flights</Link>
      <div className="page-head">
        <div>
          <h1>{editing ? 'Edit ' + (original ? original.flight_number : 'flight') : 'Add a flight'}</h1>
          <p>{editing ? 'Changes apply to new searches straight away.' : 'The flight goes on sale as soon as it is saved.'}</p>
        </div>
      </div>

      {/* Only a load failure shows up here, before there is a form. */}
      {!form && error && <div className="banner banner--error" role="alert">{error.message}</div>}

      {!form && !error && <span className="skeleton" style={{ display: 'block', height: 380, borderRadius: 12 }} />}

      {form && (
        <form className="card card--pad stack" onSubmit={submit}>
          <div className="form-grid">
            <label className="field">
              <span>Flight number</span>
              <input className="input mono" required placeholder="6E-2134" value={form.flight_number} onChange={set('flight_number')} />
            </label>
            <label className="field">
              <span>Airline</span>
              <input className="input" required list="airlines" value={form.airline_name} onChange={set('airline_name')} />
              <datalist id="airlines">
                {AIRLINES.map((a) => <option key={a} value={a} />)}
              </datalist>
            </label>
            <label className="field">
              <span>From</span>
              <select className="input" value={form.departure_city} onChange={set('departure_city')}>
                {CITIES.map((c) => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
              </select>
            </label>
            <label className="field">
              <span>To</span>
              <select className="input" value={form.arrival_city} onChange={set('arrival_city')}>
                {CITIES.map((c) => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
              </select>
            </label>
            <label className="field span-2">
              <span>Date</span>
              <input className="input" type="date" required value={form.flight_date} onChange={set('flight_date')} />
            </label>
            <label className="field">
              <span>Departs</span>
              <input className="input" type="time" required value={form.departure_time} onChange={set('departure_time')} />
            </label>
            <label className="field">
              <span>Arrives</span>
              <input className="input" type="time" required value={form.arrival_time} onChange={set('arrival_time')} />
              <small>An earlier time than departure means it lands the next day.</small>
            </label>
            <label className="field">
              <span>Total seats</span>
              <input className="input" type="number" min="1" required value={form.total_seats} onChange={set('total_seats')} />
              {editing && <small>Lowering this below the number of confirmed bookings is refused.</small>}
            </label>
            <label className="field">
              <span>Fare (₹)</span>
              <input className="input" type="number" min="0" required value={form.price} onChange={set('price')} />
            </label>
            {editing && original && (
              <label className="field span-2">
                <span>Seats available</span>
                <input className="input" readOnly value={original.available_seats} />
                <small>Managed by bookings and cancellations. Changing total seats moves this by the same amount.</small>
              </label>
            )}
          </div>

          {/* A save error appears right above the button that caused it. At
              the top of a long form it would be off-screen, and the save would
              look like it silently did nothing. */}
          {form && error && <div className="banner banner--error" role="alert">{error.message}</div>}

          <div className="row">
            <Link to="/admin/flights" className="btn btn--ghost">Cancel</Link>
            <span className="spacer" />
            <button className="btn btn--primary btn--lg" disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Add flight'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
