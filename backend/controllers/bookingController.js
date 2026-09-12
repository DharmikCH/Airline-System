const Booking = require('../models/Booking');
const Flight = require('../models/Flight');
const { generatePNR } = require('../utils/generatePNR');
const { addDisplayFields } = require('../utils/timeFormat');
const { sendError } = require('../middleware/errorHandler');

const MAX_PNR_ATTEMPTS = 5;

function isText(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isMissing(value) {
  return value === undefined || value === null || value === '';
}

// A booking that has had its flight populated still has to carry the three
// display fields, because the rule is that every flight object the API returns
// has them, not only the ones from the flight endpoints.
function withFlightDisplay(booking) {
  const obj = booking.toObject ? booking.toObject() : booking;
  if (obj.flight_id && typeof obj.flight_id === 'object' && obj.flight_id.departure_time !== undefined) {
    obj.flight_id = addDisplayFields(obj.flight_id);
  }
  return obj;
}

// The instant a flight leaves, as a Date. flight_date is stored at midnight and
// departure_time is minutes after that midnight, so the two together give the
// departure. Both are read in the timezone the server runs in, which is fine
// for a system that runs locally.
function departureInstant(flight) {
  return new Date(flight.flight_date.getTime() + flight.departure_time * 60 * 1000);
}

// POST /api/bookings
async function createBooking(req, res, next) {
  try {
    const { flight_id, passenger_name, passenger_age, passenger_gender } = req.body;

    if (!isText(flight_id) || !isText(passenger_name)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'flight_id and passenger_name are required, and must be text.');
    }

    // Read the flight first only to produce a precise error. The seat itself is
    // taken by the atomic update below, which is the part that has to be right.
    const flight = await Flight.findById(flight_id);

    if (!flight) {
      return sendError(res, 404, 'FLIGHT_NOT_FOUND', 'No flight found with that id.');
    }

    if (!flight.is_active) {
      return sendError(res, 409, 'FLIGHT_INACTIVE', 'This flight is no longer available for booking.');
    }

    // Deliberately the same check cancellation uses, so the two cannot
    // disagree. Comparing flight_date alone would leave a flight that took off
    // earlier this morning still bookable, and the passenger who booked it
    // would then be refused a cancellation because that check is precise to
    // the departure time.
    if (departureInstant(flight) <= new Date()) {
      return sendError(res, 409, 'FLIGHT_IN_PAST', 'That flight has already departed.');
    }

    // The whole seat-concurrency problem is solved by this one call.
    //
    // Reading available_seats, checking it is above zero, and then saving a
    // decrement would leave a gap between the check and the write. Two requests
    // for the last seat could both read 1, both decide a seat is free, and both
    // decrement, overselling the flight. Here the condition and the decrement
    // are a single document update, and MongoDB guarantees that updates to one
    // document do not interleave, so exactly one of the two wins.
    const reserved = await Flight.findOneAndUpdate(
      { _id: flight_id, is_active: true, available_seats: { $gt: 0 } },
      { $inc: { available_seats: -1 } },
      { new: true }
    );

    // The filter matched nothing, so there was no seat left to take.
    if (!reserved) {
      return sendError(res, 409, 'NO_SEATS_AVAILABLE', 'This flight is fully booked.');
    }

    // From here the seat is already held. Every path out of this function must
    // either produce a booking or give the seat back, otherwise the flight
    // would lose a seat that nobody is sitting in.
    let booking = null;

    for (let attempt = 1; attempt <= MAX_PNR_ATTEMPTS; attempt++) {
      try {
        booking = await Booking.create({
          pnr: generatePNR(),
          user_id: req.user.id,
          flight_id,
          passenger_name,
          // An empty age would fail to cast to a Number, so treat it as absent.
          passenger_age: isMissing(passenger_age) ? undefined : passenger_age,
          passenger_gender: isMissing(passenger_gender) ? undefined : passenger_gender
        });
        break;
      } catch (err) {
        // 11000 is a duplicate key error, which here means the random PNR is
        // already in use. Try a different one; the seat stays held meanwhile.
        if (err.code === 11000) {
          continue;
        }
        // Anything else is a real failure, so release the seat before reporting.
        await Flight.updateOne({ _id: flight_id }, { $inc: { available_seats: 1 } });
        return next(err);
      }
    }

    if (!booking) {
      await Flight.updateOne({ _id: flight_id }, { $inc: { available_seats: 1 } });
      return sendError(res, 500, 'PNR_GENERATION_FAILED', 'Could not generate a unique PNR. Please try again.');
    }

    return res.status(201).json({ booking });
  } catch (err) {
    return next(err);
  }
}

