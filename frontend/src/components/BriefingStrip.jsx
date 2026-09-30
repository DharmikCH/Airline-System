import { useState } from 'react';
import { CITIES } from '../lib/cities.js';
import { todayInput } from '../lib/format.js';

// The search form, laid out like the briefing strip across the top of an
// approach chart: one ruled row of boxes, each naming the value it holds.
//
// It is controlled by the parent, so the chart on the search page and these
// boxes always show the same route.

export function SwapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M2 6h13M11 2l4 4-4 4M16 12H3M7 8l-4 4 4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function BriefingStrip({ value, onChange, onSubmit, compact = false }) {
  const [errors, setErrors] = useState({});
  const { from, to, date } = value;

  function set(field, fieldValue) {
    setErrors((e) => ({ ...e, [field]: undefined, route: undefined }));
    onChange({ ...value, [field]: fieldValue });
  }

  function swap() {
    setErrors({});
    onChange({ ...value, from: to, to: from });
  }

  function handleSubmit(event) {
    event.preventDefault();
    const next = {};
    if (!from) next.from = 'Choose where you are flying from.';
    if (!to) next.to = 'Choose where you are flying to.';
    if (from && to && from === to) next.route = 'Departure and destination must be different airports.';
    if (!date) next.date = 'Choose a date.';
    else if (date < todayInput()) next.date = 'That date has passed. Choose today or later.';
    setErrors(next);
    if (Object.keys(next).length === 0) onSubmit(value);
  }

  const routeError = errors.route;

  return (
    <form className={'briefing' + (compact ? ' is-compact' : '')} onSubmit={handleSubmit} noValidate>
      <div className="briefing-cell">
        <label className="label" htmlFor="b-from">From</label>
        <select
          id="b-from"
          className="briefing-select"
          value={from}
          onChange={(e) => set('from', e.target.value)}
          aria-invalid={Boolean(errors.from || routeError)}
          aria-describedby={errors.from ? 'b-from-err' : undefined}
        >
          <option value="">Departure airport</option>
          {CITIES.map((c) => (
            <option key={c.code} value={c.code}>{c.code} · {c.name}</option>
          ))}
        </select>
        {errors.from && <span id="b-from-err" className="field-error">{errors.from}</span>}
      </div>

      <button type="button" className="briefing-swap" onClick={swap} aria-label="Swap departure and destination">
        <SwapIcon />
      </button>

      <div className="briefing-cell">
        <label className="label" htmlFor="b-to">To</label>
        <select
          id="b-to"
          className="briefing-select"
          value={to}
          onChange={(e) => set('to', e.target.value)}
          aria-invalid={Boolean(errors.to || routeError)}
          aria-describedby={errors.to ? 'b-to-err' : routeError ? 'b-route-err' : undefined}
        >
          <option value="">Destination airport</option>
          {CITIES.map((c) => (
            <option key={c.code} value={c.code}>{c.code} · {c.name}</option>
          ))}
        </select>
        {errors.to && <span id="b-to-err" className="field-error">{errors.to}</span>}
        {routeError && <span id="b-route-err" className="field-error">{routeError}</span>}
      </div>

      <div className="briefing-cell briefing-date">
        <label className="label" htmlFor="b-date">Date</label>
        <input
          id="b-date"
          className="briefing-select"
          type="date"
          min={todayInput()}
          value={date}
          onChange={(e) => set('date', e.target.value)}
          aria-invalid={Boolean(errors.date)}
          aria-describedby={errors.date ? 'b-date-err' : undefined}
        />
        {errors.date && <span id="b-date-err" className="field-error">{errors.date}</span>}
      </div>

      <button type="submit" className="briefing-go">
        Search flights
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M1 8h13M9 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      </button>
    </form>
  );
}
