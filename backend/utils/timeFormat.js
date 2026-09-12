// Shared formatting for flight times.
//
// Times are stored as minutes since midnight. Every flight the API returns
// carries three extra display fields so that no screen has to format times
// itself — several people are building the frontend in parallel, and three
// separate formatting functions would eventually disagree with each other.

// 630 -> "10:30". padStart keeps the leading zero on times like 09:05.
function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// 630, 765 -> "2h 15m".
// A flight that lands earlier in the day than it left is an overnight flight,
// so a negative difference means the arrival is on the next day: add 1440
// minutes (24 hours) to get the real duration.
function formatDuration(departureMinutes, arrivalMinutes) {
  let total = arrivalMinutes - departureMinutes;
  if (total < 0) {
    total = total + 1440;
  }
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${hours}h ${mins}m`;
}

// Takes a flight (a Mongoose document or a plain object) and returns a plain
// object with the three derived display fields added. Every endpoint that
// returns a flight passes it through here.
function addDisplayFields(flight) {
  const obj = flight.toObject ? flight.toObject() : flight;
  return {
    ...obj,
    departure_time_display: formatMinutes(obj.departure_time),
    arrival_time_display: formatMinutes(obj.arrival_time),
    duration_display: formatDuration(obj.departure_time, obj.arrival_time)
  };
}

module.exports = { formatMinutes, formatDuration, addDisplayFields };
