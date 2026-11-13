import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabase';
import { Compass, Users, Bookmark, Plus, LogOut, UserRound, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 text-[0.95rem] px-2 py-1 rounded-md ${
      isActive ? 'text-[var(--color-forest)] font-medium' : 'text-[var(--color-muted)] hover:text-[var(--color-forest)]'
    }`;

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[var(--color-cream)]/85 border-b border-[var(--color-line)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-block w-8 h-8 rounded-lg" style={{ background: 'linear-gradient(135deg,#D96F4A,#1F3B2D)' }} />
          <span className="serif-display text-2xl">Wayfare</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" className={linkCls}><Compass className="w-4 h-4" />Explore</NavLink>
          <NavLink to="/groups" className={linkCls}><Users className="w-4 h-4" />Open trips</NavLink>
          {user && <NavLink to="/saved" className={linkCls}><Bookmark className="w-4 h-4" />Saved</NavLink>}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Link to="/create" className="btn btn-accent text-sm"><Plus className="w-4 h-4" />New itinerary</Link>
              <Link to="/me" className="btn btn-ghost text-sm"><UserRound className="w-4 h-4" />Profile</Link>
              <button onClick={signOut} className="p-2 text-[var(--color-muted)] hover:text-[var(--color-forest)]" aria-label="Sign out"><LogOut className="w-4 h-4" /></button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost text-sm">Sign in</Link>
              <Link to="/login" className="btn btn-primary text-sm">Join Wayfare</Link>
            </>
          )}
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(v => !v)} aria-label="Menu">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-[var(--color-line)] px-4 py-3 space-y-2 bg-[var(--color-cream)]">
          <NavLink to="/" className={linkCls} onClick={() => setOpen(false)}><Compass className="w-4 h-4" />Explore</NavLink>
          <NavLink to="/groups" className={linkCls} onClick={() => setOpen(false)}><Users className="w-4 h-4" />Open trips</NavLink>
          {user && <NavLink to="/saved" className={linkCls} onClick={() => setOpen(false)}><Bookmark className="w-4 h-4" />Saved</NavLink>}
          <div className="flex gap-2 pt-2">
            {user ? (
              <>
                <Link to="/create" className="btn btn-accent text-sm flex-1" onClick={() => setOpen(false)}><Plus className="w-4 h-4" />New</Link>
                <Link to="/me" className="btn btn-ghost text-sm flex-1" onClick={() => setOpen(false)}>Profile</Link>
                <button onClick={() => { setOpen(false); signOut(); }} className="btn btn-ghost text-sm"><LogOut className="w-4 h-4" /></button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost text-sm flex-1" onClick={() => setOpen(false)}>Sign in</Link>
                <Link to="/login" className="btn btn-primary text-sm flex-1" onClick={() => setOpen(false)}>Join</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
