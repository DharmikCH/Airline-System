// Entry point for the Airline Reservation System backend.

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

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

// Routes for auth, flights and bookings are mounted here in later stages.

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
