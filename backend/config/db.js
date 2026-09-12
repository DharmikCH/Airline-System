const mongoose = require('mongoose');

// Connects to MongoDB once at startup.
// If the database is unreachable we exit instead of letting the server keep
// running: an API that is up but cannot read or write would answer every
// request with a 500, which is harder to diagnose than a process that refuses
// to start.
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;
