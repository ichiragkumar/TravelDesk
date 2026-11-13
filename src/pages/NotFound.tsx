import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <div className="serif-display text-5xl mb-3">Off the map.</div>
      <p className="text-[var(--color-muted)] mb-6">This route doesn't exist — yet. Pick a new direction.</p>
      <Link to="/" className="btn btn-primary">Back to Explore</Link>
    </div>
  );
}
