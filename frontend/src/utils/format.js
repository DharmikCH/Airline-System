const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

export function formatPrice(amount) {
  return rupees.format(amount);
}

// A flight_date is a calendar day stored at UTC midnight. Formatting it in the
// browser's own timezone would show the previous day west of UTC, so these
// always format in UTC.
const shortDay = new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' });
const longDay = new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export function formatFlightDate(value) {
  return shortDay.format(new Date(value));
}

export function formatFlightDateLong(value) {
  return longDay.format(new Date(value));
}

// For a real moment in time, like when a booking was made, the viewer's own
// timezone is the right one.
const timestamp = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function formatTimestamp(value) {
  return timestamp.format(new Date(value));
}

export function genderLabel(code) {
  return { F: 'Female', M: 'Male', O: 'Other' }[code] || null;
}
