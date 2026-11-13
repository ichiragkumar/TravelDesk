import supabase from './db-client.js';
import { getUser, cors } from './_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { username, user_id, me } = req.query;
      let q = supabase.from('profiles').select('*');
      let viewerForAutoCreate = null;
      if (me === '1') {
        const user = await getUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        viewerForAutoCreate = user;
        q = q.eq('id', user.id);
      } else if (username) q = q.eq('username', username);
      else if (user_id) q = q.eq('id', user_id);
      else return res.status(400).json({ error: 'Missing selector' });
      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      if (!data) {
        if (viewerForAutoCreate) {
          const emailSlug = (viewerForAutoCreate.email || 'traveler').split('@')[0].replace(/[^a-z0-9_]/gi, '').slice(0, 20);
          const fullName = viewerForAutoCreate.user_metadata?.full_name || viewerForAutoCreate.user_metadata?.name || null;
          const avatar = viewerForAutoCreate.user_metadata?.avatar_url || viewerForAutoCreate.user_metadata?.picture || null;
          const username = `${emailSlug || 'traveler'}_${viewerForAutoCreate.id.slice(0, 4)}`;
          const { data: created, error: ce } = await supabase.from('profiles').insert({ id: viewerForAutoCreate.id, username, full_name: fullName, avatar_url: avatar }).select().single();
          if (ce) throw ce;
          return res.status(200).json(created);
        }
        return res.status(404).json({ error: 'Not found' });
      }
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const { username, full_name, avatar_url } = req.body || {};
      const { data, error } = await supabase.from('profiles').upsert({
        id: user.id,
        username: username || `traveler_${user.id.slice(0, 6)}`,
        full_name: full_name || null,
        avatar_url: avatar_url || null,
      }, { onConflict: 'id' }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const allowed = ['username', 'full_name', 'bio', 'avatar_url', 'instagram', 'youtube', 'x_handle', 'tiktok', 'website', 'home_base'];
      const patch = {};
      for (const k of allowed) if (k in (req.body || {})) patch[k] = req.body[k];
      const { data, error } = await supabase.from('profiles').upsert({ id: user.id, ...patch }, { onConflict: 'id' }).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
