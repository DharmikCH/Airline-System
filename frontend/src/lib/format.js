// Formatting helpers. Flight *times* are never formatted here: the backend
// sends departure_time_display, arrival_time_display and duration_display for
// that. These helpers only cover prices and calendar dates.

const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export function formatPrice(amount) {
  return rupees.format(amount);
}

// flight_date is stored at midnight UTC, so it is read back in UTC. Reading it
// in local time would show the previous day for anyone west of Greenwich.
export function formatFlightDate(value, style = 'long') {
  const options = style === 'short'
    ? { day: 'numeric', month: 'short', timeZone: 'UTC' }
    : { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' };
  return new Date(value).toLocaleDateString('en-IN', options);
}

// "2026-09-30" for a Date, in the visitor's local calendar.
export function toDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

export function todayInput() {
  return toDateInput(new Date());
}

// Move a "YYYY-MM-DD" string by a number of days.
export function shiftDate(dateString, days) {
  const [y, m, d] = dateString.split('-').map(Number);
  return toDateInput(new Date(y, m - 1, d + days));
}

// "YYYY-MM-DD" from a stored flight_date, read in UTC like formatFlightDate.
export function flightDateInput(value) {
  return new Date(value).toISOString().slice(0, 10);
}

// A "YYYY-MM-DD" search date as a heading, e.g. "Wed, 30 Sept 2026".
export function formatSearchDate(dateString) {
  return formatFlightDate(dateString + 'T00:00:00Z');
}

// Same rule the backend uses to refuse a booking (FLIGHT_IN_PAST): the flight
// date at midnight UTC plus the departure minutes. Used only to label a row as
// departed; the backend still makes the real decision.
export function hasDeparted(flight) {
  const departure = new Date(flight.flight_date).getTime() + flight.departure_time * 60 * 1000;
  return departure <= Date.now();
}

// Seats at or below this count are called out as "few left".
export const FEW_SEATS = 10;

// Where a flight stands for a passenger, in one word the UI can style.
export function flightStatus(flight) {
  if (!flight.is_active) return 'withdrawn';
  if (hasDeparted(flight)) return 'departed';
  if (flight.available_seats === 0) return 'soldout';
  if (flight.available_seats <= FEW_SEATS) return 'few';
  return 'open';
}
