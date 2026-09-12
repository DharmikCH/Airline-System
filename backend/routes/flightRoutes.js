const express = require('express');
const {
  searchFlights, getFlightById, createFlight, updateFlight, deleteFlight
} = require('../controllers/flightController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Must be declared before '/:id', otherwise Express would treat the word
// "search" as an id and try to look up a flight whose id is "search".
router.get('/search', searchFlights);
router.get('/:id', getFlightById);

// protect runs first so that adminOnly has req.user to check.
router.post('/', protect, adminOnly, createFlight);
router.put('/:id', protect, adminOnly, updateFlight);
router.delete('/:id', protect, adminOnly, deleteFlight);

module.exports = router;
