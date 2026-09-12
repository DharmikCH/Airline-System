# Claude Code Prompt — Airline Reservation System (Backend)

> **How to use this:** save it as `CLAUDE.md` in the root of your backend repo. Claude Code reads
> that file automatically at the start of every session, so you don't have to re-paste it. Then
> drive the build one stage at a time with short messages like *"Do Stage 2"*. Do not paste the
> whole thing and say "build everything."

---

## Context

I am building the backend for an **Airline Reservation System**, a fifth-semester Software
Engineering & Project Management course project at Dayananda Sagar University. The team has 10
members and follows the **Waterfall model**. The SRS and SDD are approved and frozen — the design
below is not open for redesign. Your job is to implement the approved design, not improve it.

This is an academic project, not production software. Two things follow from that:

1. **I have to defend every line in a viva.** Write code a second-year student can read and
   explain. No clever abstractions, no design patterns I didn't ask for, no dependency-injection
   layers, no TypeScript, no ORM wrappers around Mongoose.
2. **Correctness on the tricky parts matters more than breadth.** The seat-concurrency logic and
   PNR generation are the graded technical highlights. Everything else is CRUD.

**Scope: backend only.** Do not create any React, frontend, or client code. Do not create Docker
files, CI configs, or deployment scripts.

---

## Stack (fixed, do not substitute)

- Node.js 20 LTS, CommonJS modules (`require`, not `import`)
- Express.js
- MongoDB with Mongoose ODM
- `jsonwebtoken` for auth, `bcryptjs` for password hashing
- `dotenv`, `cors`
- No other dependencies without asking me first.

---

## Folder structure

```
backend/
├── config/db.js
├── models/          User.js, Flight.js, Booking.js
├── middleware/      auth.js, errorHandler.js
├── controllers/     authController.js, flightController.js, bookingController.js, adminController.js
├── routes/          authRoutes.js, flightRoutes.js, bookingRoutes.js
├── utils/           generatePNR.js
├── seed.js
├── .env.example
└── server.js
```

---

## Data models

### User (`users`)
| Field | Type | Rules |
|---|---|---|
| `name` | String | required, trimmed |
| `email` | String | required, unique, lowercase |
| `password_hash` | String | required, bcrypt (10 rounds), never returned in any response |
| `phone` | String | optional |
| `role` | String | enum `['passenger','admin']`, default `'passenger'` |
| `createdAt` | Date | default now |

### Flight (`flights`)
| Field | Type | Rules |
|---|---|---|
| `flight_number` | String | required, e.g. `AI-202` |
| `airline_name` | String | required |
| `departure_city` | String | required, **stored uppercase** |
| `arrival_city` | String | required, **stored uppercase** |
| `departure_time` | Number | required, **minutes since midnight (0–1439)** |
| `arrival_time` | Number | required, minutes since midnight |
| `flight_date` | Date | required |
| `total_seats` | Number | required, min 1 |
| `available_seats` | Number | required, min 0 |
| `price` | Number | required, min 0 |
| `is_active` | Boolean | default `true` |

Two decisions to implement exactly as stated, both of which I must be able to justify:

- **Times are numbers, not strings.** `"10:30 AM"` cannot be sorted or subtracted. Minutes since
  midnight lets me compute duration as `arrival - departure`, adding 1440 if the result is
  negative (overnight flight). Add a small helper to format minutes back to `"HH:MM"` for responses.
- **Cities are stored and queried in uppercase.** A case-insensitive `$regex` match cannot use an
  index. Normalising on write lets an exact-match query hit the index.

**Every flight object returned by any endpoint must also include three derived display fields:**
`departure_time_display` and `arrival_time_display` as `"HH:MM"` strings, and `duration_display` as
`"2h 15m"`. Compute them in one shared helper. The frontend is being built by several people in
parallel — if the API returns raw minutes only, three of them will write three different formatting
functions and the screens will disagree with each other.

