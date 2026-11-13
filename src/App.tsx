import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import ItineraryDetail from './pages/ItineraryDetail';
import Create from './pages/Create';
import Profile from './pages/Profile';
import Groups from './pages/Groups';
import GroupHub from './pages/GroupHub';
import Saved from './pages/Saved';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/itinerary/:id" element={<ItineraryDetail />} />
          <Route path="/create" element={<ProtectedRoute><Create /></ProtectedRoute>} />
          <Route path="/edit/:id" element={<ProtectedRoute><Create /></ProtectedRoute>} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/me" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/group/:id" element={<GroupHub />} />
          <Route path="/saved" element={<ProtectedRoute><Saved /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="border-t border-[var(--color-line)] mt-16 py-10 text-center text-sm text-[var(--color-muted)] bg-[var(--color-sand-soft)]/40">
        <div className="serif-display text-3xl text-[var(--color-forest)] mb-1">Wayfare</div>
        <div>Hand-crafted itineraries, from the road.</div>
      </footer>
    </div>
  );
}
