import { Link } from 'react-router-dom';
import { Heart, Bookmark, MapPin, Clock, Wallet, Users } from 'lucide-react';
import type { Itinerary } from '../lib/api';

export default function ItineraryCard({ it }: { it: Itinerary }) {
  const budgetLabel = it.budget
    ? `$${Math.round(it.budget).toLocaleString()}`
    : it.budget_tier || '—';
  return (
    <Link to={`/itinerary/${it.id}`} className="card group block">
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-sand)]">
        {it.cover_url ? (
          <img
            src={it.cover_url}
            alt={it.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-[var(--color-muted)] serif-display text-3xl">{it.destination}</div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {it.travel_style && <span className="badge badge-forest capitalize">{it.travel_style}</span>}
          {it.group && <span className="badge badge-accent"><Users className="w-3 h-3" />Open trip</span>}
        </div>
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] mb-1">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{it.destination}{it.country ? `, ${it.country}` : ''}</span>
        </div>
        <h3 className="serif-display text-xl sm:text-2xl leading-tight mb-2 text-[var(--color-ink)]">{it.title}</h3>
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--color-muted)]">
          <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{it.duration_days} days</span>
          <span className="inline-flex items-center gap-1"><Wallet className="w-3.5 h-3.5" />{budgetLabel}</span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[var(--color-sand)] grid place-items-center text-[0.65rem] font-medium overflow-hidden">
              {it.author?.avatar_url ? <img src={it.author.avatar_url} className="w-full h-full object-cover" alt="" /> : (it.author?.username?.[0]?.toUpperCase() || '?')}
            </div>
            <span className="text-xs text-[var(--color-muted)]">@{it.author?.username || 'traveler'}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
            <span className="inline-flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{it.likes_count}</span>
            <span className="inline-flex items-center gap-1"><Bookmark className="w-3.5 h-3.5" />{it.bookmarks_count}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
