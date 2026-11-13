import { useEffect, useState, FormEvent, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPost, apiPut, type Itinerary } from '../lib/api';
import { Plus, Trash2, Save, Eye, Upload, ChevronDown, ChevronUp, Link2, Tag, Lock, Globe, FileEdit } from 'lucide-react';

type DraftActivity = {
  id?: number;
  time_slot: string;
  title: string;
  location: string;
  description: string;
  notes: string;
  estimated_cost: string;
  image_url: string;
  external_link: string;
  affiliate_url: string;
  affiliate_label: string;
};

type DraftDay = {
  id?: number;
  day_number: number;
  title: string;
  summary: string;
  activities: DraftActivity[];
  open?: boolean;
};

type DraftAffiliate = { id?: number; label: string; url: string; category: string; note: string };

const blankActivity = (): DraftActivity => ({
  time_slot: 'Morning', title: '', location: '', description: '', notes: '', estimated_cost: '', image_url: '', external_link: '', affiliate_url: '', affiliate_label: '',
});

const STYLES = ['solo', 'group', 'adventure', 'leisure', 'culture', 'foodie', 'budget', 'luxury'];

export default function Create() {
  const nav = useNavigate();
  const { id } = useParams();
  const editing = !!id;

  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [country, setCountry] = useState('');
  const [duration, setDuration] = useState(3);
  const [budget, setBudget] = useState('');
  const [style, setStyle] = useState('adventure');
  const [coverUrl, setCoverUrl] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'draft' | 'private' | 'public'>('draft');
  const [days, setDays] = useState<DraftDay[]>([{ day_number: 1, title: '', summary: '', activities: [blankActivity()], open: true }]);
  const [affLinks, setAffLinks] = useState<DraftAffiliate[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) return;
    (async () => {
      try {
        const it = await apiGet<Itinerary>(`/api/itinerary?id=${id}`);
        setTitle(it.title); setDestination(it.destination); setCountry(it.country || ''); setDuration(it.duration_days);
        setBudget(it.budget ? String(it.budget) : ''); setStyle(it.travel_style || 'adventure'); setCoverUrl(it.cover_url || '');
        setDescription(it.description || ''); setVisibility(it.visibility);
        setDays(it.days?.map(d => ({ id: d.id, day_number: d.day_number, title: d.title || '', summary: d.summary || '', open: false, activities: (d.activities || []).map(a => ({ id: a.id, time_slot: a.time_slot || 'Morning', title: a.title, location: a.location || '', description: a.description || '', notes: a.notes || '', estimated_cost: a.estimated_cost != null ? String(a.estimated_cost) : '', image_url: a.image_url || '', external_link: a.external_link || '', affiliate_url: a.affiliate_url || '', affiliate_label: a.affiliate_label || '' })) })) || []);
        setAffLinks((it.affiliate_links || []).map(l => ({ id: l.id, label: l.label, url: l.url, category: l.category || '', note: l.note || '' })));
      } catch (e: any) { setErr(e.message); }
    })();
  }, [id, editing]);

  const addDay = () => setDays(ds => [...ds, { day_number: ds.length + 1, title: '', summary: '', activities: [blankActivity()], open: true }]);
  const removeDay = (i: number) => setDays(ds => ds.filter((_, idx) => idx !== i).map((d, idx) => ({ ...d, day_number: idx + 1 })));
  const toggleDay = (i: number) => setDays(ds => ds.map((d, idx) => idx === i ? { ...d, open: !d.open } : d));
  const updateDay = (i: number, patch: Partial<DraftDay>) => setDays(ds => ds.map((d, idx) => idx === i ? { ...d, ...patch } : d));

  const addActivity = (dayIdx: number) => setDays(ds => ds.map((d, i) => i === dayIdx ? { ...d, activities: [...d.activities, blankActivity()] } : d));
  const removeActivity = (dayIdx: number, actIdx: number) => setDays(ds => ds.map((d, i) => i === dayIdx ? { ...d, activities: d.activities.filter((_, ai) => ai !== actIdx) } : d));
  const updateActivity = (dayIdx: number, actIdx: number, patch: Partial<DraftActivity>) => setDays(ds => ds.map((d, i) => i === dayIdx ? { ...d, activities: d.activities.map((a, ai) => ai === actIdx ? { ...a, ...patch } : a) } : d));

  const uploadImage = async (file: File): Promise<string> => {
    const buf = await file.arrayBuffer();
    const base64 = btoa(new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), ''));
    const res = await apiPost<{ url: string }>('/api/upload', { fileName: `${Date.now()}-${file.name}`, fileBase64: base64, contentType: file.type });
    return res.url;
  };

  const onCoverFile = async (f: File | undefined) => {
    if (!f) return;
    try { const url = await uploadImage(f); setCoverUrl(url); } catch (e: any) { setErr(e.message); }
  };

  const onActivityImage = async (dayIdx: number, actIdx: number, f: File | undefined) => {
    if (!f) return;
    try { const url = await uploadImage(f); updateActivity(dayIdx, actIdx, { image_url: url }); } catch (e: any) { setErr(e.message); }
  };

  const save = async (asVisibility?: 'draft' | 'private' | 'public') => {
    setSaving(true); setErr(null);
    try {
      const payload = {
        title, destination, country, duration_days: duration,
        budget: budget ? Number(budget) : null, travel_style: style, cover_url: coverUrl,
        description, visibility: asVisibility || visibility,
        days: days.map(d => ({
          id: d.id, day_number: d.day_number, title: d.title, summary: d.summary,
          activities: d.activities.map((a, idx) => ({
            id: a.id, position: idx, time_slot: a.time_slot, title: a.title,
            location: a.location, description: a.description, notes: a.notes,
            estimated_cost: a.estimated_cost ? Number(a.estimated_cost) : null,
            image_url: a.image_url, external_link: a.external_link,
            affiliate_url: a.affiliate_url, affiliate_label: a.affiliate_label,
          })),
        })),
        affiliate_links: affLinks,
      };
      let result: Itinerary;
      if (editing) result = await apiPut<Itinerary>(`/api/itinerary?id=${id}`, payload);
      else result = await apiPost<Itinerary>('/api/itineraries', payload);
      nav(`/itinerary/${result.id}`);
    } catch (e: any) { setErr(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <FileEdit className="w-5 h-5" />
        <h1 className="serif-display text-3xl sm:text-4xl flex-1">{editing ? 'Edit itinerary' : 'Plot a new itinerary'}</h1>
        <button onClick={() => save('draft')} disabled={saving} className="btn btn-ghost text-sm"><Save className="w-4 h-4" />Save draft</button>
        <button onClick={() => save('public')} disabled={saving || !title || !destination} className="btn btn-primary text-sm"><Eye className="w-4 h-4" />Publish</button>
      </div>

      {err && <div className="mb-6 text-sm text-[var(--color-terracotta-dark)] bg-[var(--color-terracotta)]/10 border border-[var(--color-terracotta)]/30 rounded-xl p-3">{err}</div>}

      {/* Basics */}
      <section className="card p-6 mb-6 space-y-4">
        <div className="label-k">The basics</div>
        <div>
          <label className="label-k">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="input mt-1 text-xl serif-display" placeholder="Chasing shrines in Kyoto" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label-k">Destination (city / region)</label>
            <input value={destination} onChange={e => setDestination(e.target.value)} className="input mt-1" placeholder="Kyoto" />
          </div>
          <div>
            <label className="label-k">Country</label>
            <input value={country} onChange={e => setCountry(e.target.value)} className="input mt-1" placeholder="Japan" />
          </div>
          <div>
            <label className="label-k">Duration (days)</label>
            <input type="number" min={1} max={60} value={duration} onChange={e => setDuration(Number(e.target.value))} className="input mt-1" />
          </div>
          <div>
            <label className="label-k">Estimated budget (USD)</label>
            <input type="number" value={budget} onChange={e => setBudget(e.target.value)} className="input mt-1" placeholder="1200" />
          </div>
        </div>
        <div>
          <label className="label-k">Travel style</label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {STYLES.map(s => (
              <button key={s} onClick={() => setStyle(s)} className={`badge capitalize ${style === s ? 'badge-forest' : ''}`}>{s}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="label-k">Short pitch</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="input textarea mt-1" placeholder="What makes this trip worth taking?" />
        </div>
        <div>
          <label className="label-k">Cover photo</label>
          <div className="mt-2 flex items-center gap-3">
            <div className="w-40 h-28 rounded-xl bg-[var(--color-sand)] overflow-hidden grid place-items-center text-[var(--color-muted)] text-sm">
              {coverUrl ? <img src={coverUrl} className="w-full h-full object-cover" alt="" /> : 'No cover'}
            </div>
            <input ref={coverInput} type="file" accept="image/*" className="hidden" onChange={e => onCoverFile(e.target.files?.[0])} />
            <button onClick={() => coverInput.current?.click()} className="btn btn-ghost text-sm"><Upload className="w-4 h-4" />Upload</button>
            <input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} className="input flex-1" placeholder="or paste an image URL" />
          </div>
        </div>
        <div>
          <label className="label-k">Visibility</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {([['draft', 'Draft', FileEdit], ['private', 'Private', Lock], ['public', 'Public', Globe]] as const).map(([v, l, Icon]) => (
              <button key={v} onClick={() => setVisibility(v)} className={`btn text-sm ${visibility === v ? 'btn-primary' : 'btn-ghost'}`}>
                <Icon className="w-4 h-4" />{l}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Days */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="label-k">Day-by-day</div>
          <button onClick={addDay} className="btn btn-ghost text-sm"><Plus className="w-4 h-4" />Add day</button>
        </div>
        <div className="space-y-4">
          {days.map((day, di) => (
            <div key={di} className="card">
              <button onClick={() => toggleDay(di)} className="w-full flex items-center justify-between p-4 text-left">
                <div className="flex items-baseline gap-3">
                  <span className="serif-display text-3xl text-[var(--color-terracotta)]">{day.day_number}</span>
                  <span className="serif-display text-xl">{day.title || `Day ${day.day_number}`}</span>
                  <span className="text-xs text-[var(--color-muted)]">{day.activities.length} activities</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); removeDay(di); }} className="p-1 text-[var(--color-muted)] hover:text-[var(--color-terracotta)]" aria-label="Remove day"><Trash2 className="w-4 h-4" /></button>
                  {day.open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>
              {day.open && (
                <div className="p-4 pt-0 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input value={day.title} onChange={e => updateDay(di, { title: e.target.value })} className="input" placeholder="Day title (e.g. Arrival & Gion stroll)" />
                    <input value={day.summary} onChange={e => updateDay(di, { summary: e.target.value })} className="input" placeholder="One-line summary" />
                  </div>
                  {day.activities.map((a, ai) => (
                    <ActivityRow key={ai} activity={a} onChange={(patch) => updateActivity(di, ai, patch)} onRemove={() => removeActivity(di, ai)} onUploadImage={(f) => onActivityImage(di, ai, f)} />
                  ))}
                  <button onClick={() => addActivity(di)} className="btn btn-ghost text-sm"><Plus className="w-4 h-4" />Add activity</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Affiliate */}
      <section className="card p-6 mb-10">
        <div className="flex items-center justify-between mb-2">
          <div className="label-k">Recommended gear & booking links</div>
          <button onClick={() => setAffLinks(ls => [...ls, { label: '', url: '', category: '', note: '' }])} className="btn btn-ghost text-sm"><Plus className="w-4 h-4" />Add link</button>
        </div>
        <p className="text-sm text-[var(--color-muted)] mb-4">Add affiliate or referral links you use. These appear at the bottom of the published itinerary with a clear badge.</p>
        <div className="space-y-3">
          {affLinks.map((l, i) => (
            <div key={i} className="grid sm:grid-cols-5 gap-2 items-start">
              <input value={l.label} onChange={e => setAffLinks(ls => ls.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} className="input sm:col-span-2" placeholder="Osprey Farpoint 40 pack" />
              <input value={l.url} onChange={e => setAffLinks(ls => ls.map((x, j) => j === i ? { ...x, url: e.target.value } : x))} className="input sm:col-span-2" placeholder="https://…" />
              <input value={l.category} onChange={e => setAffLinks(ls => ls.map((x, j) => j === i ? { ...x, category: e.target.value } : x))} className="input" placeholder="Gear / Hotel / Tour" />
              <input value={l.note} onChange={e => setAffLinks(ls => ls.map((x, j) => j === i ? { ...x, note: e.target.value } : x))} className="input sm:col-span-4" placeholder="Optional note" />
              <button onClick={() => setAffLinks(ls => ls.filter((_, j) => j !== i))} className="btn btn-ghost sm:col-span-1 text-sm"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          {affLinks.length === 0 && <div className="text-sm text-[var(--color-muted)]">No links yet.</div>}
        </div>
      </section>

      <div className="flex gap-2 justify-end sticky bottom-2 sm:bottom-4">
        <button onClick={() => save('draft')} disabled={saving} className="btn btn-ghost"><Save className="w-4 h-4" />Save draft</button>
        <button onClick={() => save('public')} disabled={saving || !title || !destination} className="btn btn-primary"><Globe className="w-4 h-4" />Publish</button>
      </div>
    </div>
  );
}

function ActivityRow({ activity, onChange, onRemove, onUploadImage }: {
  activity: DraftActivity;
  onChange: (patch: Partial<DraftActivity>) => void;
  onRemove: () => void;
  onUploadImage: (f: File | undefined) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showMore, setShowMore] = useState(false);
  return (
    <div className="border border-[var(--color-line)] rounded-xl p-4 bg-[var(--color-sand-soft)]/30">
      <div className="grid sm:grid-cols-5 gap-2">
        <select value={activity.time_slot} onChange={e => onChange({ time_slot: e.target.value })} className="input">
          {['Morning', 'Midday', 'Afternoon', 'Evening', 'Night', 'All day'].map(t => <option key={t}>{t}</option>)}
        </select>
        <input value={activity.title} onChange={e => onChange({ title: e.target.value })} className="input sm:col-span-2" placeholder="Activity title" />
        <input value={activity.location} onChange={e => onChange({ location: e.target.value })} className="input" placeholder="Location" />
        <input type="number" value={activity.estimated_cost} onChange={e => onChange({ estimated_cost: e.target.value })} className="input" placeholder="Cost $" />
      </div>
      <textarea value={activity.description} onChange={e => onChange({ description: e.target.value })} className="input textarea mt-2" placeholder="Describe the activity" />
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <button onClick={() => setShowMore(v => !v)} className="text-xs text-[var(--color-forest)] underline">
          {showMore ? 'Hide extras' : 'Add photo, notes, links'}
        </button>
        <button onClick={onRemove} className="ml-auto text-xs text-[var(--color-terracotta-dark)] inline-flex items-center gap-1"><Trash2 className="w-3 h-3" />Remove</button>
      </div>
      {showMore && (
        <div className="mt-3 space-y-2">
          <textarea value={activity.notes} onChange={e => onChange({ notes: e.target.value })} className="input" placeholder="Insider notes / tips" />
          <div className="grid sm:grid-cols-2 gap-2">
            <input value={activity.external_link} onChange={e => onChange({ external_link: e.target.value })} className="input" placeholder="Reference link (maps / official site)" />
            <input value={activity.affiliate_label} onChange={e => onChange({ affiliate_label: e.target.value })} className="input" placeholder="Affiliate label (e.g. Book on Booking.com)" />
            <input value={activity.affiliate_url} onChange={e => onChange({ affiliate_url: e.target.value })} className="input sm:col-span-2" placeholder="Affiliate link URL" />
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => onUploadImage(e.target.files?.[0])} />
            <button onClick={() => fileRef.current?.click()} className="btn btn-ghost text-sm"><Upload className="w-3 h-3" />Upload photo</button>
            <input value={activity.image_url} onChange={e => onChange({ image_url: e.target.value })} className="input flex-1" placeholder="or image URL" />
          </div>
          {activity.image_url && <img src={activity.image_url} className="max-h-40 rounded-lg" alt="" />}
        </div>
      )}
    </div>
  );
}
