import { useEffect, useState } from 'react';
import { AlertCircle, Calendar, Check, Clock, Moon, Pause, Sun, Wallet, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase, callEdgeFunction } from '../../lib/supabase';
import { BUNDLE_TIERS, BundleTier, DOG_SITTING_RATES, creditRateCents, creditsNeededFor } from '../../lib/bundles';
import { ClientBundleSubscription, CreditLot, Dog, DogSittingBooking } from '../../lib/types';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function ClientMembership() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bundle, setBundle] = useState<ClientBundleSubscription | null>(null);
  const [lots, setLots] = useState<CreditLot[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [bookings, setBookings] = useState<DogSittingBooking[]>([]);
  const [switching, setSwitching] = useState<BundleTier | null>(null);
  const [showFreeze, setShowFreeze] = useState(false);
  const [freezeDate, setFreezeDate] = useState('');
  const [freezing, setFreezing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showSitting, setShowSitting] = useState(false);
  const [sittingDogId, setSittingDogId] = useState('');
  const [sittingType, setSittingType] = useState<'day' | 'overnight'>('day');
  const [sittingDate, setSittingDate] = useState('');
  const [sittingNotes, setSittingNotes] = useState('');
  const [bookingSitting, setBookingSitting] = useState(false);

  async function loadData() {
    if (!profile) return;
    const [bundleRes, lotsRes, dogsRes, bookingsRes] = await Promise.all([
      supabase.from('client_bundle_subscriptions').select('*').eq('client_id', profile.id).maybeSingle(),
      supabase.from('credit_lots').select('*').eq('client_id', profile.id).is('voided_at', null).gt('remaining', 0)
        .gt('expires_at', new Date().toISOString()).order('expires_at', { ascending: true }),
      supabase.from('dogs').select('*').eq('owner_id', profile.id),
      supabase.from('dog_sitting_bookings').select('*, dog:dogs(*)').eq('client_id', profile.id)
        .order('scheduled_date', { ascending: false }),
    ]);
    setBundle(bundleRes.data as ClientBundleSubscription | null);
    setLots((lotsRes.data ?? []) as CreditLot[]);
    setDogs((dogsRes.data ?? []) as Dog[]);
    setBookings((bookingsRes.data ?? []) as DogSittingBooking[]);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [profile]);

  // Handle return from Stripe checkout (bundle purchase or dog sitting)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const membership = params.get('membership');
    const dogsitting = params.get('dogsitting');
    if (!membership && !dogsitting) return;
    window.history.replaceState({}, '', window.location.pathname);
    if (membership === 'success' || dogsitting === 'success') {
      toast('Payment received! This can take a few seconds to confirm.', 'success');
      setTimeout(loadData, 2000);
      setTimeout(loadData, 5000);
    } else if (membership === 'cancelled' || dogsitting === 'cancelled') {
      toast('Checkout cancelled.', 'info');
    }
  }, []);

  const totalCredits = lots.reduce((sum, l) => sum + l.remaining, 0);
  const nextExpiry = lots[0]?.expires_at;

  async function subscribeTo(tier: BundleTier) {
    setSwitching(tier);
    try {
      const origin = window.location.origin;
      const res = await callEdgeFunction('bundle-checkout', {
        tier,
        success_url: `${origin}/?membership=success`,
        cancel_url: `${origin}/?membership=cancelled`,
      });
      const data = await res.json();
      if (data.error) {
        toast(data.error, 'error');
      } else if (data.switched) {
        toast('Plan switched! Your next invoice will reflect the prorated difference.', 'success');
        await loadData();
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast('Failed to start checkout.', 'error');
    }
    setSwitching(null);
  }

  async function freezeAccount() {
    if (!freezeDate) return;
    setFreezing(true);
    try {
      const res = await callEdgeFunction('freeze-account', { end_date: freezeDate });
      const data = await res.json();
      if (data.error) {
        toast(data.error, 'error');
      } else {
        toast('Account frozen. Unused credits have been forfeited per policy.', 'success');
        setShowFreeze(false);
        await loadData();
      }
    } catch {
      toast('Failed to freeze account.', 'error');
    }
    setFreezing(false);
  }

  async function cancelBundle() {
    setCancelling(true);
    try {
      const res = await callEdgeFunction('cancel-bundle', {});
      const data = await res.json();
      if (data.error) {
        toast(data.error, 'error');
      } else {
        toast('Membership will cancel at the end of the current billing period.', 'success');
        await loadData();
      }
    } catch {
      toast('Failed to cancel.', 'error');
    }
    setCancelling(false);
  }

  async function bookSitting() {
    if (!sittingDogId || !sittingDate) return;
    setBookingSitting(true);
    try {
      const origin = window.location.origin;
      const res = await callEdgeFunction('book-dog-sitting', {
        dog_id: sittingDogId,
        visit_type: sittingType,
        scheduled_date: sittingDate,
        client_notes: sittingNotes,
        success_url: `${origin}/?dogsitting=success`,
        cancel_url: `${origin}/?dogsitting=cancelled`,
      });
      const data = await res.json();
      if (data.error) {
        toast(data.error, 'error');
      } else if (data.paid) {
        toast('Booked! Fully covered by your credits.', 'success');
        setShowSitting(false);
        await loadData();
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast('Failed to book.', 'error');
    }
    setBookingSitting(false);
  }

  if (loading) return <LoadingSpinner className="min-h-screen" />;

  const previewCreditsNeeded = bundle?.status === 'active'
    ? creditsNeededFor(bundle.tier, DOG_SITTING_RATES[sittingType].priceCents)
    : 0;
  const previewCreditsUsed = Math.min(previewCreditsNeeded, totalCredits);
  const previewCashCents = bundle?.status === 'active'
    ? (previewCreditsNeeded - previewCreditsUsed) * creditRateCents(bundle.tier)
    : DOG_SITTING_RATES[sittingType].priceCents;

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto pb-24 md:pb-8">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-5">Membership</h1>

      {/* Current status */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFF5B8' }}>
            <Wallet size={18} style={{ color: '#B8860B' }} />
          </div>
          <div>
            <div className="font-semibold text-sm text-[#1A1A1A]">
              {bundle?.status === 'active' && `${BUNDLE_TIERS.find(t => t.id === bundle.tier)?.label} plan — active`}
              {bundle?.status === 'paused' && 'Membership frozen'}
              {bundle?.status === 'incomplete' && 'Completing checkout…'}
              {bundle?.status === 'canceled' && 'No active membership'}
              {!bundle && 'No active membership'}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {bundle?.status === 'paused' && bundle.paused_until
                ? `Frozen until ${new Date(bundle.paused_until).toLocaleDateString()}`
                : 'Choose a plan below to get started'}
            </div>
          </div>
        </div>

        {totalCredits > 0 && (
          <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold text-[#1A1A1A]">{totalCredits} walk credits available</div>
              {nextExpiry && (
                <div className="text-xs text-gray-500 mt-0.5">
                  Next {lots[0].remaining} expire {new Date(nextExpiry).toLocaleDateString()}
                </div>
              )}
            </div>
            <Clock size={16} className="text-gray-300" />
          </div>
        )}

        {bundle?.status === 'active' && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowFreeze(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors"
            >
              <Pause size={12} />
              Freeze account
            </button>
            <button
              onClick={cancelBundle}
              disabled={cancelling}
              className="flex-1 py-2 rounded-xl border border-red-200 text-red-500 text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-60"
            >
              {cancelling ? 'Cancelling…' : 'Cancel membership'}
            </button>
          </div>
        )}
      </div>

      {/* Plan tiers */}
      <h2 className="font-semibold text-sm text-[#1A1A1A] mb-3">
        {bundle?.status === 'active' ? 'Switch plans' : 'Choose a monthly plan'}
      </h2>
      <div className="space-y-3 mb-8">
        {BUNDLE_TIERS.map(tier => {
          const isCurrent = bundle?.status === 'active' && bundle.tier === tier.id;
          const savings = (tier.regularPriceCents - tier.monthlyPriceCents) / 100;
          return (
            <div
              key={tier.id}
              className="bg-white rounded-2xl border-2 shadow-sm p-4 flex items-center justify-between"
              style={{ borderColor: isCurrent ? '#F2C94C' : '#f3f4f6' }}
            >
              <div>
                <div className="font-semibold text-sm text-[#1A1A1A]">{tier.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  ${(tier.monthlyPriceCents / 100).toFixed(0)}/mo · save ${savings.toFixed(0)} vs. per-walk pricing
                </div>
              </div>
              {isCurrent ? (
                <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: '#FFF5B8', color: '#B8860B' }}>
                  <Check size={12} /> Current
                </span>
              ) : (
                <button
                  onClick={() => subscribeTo(tier.id)}
                  disabled={switching === tier.id}
                  className="text-xs font-semibold px-4 py-2 rounded-xl text-[#1A1A1A] disabled:opacity-60 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#F2C94C' }}
                >
                  {switching === tier.id ? 'Loading…' : bundle?.status === 'active' ? 'Switch' : 'Subscribe'}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mb-8">
        Billed on the 1st of every month. Joining mid-month prorates your first charge — you're only billed for the days remaining.
      </p>

      {/* Dog sitting */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-sm text-[#1A1A1A]">Dog Sitting</h2>
        <button
          onClick={() => { setShowSitting(true); setSittingDogId(dogs[0]?.id ?? ''); }}
          disabled={dogs.length === 0}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl text-[#1A1A1A] disabled:opacity-40 transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#F2C94C' }}
        >
          Book a visit
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <Sun size={16} style={{ color: '#B8860B' }} />
          <div className="font-semibold text-sm text-[#1A1A1A] mt-2">{DOG_SITTING_RATES.day.label}</div>
          <div className="text-xs text-gray-400 mt-0.5">{DOG_SITTING_RATES.day.desc}</div>
          <div className="text-sm font-semibold text-[#1A1A1A] mt-2">${(DOG_SITTING_RATES.day.priceCents / 100).toFixed(0)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <Moon size={16} style={{ color: '#B8860B' }} />
          <div className="font-semibold text-sm text-[#1A1A1A] mt-2">{DOG_SITTING_RATES.overnight.label}</div>
          <div className="text-xs text-gray-400 mt-0.5">{DOG_SITTING_RATES.overnight.desc}</div>
          <div className="text-sm font-semibold text-[#1A1A1A] mt-2">${(DOG_SITTING_RATES.overnight.priceCents / 100).toFixed(0)}</div>
        </div>
      </div>

      {bookings.length > 0 && (
        <>
          <h2 className="font-semibold text-sm text-[#1A1A1A] mb-3">Sitting History</h2>
          <div className="space-y-2">
            {bookings.map(b => (
              <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-[#1A1A1A]">
                    {b.dog?.name} · {b.visit_type === 'day' ? 'Day Sitting' : 'Overnight Sitting'}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(`${b.scheduled_date}T12:00:00`).toLocaleDateString()}
                    {b.credits_used > 0 && ` · ${b.credits_used} credit(s) used`}
                    {b.cash_charged_cents > 0 && ` · $${(b.cash_charged_cents / 100).toFixed(2)} charged`}
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  b.payment_status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {b.payment_status === 'paid' ? 'Confirmed' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Freeze modal */}
      <Modal
        open={showFreeze}
        onClose={() => setShowFreeze(false)}
        title="Freeze your membership"
        footer={
          <button
            onClick={freezeAccount}
            disabled={freezing || !freezeDate}
            className="w-full py-3 rounded-xl text-[#1A1A1A] font-semibold disabled:opacity-60"
            style={{ backgroundColor: '#F2C94C' }}
          >
            {freezing ? 'Freezing…' : 'Confirm Freeze'}
          </button>
        }
      >
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2">
            <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Freezing pauses billing but forfeits any unused credits you currently have. Freezes can last up to 30 days.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Resume date</label>
            <input
              type="date"
              min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
              max={new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]}
              value={freezeDate}
              onChange={e => setFreezeDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:border-forest-500"
            />
          </div>
        </div>
      </Modal>

      {/* Dog sitting booking modal */}
      <Modal
        open={showSitting}
        onClose={() => setShowSitting(false)}
        title="Book Dog Sitting"
        footer={
          <button
            onClick={bookSitting}
            disabled={bookingSitting || !sittingDogId || !sittingDate}
            className="w-full py-3 rounded-xl text-[#1A1A1A] font-semibold disabled:opacity-60"
            style={{ backgroundColor: '#F2C94C' }}
          >
            {bookingSitting ? 'Booking…' : previewCashCents > 0 ? `Pay $${(previewCashCents / 100).toFixed(2)}` : 'Confirm (using credits)'}
          </button>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Dog</label>
            <select
              value={sittingDogId}
              onChange={e => setSittingDogId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:border-forest-500"
            >
              {dogs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['day', 'overnight'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSittingType(t)}
                  className="py-3 rounded-xl border-2 text-sm font-medium transition-all"
                  style={sittingType === t
                    ? { borderColor: '#F2C94C', color: '#B8860B', backgroundColor: '#FFF5B8' }
                    : { borderColor: '#e5e7eb', color: '#4b5563' }}
                >
                  <div>{DOG_SITTING_RATES[t].label}</div>
                  <div className="text-xs opacity-70 mt-0.5">${(DOG_SITTING_RATES[t].priceCents / 100).toFixed(0)}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              max={new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]}
              value={sittingDate}
              onChange={e => setSittingDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:border-forest-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={sittingNotes}
              onChange={e => setSittingNotes(e.target.value)}
              rows={2}
              maxLength={500}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:border-forest-500 resize-none"
            />
          </div>
          <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-600">
            {previewCreditsUsed > 0 && <div>{previewCreditsUsed} credit(s) will be applied</div>}
            <div className="font-semibold text-[#1A1A1A] mt-0.5">
              {previewCashCents > 0 ? `$${(previewCashCents / 100).toFixed(2)} due at checkout` : 'Fully covered by credits'}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
