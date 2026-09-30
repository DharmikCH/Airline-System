import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container narrow">
      <div className="card empty">
        <h3>This page took a wrong turn</h3>
        <p>The address may be mistyped, or the page may have moved.</p>
        <Link to="/" className="btn btn--primary">Back to home</Link>
      </div>
    </div>
  );
}
