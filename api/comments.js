import supabase from './db-client.js';
import { getUser, cors } from './_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const id = Number(req.query.itinerary_id);
      if (!id) return res.status(400).json({ error: 'Missing itinerary_id' });
      const { data: comments } = await supabase.from('comments').select('*').eq('itinerary_id', id).order('created_at', { ascending: true });
      const uids = [...new Set((comments || []).map(c => c.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', uids);
      const pMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
      return res.status(200).json((comments || []).map(c => ({ ...c, author: pMap[c.user_id] || null })));
    }
    if (req.method === 'POST') {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const { itinerary_id, body } = req.body || {};
      if (!itinerary_id || !body) return res.status(400).json({ error: 'Missing fields' });
      const { data, error } = await supabase.from('comments').insert({ itinerary_id, user_id: user.id, body }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
}
