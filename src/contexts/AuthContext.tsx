import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import supabase from '../lib/supabase';

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthCtx>({ user: null, session: null, loading: true, token: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ensureProfile = async (session: Session | null) => {
      if (!session?.access_token) return;
      try {
        await fetch('/api/profile?me=1', { headers: { Authorization: `Bearer ${session.access_token}` } });
      } catch { /* non-fatal */ }
    };
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      ensureProfile(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      ensureProfile(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, token: session?.access_token ?? null }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
