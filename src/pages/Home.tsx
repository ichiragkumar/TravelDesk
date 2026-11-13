import { useEffect, useMemo, useState } from 'react';
import ItineraryCard from '../components/ItineraryCard';
import { apiGet, type Itinerary } from '../lib/api';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const STYLES = ['solo', 'group', 'adventure', 'leisure', 'culture', 'foodie', 'budget', 'luxury'];
const BUDGETS = [
  { label: 'Any', min: 0, max: 100000 },
  { label: '< $500', min: 0, max: 500 },
  { label: '$500 – $1500', min: 500, max: 1500 },
  { label: '$1500 – $3000', min: 1500, max: 3000 },
  { label: '$3000+', min: 3000, max: 100000 },
];
const DURATIONS = [
  { label: 'Any', min: 0, max: 60 },
  { label: 'Weekend (1–3d)', min: 1, max: 3 },
  { label: 'Short (4–6d)', min: 4, max: 6 },
  { label: '1 week (7–9d)', min: 7, max: 9 },
  { label: 'Long (10d+)', min: 10, max: 60 },
];
const SORTS = [
  { key: 'popular', label: 'Popular' },
  { key: 'new', label: 'Newest' },
  { key: 'budget_asc', label: 'Budget: low → high' },
  { key: 'duration', label: 'Shortest trips' },
];

export default function Home() {
  const [items, setItems] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [style, setStyle] = useState<string>('');
  const [budgetIdx, setBudgetIdx] = useState(0);
  const [durationIdx, setDurationIdx] = useState(0);
  const [sort, setSort] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiGet<Itinerary[]>('/api/itineraries?visibility=public')
      .then(setItems)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const b = BUDGETS[budgetIdx];
    const d = DURATIONS[durationIdx];
    let list = items.filter((it) => {
      const matchesQ = !q || [it.title, it.destination, it.country, it.description].join(' ').toLowerCase().includes(q.toLowerCase());
      const matchesStyle = !style || it.travel_style === style;
      const budget = it.budget ?? 0;
      const matchesBudget = budget >= b.min && budget <= b.max;
      const matchesDuration = it.duration_days >= d.min && it.duration_days <= d.max;
      return matchesQ && matchesStyle && matchesBudget && matchesDuration;
    });
    if (sort === 'popular') list.sort((a, b) => (b.likes_count + b.bookmarks_count) - (a.likes_count + a.bookmarks_count));
    else if (sort === 'new') list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else if (sort === 'budget_asc') list.sort((a, b) => (a.budget ?? 0) - (b.budget ?? 0));
    else if (sort === 'duration') list.sort((a, b) => a.duration_days - b.duration_days);
    return list;
  }, [items, q, style, budgetIdx, durationIdx, sort]);

  const hasActiveFilter = !!style || budgetIdx !== 0 || durationIdx !== 0 || sort !== 'popular';

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-[var(--color-line)] bg-[var(--color-sand-soft)]/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <div className="max-w-3xl">
            <div className="label-k mb-4">A field notebook for travelers</div>
            <h1 className="serif-display text-5xl sm:text-7xl text-[var(--color-forest)] mb-4">
              Routes worth taking,<br /><em className="text-[var(--color-terracotta)]">together.</em>
            </h1>
            <p className="text-lg text-[var(--color-muted)] max-w-xl">
              Browse day-by-day itineraries from travelers who've been there, bookmark the ones that spark something, or join a group heading your way.
            </p>
          </div>
          <div className="mt-8 flex gap-3 items-center">
            <div className="relative flex-1 max-w-xl">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by destination, country, or vibe…"
                className="input pl-9"
              />
            </div>
            <button onClick={() => setShowFilters(v => !v)} className={`btn ${hasActiveFilter ? 'btn-primary' : 'btn-ghost'} shrink-0`}>
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>
      </section>

      {/* Filters */}
      {showFilters && (
        <section className="border-b border-[var(--color-line)] bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 grid gap-4 sm:grid-cols-4">
            <div>
              <div className="label-k mb-2">Travel style</div>
              <div className="flex gap-1.5 flex-wrap">
                <button onClick={() => setStyle('')} className={`badge ${!style ? 'badge-forest' : ''}`}>All</button>
                {STYLES.map(s => (
                  <button key={s} onClick={() => setStyle(s === style ? '' : s)} className={`badge capitalize ${style === s ? 'badge-forest' : ''}`}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="label-k mb-2">Budget</div>
              <div className="flex gap-1.5 flex-wrap">
                {BUDGETS.map((b, i) => (
                  <button key={b.label} onClick={() => setBudgetIdx(i)} className={`badge ${budgetIdx === i ? 'badge-forest' : ''}`}>{b.label}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="label-k mb-2">Duration</div>
              <div className="flex gap-1.5 flex-wrap">
                {DURATIONS.map((d, i) => (
                  <button key={d.label} onClick={() => setDurationIdx(i)} className={`badge ${durationIdx === i ? 'badge-forest' : ''}`}>{d.label}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="label-k mb-2">Sort</div>
              <div className="flex gap-1.5 flex-wrap">
                {SORTS.map(s => (
                  <button key={s.key} onClick={() => setSort(s.key)} className={`badge ${sort === s.key ? 'badge-forest' : ''}`}>{s.label}</button>
                ))}
              </div>
            </div>
            {hasActiveFilter && (
              <button onClick={() => { setStyle(''); setBudgetIdx(0); setDurationIdx(0); setSort('popular'); }} className="text-xs text-[var(--color-terracotta)] inline-flex items-center gap-1 justify-self-start">
                <X className="w-3 h-3" />Clear all
              </button>
            )}
          </div>
        </section>
      )}

      {/* Feed */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-end justify-between mb-6">
          <h2 className="serif-display text-3xl sm:text-4xl">The feed</h2>
          <div className="text-sm text-[var(--color-muted)]">{filtered.length} itineraries</div>
        </div>
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0,1,2,3,4,5].map(i => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-[4/3] bg-[var(--color-sand)]" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-[var(--color-sand)] rounded w-1/3" />
                  <div className="h-5 bg-[var(--color-sand)] rounded w-3/4" />
                  <div className="h-3 bg-[var(--color-sand)] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-[var(--color-muted)]">
            <div className="serif-display text-3xl text-[var(--color-forest)] mb-2">Nothing here yet.</div>
            <p>Try broader filters or a different search term.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(it => <ItineraryCard key={it.id} it={it} />)}
          </div>
        )}
      </section>
    </div>
  );
}
