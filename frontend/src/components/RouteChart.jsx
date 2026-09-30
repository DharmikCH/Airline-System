import { useEffect, useState } from 'react';
import { CITIES, findCity, formatTrack, routeGeometry } from '../lib/cities.js';

// A plan-view chart of the seven airports, drawn from their real coordinates.
//
// The projection is the simplest one that looks right at this scale: longitude
// and latitude map straight to x and y, with longitude squeezed by cos(20°) so
// India is not stretched sideways. That is accurate to a few pixels here.

const WEST = 66;
const EAST = 94;
const NORTH = 31;
const SOUTH = 10;
const SCALE = 40;                                  // pixels per degree of latitude
const SQUEEZE = Math.cos((20 * Math.PI) / 180);    // longitude is squeezed by this much

const WIDTH = (EAST - WEST) * SCALE * SQUEEZE;
const HEIGHT = (NORTH - SOUTH) * SCALE;
const PAD = 28;                                     // room for the graduated border

// Exported so RouteInset draws its small plan view on the same projection.
export function project(lat, lon) {
  return {
    x: PAD + (lon - WEST) * SCALE * SQUEEZE,
    y: PAD + (NORTH - lat) * SCALE
  };
}

// Which side of the symbol each label sits on, chosen so no two collide.
const LABEL_SIDE = {
  DEL: 'right',
  BOM: 'left',
  CCU: 'right',
  HYD: 'right',
  GOI: 'left',
  BLR: 'left',
  MAA: 'right'
};

// Every pair of airports, for the faint airway network behind everything.
const PAIRS = [];
CITIES.forEach((a, i) => CITIES.slice(i + 1).forEach((b) => PAIRS.push([a, b])));

// A point on a circle, measured as a compass bearing (0° = north, clockwise).
export function onBearing(cx, cy, radius, bearing) {
  const r = (bearing * Math.PI) / 180;
  return { x: cx + radius * Math.sin(r), y: cy - radius * Math.cos(r) };
}

// The compass rose drawn around the departure airport, as a chart draws one
// around a navigation beacon. When a destination is chosen, the route's track
// is marked on it in magenta.
function CompassRose({ x, y, track }) {
  const R = 74;
  const ticks = [];
  for (let b = 0; b < 360; b += 10) {
    const long = b % 30 === 0;
    const a = onBearing(x, y, R, b);
    const c = onBearing(x, y, R - (long ? 10 : 5), b);
    ticks.push(<line key={b} x1={a.x} y1={a.y} x2={c.x} y2={c.y} />);
  }
  const north = onBearing(x, y, R + 12, 0);

  let trackMark = null;
  if (track != null) {
    const a = onBearing(x, y, R + 4, track);
    const c = onBearing(x, y, R - 16, track);
    const label = onBearing(x, y, R + 20, track);
    trackMark = (
      <g className="rose-track">
        <line x1={a.x} y1={a.y} x2={c.x} y2={c.y} />
        <text x={label.x} y={label.y + 4}>{formatTrack(track)}</text>
      </g>
    );
  }

  return (
    <g className="rose">
      <circle cx={x} cy={y} r={R} />
      {ticks}
      <text className="rose-north" x={north.x} y={north.y + 4}>N</text>
      {trackMark}
    </g>
  );
}

// On a phone the full chart would shrink the airports to specks, so the view
// closes in on the area the airports actually cover.
const NARROW_VIEW = (() => {
  const topLeft = project(30.2, 71);
  const bottomRight = project(11.6, 90.2);
  return `${topLeft.x} ${topLeft.y} ${bottomRight.x - topLeft.x} ${bottomRight.y - topLeft.y}`;
})();

function useNarrowScreen() {
  const query = '(max-width: 720px)';
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setNarrow(list.matches);
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, []);
  return narrow;
}

