// The airports the seeded schedule flies between. The backend has no airport
// endpoint, so the list lives here. Codes are what the API expects.
export const CITIES = [
  { code: 'BLR', name: 'Bengaluru' },
  { code: 'DEL', name: 'Delhi' },
  { code: 'BOM', name: 'Mumbai' },
  { code: 'MAA', name: 'Chennai' },
  { code: 'HYD', name: 'Hyderabad' },
  { code: 'CCU', name: 'Kolkata' },
  { code: 'GOI', name: 'Goa' }
];

export function cityName(code) {
  const city = CITIES.find((c) => c.code === code);
  return city ? city.name : code;
}

export const POPULAR_ROUTES = [
  ['BLR', 'DEL'],
  ['BLR', 'BOM'],
  ['DEL', 'BOM'],
  ['BLR', 'HYD'],
  ['BOM', 'GOI'],
  ['DEL', 'CCU']
];
