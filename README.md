# Airline Reservation System

A web-based airline reservation system built as a fifth-semester Software Engineering & Project
Management course project at Dayananda Sagar University. The team of 10 follows the **Waterfall
model**; the SRS and SDD are approved and frozen, and the implementation follows that approved
design.

The project runs **locally only** — there is no deployment.

---

## Repository layout

```
Airline-System/
├── backend/     Node.js + Express + MongoDB REST API
└── frontend/    React app (not scaffolded yet)
```

The backend API contract is frozen and documented in [`backend/CLAUDE.md`](backend/CLAUDE.md).
Anyone building a frontend screen should read the "API contract" section there — the request and
response shapes are fixed, because several people are building against them in parallel.

---

## Backend

### Stack

- Node.js 20 LTS (CommonJS modules)
- Express.js
- MongoDB with Mongoose
- `jsonwebtoken` for auth, `bcryptjs` for password hashing

### Prerequisites

- Node.js 20 or newer
- MongoDB running locally, or a MongoDB Atlas connection string

### Setup

```bash
cd backend
npm install
cp .env.example .env
```

Then open `.env` and fill in the values:

| Variable | What it is |
|---|---|
| `PORT` | Port Express listens on. Default `5000`. |
| `MONGO_URI` | MongoDB connection string, local or Atlas. |
| `JWT_SECRET` | Any long random string. Used to sign login tokens. |
| `CLIENT_URL` | Origin allowed by CORS. `http://localhost:5173` for Vite's dev server. |

`.env` is gitignored and must never be committed.

### Running

```bash
npm start     # start the server
npm run dev   # start with auto-restart on file changes
```

On a successful start the console prints the server URL and the connected database. If MongoDB is
unreachable the process exits instead of starting — an API that is up but cannot reach its database
would fail every request with a 500, which is harder to diagnose than a server that refuses to boot.

### Verifying it works

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{ "status": "ok" }
```

---

## Build progress

The backend is being built in stages. Completed stages are implemented and manually tested.

| Stage | Scope | Status |
|---|---|---|
| 1 | Server entry point, DB connection, env template, folder skeleton, health route | Done |
| 2 | User, Flight and Booking models with indexes and the time-formatting helper | Not started |
| 3 | Auth middleware, error handler, register and login | Not started |
| 4 | Flight search, get by id, admin create/edit/soft-delete | Not started |
| 5 | PNR generation and the booking controller | Not started |
| 6 | `seed.js` — sample admin, passengers and flights | Not started |

`package.json` defines `npm run seed`, but `seed.js` itself arrives in Stage 6 — the script will
fail until then.

Full endpoint documentation will be added here once Stage 5 is complete and the routes exist.

---

## Notes for the team

- **The API contract is frozen.** If a response shape genuinely has to change, it needs approval and
  a dated entry in `API-CHANGELOG.md` at the repo root, so nobody's screen breaks silently.
- **Every error response uses the same shape**, so error handling can be written once:
  ```json
  { "error": { "code": "NO_SEATS_AVAILABLE", "message": "This flight is fully booked." } }
  ```
- **Flight times are numbers** (minutes since midnight), not strings — they need to be sortable and
  subtractable. Every flight returned by the API also includes `departure_time_display` and
  `arrival_time_display` as `"HH:MM"` strings and `duration_display` as `"2h 15m"`, so no screen
  needs to write its own formatting.
