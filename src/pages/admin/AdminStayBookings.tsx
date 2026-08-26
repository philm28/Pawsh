import { useEffect, useState } from 'react';
import { supabase, callEdgeFunction } from '../../lib/supabase';
import { StayBooking } from '../../lib/types';

const STATUS_LABELS: Record<StayBooking['status'], { label: string; color: string }> = {
  pending_deposit: { label: 'Awaiting deposit', color: 'bg-gray-100 text-gray-600' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700' },
  cancelled_refundable: { label: 'Cancelled (refunded)', color: 'bg-gray-100 text-gray-500' },
  cancelled_nonrefundable: { label: 'Cancelled (deposit kept)', color: 'bg-red-100 text-red-600' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
};

export default function AdminStayBookings() {
  const [bookings, setBookings] = useState<StayBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [chargingId, setChargingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadBookings() {
    setLoading(true);
    const { data, error } = await supabase
      .from('stay_bookings')
      .select('*, client:profiles!stay_bookings_client_id_fkey(id, full_name, email, phone)')
      .order('start_date', { ascending: true });
    if (!error && data) setBookings(data as unknown as StayBooking[]);
    setLoading(false);
  }

  useEffect(() => {
    loadBookings();
  }, []);

  async function handleChargeBalance(bookingId: string) {
    setActionError(null);
    setChargingId(bookingId);
    try {
      const response = await callEdgeFunction('charge-stay-balance', { booking_id: bookingId });
      const result = await response.json();
      if (result.error) {
        setActionError(result.error);
      } else {
        await loadBookings();
      }
    } catch (err: any) {
      setActionError(err.message ?? 'Failed to charge balance.');
    } finally {
      setChargingId(null);
    }
  }

  if (loading) {
    return <div className="p-6 text-gray-500">Loading extended stay bookings…</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="font-serif text-2xl mb-6">Extended Stay Bookings</h1>

      {actionError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {actionError}
        </div>
      )}

      {bookings.length === 0 ? (
        <p className="text-gray-500">No extended stay bookings yet.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const balance = booking.total_price - booking.deposit_amount;
            const canChargeBalance = booking.deposit_paid && !booking.balance_charged && balance > 0;
            const status = STATUS_LABELS[booking.status];

            return (
              <div key={booking.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium">
                      {booking.client?.full_name ?? 'Unknown client'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(booking.start_date).toLocaleDateString()} –{' '}
                      {new Date(booking.end_date).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <div className="text-gray-500">Total</div>
                    <div className="font-medium">${booking.total_price.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Deposit {booking.deposit_paid ? '(paid)' : '(pending)'}</div>
                    <div className="font-medium">${booking.deposit_amount.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Balance {booking.balance_charged ? '(charged)' : ''}</div>
                    <div className="font-medium">
                      ${booking.balance_charged ? (booking.balance_amount ?? 0).toFixed(2) : balance.toFixed(2)}
                    </div>
                  </div>
                </div>

                {canChargeBalance && (
                  <button
                    onClick={() => handleChargeBalance(booking.id)}
                    disabled={chargingId === booking.id}
                    className="text-sm bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white font-medium rounded-lg px-4 py-2"
                  >
                    {chargingId === booking.id ? 'Charging…' : `Charge remaining balance ($${balance.toFixed(2)})`}
                  </button>
                )}

                {booking.status === 'pending_deposit' && (
                  <p className="text-sm text-gray-400">Waiting on client to complete deposit checkout.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