// GET /api/bookings/my
async function getMyBookings(req, res, next) {
  try {
    const bookings = await Booking.find({ user_id: req.user.id })
      .populate('flight_id')
      .sort({ booking_date: -1 });

    return res.status(200).json(bookings.map(withFlightDisplay));
  } catch (err) {
    return next(err);
  }
}

// GET /api/bookings/pnr/:pnr
async function getBookingByPNR(req, res, next) {
  try {
    // user_id in the filter is the security check. Looking the booking up by
    // PNR alone would let any logged-in user read another passenger booking by
    // trying codes, and a PNR is printed on a ticket rather than kept secret.
    const booking = await Booking.findOne({
      pnr: req.params.pnr.toUpperCase(),
      user_id: req.user.id
    });

    if (!booking) {
      return sendError(res, 404, 'BOOKING_NOT_FOUND', 'No booking of yours found with that PNR.');
    }

    return res.status(200).json({ booking });
  } catch (err) {
    return next(err);
  }
}

// PUT /api/bookings/cancel/:id
async function cancelBooking(req, res, next) {
  try {
    const existing = await Booking.findById(req.params.id).populate('flight_id');

    if (!existing) {
      return sendError(res, 404, 'BOOKING_NOT_FOUND', 'No booking found with that id.');
    }

    if (existing.user_id.toString() !== req.user.id) {
      return sendError(res, 403, 'NOT_YOUR_BOOKING', 'You can only cancel your own bookings.');
    }

    if (existing.flight_id && departureInstant(existing.flight_id) <= new Date()) {
      return sendError(res, 409, 'FLIGHT_ALREADY_DEPARTED', 'That flight has already departed, so the booking cannot be cancelled.');
    }

    // One conditional update rather than a read followed by a write.
    //
    // The status condition in the filter is what makes this idempotent. If the
    // passenger clicks Cancel twice, the second update matches nothing, so the
    // seat below is only ever given back once. user_id is repeated here so the
    // ownership check is part of the same atomic operation, not only the read
    // above.
    const cancelled = await Booking.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id, status: 'confirmed' },
      { status: 'cancelled' },
      { new: true }
    );

    // Nothing matched, so the booking was already cancelled.
    if (!cancelled) {
      return sendError(res, 404, 'BOOKING_NOT_CONFIRMED', 'That booking is not currently confirmed.');
    }

    // Only now, once we know this request is the one that did the cancelling.
    await Flight.updateOne({ _id: cancelled.flight_id }, { $inc: { available_seats: 1 } });

    return res.status(200).json({ booking: cancelled });
  } catch (err) {
    return next(err);
  }
}

// GET /api/bookings/all  (admin)
async function getAllBookings(req, res, next) {
  try {
    // The password hash is select:false on the User schema, so populating the
    // whole user document cannot leak it.
    const bookings = await Booking.find()
      .populate('user_id')
      .populate('flight_id')
      .sort({ booking_date: -1 });

    return res.status(200).json(bookings.map(withFlightDisplay));
  } catch (err) {
    return next(err);
  }
}

module.exports = { createBooking, getMyBookings, getBookingByPNR, cancelBooking, getAllBookings };