Indexes:
```js
flightSchema.index({ departure_city: 1, arrival_city: 1, flight_date: 1 });
```

### Booking (`bookings`)
| Field | Type | Rules |
|---|---|---|
| `pnr` | String | required, **unique index**, 6 chars uppercase |
| `user_id` | ObjectId | ref `User`, required |
| `flight_id` | ObjectId | ref `Flight`, required |
| `passenger_name` | String | required |
| `passenger_age` | Number | optional |
| `passenger_gender` | String | optional |
| `status` | String | enum `['confirmed','cancelled']`, default `'confirmed'` |
| `booking_date` | Date | default now |

One passenger per booking — group bookings are explicitly out of scope per the SRS.

---

## API contract (frozen — implement exactly these paths)

### Auth
| Method | Path | Body | Success | Auth |
|---|---|---|---|---|
| POST | `/api/auth/register` | `{name,email,password,phone}` | 201 `{message}` | none |
| POST | `/api/auth/login` | `{email,password}` | 200 `{token,user:{id,name,email,role}}` | none |

JWT payload: `{id, role}`. Expiry: `24h`.

### Flights
| Method | Path | Success | Auth |
|---|---|---|---|
| GET | `/api/flights/search?from=&to=&date=` | 200 `[flight]` | none |
| GET | `/api/flights/:id` | 200 `{flight}` | none |
| POST | `/api/flights` | 201 `{flight}` | admin |
| PUT | `/api/flights/:id` | 200 `{flight}` | admin |
| DELETE | `/api/flights/:id` | 200 `{message}` | admin |

### Bookings
| Method | Path | Success | Auth |
|---|---|---|---|
| POST | `/api/bookings` | 201 `{booking}` | passenger |
| GET | `/api/bookings/my` | 200 `[booking]` (flight populated) | passenger |
| GET | `/api/bookings/pnr/:pnr` | 200 `{booking}` | passenger (own booking only) |
| PUT | `/api/bookings/cancel/:id` | 200 `{booking}` | passenger (own booking only) |
| GET | `/api/bookings/all` | 200 `[booking]` (user + flight populated) | admin |

### Error format
Every error response, without exception:
```json
{ "error": { "code": "NO_SEATS_AVAILABLE", "message": "This flight is fully booked." } }
```
Status codes: `400` validation, `401` missing/invalid token, `403` wrong role or not your resource,
`404` not found, `409` conflict (no seats, duplicate email, deleting a booked flight), `500`
unexpected. **No endpoint may return 500 for bad user input** — that is a stated non-functional
requirement.

---

## The parts that actually matter

Implement these three exactly. They are the graded portion.

### 1. Seat reservation must be atomic

Do **not** read the flight, check `available_seats > 0`, and then decrement in a separate call.
That is a time-of-check-to-time-of-use gap: two concurrent bookings both read `1` and both succeed,
overselling the flight. Make the check and the decrement one operation and let MongoDB's
document-level atomicity enforce it:

```js
const flight = await Flight.findOneAndUpdate(
  { _id: flight_id, is_active: true, available_seats: { $gt: 0 } },
  { $inc: { available_seats: -1 } },
  { new: true }
);
if (!flight) return 409 NO_SEATS_AVAILABLE;
```

Reserve the seat **first**, then create the booking document. If the booking insert throws, `$inc`
the seat back by 1 before returning the error, so a failure cannot leak seats. Also reject booking a
flight whose `flight_date` is in the past.

### 2. PNR generation

