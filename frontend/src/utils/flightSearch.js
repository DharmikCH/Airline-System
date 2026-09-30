import { api } from '../api.js';

// Search results remembered for this session, keyed by route and day.
//
// The date strip asks for seven days at once, and people click back and forth
// between them. Remembering answers means a day already seen costs nothing.
// The results list itself always passes fresh: true, because seat counts
// change the moment anyone books.
const cache = new Map();

export async function searchFlights(from, to, date, { fresh = false } = {}) {
  const key = from + '|' + to + '|' + date;
  if (!fresh && cache.has(key)) {
    return cache.get(key);
  }
  const query = new URLSearchParams({ from, to, date });
  const flights = await api('GET', '/flights/search?' + query);
  cache.set(key, flights);
  return flights;
}

// After a booking or cancellation, seat counts are stale everywhere.
export function clearSearchCache() {
  cache.clear();
}

export function lowestAvailableFare(flights) {
  const open = flights.filter((f) => f.available_seats > 0);
  if (open.length === 0) return null;
  return Math.min(...open.map((f) => f.price));
}
