// Date and time helpers.
//
// Display strings for times ("06:10", "2h 35m") always come from the API's
// *_display fields. Nothing here formats a time for display; these helpers
// only compare, sort, and convert form input.

const DAY_MS = 24 * 60 * 60 * 1000;

// The moment a flight leaves. Mirrors departureInstant() in
// backend/controllers/bookingController.js exactly, so the UI never offers a
// cancel button that the API would then refuse.
export function departureInstant(flight) {
  return new Date(new Date(flight.flight_date).getTime() + flight.departure_time * 60 * 1000);
}

export function hasDeparted(flight) {
  return departureInstant(flight) <= new Date();
}

// Minutes in the air, for sorting by "fastest". Same overnight rule as the
// backend: a negative difference means landing the next day.
export function durationMinutes(flight) {
  let total = flight.arrival_time - flight.departure_time;
  if (total < 0) total += 1440;
  return total;
}

// A flight that lands earlier in the clock than it left arrives the next day.
export function arrivesNextDay(flight) {
  return flight.arrival_time < flight.departure_time;
}

// "14:30" from an <input type="time"> into minutes since midnight.
export function hhmmToMinutes(value) {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

// Dates in the API are calendar days stored at UTC midnight, so "today" and
// day arithmetic are done in UTC as well. Doing them in local time would put
// Indian users one day out for part of every night.
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(iso, days) {
  const d = new Date(iso + 'T00:00:00Z');
  return new Date(d.getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

export function isValidISODate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !isNaN(new Date(value + 'T00:00:00Z').getTime());
}

// Which part of the day a flight leaves in, for the results filter.
export function timeBand(minutes) {
  if (minutes >= 300 && minutes < 720) return 'morning';
  if (minutes >= 720 && minutes < 1020) return 'afternoon';
  if (minutes >= 1020 && minutes < 1260) return 'evening';
  return 'night';
}
