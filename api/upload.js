import supabase from './db-client.js';
import { getUser, cors } from './_auth.js';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { fileName, fileBase64, contentType } = req.body || {};
    if (!fileName || !fileBase64) return res.status(400).json({ error: 'Missing file' });
    const buffer = Buffer.from(fileBase64, 'base64');
    const safePath = `${user.id}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await supabase.storage.from('wayfare').upload(safePath, buffer, { contentType: contentType || 'image/jpeg', upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from('wayfare').getPublicUrl(safePath);
    return res.status(200).json({ url: data.publicUrl });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
}
