import { useEffect, useState } from 'react';
import { Wallet, Search, X, Plus, Minus, PawPrint } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BUNDLE_TIERS } from '../../lib/bundles';
import { ClientBundleSubscription, CreditLot, DogSittingBooking, Profile } from '../../lib/types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';

interface ClientRow extends Profile {
  bundle: ClientBundleSubscription | null;
  totalCredits: number;
  nextExpiry: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  paused: 'bg-amber-50 text-amber-700',
  incomplete: 'bg-gray-100 text-gray-500',
  past_due: 'bg-red-50 text-red-600',
  canceled: 'bg-gray-100 text-gray-400',
};

export default function AdminMemberships() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [bookings, setBookings] = useState<DogSittingBooking[]>([]);
  const [search, setSearch] = useState('');
  const [adjustingClient, setAdjustingClient] = useState<ClientRow | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustDirection, setAdjustDirection] = useState<'add' | 'remove'>('add');
  const [saving, setSaving] = useState(false);

  async function load() {
    const [profilesRes, bundlesRes, lotsRes, bookingsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'client').order('full_name'),
      supabase.from('client_bundle_subscriptions').select('*'),
      supabase.from('credit_lots').select('*').is('voided_at', null).gt('remaining', 0)
        .gt('expires_at', new Date().toISOString()).order('expires_at', { ascending: true }),
      supabase.from('dog_sitting_bookings').select('*, dog:dogs(*), client:profiles(*)')
        .order('scheduled_date', { ascending: false }).limit(30),
    ]);

    const bundleByClient = new Map<string, ClientBundleSubscription>();
    for (const b of (bundlesRes.data ?? [])) bundleByClient.set(b.client_id, b as ClientBundleSubscription);

    const lotsByClient = new Map<string, CreditLot[]>();
    for (const l of (lotsRes.data ?? [])) {
      const arr = lotsByClient.get(l.client_id) ?? [];
      arr.push(l as CreditLot);
      lotsByClient.set(l.client_id, arr);
    }

    const rows: ClientRow[] = (profilesRes.data ?? []).map(p => {
      const lots = lotsByClient.get(p.id) ?? [];
      return {
        ...p,
        bundle: bundleByClient.get(p.id) ?? null,
        totalCredits: lots.reduce((sum, l) => sum + l.remaining, 0),
        nextExpiry: lots[0]?.expires_at ?? null,
      };
    });

    // Show members (has/had a bundle) first, then everyone else
    rows.sort((a, b) => {
      if (!!a.bundle !== !!b.bundle) return a.bundle ? -1 : 1;
      return (a.full_name ?? '').localeCompare(b.full_name ?? '');
    });

    setClients(rows);
    setBookings((bookingsRes.data ?? []) as DogSittingBooking[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = search.trim()
    ? clients.filter(c => {
        const q = search.toLowerCase();
        return (c.full_name ?? '').toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      })
    : clients;

  const memberCount = clients.filter(c => c.bundle?.status === 'active').length;

  function openAdjust(client: ClientRow, direction: 'add' | 'remove') {
    setAdjustingClient(client);
    setAdjustDirection(direction);
    setAdjustAmount('');
    setAdjustReason('');
  }

  async function submitAdjustment() {
    if (!adjustingClient) return;
    const amount = parseInt(adjustAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      toast('Enter a valid credit amount.', 'error');
      return;
    }
    setSaving(true);

    if (adjustDirection === 'add') {
      const { error } = await supabase.from('credit_lots').insert({
        client_id: adjustingClient.id,
        amount,
        remaining: amount,
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        source: 'admin_adjustment',
        voided_reason: adjustReason || null,
      });
      if (error) {
        toast('Failed to add credits.', 'error');
      } else {
        toast(`Added ${amount} credit(s) for ${adjustingClient.full_name}.`, 'success');
      }
    } else {
      // Deduct FIFO from existing unexpired lots
      const { data: lotRows } = await supabase
        .from('credit_lots')
        .select('id, remaining')
        .eq('client_id', adjustingClient.id)
        .is('voided_at', null)
        .gt('remaining', 0)
        .order('expires_at', { ascending: true });

      let toDeduct = amount;
      for (const lot of (lotRows ?? [])) {
        if (toDeduct <= 0) break;
        const take = Math.min(lot.remaining, toDeduct);
        await supabase.from('credit_lots').update({ remaining: lot.remaining - take }).eq('id', lot.id);
        toDeduct -= take;
      }
      if (toDeduct > 0) {
        toast(`Removed ${amount - toDeduct} credit(s) — client only had that many available.`, 'info');
      } else {
        toast(`Removed ${amount} credit(s) for ${adjustingClient.full_name}.`, 'success');
      }
    }

    setSaving(false);
    setAdjustingClient(null);
    await load();
  }

  if (loading) return <LoadingSpinner className="min-h-screen" />;

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Memberships</h1>
        <div className="text-sm text-gray-500">{memberCount} active</div>
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name or email…"
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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        {filtered.map((client, i) => (
          <div
            key={client.id}
            className={`flex items-center gap-3 px-4 py-3.5 ${i < filtered.length - 1 ? 'border-b border-gray-50' : ''}`}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-semibold text-sm" style={{ backgroundColor: '#FFF5B8', color: '#B8860B' }}>
              {(client.full_name ?? client.email).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-[#1A1A1A] truncate">{client.full_name ?? '—'}</div>
              <div className="text-xs text-gray-500 truncate">{client.email}</div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {client.bundle ? (
                  <>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[client.bundle.status]}`}>
                      {BUNDLE_TIERS.find(t => t.id === client.bundle!.tier)?.label ?? client.bundle.tier} · {client.bundle.status}
                    </span>
                    {client.totalCredits > 0 && (
                      <span className="text-xs text-gray-400">{client.totalCredits} credits</span>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-gray-300">No membership</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => openAdjust(client, 'add')}
                title="Add credits"
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => openAdjust(client, 'remove')}
                title="Remove credits"
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <Minus size={14} />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Wallet size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500 font-medium text-sm">No clients match.</p>
          </div>
        )}
      </div>

      <h2 className="font-semibold text-sm text-[#1A1A1A] mb-3">Recent Dog Sitting Bookings</h2>
      {bookings.length === 0 ? (
        <p className="text-sm text-gray-400">No dog sitting bookings yet.</p>
      ) : (
        <div className="space-y-2">
          {bookings.map(b => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFF5B8' }}>
                <PawPrint size={13} style={{ color: '#B8860B' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#1A1A1A] truncate">
                  {(b as any).client?.full_name ?? 'Client'} · {b.dog?.name} · {b.visit_type === 'day' ? 'Day' : 'Overnight'}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {new Date(`${b.scheduled_date}T12:00:00`).toLocaleDateString()}
                  {b.credits_used > 0 && ` · ${b.credits_used} credit(s)`}
                  {b.cash_charged_cents > 0 && ` · $${(b.cash_charged_cents / 100).toFixed(2)}`}
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                b.payment_status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {b.payment_status === 'paid' ? 'Confirmed' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!adjustingClient}
        onClose={() => setAdjustingClient(null)}
        title={`${adjustDirection === 'add' ? 'Add' : 'Remove'} credits — ${adjustingClient?.full_name ?? ''}`}
        footer={
          <button
            onClick={submitAdjustment}
            disabled={saving}
            className="w-full py-3 rounded-xl text-[#1A1A1A] font-semibold disabled:opacity-60"
            style={{ backgroundColor: '#F2C94C' }}
          >
            {saving ? 'Saving…' : adjustDirection === 'add' ? 'Add Credits' : 'Remove Credits'}
          </button>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Number of credits</label>
            <input
              type="number"
              min="1"
              value={adjustAmount}
              onChange={e => setAdjustAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:border-forest-500"
            />
          </div>
          {adjustDirection === 'add' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Reason <span className="text-gray-400 font-normal">(optional, internal note)</span>
              </label>
              <input
                type="text"
                value={adjustReason}
                onChange={e => setAdjustReason(e.target.value)}
                placeholder="e.g. Missed walk goodwill credit"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:border-forest-500"
              />
              <p className="text-xs text-gray-400 mt-1.5">Added credits expire in 14 days, same as regular grants.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
