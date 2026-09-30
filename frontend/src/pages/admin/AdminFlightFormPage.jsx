import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { CITIES } from '../../lib/cities.js';
import { flightDateInput, todayInput } from '../../lib/format.js';

// The API stores times as minutes since midnight. A time input works in
// "HH:MM", so these two convert between them for the form only.
function minutesToInput(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return h + ':' + m;
}

function inputToMinutes(value) {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

const EMPTY = {
  flight_number: '',
  airline_name: '',
  departure_city: '',
  arrival_city: '',
  flight_date: todayInput(),
  departure_time: '',
  arrival_time: '',
  total_seats: '180',
  price: ''
};

export default function AdminFlightFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [original, setOriginal] = useState(null);
  const [airlines, setAirlines] = useState([]);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Airline names already on the schedule, offered as suggestions.
  useEffect(() => {
    api('GET', '/flights')
      .then((list) => setAirlines([...new Set(list.map((f) => f.airline_name))].sort()))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!editing) return;
    api('GET', '/flights/' + id)
      .then(({ flight }) => {
        setOriginal(flight);
        setForm({
          flight_number: flight.flight_number,
          airline_name: flight.airline_name,
          departure_city: flight.departure_city,
          arrival_city: flight.arrival_city,
          flight_date: flightDateInput(flight.flight_date),
          departure_time: minutesToInput(flight.departure_time),
          arrival_time: minutesToInput(flight.arrival_time),
          total_seats: String(flight.total_seats),
          price: String(flight.price)
        });
      })
      .catch(setLoadError);
  }, [editing, id]);

  function set(field, value) {
    setForm({ ...form, [field]: value });
    setErrors({ ...errors, [field]: undefined });
  }

  function validate() {
    const e = {};
    if (!form.flight_number.trim()) e.flight_number = 'Enter a flight number, e.g. 6E-2134.';
    if (!form.airline_name.trim()) e.airline_name = 'Enter the airline.';
    if (!form.departure_city) e.departure_city = 'Choose the departure airport.';
    if (!form.arrival_city) e.arrival_city = 'Choose the arrival airport.';
    if (form.departure_city && form.departure_city === form.arrival_city) e.arrival_city = 'Arrival must differ from departure.';
    if (!form.flight_date) e.flight_date = 'Choose a date.';
    if (!form.departure_time) e.departure_time = 'Enter the departure time.';
    if (!form.arrival_time) e.arrival_time = 'Enter the arrival time.';
    if (!/^\d+$/.test(form.total_seats) || Number(form.total_seats) < 1) e.total_seats = 'Seats must be a whole number, at least 1.';
    if (!/^\d+$/.test(form.price)) e.price = 'Enter the fare in rupees, whole numbers only.';
    return e;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const body = {
      flight_number: form.flight_number.trim().toUpperCase(),
      airline_name: form.airline_name.trim(),
      departure_city: form.departure_city,
      arrival_city: form.arrival_city,
      flight_date: form.flight_date,
      departure_time: inputToMinutes(form.departure_time),
      arrival_time: inputToMinutes(form.arrival_time),
      total_seats: Number(form.total_seats),
      price: Number(form.price)
    };

    setBusy(true);
    setServerError(null);
    try {
      const data = editing
        ? await api('PUT', '/flights/' + id, body)
        : await api('POST', '/flights', body);
      navigate('/admin/flights', { state: { saved: data.flight.flight_number } });
    } catch (err) {
      setBusy(false);
      if (err.code === 'SEATS_BELOW_BOOKINGS' || err.code === 'NEGATIVE_AVAILABLE_SEATS') {
        const sold = original.total_seats - original.available_seats;
        setErrors({ total_seats: `Too few: ${sold} seats are already sold, so the total must be at least ${sold}.` });
      } else {
        setServerError(err.message);
      }
    }
  }

  if (loadError) {
    return (
      <div className="admin">
        <div className="notice notice-info" role="alert">
          <p className="notice-title">Could not load this flight</p>
          <p>{loadError.message}</p>
        </div>
      </div>
    );
  }

  if (editing && !original) {
    return <div className="skeleton" style={{ height: 480 }} aria-busy="true" />;
  }

  const booked = original ? original.total_seats - original.available_seats : 0;

  function field(name, label, input, hint) {
    return (
      <div className="field">
        <label className="label" htmlFor={'f-' + name}>{label}</label>
        {input}
        {errors[name]
          ? <span id={'f-' + name + '-err'} className="field-error">{errors[name]}</span>
          : hint && <span className="field-hint">{hint}</span>}
      </div>
    );
  }

  function inputProps(name) {
    return {
      id: 'f-' + name,
      value: form[name],
      onChange: (e) => set(name, e.target.value),
      'aria-invalid': Boolean(errors[name]),
      'aria-describedby': errors[name] ? 'f-' + name + '-err' : undefined
    };
  }

  return (
    <div className="admin">
      <header className="page-head">
        <div>
          <h1>{editing ? 'Edit ' + original.flight_number : 'New flight'}</h1>
          <p>
            {editing
              ? `${booked} ${booked === 1 ? 'seat is' : 'seats are'} booked on this flight. Seats left adjust automatically when you change the total.`
              : 'Seats left start equal to the total and move as passengers book and cancel.'}
          </p>
        </div>
        <Link to="/admin/flights" className="btn">Back to flights</Link>
      </header>

      <form className="flight-form" onSubmit={handleSubmit} noValidate>
        <fieldset className="form-block">
          <legend className="label">Flight</legend>
          <div className="form-grid">
            {field('flight_number', 'Flight number', <input className="input num" {...inputProps('flight_number')} placeholder="6E-2134" />)}
            {field('airline_name', 'Airline', (
              <>
                <input className="input" list="airline-list" {...inputProps('airline_name')} />
                <datalist id="airline-list">{airlines.map((a) => <option key={a} value={a} />)}</datalist>
              </>
            ))}
          </div>
        </fieldset>

        <fieldset className="form-block">
          <legend className="label">Route and time</legend>
          <div className="form-grid form-grid-3">
            {field('departure_city', 'From', (
              <select className="select" {...inputProps('departure_city')}>
                <option value="">Choose</option>
                {CITIES.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.name}</option>)}
              </select>
            ))}
            {field('arrival_city', 'To', (
              <select className="select" {...inputProps('arrival_city')}>
                <option value="">Choose</option>
                {CITIES.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.name}</option>)}
              </select>
            ))}
            {field('flight_date', 'Date', <input className="input num" type="date" {...inputProps('flight_date')} />, 'Dates are stored in UTC.')}
            {field('departure_time', 'Departs', <input className="input num" type="time" {...inputProps('departure_time')} />)}
            {field('arrival_time', 'Arrives', <input className="input num" type="time" {...inputProps('arrival_time')} />, 'An earlier time than departure means it lands the next day.')}
          </div>
        </fieldset>

        <fieldset className="form-block">
          <legend className="label">Seats and fare</legend>
          <div className="form-grid form-grid-3">
            {field('total_seats', 'Total seats', <input className="input num" inputMode="numeric" {...inputProps('total_seats')} />,
              editing ? `Cannot go below the ${booked} already booked.` : null)}
            {editing && (
              <div className="field">
                <label className="label" htmlFor="f-available">Seats left</label>
                <input id="f-available" className="input num" value={original.available_seats} readOnly />
                <span className="field-hint">Set by bookings, not editable.</span>
              </div>
            )}
            {field('price', 'Fare (₹)', <input className="input num" inputMode="numeric" {...inputProps('price')} />)}
          </div>
        </fieldset>

        {serverError && (
          <div className="notice notice-info" role="alert">
            <p className="notice-title">Could not save the flight</p>
            <p>{serverError}</p>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-large" disabled={busy} data-busy={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Add flight'}
          </button>
          <Link to="/admin/flights" className="btn btn-large">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
