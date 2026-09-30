import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import BriefingStrip from '../components/BriefingStrip.jsx';
import FlightRow, { FlightRowSkeleton } from '../components/FlightRow.jsx';
import RouteInset from '../components/RouteInset.jsx';
import { api } from '../lib/api.js';
import { cityName, findCity, formatTrack, routeGeometry } from '../lib/cities.js';
import { formatSearchDate, shiftDate, todayInput } from '../lib/format.js';
import { saveLastSearch, searchUrl } from '../lib/lastSearch.js';

export default function ResultsPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const from = (params.get('from') || '').toUpperCase();
  const to = (params.get('to') || '').toUpperCase();
  const date = params.get('date') || '';

  const [form, setForm] = useState({ from, to, date });
  const [flights, setFlights] = useState(null);
  const [error, setError] = useState(null);

  const validRoute = findCity(from) && findCity(to) && from !== to && /^\d{4}-\d{2}-\d{2}$/.test(date);

  // Keep the form in step with the URL when the day stepper or back button
  // changes it, then fetch the flights for that route and day.
  useEffect(() => {
    setForm({ from, to, date });
    if (!validRoute) return;

    saveLastSearch({ from, to, date });
    let cancelled = false;
    setFlights(null);
    setError(null);

    api('GET', `/flights/search?from=${from}&to=${to}&date=${date}`)
      .then((list) => { if (!cancelled) setFlights(list); })
      .catch((err) => { if (!cancelled) setError(err); });

    return () => { cancelled = true; };
  }, [from, to, date, validRoute]);

  function go(value) {
    navigate(searchUrl(value));
  }

  if (!validRoute) {
    return (
      <div className="results">
        <div className="notice notice-info">
          <p className="notice-title">That search is incomplete</p>
          <p>Choose two different airports and a date to see flights.</p>
        </div>
        <p style={{ marginTop: 'var(--s4)' }}><Link to="/">Back to the chart</Link></p>
      </div>
    );
  }

  const geometry = routeGeometry(from, to);
  const previousDay = shiftDate(date, -1);
  const nextDay = shiftDate(date, 1);
  const canGoBack = previousDay >= todayInput();

  return (
    <div className="results">
      <BriefingStrip value={form} onChange={setForm} onSubmit={go} compact />

      <header className="results-head">
        <div className="results-route">
          <div className="route-axis">
            <span className="route-code">{from}</span>
            <span className="route-line" aria-hidden="true" />
            <span className="route-code">{to}</span>
          </div>
          <h1 className="results-title">
            {cityName(from)} to {cityName(to)}
            <span className="results-sub num">
              {geometry.distance} NM · Track {formatTrack(geometry.track)}
            </span>
          </h1>
        </div>

        <nav className="day-stepper" aria-label="Change day">
          <button type="button" className="btn" onClick={() => go({ from, to, date: previousDay })} disabled={!canGoBack}>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M13 7H2M6 2 1 7l5 5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
            <span className="visually-hidden">Previous day</span>
          </button>
          <span className="day-current num" aria-live="polite">{formatSearchDate(date)}</span>
          <button type="button" className="btn" onClick={() => go({ from, to, date: nextDay })}>
            <span className="visually-hidden">Next day</span>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 7h11M8 2l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
          </button>
        </nav>
      </header>

      <div className="results-body">
        <div className="results-main">
          {error ? (
            <div className="notice notice-info" role="alert">
              <p className="notice-title">Could not load flights</p>
              <p>{error.message}</p>
            </div>
          ) : flights === null ? (
            <ul className="flight-list" aria-busy="true" aria-label="Loading flights">
              <FlightRowSkeleton />
              <FlightRowSkeleton />
              <FlightRowSkeleton />
            </ul>
          ) : flights.length === 0 ? (
            <div className="results-empty">
              <h2>No flights from {cityName(from)} to {cityName(to)} on {formatSearchDate(date)}</h2>
              <p>Schedules vary by day. Try the next day, or pick another route on the chart.</p>
              <div className="results-empty-actions">
                <button type="button" className="btn btn-primary" onClick={() => go({ from, to, date: nextDay })}>
                  Try {formatSearchDate(nextDay)}
                </button>
                <Link to="/" className="btn">Change route</Link>
              </div>
            </div>
          ) : (
            <>
              <p className="results-count">
                <span className="num">{flights.length}</span> {flights.length === 1 ? 'flight' : 'flights'}, earliest departure first
              </p>
              <ul className="flight-list">
                {flights.map((flight) => <FlightRow key={flight._id} flight={flight} />)}
              </ul>
            </>
          )}
        </div>

        <aside className="results-plan" aria-label="Route plan">
          <span className="label">Plan view</span>
          <RouteInset from={from} to={to} />
        </aside>
      </div>
    </div>
  );
}
