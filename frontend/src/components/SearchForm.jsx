import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CITIES } from '../utils/cities.js';
import { addDaysISO, todayISO } from '../utils/time.js';
import './flights.css';

// The search widget, used large on the home page and compact above results.
// The results page remounts it with a key whenever the URL changes, so it
// always starts from whatever is being shown.
export default function SearchForm({ initial = {}, compact = false }) {
  const navigate = useNavigate();
  const [from, setFrom] = useState(initial.from || 'BLR');
  const [to, setTo] = useState(initial.to || 'DEL');
  const [date, setDate] = useState(initial.date || addDaysISO(todayISO(), 1));
  const [error, setError] = useState('');

  function swap() {
    setFrom(to);
    setTo(from);
  }

  function submit(e) {
    e.preventDefault();
    if (from === to) {
      setError('Departure and destination must be different cities.');
      return;
    }
    if (!date || date < todayISO()) {
      setError('Choose today or a later date.');
      return;
    }
    setError('');
    navigate('/search?' + new URLSearchParams({ from, to, date }));
  }

  return (
    <form className={'search' + (compact ? ' search--compact' : '')} onSubmit={submit}>
      <div className="search__fields">
        <label className="field search__city">
          <span>From</span>
          <select className="input" value={from} onChange={(e) => setFrom(e.target.value)}>
            {CITIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
            ))}
          </select>
        </label>

        <button type="button" className="search__swap" onClick={swap} aria-label="Swap departure and destination">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />
          </svg>
        </button>

        <label className="field search__city">
          <span>To</span>
          <select className="input" value={to} onChange={(e) => setTo(e.target.value)}>
            {CITIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
            ))}
          </select>
        </label>

        <label className="field search__date">
          <span>Departure</span>
          <input className="input" type="date" value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)} />
        </label>

        <button type="submit" className={'btn btn--primary search__go' + (compact ? '' : ' btn--lg')}>
          Search flights
        </button>
      </div>
      {error && <p className="search__error" role="alert">{error}</p>}
    </form>
  );
}