- 6 characters, alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` — **O, I, 0 and 1 are deliberately
  excluded** so a user reading a PNR off a printed ticket cannot mistype it. 32 symbols, 32⁶ ≈ 1.07
  billion combinations.
- Uniqueness is enforced by the **unique index on `pnr`**, not by the generator. Generate, attempt
  the insert, and on a duplicate-key error (code `11000`) regenerate and retry. Cap at 5 attempts,
  then return 500.
- Never use a sequential counter — it is guessable and leaks total booking volume.

### 3. Cancellation must be safe and idempotent

A single conditional update, not a read-then-write:

```js
const booking = await Booking.findOneAndUpdate(
  { _id: req.params.id, user_id: req.user.id, status: 'confirmed' },
  { status: 'cancelled' },
  { new: true }
);
```

The `user_id` in the filter is the security check — without it any logged-in user can cancel
anyone's booking by guessing an ObjectId (an IDOR vulnerability). The `status: 'confirmed'` in the
filter makes it idempotent — clicking Cancel twice cannot increment the seat count twice. Only
`$inc` the seat back by 1 if this returns a document. Also reject cancelling a flight that has
already departed.

Apply the same ownership filter to `GET /api/bookings/pnr/:pnr`.

---

## Two admin rules that are easy to get wrong

- **`PUT /api/flights/:id` changing `total_seats`:** adjust `available_seats` by the same delta.
  Reject with 409 if the new `total_seats` would be lower than the number of confirmed bookings on
  that flight, or if `available_seats` would go negative.
- **`DELETE /api/flights/:id` is a soft delete.** Set `is_active: false`; never remove the document.
  MongoDB has no foreign keys, so a hard delete would orphan every booking pointing at that flight.
  Exclude inactive flights from search results. If confirmed bookings exist, still soft-delete but
  return a message saying how many active bookings are affected.

---

## `seed.js`

Wipes and repopulates the database:
- One admin: `admin@airbook.com` / `Admin@123`, role `admin`, password properly hashed.
- Two sample passengers.
- 18–20 flights across real Indian routes (BLR, DEL, BOM, MAA, HYD, CCU, GOI) with realistic
  airlines, times and fares, spread over the next 14 days, some nearly full so the sold-out path is
  demonstrable.

---

## How to work with me

- **Build in the stages below. Stop after each stage and wait for me.** Do not run ahead.
- After each stage, tell me in two or three lines what to test in Postman to verify it.
- If something in this document is ambiguous or contradictory, ask me — do not silently pick.
- Explain *why* on anything non-obvious, in a brief comment. I have to defend this in a viva.
- Do not write tests, a README, or Swagger docs unless I ask.
- Do not refactor code from an earlier stage without telling me what changed and why.
- **The API contract above is frozen.** Eight teammates are building the frontend against it in
  parallel, so a response shape you change quietly breaks their screens. If I explicitly approve a
  change, add a dated one-line entry to `API-CHANGELOG.md` in the repo root saying what changed.
- This project runs **locally only**. Localhost, local or Atlas MongoDB, no deployment of any kind.

### Stages
1. `package.json`, `server.js`, `config/db.js`, `.env.example`, folder skeleton, and a
   `GET /api/health` route returning `{status:'ok'}`. Configure CORS as
   `cors({ origin: process.env.CLIENT_URL })` with `CLIENT_URL=http://localhost:5173` in
   `.env.example` — Vite's dev server runs on a different port to Express, so without this every
   request from the frontend is blocked by the browser.
2. The three models with all indexes and the time-formatting helper.
3. `middleware/auth.js` (`protect`, `adminOnly`), `middleware/errorHandler.js`, register + login.
4. Flight search, get-by-id, and admin create/edit/soft-delete.
5. `utils/generatePNR.js` and the booking controller — create, my bookings, PNR lookup, cancel.
6. `seed.js`.

---

## Definition of done

- Every endpoint in the contract returns the exact shape specified, with the exact error format.
- No endpoint returns 500 on bad input.
- Two simultaneous bookings for the last seat: one gets 201, the other gets 409, and
  `available_seats` lands at exactly 0.
- Cancelling the same booking twice returns 200 then 404 — and the seat count only goes up once.
- A passenger cannot read or cancel another passenger's booking.
