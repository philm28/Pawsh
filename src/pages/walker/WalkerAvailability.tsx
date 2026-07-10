import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const DAYS = [
  { value: 0, label: 'Sun', full: 'Sunday' },
  { value: 1, label: 'Mon', full: 'Monday' },
  { value: 2, label: 'Tue', full: 'Tuesday' },
  { value: 3, label: 'Wed', full: 'Wednesday' },
  { value: 4, label: 'Thu', full: 'Thursday' },
  { value: 5, label: 'Fri', full: 'Friday' },
  { value: 6, label: 'Sat', full: 'Saturday' },
];

interface DayState {
  enabled: boolean;
  start_time: string;
  end_time: string;
}

type AvailabilityState = Record<number, DayState>;

function defaultState(): AvailabilityState {
  const s: AvailabilityState = {};
  for (let i = 0; i < 7; i++) s[i] = { enabled: false, start_time: '08:00', end_time: '18:00' };
  return s;
}

export default function WalkerAvailability() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityState>(defaultState);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('walker_availability')
        .select('*')
        .eq('walker_id', profile!.id);
      if (data && data.length > 0) {
        setAvailability(prev => {
          const next = { ...prev };
          for (const row of data) {
            next[row.day_of_week] = {
              enabled: true,
              start_time: (row.start_time as string).slice(0, 5),
              end_time: (row.end_time as string).slice(0, 5),
            };
          }
          return next;
        });
      }
      setLoading(false);
    }
    load();
  }, [profile]);

  function toggleDay(day: number) {
    setAvailability(prev => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }));
  }

  function updateTime(day: number, field: 'start_time' | 'end_time', value: string) {
    setAvailability(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  async function save() {
    setSaving(true);
    const { error: delErr } = await supabase
      .from('walker_availability')
      .delete()
      .eq('walker_id', profile!.id);

    if (delErr) {
      toast('Failed to save availability.', 'error');
      setSaving(false);
      return;
    }

    const inserts = Object.entries(availability)
      .filter(([, v]) => v.enabled)
      .map(([day, v]) => ({
        walker_id: profile!.id,
        day_of_week: parseInt(day),
        start_time: v.start_time,
        end_time: v.end_time,
      }));

    if (inserts.length > 0) {
      const { error: insErr } = await supabase.from('walker_availability').insert(inserts);
      if (insErr) {
        toast('Failed to save availability.', 'error');
        setSaving(false);
        return;
      }
    }

    toast('Availability saved!', 'success');
    setSaving(false);
  }

  if (loading) return <LoadingSpinner className="min-h-screen" />;

  const enabledCount = Object.values(availability).filter(v => v.enabled).length;

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto pb-32 md:pb-8">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Availability</h1>
        <p className="text-gray-500 text-sm mt-0.5">Set the days and hours you're available to walk dogs.</p>
      </div>

      <div className="space-y-3 mb-6">
        {DAYS.map(day => {
          const { enabled, start_time, end_time } = availability[day.value];
          return (
            <div
              key={day.value}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                enabled ? 'border-forest-200' : 'border-gray-100'
              }`}
            >
              <div className="flex items-center gap-4 px-4 py-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm shrink-0 transition-colors ${
                    enabled ? 'text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                  style={enabled ? { backgroundColor: '#2D5016' } : {}}
                >
                  {day.label}
                </div>
                <span className={`flex-1 font-medium text-sm transition-colors ${enabled ? 'text-[#1A1A1A]' : 'text-gray-400'}`}>
                  {day.full}
                </span>
                <button
                  onClick={() => toggleDay(day.value)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 focus:outline-none ${
                    enabled ? '' : 'bg-gray-200'
                  }`}
                  style={enabled ? { backgroundColor: '#2D5016' } : {}}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {enabled && (
                <div className="px-4 pb-4 flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1.5">Start time</label>
                    <input
                      type="time"
                      value={start_time}
                      onChange={e => updateTime(day.value, 'start_time', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:border-forest-500"
                      style={{ '--tw-ring-color': 'rgba(45,80,22,0.2)' } as React.CSSProperties}
                    />
                  </div>
                  <div className="text-gray-300 mb-3 text-lg">—</div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1.5">End time</label>
                    <input
                      type="time"
                      value={end_time}
                      onChange={e => updateTime(day.value, 'end_time', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:border-forest-500"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-20 left-4 right-4 md:static md:bottom-auto md:left-auto md:right-auto">
        <button
          onClick={save}
          disabled={saving}
          className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm disabled:opacity-60 transition-opacity shadow-lg md:shadow-none"
          style={{ backgroundColor: '#2D5016' }}
        >
          {saving
            ? 'Saving…'
            : enabledCount > 0
              ? `Save Availability (${enabledCount} day${enabledCount !== 1 ? 's' : ''})`
              : 'Save (No days selected)'}
        </button>
      </div>
    </div>
  );
}
