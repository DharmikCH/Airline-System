// The seven airports the seeded schedule flies between. The backend has no
// airport endpoint, so the list lives here. Codes are what the API expects.
// lat/lon are the real airport positions; the chart on the search page is
// drawn from them.
export const CITIES = [
  { code: 'DEL', name: 'Delhi', airport: 'Indira Gandhi Intl', lat: 28.566, lon: 77.103 },
  { code: 'BOM', name: 'Mumbai', airport: 'Chhatrapati Shivaji Maharaj Intl', lat: 19.089, lon: 72.868 },
  { code: 'CCU', name: 'Kolkata', airport: 'Netaji Subhas Chandra Bose Intl', lat: 22.654, lon: 88.447 },
  { code: 'HYD', name: 'Hyderabad', airport: 'Rajiv Gandhi Intl', lat: 17.24, lon: 78.429 },
  { code: 'GOI', name: 'Goa', airport: 'Dabolim', lat: 15.381, lon: 73.831 },
  { code: 'BLR', name: 'Bengaluru', airport: 'Kempegowda Intl', lat: 13.198, lon: 77.706 },
  { code: 'MAA', name: 'Chennai', airport: 'Chennai Intl', lat: 12.994, lon: 80.171 }
];

export function findCity(code) {
  return CITIES.find((c) => c.code === code) || null;
}

export function cityName(code) {
  const city = findCity(code);
  return city ? city.name : code;
}

// Great-circle distance in nautical miles and the initial true track in
// degrees, the two numbers printed beside a route on an aeronautical chart.
// This is plain geometry on the airport positions above, not flight data.
export function routeGeometry(fromCode, toCode) {
  const a = findCity(fromCode);
  const b = findCity(toCode);
  if (!a || !b || a === b) return null;

  const rad = (d) => (d * Math.PI) / 180;
  const lat1 = rad(a.lat);
  const lat2 = rad(b.lat);
  const dLat = lat2 - lat1;
  const dLon = rad(b.lon - a.lon);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const earthRadiusNm = 3440.065;
  const distance = 2 * earthRadiusNm * Math.asin(Math.sqrt(h));

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const track = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;

  return { distance: Math.round(distance), track: Math.round(track) };
}

// Track as a three-digit chart bearing: 7 -> "007°".
export function formatTrack(track) {
  return String(track).padStart(3, '0') + '°';
}
