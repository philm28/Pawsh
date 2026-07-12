import { useEffect, useState } from 'react';
import { Award, CheckCircle, DollarSign, LogOut, PawPrint, Save, Star, User, HelpCircle, FileText, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useNav } from '../../contexts/NavContext';
import { supabase } from '../../lib/supabase';

interface WalkerStats {
  completedWalks: number;
  avgRating: number | null;
  ratingCount: number;
  totalEarnings: number;
}

export default function WalkerProfile() {
  const { profile, refreshProfile, signOut } = useAuth();
  const { navigate } = useNav();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<WalkerStats | null>(null);

  useEffect(() => {
    async function loadStats() {
      const [walksRes, ratingsRes] = await Promise.all([
        supabase
          .from('walks')
          .select('status, price, payment_status')
          .eq('walker_id', profile!.id),
        supabase
          .from('walk_ratings')
          .select('rating')
          .eq('walker_id', profile!.id),
      ]);

      const walks = walksRes.data ?? [];
      const ratings = ratingsRes.data ?? [];

      const completedWalks = walks.filter(w => w.status === 'completed').length;
      const totalEarnings = walks
        .filter(w => w.status === 'completed' && w.payment_status === 'paid')
        .reduce((sum, w) => sum + (w.price ?? 0), 0);
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : null;

      setStats({ completedWalks, avgRating, ratingCount: ratings.length, totalEarnings });
    }
    loadStats();
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone })
      .eq('id', profile!.id);
    setSaving(false);
    if (error) toast('Failed to save changes.', 'error');
    else {
      toast('Profile updated!', 'success');
      await refreshProfile();
    }
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 md:pb-8">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">My Profile</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Walks Done', value: stats.completedWalks, icon: CheckCircle },
            {
              label: 'Avg Rating',
              value: stats.avgRating != null ? stats.avgRating.toFixed(1) : '—',
              icon: Star,
              sub: stats.ratingCount > 0 ? `${stats.ratingCount} review${stats.ratingCount !== 1 ? 's' : ''}` : 'No ratings yet',
            },
            { label: 'Earnings', value: `$${stats.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: DollarSign },
          ].map(({ label, value, icon: Icon, sub }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5">
              <Icon size={15} className="text-gray-400 mb-2" />
              <div className="text-lg font-bold text-[#1A1A1A] leading-none mb-0.5">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
              {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Profile form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-4">
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-50">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFF5B8' }}>
            <User size={24} style={{ color: '#B8860B' }} />
          </div>
          <div>
            <div className="font-semibold text-[#1A1A1A]">{profile?.full_name || 'No name set'}</div>
            <div className="text-sm text-gray-500">{profile?.email}</div>
            <div className="text-xs mt-0.5 capitalize px-2 py-0.5 rounded-full inline-flex items-center gap-1" style={{ backgroundColor: '#FFF5B8', color: '#B8860B' }}>
              <PawPrint size={10} />
              Dog Walker
            </div>
          </div>
        </div>

        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              value={profile?.email ?? ''}
              disabled
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-400 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(555) 000-0000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[#1A1A1A] font-semibold disabled:opacity-60"
            style={{ backgroundColor: '#F2C94C' }}
          >
            <Save size={16} />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Achievements */}
      {stats && stats.completedWalks >= 10 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFF9E0' }}>
            <Award size={18} style={{ color: '#C9A84C' }} />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#1A1A1A]">
              {stats.completedWalks >= 100 ? 'Century Walker' : stats.completedWalks >= 50 ? 'Elite Walker' : 'Experienced Walker'}
            </div>
            <div className="text-xs text-gray-500">{stats.completedWalks} completed walks</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-3">
        <button
          onClick={() => navigate('contact')}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors border-b border-gray-50"
        >
          <HelpCircle size={16} className="text-gray-400" />
          <span className="flex-1 text-left text-sm font-medium text-gray-700">Help & Contact</span>
          <ChevronRight size={16} className="text-gray-300" />
        </button>
        <button
          onClick={() => navigate('terms')}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <FileText size={16} className="text-gray-400" />
          <span className="flex-1 text-left text-sm font-medium text-gray-700">Terms & Policies</span>
          <ChevronRight size={16} className="text-gray-300" />
        </button>
      </div>

      <button
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
      >
        <LogOut size={16} />
        Sign Out
      </button>
    </div>
  );
}
