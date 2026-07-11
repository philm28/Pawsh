import { useEffect, useState } from 'react';
import { PawPrint, Search, X, ShieldOff, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../lib/types';
import StarRating from '../../components/ui/StarRating';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';

interface WalkerWithStats extends Profile {
  walk_count: number;
  completed_count: number;
  avg_rating: number | null;
  rating_count: number;
}

export default function AdminWalkers() {
  const { toast } = useToast();
  const [walkers, setWalkers] = useState<WalkerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [walkersRes, walksRes, ratingsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'walker').order('full_name'),
        supabase.from('walks').select('walker_id, status').not('walker_id', 'is', null),
        supabase.from('walk_ratings').select('walker_id, rating'),
      ]);

      if (!walkersRes.data) { setLoading(false); return; }

      const walkCounts = new Map<string, number>();
      const completedCounts = new Map<string, number>();
      for (const w of (walksRes.data ?? [])) {
        walkCounts.set(w.walker_id, (walkCounts.get(w.walker_id) ?? 0) + 1);
        if (w.status === 'completed') {
          completedCounts.set(w.walker_id, (completedCounts.get(w.walker_id) ?? 0) + 1);
        }
      }

      const ratingTotals = new Map<string, { sum: number; count: number }>();
      for (const r of (ratingsRes.data ?? [])) {
        const existing = ratingTotals.get(r.walker_id) ?? { sum: 0, count: 0 };
        ratingTotals.set(r.walker_id, { sum: existing.sum + r.rating, count: existing.count + 1 });
      }

      setWalkers(walkersRes.data.map(w => {
        const rt = ratingTotals.get(w.id);
        return {
          ...w,
          walk_count: walkCounts.get(w.id) ?? 0,
          completed_count: completedCounts.get(w.id) ?? 0,
          avg_rating: rt ? rt.sum / rt.count : null,
          rating_count: rt?.count ?? 0,
        } as WalkerWithStats;
      }));
      setLoading(false);
    }
    load();
  }, []);

  async function toggleActive(walker: WalkerWithStats) {
    setUpdating(walker.id);
    const { error } = await supabase
      .from('profiles')
      .update({ active: !walker.active })
      .eq('id', walker.id);
    setUpdating(null);
    if (error) {
      toast('Failed to update walker status.', 'error');
      return;
    }
    setWalkers(prev => prev.map(w => (w.id === walker.id ? { ...w, active: !w.active } : w)));
    toast(walker.active ? `${walker.full_name ?? 'Walker'} suspended.` : `${walker.full_name ?? 'Walker'} reactivated.`, 'success');
  }

  const filtered = search.trim()
    ? walkers.filter(w => {
        const q = search.toLowerCase();
        return (
          (w.full_name ?? '').toLowerCase().includes(q) ||
          w.email.toLowerCase().includes(q) ||
          (w.phone ?? '').includes(q)
        );
      })
    : walkers;

  if (loading) return <LoadingSpinner className="min-h-screen" />;

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Walkers</h1>
        <div className="text-sm text-gray-500">{walkers.length} total</div>
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name, email, or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:border-forest-500 shadow-sm"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <PawPrint size={48} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium">{search ? 'No walkers match your search.' : 'No walkers yet.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {filtered.map((walker, i) => (
            <div
              key={walker.id}
              className={`flex items-center gap-4 px-4 py-4 ${i < filtered.length - 1 ? 'border-b border-gray-50' : ''} ${!walker.active ? 'opacity-60' : ''}`}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-semibold text-sm" style={{ backgroundColor: '#f0f4e8', color: '#2D5016' }}>
                {(walker.full_name ?? walker.email).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-sm text-[#1A1A1A] truncate">{walker.full_name ?? '—'}</div>
                  {!walker.active && (
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 shrink-0">Suspended</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 truncate">{walker.email}</div>
                {walker.phone && <div className="text-xs text-gray-400">{walker.phone}</div>}
                {walker.avg_rating !== null && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <StarRating value={Math.round(walker.avg_rating)} readonly size={12} />
                    <span className="text-xs text-gray-400">
                      {walker.avg_rating.toFixed(1)} ({walker.rating_count} review{walker.rating_count !== 1 ? 's' : ''})
                    </span>
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-semibold text-[#1A1A1A]">{walker.completed_count}</div>
                <div className="text-xs text-gray-400">completed</div>
              </div>
              <button
                onClick={() => toggleActive(walker)}
                disabled={updating === walker.id}
                title={walker.active ? 'Suspend this walker' : 'Reactivate this walker'}
                className={`shrink-0 p-2 rounded-lg transition-colors disabled:opacity-50 ${
                  walker.active ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                {walker.active ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
              </button>
            </div>
          ))}
        </div>
      )}
      {search && filtered.length > 0 && (
        <p className="text-xs text-gray-400 mt-2">{filtered.length} of {walkers.length} walkers</p>
      )}
    </div>
  );
}
