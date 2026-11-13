import supabase from './db-client.js';
import { getUser, cors } from './_auth.js';

async function enrichList(list, viewer) {
  if (!list || list.length === 0) return [];
  const authorIds = [...new Set(list.map(i => i.user_id))];
  const ids = list.map(i => i.id);
  const { data: authors } = await supabase.from('profiles').select('*').in('id', authorIds);
  const aMap = Object.fromEntries((authors || []).map(a => [a.id, a]));

  const { data: groups } = await supabase.from('travel_groups').select('*').in('itinerary_id', ids);
  const gMap = Object.fromEntries((groups || []).map(g => [g.itinerary_id, g]));
  const groupIds = (groups || []).map(g => g.id);
  let approvedCounts = {};
  if (groupIds.length) {
    const { data: approved } = await supabase.from('group_members').select('group_id').eq('status', 'APPROVED').in('group_id', groupIds);
    for (const m of (approved || [])) approvedCounts[m.group_id] = (approvedCounts[m.group_id] || 0) + 1;
  }

  let likedSet = new Set(), bookmarkedSet = new Set();
  if (viewer) {
    const { data: likes } = await supabase.from('likes').select('itinerary_id').eq('user_id', viewer.id).in('itinerary_id', ids);
    const { data: bms } = await supabase.from('bookmarks').select('itinerary_id').eq('user_id', viewer.id).in('itinerary_id', ids);
    likedSet = new Set((likes || []).map(l => l.itinerary_id));
    bookmarkedSet = new Set((bms || []).map(b => b.itinerary_id));
  }

  return list.map(it => ({
    ...it,
    author: aMap[it.user_id] || null,
    group: gMap[it.id] ? { ...gMap[it.id], approved_count: approvedCounts[gMap[it.id].id] || 0 } : null,
    liked: likedSet.has(it.id),
    bookmarked: bookmarkedSet.has(it.id),
  }));
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const viewer = await getUser(req);

    if (req.method === 'GET') {
      const { visibility, user_id, limit } = req.query;
      let q = supabase.from('itineraries').select('*').order('created_at', { ascending: false }).limit(Math.min(Number(limit) || 100, 200));
      if (visibility) q = q.eq('visibility', visibility);
      if (user_id) {
        q = q.eq('user_id', user_id);
        if (!viewer || viewer.id !== user_id) q = q.eq('visibility', 'public');
      }
      const { data, error } = await q;
      if (error) throw error;
      const enriched = await enrichList(data || [], viewer);
      return res.status(200).json(enriched);
    }

    if (req.method === 'POST') {
      if (!viewer) return res.status(401).json({ error: 'Unauthorized' });
      const b = req.body || {};
      const insertRow = {
        user_id: viewer.id,
        title: b.title,
        destination: b.destination,
        country: b.country || null,
        duration_days: Number(b.duration_days) || 1,
        budget: b.budget != null ? Number(b.budget) : null,
        travel_style: b.travel_style || null,
        cover_url: b.cover_url || null,
        description: b.description || null,
        visibility: b.visibility || 'draft',
      };
      const { data: it, error } = await supabase.from('itineraries').insert(insertRow).select().single();
      if (error) throw error;

      await writeDaysAndLinks(it.id, b);
      return res.status(201).json(it);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}

export async function writeDaysAndLinks(itineraryId, body) {
  // Replace days + activities + affiliate_links.
  await supabase.from('activities').delete().in('day_id',
    ((await supabase.from('itinerary_days').select('id').eq('itinerary_id', itineraryId)).data || []).map(d => d.id)
  );
  await supabase.from('itinerary_days').delete().eq('itinerary_id', itineraryId);
  await supabase.from('affiliate_links').delete().eq('itinerary_id', itineraryId);

  for (const d of (body.days || [])) {
    const { data: day, error } = await supabase.from('itinerary_days').insert({
      itinerary_id: itineraryId,
      day_number: d.day_number,
      title: d.title || null,
      summary: d.summary || null,
    }).select().single();
    if (error) throw error;
    const acts = (d.activities || []).map((a, i) => ({
      day_id: day.id,
      position: a.position != null ? a.position : i,
      time_slot: a.time_slot || null,
      title: a.title || 'Untitled',
      location: a.location || null,
      description: a.description || null,
      notes: a.notes || null,
      estimated_cost: a.estimated_cost != null && a.estimated_cost !== '' ? Number(a.estimated_cost) : null,
      image_url: a.image_url || null,
      external_link: a.external_link || null,
      affiliate_url: a.affiliate_url || null,
      affiliate_label: a.affiliate_label || null,
    }));
    if (acts.length) {
      const { error: ae } = await supabase.from('activities').insert(acts);
      if (ae) throw ae;
    }
  }

  const links = (body.affiliate_links || []).filter(l => l.url && l.label).map(l => ({
    itinerary_id: itineraryId,
    label: l.label,
    url: l.url,
    category: l.category || null,
    note: l.note || null,
  }));
  if (links.length) await supabase.from('affiliate_links').insert(links);
}
