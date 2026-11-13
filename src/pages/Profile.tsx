import { useEffect, useState, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet, apiPut, type Profile as ProfileT, type Itinerary, type TravelGroup } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import ItineraryCard from '../components/ItineraryCard';
import { Instagram, Youtube, Globe, Pencil, X, UserRound, Map, Bookmark, Users } from 'lucide-react';

export default function Profile() {
  const { username } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileT | null>(null);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [bookmarked, setBookmarked] = useState<Itinerary[]>([]);
  const [groups, setGroups] = useState<TravelGroup[]>([]);
  const [tab, setTab] = useState<'published' | 'saved' | 'groups'>('published');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const p = username
        ? await apiGet<ProfileT>(`/api/profile?username=${username}`)
        : await apiGet<ProfileT>(`/api/profile?me=1`);
      setProfile(p);
      const its = await apiGet<Itinerary[]>(`/api/itineraries?user_id=${p.id}`);
      setItineraries(its);
      if (!username || (user && user.id === p.id)) {
        const saved = await apiGet<Itinerary[]>(`/api/bookmarks`);
        setBookmarked(saved);
      }
      const gs = await apiGet<TravelGroup[]>(`/api/groups?user_id=${p.id}`);
      setGroups(gs);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [username]);

  const isMe = !!user && !!profile && user.id === profile.id;

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-20 text-[var(--color-muted)]">Loading profile…</div>;
  if (!profile) return <div className="max-w-5xl mx-auto px-4 py-20 text-[var(--color-muted)]">Profile not found.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header card */}
      <div className="relative card overflow-hidden mb-8">
        <div className="h-36 bg-gradient-to-br from-[var(--color-forest)] via-[var(--color-forest-soft)] to-[var(--color-terracotta)]" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end justify-between gap-4 flex-wrap">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 rounded-2xl bg-[var(--color-sand)] border-4 border-[var(--color-cream)] overflow-hidden grid place-items-center">
                {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" /> : <UserRound className="w-8 h-8 text-[var(--color-muted)]" />}
              </div>
              <div>
                <h1 className="serif-display text-3xl">{profile.full_name || profile.username}</h1>
                <div className="text-sm text-[var(--color-muted)]">@{profile.username}{profile.home_base ? ` · based in ${profile.home_base}` : ''}</div>
              </div>
            </div>
            {isMe && (
              <button onClick={() => setEditing(true)} className="btn btn-ghost text-sm"><Pencil className="w-4 h-4" />Edit profile</button>
            )}
          </div>
          {profile.bio && <p className="mt-4 text-[var(--color-ink)]/85 max-w-2xl">{profile.bio}</p>}

          <div className="mt-4 flex flex-wrap gap-2">
            {profile.instagram && <a className="badge" href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noreferrer"><Instagram className="w-3 h-3" />@{profile.instagram}</a>}
            {profile.youtube && <a className="badge" href={profile.youtube.startsWith('http') ? profile.youtube : `https://youtube.com/${profile.youtube}`} target="_blank" rel="noreferrer"><Youtube className="w-3 h-3" />YouTube</a>}
            {profile.x_handle && <a className="badge" href={`https://x.com/${profile.x_handle}`} target="_blank" rel="noreferrer">𝕏 @{profile.x_handle}</a>}
            {profile.tiktok && <a className="badge" href={`https://tiktok.com/@${profile.tiktok}`} target="_blank" rel="noreferrer">TikTok @{profile.tiktok}</a>}
            {profile.website && <a className="badge" href={profile.website} target="_blank" rel="noreferrer"><Globe className="w-3 h-3" />Website</a>}
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4 max-w-md">
            <Stat label="Itineraries" value={itineraries.length} />
            <Stat label="Open trips" value={groups.filter(g => g.status === 'open').length} />
            <Stat label="Countries" value={new Set(itineraries.map(i => i.country).filter(Boolean)).size} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--color-line)] mb-6">
        <TabBtn active={tab === 'published'} onClick={() => setTab('published')}><Map className="w-4 h-4" />Published</TabBtn>
        {isMe && <TabBtn active={tab === 'saved'} onClick={() => setTab('saved')}><Bookmark className="w-4 h-4" />Saved</TabBtn>}
        <TabBtn active={tab === 'groups'} onClick={() => setTab('groups')}><Users className="w-4 h-4" />Groups</TabBtn>
      </div>

      {tab === 'published' && (
        itineraries.length === 0 ? (
          <Empty text="No itineraries yet." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {itineraries.map(it => <ItineraryCard key={it.id} it={it} />)}
          </div>
        )
      )}

      {tab === 'saved' && (
        bookmarked.length === 0 ? <Empty text="Nothing saved yet." /> :
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {bookmarked.map(it => <ItineraryCard key={it.id} it={it} />)}
        </div>
      )}

      {tab === 'groups' && (
        groups.length === 0 ? <Empty text="No travel groups yet." /> :
        <div className="grid sm:grid-cols-2 gap-4">
          {groups.map(g => (
            <Link key={g.id} to={`/group/${g.id}`} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="label-k mb-1">{g.status === 'open' ? 'Open' : 'Closed'} · {g.destination}</div>
                  <h3 className="serif-display text-xl">{g.title}</h3>
                  {g.start_date && <div className="text-sm text-[var(--color-muted)] mt-1">{new Date(g.start_date).toLocaleDateString()}{g.end_date ? ` → ${new Date(g.end_date).toLocaleDateString()}` : ''}</div>}
                </div>
                <div className="text-right">
                  <div className="serif-display text-2xl">{g.approved_count}/{g.capacity}</div>
                  <div className="text-xs text-[var(--color-muted)]">travelers</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {editing && isMe && <EditProfileModal profile={profile} onClose={() => setEditing(false)} onSaved={(p) => { setProfile(p); setEditing(false); }} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="serif-display text-3xl text-[var(--color-forest)]">{value}</div>
      <div className="label-k">{label}</div>
    </div>
  );
}

function TabBtn({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm -mb-px border-b-2 ${active ? 'border-[var(--color-forest)] text-[var(--color-forest)] font-medium' : 'border-transparent text-[var(--color-muted)]'}`}>{children}</button>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-center py-16 text-[var(--color-muted)]">{text}</div>;
}

function EditProfileModal({ profile, onClose, onSaved }: { profile: ProfileT; onClose: () => void; onSaved: (p: ProfileT) => void }) {
  const [p, setP] = useState(profile);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const res = await apiPut<ProfileT>('/api/profile', p);
      onSaved(res);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} className="card max-w-xl w-full p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="serif-display text-2xl">Edit profile</div>
          <button onClick={onClose} type="button" className="p-1"><X className="w-4 h-4" /></button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Username"><input value={p.username || ''} onChange={e => setP({ ...p, username: e.target.value })} className="input" /></Field>
          <Field label="Full name"><input value={p.full_name || ''} onChange={e => setP({ ...p, full_name: e.target.value })} className="input" /></Field>
          <Field label="Home base"><input value={p.home_base || ''} onChange={e => setP({ ...p, home_base: e.target.value })} className="input" placeholder="Lisbon, Portugal" /></Field>
          <Field label="Avatar URL"><input value={p.avatar_url || ''} onChange={e => setP({ ...p, avatar_url: e.target.value })} className="input" placeholder="https://…" /></Field>
          <Field label="Instagram"><input value={p.instagram || ''} onChange={e => setP({ ...p, instagram: e.target.value })} className="input" placeholder="handle" /></Field>
          <Field label="YouTube"><input value={p.youtube || ''} onChange={e => setP({ ...p, youtube: e.target.value })} className="input" placeholder="@channel or URL" /></Field>
          <Field label="X (Twitter)"><input value={p.x_handle || ''} onChange={e => setP({ ...p, x_handle: e.target.value })} className="input" placeholder="handle" /></Field>
          <Field label="TikTok"><input value={p.tiktok || ''} onChange={e => setP({ ...p, tiktok: e.target.value })} className="input" placeholder="handle" /></Field>
          <Field label="Website"><input value={p.website || ''} onChange={e => setP({ ...p, website: e.target.value })} className="input sm:col-span-2" placeholder="https://…" /></Field>
        </div>
        <Field label="Bio"><textarea value={p.bio || ''} onChange={e => setP({ ...p, bio: e.target.value })} className="input textarea" placeholder="I write about slow travel in the Balkans…" /></Field>
        {err && <div className="text-sm text-[var(--color-terracotta-dark)]">{err}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-ghost text-sm">Cancel</button>
          <button type="submit" disabled={busy} className="btn btn-primary text-sm">Save</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="label-k mb-1">{label}</div>{children}</label>;
}
