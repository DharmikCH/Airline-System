import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DateStrip from '../components/DateStrip.jsx';
import FilterBar, { DEFAULT_FILTERS, applyFilters } from '../components/FilterBar.jsx';
import FlightCard, { FlightCardSkeleton } from '../components/FlightCard.jsx';
import SearchForm from '../components/SearchForm.jsx';
import { useToast } from '../components/Toaster.jsx';
import { cityName } from '../utils/cities.js';
import { searchFlights } from '../utils/flightSearch.js';
import { formatFlightDateLong } from '../utils/format.js';
import { addDaysISO, isValidISODate } from '../utils/time.js';
import './pages.css';

export default function SearchResults() {
  const [params, setParams] = useSearchParams();
  const toast = useToast();

  const from = (params.get('from') || '').toUpperCase();
  const to = (params.get('to') || '').toUpperCase();
  const date = params.get('date') || '';
  const valid = Boolean(from && to && from !== to && isValidISODate(date));

  const [result, setResult] = useState({ loading: true, flights: [], error: null });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [finding, setFinding] = useState(false);

  useEffect(() => {
    if (!valid) return;
    let ignore = false;
    setResult({ loading: true, flights: [], error: null });
    // fresh: seat counts change whenever anyone books, so the list the user
    // is about to choose from must never come from the cache.
    searchFlights(from, to, date, { fresh: true })
      .then((flights) => {
        if (!ignore) setResult({ loading: false, flights, error: null });
      })
      .catch((err) => {
        if (!ignore) setResult({ loading: false, flights: [], error: err.message });
      });
    return () => {
      ignore = true;
    };
  }, [from, to, date, valid]);

  function pickDate(day) {
    setParams({ from, to, date: day });
  }

  // Look ahead up to two weeks for the first day that still has a seat.
  async function findNextFlight() {
    setFinding(true);
    const days = Array.from({ length: 14 }, (_, i) => addDaysISO(date, i + 1));
    const answers = await Promise.all(
      days.map((day) =>
        searchFlights(from, to, day)
          .then((flights) => ({ day, flights }))
          .catch(() => ({ day, flights: [] }))
      )
    );
    setFinding(false);
    const hit = answers.find((a) => a.flights.some((f) => f.available_seats > 0));
    if (hit) {
      pickDate(hit.day);
    } else {
      toast('No seats on this route in the next two weeks.', 'error');
    }
  }

  if (!valid) {
    return (
      <div className="container">
        <div className="page-head">
          <div>
            <h1>Find a flight</h1>
            <p>Choose where you are flying from, where to, and when.</p>
          </div>
        </div>
        <SearchForm />
      </div>
    );
  }

  const shown = applyFilters(result.flights, filters);
  const hasFlights = result.flights.length > 0;

  return (
    <div className="container">
      <SearchForm key={from + to + date} initial={{ from, to, date }} compact />

      <div className="results-head">
        <h1>
          {cityName(from)} <span className="muted">to</span> {cityName(to)}
        </h1>
        <p className="text-2">
          {formatFlightDateLong(date + 'T00:00:00Z')}
          {!result.loading && hasFlights && ' · ' + result.flights.length + (result.flights.length === 1 ? ' flight' : ' flights')}
        </p>
      </div>

      <DateStrip key={from + to} from={from} to={to} date={date} onPick={pickDate} />

      <div className={'results' + (hasFlights ? '' : ' results--single')}>
        {hasFlights && <FilterBar flights={result.flights} filters={filters} onChange={setFilters} />}

        <div className="results__list">
          {result.loading && [0, 1, 2].map((i) => <FlightCardSkeleton key={i} />)}

          {!result.loading && result.error && (
            <div className="banner banner--error" role="alert">{result.error}</div>
          )}

          {!result.loading && !result.error && !hasFlights && (
            <div className="card empty">
              <h3>No flights on this day</h3>
              <p>Nothing is scheduled from {cityName(from)} to {cityName(to)} on this date.</p>
              <button className="btn btn--primary" onClick={findNextFlight} disabled={finding}>
                {finding ? 'Searching…' : 'Find the next available flight'}
              </button>
            </div>
          )}

          {!result.loading && hasFlights && shown.length === 0 && (
            <div className="card empty">
              <h3>No flights match your filters</h3>
              <p>Try widening the departure time or including more airlines.</p>
              <button className="btn btn--ghost" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset filters</button>
            </div>
          )}

          {!result.loading &&
            shown.map((flight, i) => (
              // A short stagger so the list cascades in, capped so a long
              // list never keeps the user waiting.
              <FlightCard key={flight._id} flight={flight} style={{ animationDelay: Math.min(i * 40, 240) + 'ms' }} />
            ))}
        </div>
      </div>
    </div>
  );
}
