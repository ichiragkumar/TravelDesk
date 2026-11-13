import supabase from './db-client.js';
import { getUser, cors } from './_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.method === 'POST') {
      const { group_id, body } = req.body || {};
      const { data: group } = await supabase.from('travel_groups').select('host_id').eq('id', group_id).maybeSingle();
      if (!group) return res.status(404).json({ error: 'Group not found' });
      if (group.host_id !== user.id) return res.status(403).json({ error: 'Only the host can post announcements' });
      const { data, error } = await supabase.from('announcements').insert({ group_id, user_id: user.id, body }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
}
