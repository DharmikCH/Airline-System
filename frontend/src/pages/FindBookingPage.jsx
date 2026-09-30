import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// PNRs are six characters from this alphabet. O, I, 0 and 1 are left out on
// purpose, so a code read aloud or off a printout cannot be mistyped.
const PNR_ALPHABET = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
// The allowed characters each excluded one is most often mistaken for.
const LOOKALIKES = { O: 'D or Q', 0: 'D or Q', I: 'L', 1: 'L' };

export default function FindBookingPage() {
  const navigate = useNavigate();
  const [pnr, setPnr] = useState('');
  const [error, setError] = useState(null);

  function handleChange(event) {
    setError(null);
    setPnr(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (pnr.length !== 6) {
      setError('A PNR is exactly six characters.');
      return;
    }
    if (!PNR_ALPHABET.test(pnr)) {
      const bad = pnr.split('').find((c) => LOOKALIKES[c]);
      setError(`Airway PNRs never contain ${bad}. Check the ticket: it is probably ${LOOKALIKES[bad]}.`);
      return;
    }
    navigate('/bookings/' + pnr);
  }

  const cells = pnr.padEnd(6, ' ').split('');

  return (
    <div className="find">
      <header className="page-head">
        <div>
          <h1>Find a booking</h1>
          <p>Enter the six-character PNR from your ticket. You can open bookings made from this account.</p>
        </div>
      </header>

      <form className="find-form" onSubmit={handleSubmit} noValidate>
        <label className="label" htmlFor="pnr">PNR</label>
        <div className="find-entry">
          <input
            id="pnr"
            className="find-input"
            value={pnr}
            onChange={handleChange}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck="false"
            maxLength={6}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'pnr-err' : 'pnr-hint'}
          />
          {/* The six ruled cells behind the input, so what you type lands in
              the same boxes the ticket prints it in. */}
          <div className="find-cells" aria-hidden="true">
            {cells.map((c, i) => (
              <span key={i} className={i === pnr.length ? 'is-next' : ''}>{c}</span>
            ))}
          </div>
        </div>
        {error
          ? <p id="pnr-err" className="field-error" role="alert">{error}</p>
          : <p id="pnr-hint" className="field-hint">Letters and digits only. O, I, 0 and 1 never appear in a PNR.</p>}
        <button type="submit" className="btn btn-primary btn-large">Open booking</button>
      </form>
    </div>
  );
}
