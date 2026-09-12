const Flight = require('../models/Flight');
const Booking = require('../models/Booking');
const { addDisplayFields } = require('../utils/timeFormat');
const { sendError } = require('../middleware/errorHandler');

// A field is missing only if it was not sent at all. Checking with !value
// would reject a departure_time of 0 (midnight) and a price of 0, both of
// which are legitimate.
function isMissing(value) {
  return value === undefined || value === null || value === '';
}

// Express turns ?from[$ne]= into an object and ?from=a&from=b into an array,
// so a query string on its own can hand a controller something that is not a
// string. Calling .trim() on it would throw and become a 500, and passing it
// to the query would let the caller shape the filter themselves.
function isText(value) {
  return typeof value === 'string' && value.trim() !== '';
}

// GET /api/flights/search?from=&to=&date=
async function searchFlights(req, res, next) {
  try {
    const { from, to, date } = req.query;

    if (!isText(from) || !isText(to) || !isText(date)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'from, to and date are all required, and must be text.');
    }

    // A date arrives as "2026-09-20" but flight_date is a full timestamp, so
    // an equality match would only find flights stored at exactly midnight.
    // Matching the range [that day, the next day) finds every flight on the
    // day and still uses the compound index.
    const dayStart = new Date(date);
    if (isNaN(dayStart.getTime())) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'date must be a valid date, for example 2026-09-20.');
    }
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const flights = await Flight.find({
      // Cities are stored uppercase, so the search term is uppercased to match
      // exactly and hit the index.
      departure_city: from.trim().toUpperCase(),
      arrival_city: to.trim().toUpperCase(),
      flight_date: { $gte: dayStart, $lt: dayEnd },
      // Soft-deleted flights must never appear in search results.
      is_active: true
    }).sort({ departure_time: 1 });

    return res.status(200).json(flights.map(addDisplayFields));
  } catch (err) {
    return next(err);
  }
}

// GET /api/flights/:id
async function getFlightById(req, res, next) {
  try {
    const flight = await Flight.findById(req.params.id);

    if (!flight) {
      return sendError(res, 404, 'FLIGHT_NOT_FOUND', 'No flight found with that id.');
    }

    // Deliberately not filtered on is_active: a passenger looking at an old
    // booking still needs to see the flight it points at, even if an admin has
    // since deactivated it. Only search hides inactive flights.
    return res.status(200).json({ flight: addDisplayFields(flight) });
  } catch (err) {
    return next(err);
  }
}

// POST /api/flights  (admin)
async function createFlight(req, res, next) {
  try {
    const {
      flight_number, airline_name, departure_city, arrival_city,
      departure_time, arrival_time, flight_date, total_seats, price
    } = req.body;

    const required = {
      flight_number, airline_name, departure_city, arrival_city,
      departure_time, arrival_time, flight_date, total_seats, price
    };
    const missing = Object.keys(required).filter((key) => isMissing(required[key]));
    if (missing.length > 0) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Missing required field(s): ' + missing.join(', ') + '.');
    }

    // A brand new flight normally has every seat free, so available_seats is
    // optional and defaults to total_seats.
    const available_seats = isMissing(req.body.available_seats)
      ? total_seats
      : req.body.available_seats;

    if (Number(available_seats) > Number(total_seats)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'available_seats cannot be greater than total_seats.');
    }

    const flight = await Flight.create({
      flight_number, airline_name, departure_city, arrival_city,
      departure_time, arrival_time, flight_date, total_seats, available_seats, price
    });

    return res.status(201).json({ flight: addDisplayFields(flight) });
  } catch (err) {
    return next(err);
  }
}

// PUT /api/flights/:id  (admin)
async function updateFlight(req, res, next) {
  try {
    const flight = await Flight.findById(req.params.id);

    if (!flight) {
      return sendError(res, 404, 'FLIGHT_NOT_FOUND', 'No flight found with that id.');
    }

    // available_seats is deliberately not in this list. It is derived: booking
    // and cancellation move it, and changing total_seats below moves it by the
    // same amount. Letting an admin set it directly would let the seat count
    // drift away from the bookings that actually exist.
    const editable = [
      'flight_number', 'airline_name', 'departure_city', 'arrival_city',
      'departure_time', 'arrival_time', 'flight_date', 'price', 'is_active'
    ];

    editable.forEach((field) => {
      if (!isMissing(req.body[field])) {
        flight[field] = req.body[field];
      }
    });

    if (!isMissing(req.body.total_seats)) {
      const newTotal = Number(req.body.total_seats);
      const delta = newTotal - flight.total_seats;
      const newAvailable = flight.available_seats + delta;

      // Shrinking the aircraft below the number of people already booked on it
      // would leave bookings that cannot be honoured.
      const confirmedCount = await Booking.countDocuments({
        flight_id: flight._id,
        status: 'confirmed'
      });

      if (newTotal < confirmedCount) {
        return sendError(res, 409, 'SEATS_BELOW_BOOKINGS',
          'This flight already has ' + confirmedCount + ' confirmed booking(s), so total_seats cannot be set to ' + newTotal + '.');
      }

      if (newAvailable < 0) {
        return sendError(res, 409, 'NEGATIVE_AVAILABLE_SEATS',
          'That change would make available_seats negative.');
      }

      // Adding 20 seats to the aircraft adds 20 bookable seats; removing 20
      // removes 20. The number of people already booked does not change.
      flight.total_seats = newTotal;
      flight.available_seats = newAvailable;
    }

    await flight.save();

    return res.status(200).json({ flight: addDisplayFields(flight) });
  } catch (err) {
    return next(err);
  }
}

// DELETE /api/flights/:id  (admin) - soft delete
async function deleteFlight(req, res, next) {
  try {
    const flight = await Flight.findById(req.params.id);

    if (!flight) {
      return sendError(res, 404, 'FLIGHT_NOT_FOUND', 'No flight found with that id.');
    }

    // MongoDB has no foreign keys, so actually removing the document would
    // leave every booking pointing at a flight that no longer exists. Marking
    // it inactive hides it from search while keeping that history intact.
    flight.is_active = false;
    await flight.save();

    const confirmedCount = await Booking.countDocuments({
      flight_id: flight._id,
      status: 'confirmed'
    });

    const message = confirmedCount > 0
      ? 'Flight ' + flight.flight_number + ' has been deactivated. ' + confirmedCount + ' confirmed booking(s) are affected.'
      : 'Flight ' + flight.flight_number + ' has been deactivated.';

    return res.status(200).json({ message });
  } catch (err) {
    return next(err);
  }
}

module.exports = { searchFlights, getFlightById, createFlight, updateFlight, deleteFlight };
