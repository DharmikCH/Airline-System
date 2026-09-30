import { durationMinutes, timeBand } from '../utils/time.js';
import './flights.css';

export const DEFAULT_FILTERS = {
  sort: 'cheapest',
  airlines: [],
  bands: [],
  hideSoldOut: false
};

const SORTS = [
  ['cheapest', 'Cheapest'],
  ['earliest', 'Earliest'],
  ['fastest', 'Fastest']
];

const BANDS = [
  ['morning', 'Morning', '05:00–12:00'],
  ['afternoon', 'Afternoon', '12:00–17:00'],
  ['evening', 'Evening', '17:00–21:00'],
  ['night', 'Night', '21:00–05:00']
];

// Sorting and filtering happen entirely in the browser on the list search
// already returned, so changing a filter never costs a request.
export function applyFilters(flights, filters) {
  let list = flights.filter((f) => {
    if (filters.hideSoldOut && f.available_seats === 0) return false;
    if (filters.airlines.length && !filters.airlines.includes(f.airline_name)) return false;
    if (filters.bands.length && !filters.bands.includes(timeBand(f.departure_time))) return false;
    return true;
  });

  const byPrice = (a, b) => a.price - b.price;
  const byDeparture = (a, b) => a.departure_time - b.departure_time;
  const byDuration = (a, b) => durationMinutes(a) - durationMinutes(b);
  const order = { cheapest: byPrice, earliest: byDeparture, fastest: byDuration }[filters.sort];

  // Copy before sorting: sort() reorders the array in place.
  return [...list].sort(order);
}

function toggle(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function FilterBar({ flights, filters, onChange }) {
  const airlines = [...new Set(flights.map((f) => f.airline_name))].sort();
  const changed =
    filters.airlines.length > 0 || filters.bands.length > 0 || filters.hideSoldOut || filters.sort !== 'cheapest';

  return (
    <aside className="filters card" aria-label="Filters">
      <div className="filters__group">
        <h3>Sort by</h3>
        <div className="segmented">
          {SORTS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filters.sort === value}
              onClick={() => onChange({ ...filters, sort: value })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="filters__group">
        <h3>Departure time</h3>
        <div className="chips">
          {BANDS.map(([value, label, range]) => (
            <button
              key={value}
              type="button"
              className="chip"
              aria-pressed={filters.bands.includes(value)}
              onClick={() => onChange({ ...filters, bands: toggle(filters.bands, value) })}
            >
              <strong>{label}</strong>
              <span>{range}</span>
            </button>
          ))}
        </div>
      </div>

      {airlines.length > 0 && (
        <div className="filters__group">
          <h3>Airlines</h3>
          {airlines.map((name) => (
            <label key={name} className="check">
              <input
                type="checkbox"
                checked={filters.airlines.includes(name)}
                onChange={() => onChange({ ...filters, airlines: toggle(filters.airlines, name) })}
              />
              <span>{name}</span>
              <span className="muted nums">{flights.filter((f) => f.airline_name === name).length}</span>
            </label>
          ))}
        </div>
      )}

      <div className="filters__group">
        <label className="check">
          <input
            type="checkbox"
            checked={filters.hideSoldOut}
            onChange={(e) => onChange({ ...filters, hideSoldOut: e.target.checked })}
          />
          <span>Hide sold-out flights</span>
        </label>
      </div>

      {changed && (
        <button type="button" className="btn btn--quiet btn--sm" onClick={() => onChange(DEFAULT_FILTERS)}>
          Reset filters
        </button>
      )}
    </aside>
  );
}
