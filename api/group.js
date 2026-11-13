import supabase from './db-client.js';
import { getUser, cors } from './_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const user = await getUser(req);

    if (req.method === 'GET') {
      const { data: group, error } = await supabase.from('travel_groups').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!group) return res.status(404).json({ error: 'Not found' });
      const [{ data: host }, { data: members }, { data: announcements }, itineraryRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', group.host_id).maybeSingle(),
        supabase.from('group_members').select('*').eq('group_id', id).order('joined_at'),
        supabase.from('announcements').select('*').eq('group_id', id).order('created_at', { ascending: false }),
        group.itinerary_id ? supabase.from('itineraries').select('*').eq('id', group.itinerary_id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      const uids = [...new Set((members || []).map(m => m.user_id))];
      const { data: memberProfiles } = await supabase.from('profiles').select('*').in('id', uids);
      const pMap = Object.fromEntries((memberProfiles || []).map(p => [p.id, p]));
      const announcementUids = [...new Set((announcements || []).map(a => a.user_id))];
      const { data: annProfiles } = await supabase.from('profiles').select('*').in('id', announcementUids);
      const apMap = Object.fromEntries((annProfiles || []).map(p => [p.id, p]));
      const approved_count = (members || []).filter(m => m.status === 'APPROVED').length;
      const my_membership = user ? (members || []).find(m => m.user_id === user.id) || null : null;
      return res.status(200).json({
        ...group,
        host: host || null,
        itinerary: itineraryRes.data || null,
        members: (members || []).map(m => ({ ...m, profile: pMap[m.user_id] || null })),
        announcements: (announcements || []).map(a => ({ ...a, author: apMap[a.user_id] || null })),
        approved_count,
        my_membership,
      });
    }

    if (req.method === 'PUT') {
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const { data: existing } = await supabase.from('travel_groups').select('host_id').eq('id', id).maybeSingle();
      if (!existing || existing.host_id !== user.id) return res.status(403).json({ error: 'Forbidden' });
      const allowed = ['title', 'description', 'destination', 'start_date', 'end_date', 'capacity', 'join_policy', 'waitlist_enabled', 'status'];
      const patch = {};
      for (const k of allowed) if (k in (req.body || {})) patch[k] = req.body[k];
      const { data, error } = await supabase.from('travel_groups').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
}
