import supabase from './db-client.js';
import { getUser, cors } from './_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'POST') {
      const { group_id, intro_message } = req.body || {};
      const gid = Number(group_id);
      if (!gid) return res.status(400).json({ error: 'Missing group_id' });
      const { data: group } = await supabase.from('travel_groups').select('*').eq('id', gid).maybeSingle();
      if (!group) return res.status(404).json({ error: 'Group not found' });
      if (group.status === 'closed') return res.status(400).json({ error: 'Group is closed' });
      const { data: existing } = await supabase.from('group_members').select('*').eq('group_id', gid).eq('user_id', user.id).maybeSingle();
      if (existing) return res.status(400).json({ error: 'You already have a request for this group' });
      const { data: approved } = await supabase.from('group_members').select('id').eq('group_id', gid).eq('status', 'APPROVED');
      const approvedCount = (approved || []).length;
      const isFull = approvedCount >= group.capacity;
      let status;
      if (isFull) {
        if (!group.waitlist_enabled) return res.status(400).json({ error: 'Group is full' });
        status = 'WAITLIST';
      } else {
        status = group.join_policy === 'auto' ? 'APPROVED' : 'PENDING';
      }
      const { data, error } = await supabase.from('group_members').insert({
        group_id: gid, user_id: user.id, status, intro_message: intro_message || null,
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, status } = req.body || {};
      if (!id || !status) return res.status(400).json({ error: 'Missing fields' });
      const { data: member } = await supabase.from('group_members').select('*').eq('id', id).maybeSingle();
      if (!member) return res.status(404).json({ error: 'Not found' });
      const { data: group } = await supabase.from('travel_groups').select('*').eq('id', member.group_id).maybeSingle();
      if (!group) return res.status(404).json({ error: 'Group not found' });
      if (group.host_id !== user.id) return res.status(403).json({ error: 'Only the host can change member status' });
      // If approving, enforce capacity
      if (status === 'APPROVED') {
        const { data: approved } = await supabase.from('group_members').select('id').eq('group_id', group.id).eq('status', 'APPROVED');
        if ((approved || []).length >= group.capacity) return res.status(400).json({ error: 'Group is full' });
      }
      const { data, error } = await supabase.from('group_members').update({ status }).eq('id', id).select().single();
      if (error) throw error;
      // Auto-close when full
      const { data: approved } = await supabase.from('group_members').select('id').eq('group_id', group.id).eq('status', 'APPROVED');
      if ((approved || []).length >= group.capacity && !group.waitlist_enabled) {
        await supabase.from('travel_groups').update({ status: 'closed' }).eq('id', group.id);
      }
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const id = Number(req.query.id);
      const { data: member } = await supabase.from('group_members').select('*').eq('id', id).maybeSingle();
      if (!member) return res.status(404).json({ error: 'Not found' });
      const { data: group } = await supabase.from('travel_groups').select('host_id').eq('id', member.group_id).maybeSingle();
      if (member.user_id !== user.id && group?.host_id !== user.id) return res.status(403).json({ error: 'Forbidden' });
      await supabase.from('group_members').delete().eq('id', id);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
}