export default function RouteChart({ from, to, onPick }) {
  const narrow = useNarrowScreen();
  const origin = findCity(from);
  const destination = findCity(to);
  const geometry = routeGeometry(from, to);

  const lats = [];
  for (let lat = SOUTH + 2; lat < NORTH; lat += 2) lats.push(lat);
  const lons = [];
  for (let lon = WEST + 2; lon < EAST; lon += 2) lons.push(lon);

  // The graduated border: alternating black and white bars, one per degree,
  // the way a printed chart marks its edges.
  const borderBars = [];
  for (let lon = WEST; lon < EAST; lon += 2) {
    const a = project(NORTH, lon).x;
    const b = project(NORTH, lon + 1).x;
    borderBars.push(<rect key={'t' + lon} x={a} y={PAD - 6} width={b - a} height={6} />);
    borderBars.push(<rect key={'b' + lon} x={a} y={PAD + HEIGHT} width={b - a} height={6} />);
  }
  for (let lat = SOUTH; lat < NORTH; lat += 2) {
    const a = project(lat + 1, WEST).y;
    const b = project(lat, WEST).y;
    borderBars.push(<rect key={'l' + lat} x={PAD - 6} y={a} width={6} height={b - a} />);
    borderBars.push(<rect key={'r' + lat} x={PAD + WIDTH} y={a} width={6} height={b - a} />);
  }

  function handleKey(event, code) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onPick(code);
    }
  }

  const start = origin && project(origin.lat, origin.lon);
  const end = destination && project(destination.lat, destination.lon);
  const mid = start && end && { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };

  return (
    <svg
      className="route-chart"
      viewBox={narrow ? NARROW_VIEW : `0 0 ${WIDTH + PAD * 2} ${HEIGHT + PAD * 2}`}
      role="group"
      aria-label="Chart of Airway airports. Choose a departure airport, then a destination."
    >
      {/* Graticule */}
      <g className="graticule">
        {lats.map((lat) => {
          const y = project(lat, WEST).y;
          return (
            <g key={'lat' + lat}>
              <line x1={PAD} y1={y} x2={PAD + WIDTH} y2={y} />
              <text x={PAD + 8} y={y - 6}>{lat}°N</text>
            </g>
          );
        })}
        {lons.map((lon) => {
          const x = project(NORTH, lon).x;
          return (
            <g key={'lon' + lon}>
              <line x1={x} y1={PAD} x2={x} y2={PAD + HEIGHT} />
              <text x={x + 6} y={PAD + HEIGHT - 10}>{lon}°E</text>
            </g>
          );
        })}
      </g>

      <rect className="neatline" x={PAD} y={PAD} width={WIDTH} height={HEIGHT} />
      <g className="border-bars">{borderBars}</g>

      {!narrow && (
        <>
          <text className="chart-title" x={PAD + WIDTH - 16} y={PAD + 30}>AIRWAY · DOMESTIC NETWORK</text>
          <text className="chart-subtitle" x={PAD + WIDTH - 16} y={PAD + 50}>Seven airports · great-circle tracks in NM</text>
        </>
      )}

      {/* The whole network, faint, so the chart is never empty. */}
      <g className="network">
        {PAIRS.map(([a, b]) => {
          const p = project(a.lat, a.lon);
          const q = project(b.lat, b.lon);
          return <line key={a.code + b.code} x1={p.x} y1={p.y} x2={q.x} y2={q.y} />;
        })}
      </g>

      {start && <CompassRose x={start.x} y={start.y} track={geometry ? geometry.track : null} />}

      {/* Airways from the chosen origin light up; once a destination is
          chosen they settle back and the chosen route is drawn over them. */}
      {origin && (
        <g className={'airways' + (destination ? ' is-settled' : '')}>
          {CITIES.filter((c) => c.code !== from).map((c) => {
            const p = project(c.lat, c.lon);
            return <line key={from + c.code} x1={start.x} y1={start.y} x2={p.x} y2={p.y} />;
          })}
        </g>
      )}

      {start && end && (
        <g className="airway-chosen">
          {/* key restarts the draw animation whenever the route changes */}
          <line key={from + to} x1={start.x} y1={start.y} x2={end.x} y2={end.y} pathLength="1" />
          {geometry && (
            <g key={'box' + from + to} className="airway-box" transform={`translate(${mid.x} ${mid.y})`}>
              <rect x="-62" y="-26" width="124" height="52" />
              <text className="airway-box-route" x="0" y="-5">{from}–{to}</text>
              <text className="airway-box-data" x="0" y="16">{geometry.distance} NM · {formatTrack(geometry.track)}</text>
            </g>
          )}
        </g>
      )}

      {/* Airports */}
      {CITIES.map((city) => {
        const p = project(city.lat, city.lon);
        const role = city.code === from ? 'from' : city.code === to ? 'to' : '';
        const side = LABEL_SIDE[city.code];
        const anchor = side === 'left' ? 'end' : 'start';
        const dx = side === 'left' ? -18 : 18;
        const action = !from || (from && to) ? 'departure' : 'destination';

        return (
          <g
            key={city.code}
            className={'airport' + (role ? ' is-' + role : '')}
            transform={`translate(${p.x} ${p.y})`}
            role="button"
            tabIndex={0}
            aria-label={`${city.name} (${city.code})${role ? ', chosen as ' + (role === 'from' ? 'departure' : 'destination') : ''}. Set as ${action}.`}
            onClick={() => onPick(city.code)}
            onKeyDown={(e) => handleKey(e, city.code)}
          >
            <circle className="airport-hit" r="28" />
            <circle className="airport-ring" r="9" />
            <path className="airport-ticks" d="M0 -15V-9M0 9V15M-15 0H-9M9 0H15" />
            <circle className="airport-dot" r="3.5" />
            <text className="airport-code" dx={dx} y="-1" textAnchor={anchor}>{city.code}</text>
            <text className="airport-name" dx={dx} y="18" textAnchor={anchor}>{city.name}</text>
            {role && (
              <text className="airport-role" dx={dx} y="-26" textAnchor={anchor}>
                {role === 'from' ? 'DEP' : 'ARR'}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
