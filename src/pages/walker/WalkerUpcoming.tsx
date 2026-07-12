import { useEffect, useState } from 'react';
import { Clock, Dog, FileText, MapPin, PawPrint } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Walk } from '../../lib/types';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function WalkerUpcoming() {
  const { profile } = useAuth();
  const [walks, setWalks] = useState<Walk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split('T')[0];
      const sevenDays = new Date();
      sevenDays.setDate(sevenDays.getDate() + 7);
      const endDate = sevenDays.toISOString().split('T')[0];

      const { data } = await supabase
        .from('walks')
        .select('*, dog:dogs(*), client:profiles!client_id(*)')
        .eq('walker_id', profile!.id)
        .eq('payment_status', 'paid')
        .gte('scheduled_date', today)
        .lte('scheduled_date', endDate)
        .in('status', ['assigned', 'in_progress'])
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });
      if (data) setWalks(data as Walk[]);
      setLoading(false);
    }
    load();
  }, [profile]);

  function groupByDate(walks: Walk[]) {
    const groups = new Map<string, Walk[]>();
    for (const walk of walks) {
      const existing = groups.get(walk.scheduled_date) ?? [];
      groups.set(walk.scheduled_date, [...existing, walk]);
    }
    return groups;
  }

  function formatDateHeader(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  if (loading) return <LoadingSpinner className="min-h-screen" />;

  const groups = groupByDate(walks);

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto pb-24 md:pb-8">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-5">Upcoming Walks</h1>

      {walks.length === 0 ? (
        <div className="text-center py-16">
          <PawPrint size={48} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium">No upcoming walks in the next 7 days.</p>
          <p className="text-gray-400 text-sm mt-1">Check back later for new assignments.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([date, dateWalks]) => (
            <section key={date}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {formatDateHeader(date)}
              </h2>
              <div className="space-y-3">
                {dateWalks.map(walk => (
                  <div key={walk.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        {walk.dog?.photo_url ? (
                          <img src={walk.dog.photo_url} alt={walk.dog.name} className="w-11 h-11 rounded-xl object-cover" />
                        ) : (
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FFF5B8' }}>
                            <Dog size={20} style={{ color: '#B8860B' }} />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-sm text-[#1A1A1A]">{walk.dog?.name}</div>
                          <div className="text-xs text-gray-500">{walk.dog?.breed}</div>
                        </div>
                      </div>
                      <StatusBadge status={walk.status} />
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} />
                        {new Date(`2000-01-01T${walk.scheduled_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        {' · '}{walk.duration_minutes} min
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} />
                        {walk.client?.full_name}
                      </div>
                    </div>
                    {walk.client_notes && (
                      <div className="flex items-start gap-1.5 text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded-lg mt-2">
                        <FileText size={11} className="mt-0.5 shrink-0" />
                        <span>{walk.client_notes}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
