// Wipes the database and fills it with demo data.
//
// Run with: npm run seed
//
// Everything here goes through the Mongoose models rather than being inserted
// raw, so the seeded data obeys exactly the same validation the API does:
// cities are uppercased, times are checked to be inside a day, and passwords
// are hashed the same way register hashes them.

require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Flight = require('./models/Flight');
const Booking = require('./models/Booking');
const { generatePNR } = require('./utils/generatePNR');
const { formatMinutes } = require('./utils/timeFormat');

// Minutes since midnight, written the way a timetable reads it.
function hm(hours, minutes) {
  return hours * 60 + minutes;
}

// Midnight UTC, the given number of days from today.
//
// UTC rather than local midnight on purpose. The search endpoint turns
// ?date=2026-09-20 into the range [midnight UTC that day, midnight UTC the
// next day). A flight stored at local midnight in India would sit at 18:30 UTC
// the day before, fall outside that range, and never appear in search results.
function dateInDays(days) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days));
}

// [ flight_number, airline, from, to, departure, duration, price, day, seats, seats_left ]
//
// seats_left is optional. Where it is given, the flight is seeded as partly
// sold: those seats were bought before this system existed, so there are no
// Booking documents behind them. They exist so the nearly-full and sold-out
// paths can be demonstrated without having to make 180 bookings by hand.
const FLIGHT_DATA = [
  ['6E-2134', 'IndiGo', 'BLR', 'DEL', hm(6, 10), 155, 5400, 1, 180],
  ['AI-505', 'Air India', 'BLR', 'DEL', hm(9, 45), 160, 6100, 1, 160, 2],
  ['UK-810', 'Vistara', 'DEL', 'BLR', hm(7, 30), 165, 6800, 2, 158],
  ['6E-6501', 'IndiGo', 'BLR', 'BOM', hm(8, 20), 105, 4200, 2, 186],
  ['SG-193', 'SpiceJet', 'BOM', 'BLR', hm(18, 40), 110, 3900, 3, 189],
  ['AI-639', 'Air India', 'DEL', 'BOM', hm(6, 0), 130, 5600, 3, 162],
  ['QP-1102', 'Akasa Air', 'BOM', 'DEL', hm(21, 15), 135, 5100, 4, 174],
  ['6E-7112', 'IndiGo', 'BLR', 'MAA', hm(7, 5), 60, 2800, 4, 180, 0],
  ['IX-767', 'Air India Express', 'MAA', 'BLR', hm(20, 10), 65, 3100, 5, 186],
  ['UK-864', 'Vistara', 'BLR', 'HYD', hm(10, 25), 70, 3400, 5, 158],
  ['6E-334', 'IndiGo', 'HYD', 'BLR', hm(17, 55), 70, 3300, 6, 180],
  ['AI-770', 'Air India', 'DEL', 'HYD', hm(13, 20), 130, 5900, 6, 160],
  // Departs 22:30 and lands at 00:45 the next morning, so the duration helper
  // has an overnight flight to prove itself on.
  ['SG-8169', 'SpiceJet', 'HYD', 'DEL', hm(22, 30), 135, 5200, 7, 189],
  ['6E-455', 'IndiGo', 'DEL', 'CCU', hm(9, 10), 135, 5700, 8, 186],
  ['UK-727', 'Vistara', 'CCU', 'DEL', hm(19, 30), 140, 6200, 9, 158, 5],
  ['AI-776', 'Air India', 'BOM', 'CCU', hm(11, 40), 165, 7300, 10, 162],
  ['6E-923', 'IndiGo', 'BOM', 'GOI', hm(15, 5), 65, 2600, 11, 180],
  ['SG-2871', 'SpiceJet', 'GOI', 'BOM', hm(6, 45), 70, 2900, 12, 189],
  ['QP-1406', 'Akasa Air', 'BLR', 'GOI', hm(12, 15), 65, 3000, 13, 174],
  // Also overnight: 23:20 to 02:00.
  ['6E-6202', 'IndiGo', 'CCU', 'BLR', hm(23, 20), 160, 6600, 14, 186]
];

