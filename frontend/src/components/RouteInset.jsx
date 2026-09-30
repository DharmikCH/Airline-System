import { CITIES, findCity } from '../lib/cities.js';
import { project } from './RouteChart.jsx';

// A small plan view of one route, the way an approach plate pairs its
// briefing strip with a plan of the approach. Not interactive.
//
// The view is a square around the two airports, so a north-south route like
// BLR–DEL and an east-west one like BOM–CCU both get a sensible frame. Text
// and line sizes are scaled with the square so they read the same at any size.

const DISPLAY = 300; // the size, in viewBox units, that sizes below are tuned for

export default function RouteInset({ from, to }) {
  const origin = findCity(from);
  const destination = findCity(to);
  if (!origin || !destination) return null;

  const a = project(origin.lat, origin.lon);
  const b = project(destination.lat, destination.lon);

  const span = Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
  const size = span + 180;
  const cx = (a.x + b.x) / 2;
  const cy = (a.y + b.y) / 2;
  const x0 = cx - size / 2;
  const y0 = cy - size / 2;
  const k = size / DISPLAY; // one "display pixel" in viewBox units

  // Graticule every two degrees, drawn wide and clipped by the frame.
  const lines = [];
  for (let lat = 6; lat <= 34; lat += 2) {
    const y = project(lat, 0).y;
    lines.push(<line key={'la' + lat} x1={x0} y1={y} x2={x0 + size} y2={y} />);
  }
  for (let lon = 60; lon <= 100; lon += 2) {
    const x = project(0, lon).x;
    lines.push(<line key={'lo' + lon} x1={x} y1={y0} x2={x} y2={y0 + size} />);
  }

  return (
    <svg
      className="route-inset"
      viewBox={`${x0} ${y0} ${size} ${size}`}
      role="img"
      aria-label={`Plan view: ${origin.name} to ${destination.name}`}
      style={{ '--k': k }}
    >
      <defs>
        <clipPath id={'inset-' + from + to}>
          <rect x={x0} y={y0} width={size} height={size} />
        </clipPath>
      </defs>

      <g clipPath={`url(#inset-${from}${to})`}>
        <g className="inset-graticule" strokeWidth={k}>{lines}</g>

        {/* Other airports, faint, for orientation */}
        {CITIES.filter((c) => c.code !== from && c.code !== to).map((c) => {
          const p = project(c.lat, c.lon);
          // An airport close to a route end would collide with its DEP/ARR
          // label, so it is left off this small map.
          const distance = Math.min(...[a, b].map((end) => Math.hypot(end.x - p.x, end.y - p.y)));
          if (distance < 70 * k) return null;
          return (
            <g key={c.code} className="inset-other" transform={`translate(${p.x} ${p.y})`}>
              <circle r={5 * k} strokeWidth={1.25 * k} />
              <text x={8 * k} y={4 * k} fontSize={11 * k}>{c.code}</text>
            </g>
          );
        })}

        <line className="inset-leg" x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth={4 * k} />

        {[{ city: origin, p: a, role: 'DEP' }, { city: destination, p: b, role: 'ARR' }].map(({ city, p, role }) => (
          <g key={role} className="inset-end" transform={`translate(${p.x} ${p.y})`}>
            <circle r={8 * k} strokeWidth={2 * k} />
            <circle r={3 * k} className="inset-dot" />
            <text x={13 * k} y={-2 * k} fontSize={16 * k} className="inset-code">{city.code}</text>
            <text x={13 * k} y={12 * k} fontSize={10 * k} className="inset-role">{role}</text>
          </g>
        ))}
      </g>

      <rect className="inset-frame" x={x0} y={y0} width={size} height={size} strokeWidth={2 * k} />
      {/* North arrow */}
      <g className="inset-north" transform={`translate(${x0 + size - 18 * k} ${y0 + 14 * k}) scale(${k})`}>
        <path d="M0 0 6 16 0 12 -6 16Z" />
        <text x="0" y="30" fontSize="11" textAnchor="middle">N</text>
      </g>
    </svg>
  );
}
