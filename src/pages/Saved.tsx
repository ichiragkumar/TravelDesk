import { useEffect, useState } from 'react';
import { apiGet, type Itinerary } from '../lib/api';
import ItineraryCard from '../components/ItineraryCard';

export default function Saved() {
  const [items, setItems] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiGet<Itinerary[]>('/api/bookmarks').then(setItems).finally(() => setLoading(false));
  }, []);
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="serif-display text-4xl mb-6">Saved trips</h1>
      {loading ? <div className="text-[var(--color-muted)]">Loading…</div> : items.length === 0 ? (
        <div className="text-center py-20 text-[var(--color-muted)]">
          <div className="serif-display text-2xl text-[var(--color-forest)] mb-1">Nothing saved yet.</div>
          <p>Bookmark itineraries that inspire you — they'll show up here.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{items.map(it => <ItineraryCard key={it.id} it={it} />)}</div>
      )}
    </div>
  );
}
