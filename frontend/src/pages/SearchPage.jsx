import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BriefingStrip from '../components/BriefingStrip.jsx';
import RouteChart from '../components/RouteChart.jsx';
import { cityName, findCity, formatTrack, routeGeometry } from '../lib/cities.js';
import { formatSearchDate, todayInput } from '../lib/format.js';
import { readLastSearch, saveLastSearch, searchUrl } from '../lib/lastSearch.js';

export default function SearchPage() {
  const navigate = useNavigate();
  const [lastSearch] = useState(readLastSearch);
  const [search, setSearch] = useState(() => lastSearch || { from: '', to: '', date: todayInput() });

  const { from, to, date } = search;
  const geometry = routeGeometry(from, to);

  // Clicking the chart fills the boxes: first the departure, then the
  // destination. Clicking again once both are set starts a new route.
  function pickOnChart(code) {
    if (!from || (from && to)) {
      setSearch({ ...search, from: code, to: '' });
    } else if (code === from) {
      setSearch({ ...search, from: '' });
    } else {
      setSearch({ ...search, to: code });
    }
  }

  function runSearch(value) {
    saveLastSearch(value);
    navigate(searchUrl(value));
  }

  const showResume = lastSearch && (lastSearch.from !== from || lastSearch.to !== to);

  return (
    <div className="search-desk">
      <h1 className="visually-hidden">Search flights</h1>
      <BriefingStrip value={search} onChange={setSearch} onSubmit={runSearch} />

      <div className="desk">
        <div className="desk-chart">
          <RouteChart from={from} to={to} onPick={pickOnChart} />
        </div>

        <aside className="desk-index" aria-label="Route summary">
          <section className="index-box index-route" aria-live="polite">
            <h2 className="label">Route</h2>
            {from && to && geometry ? (
              <>
                <div className="route-axis">
                  <span className="route-code">{from}</span>
                  <span className="route-line" aria-hidden="true" />
                  <span className="route-code">{to}</span>
                </div>
                <p className="route-names">{cityName(from)} to {cityName(to)}</p>
                <dl className="route-facts">
                  <div>
                    <dt className="label">Distance</dt>
                    <dd className="num">{geometry.distance} NM</dd>
                  </div>
                  <div>
                    <dt className="label">Track</dt>
                    <dd className="num">{formatTrack(geometry.track)}</dd>
                  </div>
                  <div>
                    <dt className="label">Date</dt>
                    <dd className="num">{date ? formatSearchDate(date) : '—'}</dd>
                  </div>
                </dl>
              </>
            ) : from ? (
              <p className="index-prompt">
                Departing <strong>{findCity(from).name}</strong>. Now pick a destination on the chart.
              </p>
            ) : (
              <p className="index-prompt">
                Pick a departure airport on the chart, or use the <strong>From</strong> box above.
              </p>
            )}
          </section>

          {showResume && (
            <section className="index-box index-resume">
              <h2 className="label">Where you stopped</h2>
              <p>
                <span className="num">{lastSearch.from} → {lastSearch.to}</span>, {formatSearchDate(lastSearch.date)}
              </p>
              <Link to={searchUrl(lastSearch)} className="btn btn-quiet">Resume that search</Link>
            </section>
          )}

          <section className="index-box index-legend">
            <h2 className="label">Legend</h2>
            <ul>
              <li>
                <svg width="28" height="28" viewBox="-14 -14 28 28" aria-hidden="true" className="legend-airport">
                  <circle r="8" /><path d="M0 -13V-8M0 8V13M-13 0H-8M8 0H13" /><circle r="3" className="dot" />
                </svg>
                Airport
              </li>
              <li>
                <svg width="28" height="10" viewBox="0 0 28 10" aria-hidden="true">
                  <line x1="0" y1="5" x2="28" y2="5" className="legend-network" />
                </svg>
                Other routes in the network
              </li>
              <li>
                <svg width="28" height="10" viewBox="0 0 28 10" aria-hidden="true">
                  <line x1="0" y1="5" x2="28" y2="5" className="legend-airway" />
                </svg>
                Routes from your departure, until you pick a destination
              </li>
              <li>
                <svg width="28" height="10" viewBox="0 0 28 10" aria-hidden="true">
                  <line x1="0" y1="5" x2="28" y2="5" className="legend-chosen" />
                </svg>
                Your route
              </li>
              <li>
                <span className="legend-hatch" aria-hidden="true" />
                Cannot be booked: sold out, departed or withdrawn
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
