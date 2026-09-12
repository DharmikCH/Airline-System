// Entry point for the Airline Reservation System backend.

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const flightRoutes = require('./routes/flightRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const { errorHandler, sendError } = require('./middleware/errorHandler');

// Stop before starting if the configuration is incomplete.
//
// Without JWT_SECRET the server still starts and registration still works, but
// every login fails with a 500 whose real cause only appears in this console.
// Refusing to start says plainly what is wrong, once, to whoever started it.
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missingEnv = REQUIRED_ENV.filter((name) => !process.env[name]);

if (missingEnv.length > 0) {
  console.error('Cannot start: missing environment variable(s): ' + missingEnv.join(', '));
  console.error('Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

// Not fatal, but worth saying out loud: cors() with an undefined origin allows
// every origin, which is not what this project intends.
if (!process.env.CLIENT_URL) {
  console.warn('Warning: CLIENT_URL is not set, so CORS will allow any origin.');
}

const app = express();

connectDB();

// The frontend (Vite) runs on a different port to Express, so the browser
// treats every request from it as cross-origin and blocks it unless we say
// otherwise. CLIENT_URL is read from .env so the allowed origin is not
// hardcoded.
app.use(cors({ origin: process.env.CLIENT_URL }));

// Parses JSON request bodies into req.body.
app.use(express.json());

// Health check: lets the team confirm the server and this route are reachable
// before any real endpoint exists.
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/bookings', bookingRoutes);

// A request to a path that does not exist. Without this Express would answer
// with its own HTML page, which would be the one error response in the API
// that is not the agreed JSON shape.
app.use((req, res) => {
  sendError(res, 404, 'ROUTE_NOT_FOUND', 'That endpoint does not exist.');
});

// Must be registered last: Express only treats a four-argument function as an
// error handler, and it can only catch errors from middleware added above it.
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
