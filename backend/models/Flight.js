const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
  flight_number: {
    type: String,
    required: true,
    trim: true
  },
  airline_name: {
    type: String,
    required: true,
    trim: true
  },
  // Cities are stored uppercase so search can use an exact match, which hits
  // the index below. A case-insensitive $regex match cannot use an index.
  departure_city: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  arrival_city: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  // Times are minutes since midnight, not strings. "10:30 AM" cannot be sorted
  // or subtracted; 630 can. utils/timeFormat.js turns these back into "HH:MM"
  // for responses.
  departure_time: {
    type: Number,
    required: true,
    min: 0,
    max: 1439
  },
  arrival_time: {
    type: Number,
    required: true,
    min: 0,
    max: 1439
  },
  flight_date: {
    type: Date,
    required: true
  },
  total_seats: {
    type: Number,
    required: true,
    min: 1
  },
  available_seats: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  is_active: {
    type: Boolean,
    default: true
  }
});

// Supports the search endpoint, which always filters on these three fields
// together.
flightSchema.index({ departure_city: 1, arrival_city: 1, flight_date: 1 });

module.exports = mongoose.model('Flight', flightSchema);
