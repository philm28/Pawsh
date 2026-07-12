import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Camera, CheckCircle, Clock, Dog, FileText, MapPin, PawPrint, Phone, Play } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { Walk } from '../../lib/types';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// Realtime channel ref scoped outside the component render cycle
let walkerTodayChannel: ReturnType<typeof supabase.channel> | null = null;

export default function WalkerToday() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [walks, setWalks] = useState<Walk[]>([]);
  const [loading, setLoading] = useState(true);
  const [completeWalk, setCompleteWalk] = useState<Walk | null>(null);
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadWalks() {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('walks')
      .select('*, dog:dogs(*), client:profiles!client_id(*)')
      .eq('walker_id', profile!.id)
      .eq('payment_status', 'paid')
      .eq('scheduled_date', today)
      .in('status', ['assigned', 'in_progress'])
      .order('scheduled_time', { ascending: true });
    if (data) setWalks(data as Walk[]);
    setLoading(false);
  }

  useEffect(() => {
    loadWalks();

    walkerTodayChannel = supabase
      .channel('walker-today-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'walks' }, () => {
        loadWalks();
      })
      .subscribe();

    return () => {
      if (walkerTodayChannel) {
        supabase.removeChannel(walkerTodayChannel);
        walkerTodayChannel = null;
      }
    };
  }, [profile]);

  async function startWalk(walk: Walk) {
    const { error } = await supabase
      .from('walks')
      .update({ status: 'in_progress', check_in_time: new Date().toISOString() })
      .eq('id', walk.id);
    if (error) toast('Failed to start walk.', 'error');
    else { toast('Walk started!', 'success'); await loadWalks(); }
  }

  async function finishWalk() {
    if (!completeWalk) return;
    setCompleting(true);
    let photo_url: string | null = null;

    if (photoFile) {
      const ext = photoFile.name.split('.').pop();
      const path = `${completeWalk.id}.${ext}`;
      const { error: upErr } = await supabase.storage.from('walk-photos').upload(path, photoFile, { upsert: true });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('walk-photos').getPublicUrl(path);
        photo_url = urlData.publicUrl;
      }
    }

    const { error } = await supabase
      .from('walks')
      .update({
        status: 'completed',
        check_out_time: new Date().toISOString(),
        walker_notes: notes || null,
        photo_url,
      })
      .eq('id', completeWalk.id);

    setCompleting(false);
    if (error) toast('Failed to complete walk.', 'error');
    else {
      toast('Walk completed!', 'success');
      setCompleteWalk(null);
      setNotes('');
      setPhotoFile(null);
      setPhotoPreview(null);
      await loadWalks();
    }
  }

  if (loading) return <LoadingSpinner className="min-h-screen" />;

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto pb-24 md:pb-8">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Today's Walks</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {walks.length === 0 ? (
        <div className="text-center py-16">
          <PawPrint size={48} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium">No walks scheduled today.</p>
          <p className="text-gray-400 text-sm mt-1">Enjoy your day off!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {walks.map(walk => (
            <div key={walk.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    {walk.dog?.photo_url ? (
                      <img src={walk.dog.photo_url} alt={walk.dog.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFF5B8' }}>
                        <Dog size={22} style={{ color: '#B8860B' }} />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-[#1A1A1A]">{walk.dog?.name}</div>
                      <div className="text-xs text-gray-500">{walk.dog?.breed}</div>
                    </div>
                  </div>
                  <StatusBadge status={walk.status} />
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
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

                {walk.dog?.behavioral_notes && (
                  <div className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg mb-3">
                    <strong>Note:</strong> {walk.dog.behavioral_notes}
                  </div>
                )}

                {walk.client_notes && (
                  <div className="flex items-start gap-1.5 text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded-lg mb-3">
                    <FileText size={11} className="mt-0.5 shrink-0" />
                    <span>{walk.client_notes}</span>
                  </div>
                )}

                {(walk.dog?.emergency_contact_name || walk.dog?.vet_name) && (
                  <div className="mb-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700 mb-1">
                      <AlertCircle size={11} />
                      Emergency Info
                    </div>
                    {walk.dog?.emergency_contact_name && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-red-700 font-medium shrink-0">Owner</span>
                        <a
                          href={`tel:${walk.dog.emergency_contact_phone}`}
                          className="flex items-center gap-1 text-xs text-red-700 hover:text-red-900 transition-colors"
                        >
                          <Phone size={10} />
                          {walk.dog.emergency_contact_name}
                          {walk.dog.emergency_contact_phone ? ` · ${walk.dog.emergency_contact_phone}` : ''}
                        </a>
                      </div>
                    )}
                    {walk.dog?.vet_name && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-red-700 font-medium shrink-0">Vet</span>
                        <a
                          href={`tel:${walk.dog.vet_phone}`}
                          className="flex items-center gap-1 text-xs text-red-700 hover:text-red-900 transition-colors"
                        >
                          <Phone size={10} />
                          {walk.dog.vet_name}
                          {walk.dog.vet_phone ? ` · ${walk.dog.vet_phone}` : ''}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {walk.status === 'assigned' && (
                  <button
                    onClick={() => startWalk(walk)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[#1A1A1A] font-semibold"
                    style={{ backgroundColor: '#C9A84C' }}
                  >
                    <Play size={16} fill="#1A1A1A" />
                    Start Walk
                  </button>
                )}

                {walk.status === 'in_progress' && (
                  <div className="space-y-2">
                    <div className="text-xs text-orange-600 font-medium flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                      Walk in progress
                      {walk.check_in_time && (
                        <span className="text-gray-400 font-normal">
                          since {new Date(walk.check_in_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setCompleteWalk(walk)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[#1A1A1A] font-semibold"
                      style={{ backgroundColor: '#F2C94C' }}
                    >
                      <CheckCircle size={16} />
                      Complete Walk
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Complete Walk Modal */}
      <Modal
        open={!!completeWalk}
        onClose={() => { setCompleteWalk(null); setNotes(''); setPhotoFile(null); setPhotoPreview(null); }}
        title="Complete Walk"
        footer={
          <button
            onClick={finishWalk}
            disabled={completing}
            className="w-full py-3 rounded-xl text-[#1A1A1A] font-semibold disabled:opacity-60"
            style={{ backgroundColor: '#F2C94C' }}
          >
            {completing ? 'Completing…' : 'Mark as Completed'}
          </button>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Walk Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="How did the walk go? Any observations..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Walk Photo</label>
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
                <button
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-lg text-xs"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-28 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-300 transition-colors"
              >
                <Camera size={24} />
                <span className="text-sm">Tap to add a photo</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) {
                  setPhotoFile(f);
                  setPhotoPreview(URL.createObjectURL(f));
                }
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
