import supabase from './db-client.js';
import { getUser, cors } from './_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'GET') {
      const { data: bms } = await supabase.from('bookmarks').select('itinerary_id').eq('user_id', user.id);
      const ids = (bms || []).map(b => b.itinerary_id);
      if (!ids.length) return res.status(200).json([]);
      const { data: its } = await supabase.from('itineraries').select('*').in('id', ids);
      const authorIds = [...new Set((its || []).map(i => i.user_id))];
      const { data: authors } = await supabase.from('profiles').select('*').in('id', authorIds);
      const aMap = Object.fromEntries((authors || []).map(a => [a.id, a]));
      return res.status(200).json((its || []).map(it => ({ ...it, author: aMap[it.user_id] || null, bookmarked: true })));
    }

    if (req.method === 'POST') {
      const { itinerary_id } = req.body || {};
      const { data: existing } = await supabase.from('bookmarks').select('id').eq('user_id', user.id).eq('itinerary_id', itinerary_id).maybeSingle();
      let bookmarked;
      if (existing) { await supabase.from('bookmarks').delete().eq('id', existing.id); bookmarked = false; }
      else { await supabase.from('bookmarks').insert({ user_id: user.id, itinerary_id }); bookmarked = true; }
      const { count } = await supabase.from('bookmarks').select('id', { count: 'exact', head: true }).eq('itinerary_id', itinerary_id);
      await supabase.from('itineraries').update({ bookmarks_count: count || 0 }).eq('id', itinerary_id);
      return res.status(200).json({ bookmarked, bookmarks_count: count || 0 });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
}
