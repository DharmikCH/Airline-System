const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // The unique index here is what actually guarantees PNRs never collide.
  // generatePNR only produces candidates; MongoDB rejects a duplicate insert
  // with error code 11000 and the booking controller retries.
  pnr: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    minlength: 6,
    maxlength: 6
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  flight_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flight',
    required: true
  },
  passenger_name: {
    type: String,
    required: true,
    trim: true
  },
  passenger_age: {
    type: Number
  },
  passenger_gender: {
    type: String
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled'],
    default: 'confirmed'
  },
  booking_date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
