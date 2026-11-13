import { useEffect, useState, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet, apiPost, apiPut, type TravelGroup, type GroupMember } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, MapPin, Users, Megaphone, Check, X, Hourglass, Send, UserRound } from 'lucide-react';

export default function GroupHub() {
  const { id } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState<TravelGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [intro, setIntro] = useState('');
  const [announcement, setAnnouncement] = useState('');

  const load = async () => {
    try {
      const g = await apiGet<TravelGroup>(`/api/group?id=${id}`);
      setGroup(g);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { setLoading(true); load(); /* eslint-disable-next-line */ }, [id]);

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-20 text-[var(--color-muted)]">Loading group…</div>;
  if (err || !group) return <div className="max-w-5xl mx-auto px-4 py-20 text-[var(--color-muted)]">Couldn't load this group. {err}</div>;

  const isHost = user?.id === group.host_id;
  const myStatus = group.my_membership?.status || null;
  const isApproved = myStatus === 'APPROVED' || isHost;
  const approved = group.approved_count || 0;
  const isFull = approved >= group.capacity;

  const requestJoin = async () => {
    if (!user) { window.location.href = '/login'; return; }
    try {
      await apiPost('/api/group-members', { group_id: group.id, intro_message: intro });
      setIntro('');
      load();
    } catch (e: any) { setErr(e.message); }
  };

  const setStatus = async (memberId: number, status: GroupMember['status']) => {
    await apiPut('/api/group-members', { id: memberId, status });
    load();
  };

  const postAnnouncement = async (e: FormEvent) => {
    e.preventDefault();
    if (!announcement.trim()) return;
    await apiPost('/api/announcements', { group_id: group.id, body: announcement.trim() });
    setAnnouncement('');
    load();
  };

  const approvedMembers = group.members?.filter(m => m.status === 'APPROVED') || [];
  const pendingMembers = group.members?.filter(m => m.status === 'PENDING') || [];
  const waitlistMembers = group.members?.filter(m => m.status === 'WAITLIST') || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <Link to="/groups" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-forest)]">← Open trips</Link>
      </div>

      {/* Header */}
      <div className="card p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] mb-2">
              <MapPin className="w-3.5 h-3.5" />{group.destination}
              <span className="badge">{group.join_policy === 'auto' ? 'Auto-join' : 'Approval required'}</span>
              {group.waitlist_enabled && <span className="badge">Waitlist on</span>}
            </div>
            <h1 className="serif-display text-4xl sm:text-5xl text-[var(--color-forest)]">{group.title}</h1>
            {group.description && <p className="mt-3 text-[var(--color-ink)]/85 max-w-2xl">{group.description}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              {group.start_date && (
                <span className="inline-flex items-center gap-1 text-[var(--color-muted)]">
                  <Calendar className="w-4 h-4" />
                  {new Date(group.start_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  {group.end_date ? ` – ${new Date(group.end_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}
                </span>
              )}
              <span className="inline-flex items-center gap-1"><Users className="w-4 h-4" />{approved}/{group.capacity} travelers</span>
            </div>
            {group.itinerary && (
              <div className="mt-4">
                <Link to={`/itinerary/${group.itinerary.id}`} className="badge">
                  Based on itinerary — {group.itinerary.title}
                </Link>
              </div>
            )}
          </div>
          <div>
            {group.host && (
              <Link to={`/profile/${group.host.username}`} className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-[var(--color-sand)] overflow-hidden grid place-items-center">
                  {group.host.avatar_url ? <img src={group.host.avatar_url} className="w-full h-full object-cover" alt="" /> : <UserRound className="w-4 h-4 text-[var(--color-muted)]" />}
                </div>
                <div className="text-sm">
                  <div className="label-k">Host</div>
                  <div className="font-medium">@{group.host.username}</div>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Join UI */}
        {!isHost && (
          <div className="mt-6 pt-6 border-t border-[var(--color-line)]">
            {myStatus === 'APPROVED' && <div className="badge badge-forest">You're in — enjoy the hub below.</div>}
            {myStatus === 'PENDING' && <div className="badge"><Hourglass className="w-3 h-3" />Request pending the host's review</div>}
            {myStatus === 'WAITLIST' && <div className="badge"><Hourglass className="w-3 h-3" />On the waitlist — you'll be auto-promoted if a spot opens.</div>}
            {myStatus === 'REJECTED' && <div className="badge">Your request wasn't accepted this time.</div>}
            {!myStatus && (
              <div>
                {isFull && !group.waitlist_enabled ? (
                  <div className="badge">This trip is full and the waitlist is closed.</div>
                ) : (
                  <div className="space-y-3">
                    <div className="label-k">Interested? {group.join_policy === 'approval' ? 'Introduce yourself' : 'Join the group'}</div>
                    {group.join_policy === 'approval' && (
                      <textarea value={intro} onChange={e => setIntro(e.target.value)} className="input textarea" placeholder="A short note for the host: who you are, what you're hoping for from the trip…" />
                    )}
                    <button onClick={requestJoin} className="btn btn-accent">
                      {isFull && group.waitlist_enabled ? 'Join the waitlist' : group.join_policy === 'auto' ? 'Join the group' : 'Request to join'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Members */}
      <section>
        <h2 className="serif-display text-2xl mb-3">Travelers <span className="text-sm text-[var(--color-muted)]">({approvedMembers.length})</span></h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {approvedMembers.map(m => (
            <div key={m.id} className="card p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-sand)] overflow-hidden grid place-items-center shrink-0">
                {m.profile?.avatar_url ? <img src={m.profile.avatar_url} className="w-full h-full object-cover" alt="" /> : <UserRound className="w-4 h-4 text-[var(--color-muted)]" />}
              </div>
              <div className="min-w-0">
                <div className="font-medium truncate">{m.profile?.full_name || m.profile?.username}</div>
                <div className="text-xs text-[var(--color-muted)] truncate">@{m.profile?.username}{m.profile?.home_base ? ` · ${m.profile.home_base}` : ''}</div>
              </div>
            </div>
          ))}
          {approvedMembers.length === 0 && <div className="text-sm text-[var(--color-muted)]">No one has joined yet.</div>}
        </div>
      </section>

      {/* Host view: pending / waitlist */}
      {isHost && (pendingMembers.length > 0 || waitlistMembers.length > 0) && (
        <section>
          <h2 className="serif-display text-2xl mb-3">Requests</h2>
          <div className="space-y-3">
            {pendingMembers.map(m => (
              <div key={m.id} className="card p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-sand)] overflow-hidden grid place-items-center shrink-0">
                  {m.profile?.avatar_url ? <img src={m.profile.avatar_url} className="w-full h-full object-cover" alt="" /> : <UserRound className="w-4 h-4 text-[var(--color-muted)]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">@{m.profile?.username}</div>
                  {m.intro_message && <div className="text-sm text-[var(--color-muted)] mt-1">“{m.intro_message}”</div>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStatus(m.id, 'APPROVED')} className="btn btn-primary text-xs"><Check className="w-3 h-3" />Approve</button>
                  <button onClick={() => setStatus(m.id, 'REJECTED')} className="btn btn-ghost text-xs"><X className="w-3 h-3" />Decline</button>
                </div>
              </div>
            ))}
            {waitlistMembers.map(m => (
              <div key={m.id} className="card p-4 flex items-start gap-3 bg-[var(--color-sand-soft)]/40">
                <div className="w-10 h-10 rounded-full bg-[var(--color-sand)] overflow-hidden grid place-items-center shrink-0">
                  {m.profile?.avatar_url ? <img src={m.profile.avatar_url} className="w-full h-full object-cover" alt="" /> : <UserRound className="w-4 h-4 text-[var(--color-muted)]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">@{m.profile?.username} <span className="badge ml-2">Waitlist</span></div>
                  {m.intro_message && <div className="text-sm text-[var(--color-muted)] mt-1">“{m.intro_message}”</div>}
                </div>
                <button onClick={() => setStatus(m.id, 'APPROVED')} disabled={isFull} className="btn btn-primary text-xs"><Check className="w-3 h-3" />Promote</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Announcements */}
      {isApproved && (
        <section>
          <h2 className="serif-display text-2xl mb-3 inline-flex items-center gap-2"><Megaphone className="w-5 h-5 text-[var(--color-terracotta)]" />Announcements</h2>
          {isHost && (
            <form onSubmit={postAnnouncement} className="card p-4 mb-4 flex gap-2">
              <input value={announcement} onChange={e => setAnnouncement(e.target.value)} className="input" placeholder="Share an update with your travelers…" />
              <button type="submit" className="btn btn-primary"><Send className="w-4 h-4" />Post</button>
            </form>
          )}
          <div className="space-y-3">
            {(group.announcements || []).map(a => (
              <div key={a.id} className="card p-4">
                <div className="text-xs text-[var(--color-muted)] mb-1">@{a.author?.username || 'host'} · {new Date(a.created_at).toLocaleString()}</div>
                <div className="text-[var(--color-ink)]/90">{a.body}</div>
              </div>
            ))}
            {(!group.announcements || group.announcements.length === 0) && <div className="text-sm text-[var(--color-muted)]">No announcements yet.</div>}
          </div>
        </section>
      )}
    </div>
  );
}
