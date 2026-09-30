import { todayInput } from './format.js';

// The last route searched is remembered in this browser, so the search page
// can put you back where you stopped after a refresh or a sign-in.

const KEY = 'lastSearch';

export function saveLastSearch(search) {
  try {
    localStorage.setItem(KEY, JSON.stringify(search));
  } catch {
    // Storage can be blocked (private mode). Remembering is only a nicety.
  }
}

export function readLastSearch() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (!saved || !saved.from || !saved.to) return null;
    // A remembered date in the past is no use; move it to today.
    const date = saved.date && saved.date >= todayInput() ? saved.date : todayInput();
    return { from: saved.from, to: saved.to, date };
  } catch {
    return null;
  }
}

export function searchUrl({ from, to, date }) {
  return `/flights?from=${from}&to=${to}&date=${date}`;
}
