import { Link } from 'react-router-dom';
import SearchForm from '../components/SearchForm.jsx';
import { POPULAR_ROUTES, cityName } from '../utils/cities.js';
import { addDaysISO, todayISO } from '../utils/time.js';
import './pages.css';

const FEATURES = [
  ['Instant confirmation', 'Your booking reference is issued the moment you book. No waiting, no email to chase.'],
  ['Cancel before departure', 'Plans change. Cancel any confirmed booking right up until the flight leaves.'],
  ['Seven cities, six airlines', 'Bengaluru, Delhi, Mumbai, Chennai, Hyderabad, Kolkata and Goa, on the carriers you know.']
];

export default function Home() {
  const tomorrow = addDaysISO(todayISO(), 1);

  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero__copy">
            <h1>Fly across India, simply.</h1>
            <p>Compare fares across the day, book in under a minute, and manage every trip in one place.</p>
          </div>
          <SearchForm />
        </div>
      </section>

      <section className="container home-section">
        <div className="section-head">
          <h2>Popular routes</h2>
          <p className="muted">Our busiest connections. Pick one to see what is flying.</p>
        </div>
        <div className="routes">
          {POPULAR_ROUTES.map(([from, to], i) => (
            <Link
              key={from + to}
              className="route enter"
              style={{ animationDelay: Math.min(i * 40, 240) + 'ms' }}
              to={'/search?' + new URLSearchParams({ from, to, date: tomorrow })}
            >
              <span className="route__codes">
                {from}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
                {to}
              </span>
              <span className="route__names">{cityName(from)} to {cityName(to)}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container home-section">
        <div className="features">
          {FEATURES.map(([title, body]) => (
            <div key={title} className="feature">
              <h3>{title}</h3>
              <p className="text-2">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
