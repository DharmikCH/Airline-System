import { useEffect, useState } from 'react';
import { lowestAvailableFare, searchFlights } from '../utils/flightSearch.js';
import { formatFlightDate, formatPrice } from '../utils/format.js';
import { addDaysISO, todayISO } from '../utils/time.js';
import './flights.css';

// Seven days around the searched date, each showing the cheapest seat still
// on sale, the way most airline sites let you hunt for a better day.
//
// The window never starts before today, so it is always seven days wide and
// always contains the selected date. The parent keys this component on the
// route, so switching cities starts with a clean slate.
export default function DateStrip({ from, to, date, onPick }) {
  const today = todayISO();
  const threeBefore = addDaysISO(date, -3);
  const start = threeBefore < today ? today : threeBefore;
  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(start, i));

  const [fares, setFares] = useState({});

  useEffect(() => {
    let ignore = false;
    for (const day of days) {
      searchFlights(from, to, day)
        .then((flights) => {
          if (ignore) return;
          const cheapest = lowestAvailableFare(flights);
          const state = flights.length === 0 ? 'none' : cheapest === null ? 'soldout' : 'fare';
          setFares((prev) => ({ ...prev, [day]: { state, cheapest } }));
        })
        .catch(() => {
          if (!ignore) setFares((prev) => ({ ...prev, [day]: { state: 'none' } }));
        });
    }
    return () => {
      ignore = true;
    };
    // days is derived from these three values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, start]);

  return (
    <div className="date-strip" role="list" aria-label="Nearby dates">
      {days.map((day) => {
        const info = fares[day];
        const selected = day === date;
        return (
          <button
            key={day}
            type="button"
            role="listitem"
            className={'date-strip__day' + (selected ? ' is-selected' : '')}
            aria-current={selected ? 'date' : undefined}
            onClick={() => onPick(day)}
          >
            <span className="date-strip__label">{formatFlightDate(day)}</span>
            {!info && <span className="skeleton" style={{ width: 52, height: 12 }} />}
            {info && info.state === 'fare' && <span className="date-strip__fare nums">{formatPrice(info.cheapest)}</span>}
            {info && info.state === 'soldout' && <span className="date-strip__fare is-muted">Sold out</span>}
            {info && info.state === 'none' && <span className="date-strip__fare is-muted">No flights</span>}
          </button>
        );
      })}
    </div>
  );
}
