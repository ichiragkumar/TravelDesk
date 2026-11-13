import { createClient } from '@supabase/supabase-js';

const anon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function getUser(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
  if (!token) return null;
  const { data, error } = await anon.auth.getUser(token);
  if (error) return null;
  return data.user;
}

export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
