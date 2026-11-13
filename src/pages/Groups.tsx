import { useEffect, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPost, type TravelGroup } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Users, Calendar, MapPin, Plus, X } from 'lucide-react';

export default function Groups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<TravelGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = () => {
    setLoading(true);
    apiGet<TravelGroup[]>('/api/groups?status=open')
      .then(setGroups)
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
        <div>
          <div className="label-k mb-2">Travel together</div>
          <h1 className="serif-display text-4xl sm:text-5xl">Open trips looking for travelers</h1>
          <p className="text-[var(--color-muted)] max-w-xl mt-2">Join a group heading somewhere you've been dreaming about — or start your own and invite the right strangers along.</p>
        </div>
        {user && <button onClick={() => setShowCreate(true)} className="btn btn-accent"><Plus className="w-4 h-4" />Host a trip</button>}
      </div>

      {loading ? <div className="text-[var(--color-muted)]">Loading…</div> : groups.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-muted)]">
          <div className="serif-display text-2xl text-[var(--color-forest)] mb-1">No open trips right now.</div>
          <p>Be the first to host one.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map(g => (
            <Link key={g.id} to={`/group/${g.id}`} className="card p-5 block">
              <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] mb-2">
                <MapPin className="w-3.5 h-3.5" />{g.destination}
                {g.join_policy === 'auto' ? <span className="badge">Auto-join</span> : <span className="badge">Approval</span>}
              </div>
              <h3 className="serif-display text-2xl text-[var(--color-forest)] leading-tight">{g.title}</h3>
              {g.description && <p className="text-sm text-[var(--color-muted)] mt-2 line-clamp-3">{g.description}</p>}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-[var(--color-muted)] inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {g.start_date ? new Date(g.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Flexible'}
                  {g.end_date ? ` – ${new Date(g.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}
                </div>
                <div className="inline-flex items-center gap-1 text-sm">
                  <Users className="w-4 h-4" /><span className="font-medium">{g.approved_count}</span>/<span>{g.capacity}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
    </div>
  );
}

function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [capacity, setCapacity] = useState(6);
  const [policy, setPolicy] = useState<'auto' | 'approval'>('approval');
  const [waitlist, setWaitlist] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      await apiPost('/api/groups', {
        title, destination, description,
        start_date: startDate || null, end_date: endDate || null,
        capacity, join_policy: policy, waitlist_enabled: waitlist,
      });
      onCreated();
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} className="card w-full max-w-xl p-6 space-y-3 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between">
          <div className="serif-display text-2xl">Host a trip</div>
          <button onClick={onClose} type="button" className="p-1"><X className="w-4 h-4" /></button>
        </div>
        <L label="Trip title"><input required value={title} onChange={e => setTitle(e.target.value)} className="input" placeholder="Patagonia W-trek, March 2027" /></L>
        <L label="Destination"><input required value={destination} onChange={e => setDestination(e.target.value)} className="input" placeholder="Torres del Paine, Chile" /></L>
        <L label="Description"><textarea value={description} onChange={e => setDescription(e.target.value)} className="input textarea" placeholder="What's the vibe? Who are you looking for?" /></L>
        <div className="grid sm:grid-cols-2 gap-3">
          <L label="Start date"><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" /></L>
          <L label="End date"><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" /></L>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <L label="Capacity"><input type="number" min={1} max={100} value={capacity} onChange={e => setCapacity(Number(e.target.value))} className="input" /></L>
          <L label="Join policy">
            <div className="flex gap-2">
              <button type="button" onClick={() => setPolicy('auto')} className={`badge flex-1 justify-center ${policy === 'auto' ? 'badge-forest' : ''}`}>Auto-join</button>
              <button type="button" onClick={() => setPolicy('approval')} className={`badge flex-1 justify-center ${policy === 'approval' ? 'badge-forest' : ''}`}>Approval</button>
            </div>
          </L>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={waitlist} onChange={e => setWaitlist(e.target.checked)} />
          Enable waitlist when the group is full
        </label>
        {err && <div className="text-sm text-[var(--color-terracotta-dark)]">{err}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-ghost text-sm">Cancel</button>
          <button type="submit" disabled={busy} className="btn btn-primary text-sm">Create trip</button>
        </div>
      </form>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="label-k mb-1">{label}</div>{children}</label>;
}
