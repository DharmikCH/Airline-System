import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="not-found">
      <span className="not-found-code">404 · Off chart</span>
      <h1>This page is not on the chart</h1>
      <p>The address may be mistyped, or the page may have moved.</p>
      <Link to="/" className="btn btn-primary">Back to search</Link>
    </div>
  );
}
