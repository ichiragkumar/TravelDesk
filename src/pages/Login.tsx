import { FormEvent, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import supabase from '../lib/supabase';
import { signInWithGoogle } from '../lib/googleAuth';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

export default function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  const { user } = useAuth();
  const from = (loc.state as any)?.from || '/';

  useEffect(() => { if (user) nav(from, { replace: true }); }, [user, nav, from]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token}` },
            body: JSON.stringify({ username: username || email.split('@')[0] }),
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      setErr(e.message || 'Something went wrong');
    } finally { setBusy(false); }
  };

  const useDemo = async () => {
    setBusy(true); setErr(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: 'demo@wayfare.travel', password: 'wayfare123' });
      if (error) throw error;
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="card p-8">
        <div className="serif-display text-4xl text-[var(--color-forest)] mb-1">
          {mode === 'signin' ? 'Welcome back.' : 'Start your journey.'}
        </div>
        <p className="text-[var(--color-muted)] mb-6">
          {mode === 'signin' ? 'Pick up where you left the map.' : 'Share your routes. Join open trips. Find your people.'}
        </p>

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="label-k">Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} className="input mt-1" placeholder="wanderlust_mae" />
            </div>
          )}
          <div>
            <label className="label-k">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input mt-1" placeholder="you@example.com" />
          </div>
          <div>
            <label className="label-k">Password</label>
            <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="input mt-1" placeholder="at least 6 characters" />
          </div>
          {err && <div className="text-sm text-[var(--color-terracotta-dark)] bg-[var(--color-terracotta)]/10 border border-[var(--color-terracotta)]/30 rounded-xl p-3">{err}</div>}
          <button type="submit" disabled={busy} className="btn btn-primary w-full">
            {busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-[var(--color-muted)]">
          <div className="flex-1 h-px bg-[var(--color-line)]" /> or <div className="flex-1 h-px bg-[var(--color-line)]" />
        </div>

        <button onClick={() => signInWithGoogle('Wayfare')} className="btn btn-ghost w-full">
          <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
          Continue with Google
        </button>

        <button onClick={useDemo} disabled={busy} className="btn btn-ghost w-full mt-2 text-[var(--color-terracotta-dark)]">
          Try the demo account
        </button>

        <div className="text-center mt-6 text-sm text-[var(--color-muted)]">
          {mode === 'signin' ? (
            <>New here? <button onClick={() => setMode('signup')} className="underline text-[var(--color-forest)]">Create an account</button></>
          ) : (
            <>Already have one? <button onClick={() => setMode('signin')} className="underline text-[var(--color-forest)]">Sign in</button></>
          )}
        </div>
        <div className="text-center mt-2 text-xs">
          <Link to="/" className="text-[var(--color-muted)] hover:text-[var(--color-forest)]">← Back to Explore</Link>
        </div>
      </div>
    </div>
  );
}
