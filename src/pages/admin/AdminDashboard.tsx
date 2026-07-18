import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Bell, Calendar, ChevronDown, DollarSign, PawPrint, Search, TrendingUp, Users, X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { supabase, callEdgeFunction } from '../../lib/supabase';
import { Walk, Profile, WalkStatus, WalkerAvailability } from '../../lib/types';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

type DateFilter = 'all' | 'upcoming' | 'this-week' | 'this-month';
type StatusFilter = 'all' | WalkStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'all', label: 'All dates' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'this-week', label: 'This week' },
  { value: 'this-month', label: 'This month' },
];

export default function AdminDashboard() {
  const { toast } = useToast();
  const [walks, setWalks] = useState<Walk[]>([]);
  const [walkers, setWalkers] = useState<Profile[]>([]);
  const [availability, setAvailability] = useState<WalkerAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  async function load() {
    const [walksRes, walkersRes, availRes] = await Promise.all([
      supabase
        .from('walks')
        .select('*, dog:dogs(*), client:profiles!client_id(*), walker:profiles!walker_id(*)')
        .order('scheduled_date', { ascending: false })
        .order('scheduled_time', { ascending: false })
        .limit(200),
      supabase.from('profiles').select('*').eq('role', 'walker').order('full_name'),
      supabase.from('walker_availability').select('walker_id, day_of_week, start_time, end_time'),
    ]);
    if (walksRes.data) setWalks(walksRes.data as Walk[]);
    if (walkersRes.data) setWalkers(walkersRes.data as Profile[]);
    if (availRes.data) setAvailability(availRes.data as WalkerAvailability[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    channelRef.current = supabase
      .channel('admin-walks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'walks' }, () => { load(); })
      .subscribe();
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  async function assignWalker(walkId: string, walkerId: string) {
    const { error } = await supabase
      .from('walks')
      .update({ walker_id: walkerId || null, status: walkerId ? 'assigned' : 'scheduled' })
      .eq('id', walkId);
    if (error) { toast('Failed to assign walker.', 'error'); return; }
    toast('Walker assigned!', 'success');
    if (walkerId) {
      const walk = walks.find(w => w.id === walkId);
      const walker = walkers.find(w => w.id === walkerId);
      if (walk && walker) {
        try {
          await callEdgeFunction('notify-walker-assigned', {
            walker_email: walker.email,
            walker_name: walker.full_name,
            dog_name: walk.dog?.name,
            dog_breed: walk.dog?.breed,
            client_name: walk.client?.full_name,
            scheduled_date: walk.scheduled_date,
            scheduled_time: walk.scheduled_time,
            duration_minutes: walk.duration_minutes,
            behavioral_notes: walk.dog?.behavioral_notes,
          });
        } catch { /* email is best-effort */ }
      }
    }
  }

  async function sendReminders() {
    setSendingReminders(true);
    try {
      const res = await callEdgeFunction('send-walk-reminders', {});
      let json: { error?: string; sent?: number } | null = null;
      try { json = await res.json(); } catch { /* non-JSON */ }
      if (!res.ok || json?.error) toast(json?.error ?? 'Failed to send reminders.', 'error');
      else if (!json?.sent) toast('No walks scheduled for tomorrow.', 'info');
      else toast(`Reminders sent to ${json.sent} client${json.sent !== 1 ? 's' : ''}!`, 'success');
    } catch {
      toast('Failed to send reminders.', 'error');
    }
    setSendingReminders(false);
  }

  // Stats
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  const walksThisWeek = walks.filter(w => new Date(w.scheduled_date) >= weekStart && w.status !== 'cancelled').length;
  const walksThisMonth = walks.filter(w => new Date(w.scheduled_date) >= monthStart && w.status !== 'cancelled').length;
  const totalClients = new Set(walks.map(w => w.client_id)).size;
  const walksTomorrow = walks.filter(w => w.scheduled_date === tomorrowStr && w.status !== 'cancelled').length;

  const revenueThisWeek = walks
    .filter(w => new Date(w.scheduled_date) >= weekStart && w.payment_status === 'paid' && w.status !== 'cancelled')
    .reduce((sum, w) => sum + w.price, 0);
  const revenueThisMonth = walks
    .filter(w => new Date(w.scheduled_date) >= monthStart && w.payment_status === 'paid' && w.status !== 'cancelled')
    .reduce((sum, w) => sum + w.price, 0);

  function formatRevenue(n: number) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  // Filtered walks
  const filteredWalks = walks.filter(walk => {
    if (statusFilter !== 'all' && walk.status !== statusFilter) return false;
    if (dateFilter === 'upcoming') {
      if (walk.scheduled_date < todayStr) return false;
      if (walk.status === 'completed' || walk.status === 'cancelled') return false;
    } else if (dateFilter === 'this-week') {
      if (new Date(walk.scheduled_date + 'T12:00:00') < weekStart) return false;
    } else if (dateFilter === 'this-month') {
      if (new Date(walk.scheduled_date + 'T12:00:00') < monthStart) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        (walk.client?.full_name ?? '').toLowerCase().includes(q) ||
        (walk.dog?.name ?? '').toLowerCase().includes(q) ||
        (walk.walker?.full_name ?? '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  function getAvailableWalkerIds(scheduledDate: string): Set<string> {
    const dow = new Date(scheduledDate + 'T12:00:00').getDay();
    return new Set(availability.filter(a => a.day_of_week === dow).map(a => a.walker_id));
  }

  function renderWalkerSelect(walk: Walk) {
    const availIds = getAvailableWalkerIds(walk.scheduled_date);
    const available = walkers.filter(w => availIds.has(w.id));
    const others = walkers.filter(w => !availIds.has(w.id));
    const disabled = walk.status === 'completed' || walk.status === 'cancelled';

    return (
      <div className="relative">
        <select
          value={walk.walker_id ?? ''}
          onChange={e => assignWalker(walk.id, e.target.value)}
          disabled={disabled}
          className="appearance-none pr-7 pl-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:border-forest-500 disabled:opacity-50 disabled:cursor-not-allowed w-full"
        >
          <option value="">Unassigned</option>
          {available.length > 0 && others.length > 0 ? (
            <>
              <optgroup label="Available">
                {available.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
              </optgroup>
              <optgroup label="Others">
                {others.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
              </optgroup>
            </>
          ) : (
            walkers.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)
          )}
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    );
  }

  const hasFilters = searchQuery.trim() || statusFilter !== 'all' || dateFilter !== 'all';

  if (loading) return <LoadingSpinner className="min-h-screen" />;

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-serif text-2xl font-bold text-[#2B2620]">All Walks</h1>
        {walksTomorrow > 0 && (
          <button
            onClick={sendReminders}
            disabled={sendingReminders}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm font-medium hover:bg-amber-100 transition-colors disabled:opacity-60"
          >
            <Bell size={14} />
            {sendingReminders ? 'Sending…' : `Send Reminders (${walksTomorrow})`}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Revenue This Week', value: formatRevenue(revenueThisWeek), icon: DollarSign },
          { label: 'Revenue This Month', value: formatRevenue(revenueThisMonth), icon: TrendingUp },
          { label: 'Walks This Month', value: walksThisMonth, icon: Calendar },
          { label: 'Total Clients', value: totalClients, icon: Users },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={16} className="text-gray-400" />
              <span className="text-xs text-gray-500">{stat.label}</span>
            </div>
            <div className="font-serif text-2xl font-bold text-[#2B2620]">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search client, dog, or walker…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:border-forest-500 shadow-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            className="appearance-none pl-3 pr-7 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:border-forest-500 shadow-sm cursor-pointer"
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value as DateFilter)}
            className="appearance-none pl-3 pr-7 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:border-forest-500 shadow-sm cursor-pointer"
          >
            {DATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        {hasFilters && (
          <button
            onClick={() => { setSearchQuery(''); setStatusFilter('all'); setDateFilter('all'); }}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-500 hover:bg-gray-50 shadow-sm transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Result count */}
      {hasFilters && (
        <p className="text-xs text-gray-400 mb-3">
          {filteredWalks.length} result{filteredWalks.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Walks Table (desktop) */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date / Time</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dog</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Walker</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredWalks.map(walk => (
              <tr key={walk.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">
                    {new Date(walk.scheduled_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(`2000-01-01T${walk.scheduled_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    {' · '}{walk.duration_minutes}m
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700">{walk.client?.full_name ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="text-gray-700">{walk.dog?.name}</div>
                  <div className="text-xs text-gray-400">{walk.dog?.breed}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={walk.status} />
                    {walk.payment_status === 'pending' && (
                      <span title="Payment pending" className="text-amber-500">
                        <AlertCircle size={13} />
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">{renderWalkerSelect(walk)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredWalks.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <PawPrint size={32} className="mx-auto mb-2" />
            <p>{hasFilters ? 'No walks match your filters.' : 'No walks yet.'}</p>
          </div>
        )}
      </div>

      {/* Walks cards (mobile) */}
      <div className="md:hidden space-y-3">
        {filteredWalks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <PawPrint size={32} className="mx-auto mb-2" />
            <p>{hasFilters ? 'No walks match your filters.' : 'No walks yet.'}</p>
          </div>
        ) : filteredWalks.map(walk => (
          <div key={walk.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="font-semibold text-sm text-[#2B2620]">{walk.dog?.name}</div>
                <div className="text-xs text-gray-500">{walk.client?.full_name}</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {walk.payment_status === 'pending' && (
                  <span title="Payment pending" className="text-amber-500">
                    <AlertCircle size={13} />
                  </span>
                )}
                <StatusBadge status={walk.status} />
              </div>
            </div>
            <div className="text-xs text-gray-500 mb-3">
              {new Date(walk.scheduled_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              {' · '}
              {new Date(`2000-01-01T${walk.scheduled_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              {' · '}{walk.duration_minutes} min
            </div>
            {renderWalkerSelect(walk)}
          </div>
        ))}
      </div>
    </div>
  );
}
