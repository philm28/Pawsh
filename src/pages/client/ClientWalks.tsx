import { useEffect, useState } from 'react';
import { AlertCircle, Calendar, Camera, Clock, CreditCard, PawPrint, Plus, Star, X, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase, callEdgeFunction } from '../../lib/supabase';
import { Dog, Walk, WalkRating } from '../../lib/types';
import StatusBadge from '../../components/ui/StatusBadge';
import StarRating from '../../components/ui/StarRating';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

type Tab = 'upcoming' | 'history';

export default function ClientWalks() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [walks, setWalks] = useState<Walk[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [ratings, setRatings] = useState<Map<string, WalkRating>>(new Map());
  const [price30, setPrice30] = useState(25);
  const [price60, setPrice60] = useState(45);
  const [loading, setLoading] = useState(true);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedWalkPhoto, setSelectedWalkPhoto] = useState<Walk | null>(null);
  const [cancellingWalk, setCancellingWalk] = useState<Walk | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [ratingWalk, setRatingWalk] = useState<Walk | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  // Schedule form
  const [dogId, setDogId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState<30 | 60>(30);
  const [clientNotes, setClientNotes] = useState('');

  async function loadData() {
    const [walksRes, dogsRes, ratingsRes, settingsRes] = await Promise.all([
      supabase
        .from('walks')
        .select('*, dog:dogs(*), walker:profiles!walker_id(*)')
        .eq('client_id', profile!.id)
        .order('scheduled_date', { ascending: false })
        .order('scheduled_time', { ascending: false }),
      supabase.from('dogs').select('*').eq('owner_id', profile!.id).order('name'),
      supabase.from('walk_ratings').select('*').eq('client_id', profile!.id),
      supabase.from('app_settings').select('key, value').in('key', ['price_30min', 'price_60min']),
    ]);
    if (walksRes.data) setWalks(walksRes.data as Walk[]);
    if (dogsRes.data) {
      setDogs(dogsRes.data as Dog[]);
      if (dogsRes.data.length > 0 && !dogId) setDogId(dogsRes.data[0].id);
    }
    if (ratingsRes.data) {
      const map = new Map<string, WalkRating>();
      for (const r of ratingsRes.data) map.set(r.walk_id, r as WalkRating);
      setRatings(map);
    }
    if (settingsRes.data) {
      for (const s of settingsRes.data) {
        if (s.key === 'price_30min') setPrice30(parseFloat(s.value));
        if (s.key === 'price_60min') setPrice60(parseFloat(s.value));
      }
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [profile]);

  // Handle return from Stripe checkout
  useEffect(() => {
    if (!profile) return;
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const walkId = params.get('walk_id');
    const sessionId = params.get('session_id');

    if (!payment || !walkId) return;

    window.history.replaceState({}, '', window.location.pathname);

    if (payment === 'success' && sessionId) {
      handlePaymentSuccess(sessionId, walkId);
    } else if (payment === 'cancelled') {
      handlePaymentCancelled(walkId);
    }
  }, [profile]);

  async function handlePaymentSuccess(sessionId: string, walkId: string) {
    setVerifyingPayment(true);
    try {
      const res = await callEdgeFunction('verify-walk-payment', { session_id: sessionId, walk_id: walkId });
      const data: { paid?: boolean; error?: string } = await res.json();
      if (data.paid) {
        toast('Walk booked! Payment confirmed.', 'success');
      } else {
        toast(data.error ?? 'Payment not confirmed. Please try again.', 'error');
      }
    } catch {
      toast('Error confirming payment.', 'error');
    }
    setVerifyingPayment(false);
    await loadData();
  }

  async function handlePaymentCancelled(walkId: string) {
    try {
      await callEdgeFunction('verify-walk-payment', { walk_id: walkId, cancelled: true });
    } catch { /* ignore */ }
    toast('Walk booking cancelled.', 'info');
    await loadData();
  }

  async function cancelWalk() {
    if (!cancellingWalk) return;
    setCancelling(true);
    try {
      const res = await callEdgeFunction('cancel-walk', { walk_id: cancellingWalk.id });
      const data: { cancelled?: boolean; refunded?: boolean; refund_amount?: number; error?: string } = await res.json();
      if (!res.ok || !data.cancelled) {
        toast(data.error ?? 'Failed to cancel walk.', 'error');
        setCancelling(false);
        return;
      }
      if (data.refunded && data.refund_amount != null) {
        toast(`Walk cancelled. $${data.refund_amount.toFixed(2)} refund is on its way.`, 'success');
      } else {
        toast('Walk cancelled.', 'success');
      }
      setCancellingWalk(null);
      await loadData();
    } catch {
      toast('Failed to cancel walk.', 'error');
    }
    setCancelling(false);
  }

  async function submitRating(e: React.FormEvent) {
    e.preventDefault();
    if (!ratingWalk || !ratingWalk.walker_id) return;
    setSubmittingRating(true);
    const { error } = await supabase.from('walk_ratings').insert({
      walk_id: ratingWalk.id,
      client_id: profile!.id,
      walker_id: ratingWalk.walker_id,
      rating: ratingValue,
      comment: ratingComment.trim() || null,
    });
    setSubmittingRating(false);
    if (error) toast('Failed to submit rating.', 'error');
    else {
      toast('Thanks for your rating!', 'success');
      setRatingWalk(null);
      setRatingValue(5);
      setRatingComment('');
      await loadData();
    }
  }

  async function scheduleWalk(e: React.FormEvent) {
    e.preventDefault();
    if (!dogId || !date || !time) return;
    setCheckingOut(true);

    const price = duration === 60 ? price60 : price30;
    const origin = window.location.origin;
    const successUrl = `${origin}/?payment=success&walk_id=WALK_ID_PLACEHOLDER&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/?payment=cancelled&walk_id=WALK_ID_PLACEHOLDER`;

    try {
      const res = await callEdgeFunction('walk-checkout', {
        dog_id: dogId,
        scheduled_date: date,
        scheduled_time: time,
        duration_minutes: duration,
        price,
        client_notes: clientNotes.trim() || undefined,
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
      const data: { url?: string; error?: string } = await res.json();
      if (!res.ok || !data.url) {
        toast(data.error ?? 'Failed to start checkout.', 'error');
        setCheckingOut(false);
        return;
      }
      // Redirect to Stripe — page will navigate away
      window.location.href = data.url;
    } catch {
      toast('Failed to start checkout. Please try again.', 'error');
      setCheckingOut(false);
    }
  }

  async function retryPayment(walk: Walk) {
    setCheckingOut(true);
    const origin = window.location.origin;
    const successUrl = `${origin}/?payment=success&walk_id=WALK_ID_PLACEHOLDER&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/?payment=cancelled&walk_id=WALK_ID_PLACEHOLDER`;

    try {
      const res = await callEdgeFunction('walk-checkout', {
        walk_id: walk.id,
        dog_id: walk.dog_id,
        scheduled_date: walk.scheduled_date,
        scheduled_time: walk.scheduled_time,
        duration_minutes: walk.duration_minutes,
        price: walk.price,
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
      const data: { url?: string; error?: string } = await res.json();
      if (!res.ok || !data.url) {
        toast(data.error ?? 'Failed to start checkout.', 'error');
        setCheckingOut(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      toast('Failed to start checkout.', 'error');
      setCheckingOut(false);
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const upcomingWalks = walks.filter(w => w.scheduled_date >= today && w.status !== 'completed' && w.status !== 'cancelled');
  const historyWalks = walks.filter(w => w.status === 'completed' || w.status === 'cancelled' || w.scheduled_date < today);
  const displayed = tab === 'upcoming' ? upcomingWalks : historyWalks;

  function formatWalkTime(d: string, t: string) {
    return new Date(`${d}T${t}`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
      ' · ' + new Date(`${d}T${t}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  if (loading) return <LoadingSpinner className="min-h-screen" />;

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto pb-24 md:pb-8">
      {/* Payment verification overlay */}
      {verifyingPayment && (
        <div className="fixed inset-0 z-50 bg-[#FAF7F2]/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 text-center max-w-xs mx-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FFF5B8' }}>
              <CreditCard size={22} style={{ color: '#B8860B' }} />
            </div>
            <div className="font-semibold text-[#1A1A1A] mb-1">Confirming Payment</div>
            <p className="text-sm text-gray-500">Please wait a moment…</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Walks</h1>
        <button
          onClick={() => setShowSchedule(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[#1A1A1A] text-sm font-semibold"
          style={{ backgroundColor: '#F2C94C' }}
        >
          <Plus size={16} />
          Schedule
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
        {(['upcoming', 'history'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-gray-500'
            }`}
          >
            {t === 'upcoming' ? 'Upcoming' : 'History'}
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-16">
          <PawPrint size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium">
            {tab === 'upcoming' ? 'No upcoming walks.' : 'No walk history yet.'}
          </p>
          {tab === 'upcoming' && (
            <p className="text-gray-400 text-sm mt-1">Ready to book your first walk?</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(walk => {
            const existingRating = ratings.get(walk.id);
            const isPending = walk.payment_status === 'pending';
            return (
              <div
                key={walk.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                  isPending ? 'border-amber-200' : 'border-gray-100'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="font-semibold text-[#1A1A1A]">{walk.dog?.name}</div>
                      <div className="text-xs text-gray-500">{walk.dog?.breed}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                          <AlertCircle size={10} />
                          Unpaid
                        </span>
                      )}
                      <StatusBadge status={walk.status} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} />
                      {formatWalkTime(walk.scheduled_date, walk.scheduled_time)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} />
                      {walk.duration_minutes} min · ${walk.price}
                    </div>
                  </div>
                  {walk.walker && !isPending && (
                    <div className="mt-2 text-xs text-gray-500">
                      Walker: <span className="font-medium text-gray-700">{walk.walker.full_name}</span>
                    </div>
                  )}
                  {walk.client_notes && (
                    <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 italic">
                      "{walk.client_notes}"
                    </div>
                  )}

                  {/* Pending payment — complete or cancel */}
                  {isPending && (
                    <div className="mt-3 pt-3 border-t border-amber-100 space-y-2">
                      <p className="text-xs text-amber-700">Payment required to confirm this booking.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => retryPayment(walk)}
                          disabled={checkingOut}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[#1A1A1A] text-xs font-semibold disabled:opacity-60 transition-opacity"
                          style={{ backgroundColor: '#C9A84C' }}
                        >
                          <CreditCard size={12} />
                          Complete Payment
                        </button>
                        <button
                          onClick={() => handlePaymentCancelled(walk.id)}
                          className="px-3 py-2 rounded-xl border border-gray-200 text-gray-500 text-xs hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {!isPending && (walk.status === 'scheduled' || walk.status === 'assigned') && (
                    <div className="mt-3 pt-3 border-t border-gray-50">
                      <button
                        onClick={() => setCancellingWalk(walk)}
                        className="flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-600 transition-colors"
                      >
                        <XCircle size={13} />
                        Cancel walk
                      </button>
                    </div>
                  )}
                </div>

                {/* Completed walk details */}
                {walk.status === 'completed' && (
                  <div className="border-t border-gray-50 px-4 py-3 bg-gray-50/50 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {walk.check_in_time && (
                        <div>
                          <span className="text-gray-400">Check-in</span>
                          <div className="font-medium text-gray-700">
                            {new Date(walk.check_in_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </div>
                        </div>
                      )}
                      {walk.check_out_time && (
                        <div>
                          <span className="text-gray-400">Check-out</span>
                          <div className="font-medium text-gray-700">
                            {new Date(walk.check_out_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </div>
                        </div>
                      )}
                    </div>
                    {walk.walker_notes && (
                      <p className="text-xs text-gray-600 italic">"{walk.walker_notes}"</p>
                    )}
                    {walk.photo_url && (
                      <button
                        onClick={() => setSelectedWalkPhoto(walk)}
                        className="flex items-center gap-1.5 text-xs font-medium"
                        style={{ color: '#C9A84C' }}
                      >
                        <Camera size={13} />
                        View walk photo
                      </button>
                    )}
                    <div className="pt-2 border-t border-gray-100">
                      {existingRating ? (
                        <div className="flex items-center gap-2">
                          <StarRating value={existingRating.rating} readonly size={14} />
                          {existingRating.comment && (
                            <span className="text-xs text-gray-500 italic truncate">"{existingRating.comment}"</span>
                          )}
                        </div>
                      ) : walk.walker_id ? (
                        <button
                          onClick={() => { setRatingWalk(walk); setRatingValue(0); setRatingComment(''); }}
                          className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                          style={{ color: '#C9A84C' }}
                        >
                          <Star size={13} />
                          Rate this walk
                        </button>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        open={!!cancellingWalk}
        onClose={() => setCancellingWalk(null)}
        title="Cancel Walk"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setCancellingWalk(null)}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Keep Walk
            </button>
            <button
              onClick={cancelWalk}
              disabled={cancelling}
              className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-60 hover:bg-red-600 transition-colors"
            >
              {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
            </button>
          </div>
        }
      >
        <p className="text-gray-600 text-sm py-2">
          Are you sure you want to cancel the walk for{' '}
          <strong className="text-gray-900">{cancellingWalk?.dog?.name}</strong> on{' '}
          <strong className="text-gray-900">
            {cancellingWalk ? new Date(`${cancellingWalk.scheduled_date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
          </strong>?
        </p>
        {cancellingWalk?.payment_status === 'paid' && (
          <div className="mt-2 px-3 py-2.5 rounded-xl bg-green-50 border border-green-100 text-xs text-green-700">
            A full refund of <strong>${cancellingWalk.price.toFixed(2)}</strong> will be issued to your original payment method within 5&ndash;10 business days.
          </div>
        )}
      </Modal>

      {/* Rate Walk Modal */}
      <Modal
        open={!!ratingWalk}
        onClose={() => setRatingWalk(null)}
        title="Rate Your Walk"
        footer={
          <button
            form="rating-form"
            type="submit"
            disabled={submittingRating || ratingValue === 0}
            className="w-full py-3 rounded-xl text-[#1A1A1A] font-semibold disabled:opacity-60"
            style={{ backgroundColor: '#F2C94C' }}
          >
            {submittingRating ? 'Submitting…' : 'Submit Rating'}
          </button>
        }
      >
        <form id="rating-form" onSubmit={submitRating} className="space-y-5">
          <p className="text-sm text-gray-600">
            How was <strong className="text-gray-900">{ratingWalk?.dog?.name}</strong>'s walk with{' '}
            <strong className="text-gray-900">{ratingWalk?.walker?.full_name ?? 'your walker'}</strong>?
          </p>
          <div className="flex justify-center py-2">
            <StarRating value={ratingValue} onChange={setRatingValue} size={36} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Comment <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={ratingComment}
              onChange={e => setRatingComment(e.target.value)}
              placeholder="Great walk! The dog was well-behaved…"
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:border-forest-500 resize-none"
            />
          </div>
        </form>
      </Modal>

      {/* Walk Photo Modal */}
      {selectedWalkPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center px-4" onClick={() => setSelectedWalkPhoto(null)}>
          <button className="absolute top-4 right-4 p-2 text-white/70 hover:text-white">
            <X size={24} />
          </button>
          <img
            src={selectedWalkPhoto.photo_url!}
            alt="Walk photo"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain"
          />
        </div>
      )}

      {/* Schedule Modal */}
      <Modal
        open={showSchedule}
        onClose={() => setShowSchedule(false)}
        title="Schedule a Walk"
        footer={
          <button
            form="schedule-form"
            type="submit"
            disabled={checkingOut}
            className="w-full py-3 rounded-xl text-[#1A1A1A] font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#F2C94C' }}
          >
            <CreditCard size={16} />
            {checkingOut ? 'Redirecting to checkout…' : `Proceed to Payment · $${duration === 30 ? price30 : price60}`}
          </button>
        }
      >
        {dogs.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">Add a dog profile before scheduling a walk.</p>
          </div>
        ) : (
          <form id="schedule-form" onSubmit={scheduleWalk} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Dog</label>
              <select
                required
                value={dogId}
                onChange={e => setDogId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:border-forest-500"
              >
                {dogs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:border-forest-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Time</label>
              <input
                type="time"
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:border-forest-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration</label>
              <div className="grid grid-cols-2 gap-2">
                {([30, 60] as const).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className="py-3 rounded-xl border-2 text-sm font-medium transition-all"
                    style={duration === d
                      ? { borderColor: '#F2C94C', color: '#B8860B', backgroundColor: '#FFF5B8' }
                      : { borderColor: '#e5e7eb', color: '#4b5563' }
                    }
                  >
                    <div>{d} min</div>
                    <div className="text-xs opacity-70 mt-0.5">${d === 30 ? price30 : price60}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Notes for walker <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={clientNotes}
                onChange={e => setClientNotes(e.target.value)}
                placeholder="e.g. Use the side gate, she needs to be on leash at all times…"
                rows={3}
                maxLength={500}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:border-forest-500 resize-none"
              />
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-2 text-xs text-gray-500">
              <CreditCard size={13} />
              You'll be redirected to Stripe to complete payment securely.
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
