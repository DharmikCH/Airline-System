// The one place the app talks to the backend.
//
// Every error the backend sends looks like { error: { code, message } }, so a
// single function turns any failure into an ApiError that pages can show or
// branch on by code.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// auth.jsx registers a function here. This file is a plain module and cannot
// use React hooks, so this is how it tells the app a login has expired.
let onSessionExpired = null;

export function setSessionExpiredHandler(fn) {
  onSessionExpired = fn;
}

export async function api(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) {
    headers.Authorization = 'Bearer ' + token;
  }

  let res;
  try {
    res = await fetch(BASE_URL + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Cannot reach the server. Is the backend running on port 5000?');
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const e = (data && data.error) || {};
    const err = new ApiError(res.status, e.code || 'HTTP_' + res.status, e.message || 'Something went wrong.');
    if (err.code === 'INVALID_TOKEN' && onSessionExpired) {
      onSessionExpired();
    }
    throw err;
  }

  return data;
}
