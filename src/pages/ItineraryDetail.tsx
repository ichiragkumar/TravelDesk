import { useEffect, useState, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet, apiPost, type Itinerary, type Comment } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Bookmark, Share2, MapPin, Clock, Wallet, ExternalLink, StickyNote, Tag, Users, UserRound, Instagram, Youtube, Globe } from 'lucide-react';

export default function ItineraryDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [it, setIt] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [copied, setCopied] = useState(false);

  const load = async () => {
    try {
      const data = await apiGet<Itinerary>(`/api/itinerary?id=${id}`);
      setIt(data);
      const c = await apiGet<Comment[]>(`/api/comments?itinerary_id=${id}`);
      setComments(c);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { setLoading(true); load(); /* eslint-disable-next-line */ }, [id]);

  const toggleLike = async () => {
    if (!user) { window.location.href = '/login'; return; }
    await apiPost('/api/likes', { itinerary_id: Number(id) });
    load();
  };
  const toggleBookmark = async () => {
    if (!user) { window.location.href = '/login'; return; }
    await apiPost('/api/bookmarks', { itinerary_id: Number(id) });
    load();
  };
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: it?.title, text: it?.description || '', url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) { window.location.href = '/login'; return; }
    await apiPost('/api/comments', { itinerary_id: Number(id), body: newComment.trim() });
    setNewComment('');
    load();
  };

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-20 text-[var(--color-muted)]">Loading itinerary…</div>;
  if (err || !it) return <div className="max-w-4xl mx-auto px-4 py-20 text-[var(--color-muted)]">Couldn't load this itinerary. {err}</div>;

  const author = it.author;

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-6">
        <Link to="/" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-forest)]">← Explore</Link>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {it.travel_style && <span className="badge badge-forest capitalize"><Tag className="w-3 h-3" />{it.travel_style}</span>}
        <span className="badge"><MapPin className="w-3 h-3" />{it.destination}{it.country ? `, ${it.country}` : ''}</span>
        <span className="badge"><Clock className="w-3 h-3" />{it.duration_days} days</span>
        <span className="badge"><Wallet className="w-3 h-3" />{it.budget ? `~$${Math.round(it.budget).toLocaleString()}` : (it.budget_tier || 'Flexible')}</span>
      </div>
      <h1 className="serif-display text-4xl sm:text-6xl text-[var(--color-forest)] mb-4">{it.title}</h1>
      {it.description && <p className="text-lg text-[var(--color-muted)] max-w-3xl mb-6">{it.description}</p>}

      {author && (
        <Link to={`/profile/${author.username}`} className="inline-flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[var(--color-sand)] grid place-items-center overflow-hidden">
            {author.avatar_url ? <img src={author.avatar_url} className="w-full h-full object-cover" alt="" /> : <UserRound className="w-5 h-5 text-[var(--color-muted)]" />}
          </div>
          <div>
            <div className="font-medium">{author.full_name || author.username}</div>
            <div className="text-xs text-[var(--color-muted)]">@{author.username}</div>
          </div>
        </Link>
      )}

      {/* Cover */}
      {it.cover_url && (
        <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-6 bg-[var(--color-sand)]">
          <img src={it.cover_url} alt={it.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 mb-10 py-4 border-y border-[var(--color-line)]">
        <button onClick={toggleLike} className={`btn ${it.liked ? 'btn-accent' : 'btn-ghost'}`}>
          <Heart className={`w-4 h-4 ${it.liked ? 'fill-current' : ''}`} />{it.likes_count}
        </button>
        <button onClick={toggleBookmark} className={`btn ${it.bookmarked ? 'btn-primary' : 'btn-ghost'}`}>
          <Bookmark className={`w-4 h-4 ${it.bookmarked ? 'fill-current' : ''}`} />{it.bookmarked ? 'Saved' : 'Save'}
        </button>
        <button onClick={share} className="btn btn-ghost"><Share2 className="w-4 h-4" />{copied ? 'Link copied' : 'Share'}</button>
        {it.group ? (
          <Link to={`/group/${it.group.id}`} className="btn btn-accent ml-auto"><Users className="w-4 h-4" />Open trip · {it.group.approved_count}/{it.group.capacity}</Link>
        ) : null}
      </div>

      {/* Days */}
      <section className="space-y-10">
        {it.days?.map((day) => (
          <div key={day.id} className="relative">
            <div className="flex items-baseline gap-3 mb-5">
              <div className="serif-display text-5xl text-[var(--color-terracotta)]">{day.day_number}</div>
              <div>
                <div className="label-k">Day {day.day_number}</div>
                <div className="serif-display text-2xl text-[var(--color-forest)]">{day.title || 'Explore'}</div>
                {day.summary && <div className="text-sm text-[var(--color-muted)] mt-1 max-w-2xl">{day.summary}</div>}
              </div>
            </div>
            <div className="relative pl-8 rail">
              {day.activities?.map((a) => (
                <div key={a.id} className="relative mb-6">
                  <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-[var(--color-cream)] border-2 border-[var(--color-forest)] grid place-items-center text-[0.65rem] font-medium text-[var(--color-forest)]">
                    {a.time_slot ? a.time_slot.slice(0,1).toUpperCase() : '•'}
                  </div>
                  <div className="card p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] mb-1">
                          {a.time_slot && <span className="badge">{a.time_slot}</span>}
                          {a.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{a.location}</span>}
                        </div>
                        <h3 className="serif-display text-xl text-[var(--color-ink)]">{a.title}</h3>
                      </div>
                      {a.estimated_cost != null && (
                        <div className="text-right">
                          <div className="label-k">Est. cost</div>
                          <div className="serif-display text-lg">${Number(a.estimated_cost).toFixed(0)}</div>
                        </div>
                      )}
                    </div>
                    {a.description && <p className="text-sm text-[var(--color-ink)]/85 mt-3">{a.description}</p>}
                    {a.image_url && (
                      <div className="mt-3 rounded-xl overflow-hidden">
                        <img src={a.image_url} alt="" className="w-full max-h-72 object-cover" />
                      </div>
                    )}
                    {a.notes && (
                      <div className="mt-3 flex items-start gap-2 text-sm text-[var(--color-muted)] bg-[var(--color-sand-soft)]/60 border border-[var(--color-line)] rounded-xl p-3">
                        <StickyNote className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{a.notes}</span>
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {a.external_link && (
                        <a href={a.external_link} target="_blank" rel="noreferrer" className="badge">
                          <ExternalLink className="w-3 h-3" />Reference
                        </a>
                      )}
                      {a.affiliate_url && (
                        <a href={a.affiliate_url} target="_blank" rel="noreferrer" className="badge badge-accent">
                          <ExternalLink className="w-3 h-3" />{a.affiliate_label || 'Book / Shop'} · Affiliate
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Affiliate / gear */}
      {it.affiliate_links && it.affiliate_links.length > 0 && (
        <section className="mt-14 pt-10 border-t border-[var(--color-line)]">
          <div className="label-k mb-2">Recommended by {author?.full_name || `@${author?.username}`}</div>
          <h2 className="serif-display text-3xl text-[var(--color-forest)] mb-5">Gear & booking links</h2>
          <p className="text-sm text-[var(--color-muted)] max-w-2xl mb-6">
            Some links below are affiliate or referral links. If you book through them, the author may earn a small commission at no extra cost to you. Clearly marked below.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {it.affiliate_links.map(l => (
              <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="card p-4 flex items-start gap-3 hover:bg-[var(--color-sand-soft)]/40">
                <div className="w-10 h-10 rounded-full bg-[var(--color-terracotta)]/15 text-[var(--color-terracotta-dark)] grid place-items-center shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{l.label}</div>
                  {l.category && <div className="text-xs text-[var(--color-muted)] capitalize">{l.category}</div>}
                  {l.note && <div className="text-sm text-[var(--color-muted)] mt-1">{l.note}</div>}
                  <div className="mt-2"><span className="badge badge-accent">Affiliate / referral</span></div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Author social */}
      {author && (author.instagram || author.youtube || author.x_handle || author.tiktok || author.website) && (
        <section className="mt-10 pt-8 border-t border-[var(--color-line)]">
          <div className="label-k mb-3">Follow the creator</div>
          <div className="flex flex-wrap gap-2">
            {author.instagram && <a className="badge" href={`https://instagram.com/${author.instagram}`} target="_blank" rel="noreferrer"><Instagram className="w-3 h-3" />@{author.instagram}</a>}
            {author.youtube && <a className="badge" href={author.youtube.startsWith('http') ? author.youtube : `https://youtube.com/${author.youtube}`} target="_blank" rel="noreferrer"><Youtube className="w-3 h-3" />YouTube</a>}
            {author.x_handle && <a className="badge" href={`https://x.com/${author.x_handle}`} target="_blank" rel="noreferrer">𝕏 @{author.x_handle}</a>}
            {author.tiktok && <a className="badge" href={`https://tiktok.com/@${author.tiktok}`} target="_blank" rel="noreferrer">TikTok @{author.tiktok}</a>}
            {author.website && <a className="badge" href={author.website} target="_blank" rel="noreferrer"><Globe className="w-3 h-3" />Website</a>}
          </div>
        </section>
      )}

      {/* Comments */}
      <section className="mt-14 pt-10 border-t border-[var(--color-line)]">
        <h2 className="serif-display text-3xl text-[var(--color-forest)] mb-5">Trail notes <span className="text-sm text-[var(--color-muted)] font-sans">({comments.length})</span></h2>
        <form onSubmit={submitComment} className="mb-6 flex gap-2">
          <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder={user ? 'Add a note or ask a question…' : 'Sign in to leave a note'} disabled={!user} className="input" />
          <button type="submit" disabled={!user || !newComment.trim()} className="btn btn-primary">Post</button>
        </form>
        <div className="space-y-4">
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-[var(--color-sand)] shrink-0 overflow-hidden grid place-items-center">
                {c.author?.avatar_url ? <img src={c.author.avatar_url} className="w-full h-full object-cover" alt="" /> : (c.author?.username?.[0]?.toUpperCase() || '?')}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">@{c.author?.username || 'user'}</span>
                  <span className="text-xs text-[var(--color-muted)]">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <div className="text-[var(--color-ink)]/90 text-sm mt-0.5">{c.body}</div>
              </div>
            </div>
          ))}
          {comments.length === 0 && <div className="text-sm text-[var(--color-muted)]">Be the first to leave a note.</div>}
        </div>
      </section>
    </article>
  );
}
