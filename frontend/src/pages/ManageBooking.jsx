import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './pages.css';

// Booking references are drawn from this alphabet on the backend (see
// backend/utils/generatePNR.js). O, I, 0 and 1 are left out on purpose, so
// if one of them is typed it is almost certainly a misreading.
const PNR_PATTERN = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
const LOOKALIKES = /[OI01]/;

export default function ManageBooking() {
  const navigate = useNavigate();
  const [pnr, setPnr] = useState('');
  const [error, setError] = useState('');

  function submit(e) {
    e.preventDefault();
    const value = pnr.trim().toUpperCase();

    if (LOOKALIKES.test(value)) {
      setError('Airbook references never contain O, I, 0 or 1. Check whether a letter and number have been swapped.');
      return;
    }
    if (!PNR_PATTERN.test(value)) {
      setError('A booking reference is exactly 6 letters and numbers.');
      return;
    }
    setError('');
    navigate('/bookings/' + value);
  }

  return (
    <div className="container narrow">
      <div className="manage card card--pad">
        <h1>Manage a booking</h1>
        <p className="text-2">
          Enter the 6-character booking reference from your ticket to view or cancel it. You can look up any booking
          made from your account.
        </p>

        <form className="manage__form" onSubmit={submit}>
          <label className="field">
            <span>Booking reference (PNR)</span>
            <input
              className="input manage__input mono"
              value={pnr}
              maxLength={6}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck="false"
              placeholder="e.g. K7M2QX"
              onChange={(e) => setPnr(e.target.value.toUpperCase())}
            />
          </label>
          <button className="btn btn--primary btn--lg">Find booking</button>
        </form>

        {error && <div className="banner banner--error" role="alert">{error}</div>}
      </div>
    </div>
  );
}
