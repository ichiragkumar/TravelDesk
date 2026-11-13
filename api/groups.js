import supabase from './db-client.js';
import { getUser, cors } from './_auth.js';

async function withApprovedCount(groups) {
  if (!groups.length) return groups;
  const ids = groups.map(g => g.id);
  const { data: approved } = await supabase.from('group_members').select('group_id').eq('status', 'APPROVED').in('group_id', ids);
  const counts = {};
  for (const m of (approved || [])) counts[m.group_id] = (counts[m.group_id] || 0) + 1;
  return groups.map(g => ({ ...g, approved_count: counts[g.id] || 0 }));
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const user = await getUser(req);

    if (req.method === 'GET') {
      const { status, user_id, itinerary_id } = req.query;
      let q = supabase.from('travel_groups').select('*').order('created_at', { ascending: false });
      if (status) q = q.eq('status', status);
      if (itinerary_id) q = q.eq('itinerary_id', itinerary_id);
      let groups = (await q).data || [];
      if (user_id) {
        // Groups hosted OR approved-member-of
        const { data: hosted } = await supabase.from('travel_groups').select('*').eq('host_id', user_id);
        const { data: memberships } = await supabase.from('group_members').select('group_id').eq('user_id', user_id).eq('status', 'APPROVED');
        const gids = [...new Set([...(memberships || []).map(m => m.group_id)])];
        let joinedGroups = [];
        if (gids.length) joinedGroups = (await supabase.from('travel_groups').select('*').in('id', gids)).data || [];
        const map = new Map();
        for (const g of [...(hosted || []), ...joinedGroups]) map.set(g.id, g);
        groups = [...map.values()].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
      const withCounts = await withApprovedCount(groups);
      return res.status(200).json(withCounts);
    }

    if (req.method === 'POST') {
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const b = req.body || {};
      if (!b.title || !b.destination) return res.status(400).json({ error: 'Title and destination required' });
      const { data, error } = await supabase.from('travel_groups').insert({
        host_id: user.id,
        itinerary_id: b.itinerary_id || null,
        title: b.title,
        description: b.description || null,
        destination: b.destination,
        start_date: b.start_date || null,
        end_date: b.end_date || null,
        capacity: Number(b.capacity) || 6,
        join_policy: b.join_policy === 'auto' ? 'auto' : 'approval',
        waitlist_enabled: !!b.waitlist_enabled,
        status: 'open',
      }).select().single();
      if (error) throw error;
      // Auto-approve host as member
      await supabase.from('group_members').insert({ group_id: data.id, user_id: user.id, status: 'APPROVED', intro_message: null });
      return res.status(201).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
}