async function seed() {
  await connectDB();

  console.log('Wiping database: ' + mongoose.connection.name);
  await User.deleteMany({});
  await Flight.deleteMany({});
  await Booking.deleteMany({});

  // 10 rounds, the same cost register uses.
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const passengerHash = await bcrypt.hash('Test@123', 10);

  const admin = await User.create({
    name: 'Airbook Admin',
    email: 'admin@airbook.com',
    password_hash: adminHash,
    phone: '9000000001',
    role: 'admin'
  });

  const asha = await User.create({
    name: 'Asha Menon',
    email: 'asha@example.com',
    password_hash: passengerHash,
    phone: '9000000002'
  });

  const ravi = await User.create({
    name: 'Ravi Kumar',
    email: 'ravi@example.com',
    password_hash: passengerHash,
    phone: '9000000003'
  });

  const flights = [];
  for (const row of FLIGHT_DATA) {
    const [flight_number, airline_name, from, to, departure, duration, price, day, seats, seatsLeft] = row;
    flights.push(await Flight.create({
      flight_number,
      airline_name,
      departure_city: from,
      arrival_city: to,
      departure_time: departure,
      // A flight landing after midnight wraps past 1439, so take the remainder
      // to get the clock time it actually lands at.
      arrival_time: (departure + duration) % 1440,
      flight_date: dateInDays(day),
      total_seats: seats,
      available_seats: seatsLeft === undefined ? seats : seatsLeft,
      price
    }));
  }

  const byNumber = (number) => flights.find((f) => f.flight_number === number);

  // A few real bookings, so that My Bookings has something in it the moment
  // the demo starts. Each one decrements its flight the same way the booking
  // endpoint would, which keeps available_seats and the confirmed bookings in
  // agreement.
  const bookingPlan = [
    [asha, '6E-2134', 'Asha Menon', 29, 'F'],
    [asha, '6E-6501', 'Asha Menon', 29, 'F'],
    [asha, 'AI-770', 'Vikram Menon', 62, 'M'],
    [ravi, 'UK-810', 'Ravi Kumar', 34, 'M'],
    [ravi, '6E-923', 'Ravi Kumar', 34, 'M']
  ];

  const usedPNRs = new Set();
  for (const [user, flightNumber, name, age, gender] of bookingPlan) {
    const flight = byNumber(flightNumber);

    let pnr = generatePNR();
    while (usedPNRs.has(pnr)) {
      pnr = generatePNR();
    }
    usedPNRs.add(pnr);

    await Booking.create({
      pnr,
      user_id: user._id,
      flight_id: flight._id,
      passenger_name: name,
      passenger_age: age,
      passenger_gender: gender
    });

    flight.available_seats = flight.available_seats - 1;
    await flight.save();
  }

  const soldOut = byNumber('6E-7112');
  const nearlyFull = byNumber('AI-505');
  const overnight = byNumber('SG-8169');
  const searchable = byNumber('6E-2134');
  const iso = (d) => d.toISOString().slice(0, 10);

  console.log('');
  console.log('Seeded ' + flights.length + ' flights, 3 users and ' + bookingPlan.length + ' bookings.');
  console.log('');
  console.log('  Admin      admin@airbook.com / Admin@123');
  console.log('  Passenger  asha@example.com  / Test@123   (3 bookings)');
  console.log('  Passenger  ravi@example.com  / Test@123   (2 bookings)');
  console.log('');
  console.log('Flights run from ' + iso(dateInDays(1)) + ' to ' + iso(dateInDays(14)) + '.');
  console.log('');
  console.log('Worth demonstrating:');
  console.log('  sold out     ' + soldOut.flight_number + ' ' + soldOut.departure_city + '-' + soldOut.arrival_city +
    ' on ' + iso(soldOut.flight_date) + ', 0 seats left, booking it returns 409');
  console.log('  nearly full  ' + nearlyFull.flight_number + ' ' + nearlyFull.departure_city + '-' + nearlyFull.arrival_city +
    ' on ' + iso(nearlyFull.flight_date) + ', ' + nearlyFull.available_seats + ' seats left');
  console.log('  overnight    ' + overnight.flight_number + ' departs ' + formatMinutes(overnight.departure_time) +
    ' and lands ' + formatMinutes(overnight.arrival_time) + ' the next day');
  console.log('');
  console.log('Try: GET /api/flights/search?from=' + searchable.departure_city + '&to=' + searchable.arrival_city +
    '&date=' + iso(searchable.flight_date));

  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error('Seeding failed:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  });
