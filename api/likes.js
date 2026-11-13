import supabase from './db-client.js';
import { getUser, cors } from './_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.method === 'POST') {
      const { itinerary_id } = req.body || {};
      const { data: existing } = await supabase.from('likes').select('id').eq('user_id', user.id).eq('itinerary_id', itinerary_id).maybeSingle();
      let liked;
      if (existing) { await supabase.from('likes').delete().eq('id', existing.id); liked = false; }
      else { await supabase.from('likes').insert({ user_id: user.id, itinerary_id }); liked = true; }
      // Recompute count
      const { count } = await supabase.from('likes').select('id', { count: 'exact', head: true }).eq('itinerary_id', itinerary_id);
      await supabase.from('itineraries').update({ likes_count: count || 0 }).eq('id', itinerary_id);
      return res.status(200).json({ liked, likes_count: count || 0 });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
}
