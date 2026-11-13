import supabase from './db-client.js';
import { getUser, cors } from './_auth.js';
import { writeDaysAndLinks } from './itineraries.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const viewer = await getUser(req);

    if (req.method === 'GET') {
      const { data: it, error } = await supabase.from('itineraries').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!it) return res.status(404).json({ error: 'Not found' });
      if (it.visibility !== 'public' && (!viewer || viewer.id !== it.user_id)) return res.status(403).json({ error: 'Forbidden' });

      // Increment views (best-effort, non-blocking).
      if (viewer?.id !== it.user_id) {
        supabase.from('itineraries').update({ views_count: (it.views_count || 0) + 1 }).eq('id', id).then(() => {});
      }

      const [{ data: days }, { data: links }, { data: author }, { data: group }] = await Promise.all([
        supabase.from('itinerary_days').select('*').eq('itinerary_id', id).order('day_number'),
        supabase.from('affiliate_links').select('*').eq('itinerary_id', id),
        supabase.from('profiles').select('*').eq('id', it.user_id).maybeSingle(),
        supabase.from('travel_groups').select('*').eq('itinerary_id', id).maybeSingle(),
      ]);
      const dayIds = (days || []).map(d => d.id);
      let activities = [];
      if (dayIds.length) {
        const { data: acts } = await supabase.from('activities').select('*').in('day_id', dayIds).order('position');
        activities = acts || [];
      }
      const daysWithActs = (days || []).map(d => ({ ...d, activities: activities.filter(a => a.day_id === d.id) }));

      let groupOut = null;
      if (group) {
        const { data: approved } = await supabase.from('group_members').select('id').eq('group_id', group.id).eq('status', 'APPROVED');
        groupOut = { ...group, approved_count: (approved || []).length };
      }

      let liked = false, bookmarked = false;
      if (viewer) {
        const { data: likeRow } = await supabase.from('likes').select('id').eq('user_id', viewer.id).eq('itinerary_id', id).maybeSingle();
        const { data: bmRow } = await supabase.from('bookmarks').select('id').eq('user_id', viewer.id).eq('itinerary_id', id).maybeSingle();
        liked = !!likeRow; bookmarked = !!bmRow;
      }

      return res.status(200).json({ ...it, days: daysWithActs, affiliate_links: links || [], author, group: groupOut, liked, bookmarked });
    }

    if (req.method === 'PUT') {
      if (!viewer) return res.status(401).json({ error: 'Unauthorized' });
      const { data: existing } = await supabase.from('itineraries').select('user_id').eq('id', id).maybeSingle();
      if (!existing || existing.user_id !== viewer.id) return res.status(403).json({ error: 'Forbidden' });
      const b = req.body || {};
      const patch = {
        title: b.title, destination: b.destination, country: b.country || null,
        duration_days: Number(b.duration_days) || 1,
        budget: b.budget != null ? Number(b.budget) : null,
        travel_style: b.travel_style || null,
        cover_url: b.cover_url || null,
        description: b.description || null,
        visibility: b.visibility || 'draft',
      };
      const { data: it, error } = await supabase.from('itineraries').update(patch).eq('id', id).select().single();
      if (error) throw error;
      await writeDaysAndLinks(id, b);
      return res.status(200).json(it);
    }

    if (req.method === 'DELETE') {
      if (!viewer) return res.status(401).json({ error: 'Unauthorized' });
      const { data: existing } = await supabase.from('itineraries').select('user_id').eq('id', id).maybeSingle();
      if (!existing || existing.user_id !== viewer.id) return res.status(403).json({ error: 'Forbidden' });
      await supabase.from('itineraries').delete().eq('id', id);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
