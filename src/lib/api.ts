import supabase from './supabase';

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) h.Authorization = `Bearer ${session.access_token}`;
  return h;
}

export async function apiGet<T = any>(path: string): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(path, { headers });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}

export async function apiPost<T = any>(path: string, body: any): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}

export async function apiPut<T = any>(path: string, body: any): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(path, { method: 'PUT', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}

export async function apiDelete<T = any>(path: string, body?: any): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(path, { method: 'DELETE', headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}

export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  instagram: string | null;
  youtube: string | null;
  x_handle: string | null;
  tiktok: string | null;
  website: string | null;
  home_base: string | null;
  created_at?: string;
};

export type Activity = {
  id: number;
  day_id: number;
  position: number;
  time_slot: string | null;
  title: string;
  location: string | null;
  description: string | null;
  notes: string | null;
  estimated_cost: number | null;
  image_url: string | null;
  external_link: string | null;
  affiliate_url: string | null;
  affiliate_label: string | null;
};

export type Day = {
  id: number;
  itinerary_id: number;
  day_number: number;
  title: string | null;
  summary: string | null;
  activities?: Activity[];
};

export type Itinerary = {
  id: number;
  user_id: string;
  title: string;
  destination: string;
  country: string | null;
  duration_days: number;
  budget: number | null;
  budget_tier: string | null;
  travel_style: string | null;
  cover_url: string | null;
  description: string | null;
  visibility: 'draft' | 'private' | 'public';
  likes_count: number;
  bookmarks_count: number;
  views_count: number;
  created_at: string;
  author?: Profile;
  days?: Day[];
  affiliate_links?: AffiliateLink[];
  liked?: boolean;
  bookmarked?: boolean;
  group?: TravelGroup | null;
};

export type AffiliateLink = {
  id: number;
  itinerary_id: number;
  label: string;
  url: string;
  category: string | null;
  note: string | null;
};

export type TravelGroup = {
  id: number;
  itinerary_id: number | null;
  host_id: string;
  title: string;
  description: string | null;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  capacity: number;
  join_policy: 'auto' | 'approval';
  waitlist_enabled: boolean;
  status: 'open' | 'closed';
  created_at: string;
  host?: Profile;
  members?: GroupMember[];
  announcements?: Announcement[];
  itinerary?: Itinerary | null;
  approved_count?: number;
  my_membership?: GroupMember | null;
};

export type GroupMember = {
  id: number;
  group_id: number;
  user_id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WAITLIST';
  intro_message: string | null;
  joined_at: string;
  profile?: Profile;
};

export type Announcement = {
  id: number;
  group_id: number;
  user_id: string;
  body: string;
  created_at: string;
  author?: Profile;
};

export type Comment = {
  id: number;
  itinerary_id: number;
  user_id: string;
  body: string;
  created_at: string;
  author?: Profile;
};
