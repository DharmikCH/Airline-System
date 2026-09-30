# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite, React Router, plain CSS. No other frontend libraries without the team's approval,
matching the backend's "no dependency without asking" rule. Runs locally only against the Express
API at `http://localhost:5000/api`, with Vite's dev server on `http://localhost:5173` (the CORS
origin the backend expects). There is no deployment.

## Users

- **Passengers**: Indian domestic travellers searching, booking, viewing and cancelling one-way
  flights between BLR, DEL, BOM, MAA, HYD, CCU and GOI.
- **Admins**: airline staff who add, edit and deactivate flights and see every booking.
- **Examiners** (the real first audience): faculty watching the 10-person team demo the app in a
  viva. The app is designed for them first, but it must behave like a believable booking site for
  the passengers above, not like a demo harness.

## Product Purpose

The web frontend for a fifth-semester Software Engineering & Project Management course project
(Dayananda Sagar University, Waterfall model, frozen SRS/SDD). It lets passengers find a flight,
book a seat, get a PNR and ticket, look up and cancel bookings, and lets admins manage flights and
bookings. Success means a smooth live demo in which the graded backend behaviour is visible and
explainable, and every screen holds up as a real product.

## Positioning

Not competing with commercial booking sites. What sets it apart is that the tricky backend
guarantees are real and can be shown on screen: atomic seat reservation (the last seat can't be
sold twice), collision-safe PNRs that avoid confusable characters (no O, I, 0 or 1), and safe,
idempotent cancellation that returns the seat exactly once.

## Operating Context

- Demoed live on a laptop, often projected, during the viva. The team has to explain every line,
  so the code must stay readable to second-year students: no clever abstractions.
- Demo data comes from `npm run seed` in `backend/`: 3 users (one admin, two passengers with
  bookings), 20 flights over the next 14 days across 7 cities on six real Indian airlines, one
  sold-out flight and two nearly full.
- The old React frontend (commit `7065404` on `main`) was removed on the `new-frontend` branch so
  this one can be built from scratch. Its behaviour can be consulted; its look is not binding.

## Capabilities and Constraints

- **The API contract is frozen** (`README.md`, `backend/CLAUDE.md`). Changes need approval and a
  dated entry in `API-CHANGELOG.md`.
- Lists come back as bare arrays; single objects come back wrapped (`{ flight }`, `{ booking }`).
  How much related data is included differs per endpoint.
- Search needs `from`, `to` and `date` (`YYYY-MM-DD`), returns results sorted by departure, and
  **includes sold-out flights**. The UI must show a sold-out state.
- Only one-way, single-passenger bookings: `passenger_name`, plus optional age and gender. No seat
  maps, fare classes, payments, round trips or multi-passenger bookings exist in the backend.
- Times are minutes since midnight. **Always display `departure_time_display`,
  `arrival_time_display` and `duration_display`, and never format times in the frontend.**
- Auth uses a JWT (24 h) carrying `{id, role}`. Roles are `passenger` and `admin`.
- Every error has the same shape: `{ error: { code, message } }`. Codes worth their own UI:
  `NO_SEATS_AVAILABLE`, `FLIGHT_INACTIVE`, `FLIGHT_IN_PAST`, `FLIGHT_ALREADY_DEPARTED`,
  `BOOKING_NOT_CONFIRMED`, `SEATS_BELOW_BOOKINGS`, `EMAIL_ALREADY_REGISTERED`.
- Admin delete is a soft delete. `GET /flights/:id` still returns inactive flights, so old bookings
  keep their flight details.
- Flight dates are UTC.

## Brand Commitments

- **The product is called Airway** (renamed from "Airbook", chosen 2026-09-30). The seed account
  emails (`@airbook.com`) are backend data and don't need to match the new name.
- No logo, voice guide or brand assets exist.

## Evidence on Hand

- Real routes, airlines, flight numbers, fares and seat counts from `backend/seed.js`.
- No testimonials, user numbers, press, partnerships or pricing claims exist. Don't invent any.

## Product Principles

1. **Show the guarantees.** Sold-out, last seat, PNR and cancellation states are the product's
   proof. Make them clear and demonstrable, never hidden behind generic errors.
2. **Believable over flashy.** Every screen should hold up as a real booking product under an
   examiner's scrutiny, with real data, honest states and no fake features.
3. **Honour the contract.** The frontend adapts to the frozen API. It never works around it or
   quietly reimplements backend logic.
4. **Explainable code.** Any team member can walk through any component in the viva.
