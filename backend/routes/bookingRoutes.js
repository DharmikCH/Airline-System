const express = require('express');
const {
  createBooking, getMyBookings, getBookingByPNR, cancelBooking, getAllBookings
} = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Every booking route needs a logged-in caller, so protect is on all of them.
router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);
router.get('/all', protect, adminOnly, getAllBookings);
router.get('/pnr/:pnr', protect, getBookingByPNR);
router.put('/cancel/:id', protect, cancelBooking);

module.exports = router;
