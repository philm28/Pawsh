import { useEffect, useState } from 'react';
import { PawPrint, Plus, Calendar, Clock, ChevronRight, Dog } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNav } from '../../contexts/NavContext';
import { supabase } from '../../lib/supabase';
import { Walk, Dog as DogType } from '../../lib/types';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function ClientDashboard() {
  const { profile } = useAuth();
  const { navigate, setSelectedDogId } = useNav();
  const [upcomingWalks, setUpcomingWalks] = useState<Walk[]>([]);
  const [dogs, setDogs] = useState<DogType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split('T')[0];
      const [walksRes, dogsRes] = await Promise.all([
        supabase
          .from('walks')
          .select('*, dog:dogs(*), walker:profiles!walker_id(*)')
          .eq('client_id', profile!.id)
          .eq('payment_status', 'paid')
          .in('status', ['scheduled', 'assigned', 'in_progress'])
          .gte('scheduled_date', today)
          .order('scheduled_date', { ascending: true })
          .order('scheduled_time', { ascending: true })
          .limit(3),
        supabase
          .from('dogs')
          .select('*')
          .eq('owner_id', profile!.id)
          .order('name'),
      ]);
      if (walksRes.data) setUpcomingWalks(walksRes.data as Walk[]);
      if (dogsRes.data) setDogs(dogsRes.data as DogType[]);
      setLoading(false);
    }
    load();
  }, [profile]);

  function formatDate(date: string, time: string) {
    const d = new Date(`${date}T${time}`);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const isToday = d.toDateString() === today.toDateString();
    const isTomorrow = d.toDateString() === tomorrow.toDateString();
    const label = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return { label, timeStr };
  }

  if (loading) return <LoadingSpinner className="min-h-screen" />;

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">
          Hello, {profile?.full_name?.split(' ')[0] ?? 'there'}
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Here's what's happening with your pups.</p>
      </div>

      {/* Schedule CTA */}
      <button
        onClick={() => navigate('client-walks')}
        className="w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[#1A1A1A] shadow-md transition-transform active:scale-[0.98]"
        style={{ background: 'linear-gradient(135deg, #F2C94C 0%, #B8860B 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black/10 rounded-xl">
            <Plus size={20} className="text-[#1A1A1A]" />
          </div>
          <div className="text-left">
            <div className="font-semibold">Schedule a Walk</div>
            <div className="text-[#1A1A1A]/70 text-xs mt-0.5">Book for any of your dogs</div>
          </div>
        </div>
        <ChevronRight size={20} className="text-[#1A1A1A]/70" />
      </button>

      {/* Upcoming Walks */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[#1A1A1A]">Upcoming Walks</h2>
          <button
            onClick={() => navigate('client-walks')}
            className="text-sm text-gold-400 font-medium"
            style={{ color: '#C9A84C' }}
          >
            See all
          </button>
        </div>
        {upcomingWalks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <PawPrint size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-gray-500 text-sm">No walks scheduled yet.</p>
            <p className="text-gray-400 text-xs mt-0.5">Ready to book your first walk?</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingWalks.map(walk => {
              const { label, timeStr } = formatDate(walk.scheduled_date, walk.scheduled_time);
              return (
                <div key={walk.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#FFF5B8] flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFF5B8' }}>
                        <Dog size={18} style={{ color: '#B8860B' }} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-[#1A1A1A] text-sm">{walk.dog?.name}</div>
                        <div className="text-xs text-gray-500">{walk.dog?.breed}</div>
                      </div>
                    </div>
                    <StatusBadge status={walk.status} />
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} />
                      {label}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} />
                      {timeStr} · {walk.duration_minutes} min
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Dogs */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[#1A1A1A]">Your Dogs</h2>
          <button
            onClick={() => navigate('client-dogs')}
            className="text-sm font-medium"
            style={{ color: '#C9A84C' }}
          >
            Manage
          </button>
        </div>
        {dogs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <Dog size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-gray-500 text-sm">No dogs added yet.</p>
            <button
              onClick={() => navigate('client-dogs')}
              className="mt-3 px-4 py-2 rounded-xl text-[#1A1A1A] text-sm font-medium"
              style={{ backgroundColor: '#F2C94C' }}
            >
              Add a Dog
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {dogs.map(dog => (
              <button
                key={dog.id}
                onClick={() => { setSelectedDogId(dog.id); navigate('client-dogs'); }}
                className="bg-white rounded-2xl border border-gray-100 p-4 text-left shadow-sm hover:border-forest-200 transition-colors"
              >
                {dog.photo_url ? (
                  <img src={dog.photo_url} alt={dog.name} className="w-12 h-12 rounded-xl object-cover mb-2" />
                ) : (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: '#FFF5B8' }}>
                    <Dog size={22} style={{ color: '#B8860B' }} />
                  </div>
                )}
                <div className="font-semibold text-sm text-[#1A1A1A]">{dog.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{dog.breed ?? 'Unknown breed'}</div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
