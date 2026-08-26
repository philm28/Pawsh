import { useState, useMemo } from 'react';
import { supabase, callEdgeFunction } from '../../lib/supabase';

interface DayEntry {
  date: string; // yyyy-mm-dd
  visitCount: 3 | 4;
}

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function buildDayRange(start: string, end: string): string[] {
  if (!start || !end) return [];
  const days: string[] = [];
  const cur = new Date(start);
  const last = new Date(end);
  while (cur <= last) {
    days.push(toISODate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export default function StayBooking() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dayEntries, setDayEntries] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dayCount = useMemo(() => buildDayRange(startDate, endDate).length, [startDate, endDate]);
  const isValidRange = dayCount >= 3;

  function handleDateChange(newStart: string, newEnd: string) {
    setError(null);
    setStartDate(newStart);
    setEndDate(newEnd);
    const range = buildDayRange(newStart, newEnd);
    setDayEntries(range.map((date) => ({ date, visitCount: 3 })));
  }

  function toggleFourthVisit(date: string) {
    setDayEntries((prev) =>
      prev.map((d) => (d.date === date ? { ...d, visitCount: d.visitCount === 4 ? 3 : 4 } : d)),
    );
  }

  const totalPrice = dayEntries.reduce((sum, d) => sum + (d.visitCount === 4 ? 125 : 100), 0);
  const depositAmount = Math.round(totalPrice * 0.25 * 100) / 100;

  async function handleBookStay() {
    setError(null);

    if (!isValidRange) {
      setError('Extended stays require a minimum of 3 days.');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be signed in to book a stay.');
        setLoading(false);
        return;
      }

      const day_visit_counts: Record<string, number> = {};
      dayEntries.forEach((d) => {
        day_visit_counts[d.date] = d.visitCount;
      });

      const result = await callEdgeFunction('create-stay-deposit', {
        client_id: user.id,
        start_date: startDate,
        end_date: endDate,
        day_visit_counts,
        success_url: `${window.location.origin}/client/stays?booking=success`,
        cancel_url: `${window.location.origin}/client/stays?booking=cancelled`,
      });

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Redirect to Stripe Checkout — same pattern as your existing walk-pack checkout flow
      window.location.href = result.checkout_url;
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong booking your stay.');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl mb-2">Book an Extended Stay</h1>
      <p className="text-gray-600 mb-6">
        Extended stays require a minimum of 3 days. A 25% deposit locks in your dates today —
        the remaining balance is collected separately before your stay begins.
        <span className="block mt-2 text-sm text-amber-700">
          Deposits become non-refundable if you cancel within 7 days of your stay's start date.
        </span>
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <label className="flex flex-col">
          <span className="text-sm font-medium mb-1">Start date</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleDateChange(e.target.value, endDate)}
            className="border rounded-lg px-3 py-2"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-sm font-medium mb-1">End date</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleDateChange(startDate, e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
        </label>
      </div>

      {startDate && endDate && !isValidRange && (
        <p className="text-red-600 text-sm mb-4">
          That's only {dayCount} day{dayCount === 1 ? '' : 's'} — extended stays need at least 3.
        </p>
      )}

      {isValidRange && (
        <div className="mb-6">
          <h2 className="font-medium mb-3">Daily visits</h2>
          <p className="text-sm text-gray-500 mb-3">
            Each day includes up to 3 visits at $100. Add a 4th visit for any day that needs it (+$25).
          </p>
          <div className="space-y-2">
            {dayEntries.map((d) => (
              <div key={d.date} className="flex items-center justify-between border rounded-lg px-4 py-3">
                <span>{new Date(d.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={d.visitCount === 4}
                    onChange={() => toggleFourthVisit(d.date)}
                  />
                  Add 4th visit (+$25)
                </label>
                <span className="font-medium">${d.visitCount === 4 ? 125 : 100}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isValidRange && (
        <div className="bg-amber-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span>Total stay cost</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Deposit due today (25%)</span>
            <span>${depositAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Remaining balance (collected later)</span>
            <span>${(totalPrice - depositAmount).toFixed(2)}</span>
          </div>
        </div>
      )}

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <button
        onClick={handleBookStay}
        disabled={!isValidRange || loading}
        className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white font-medium rounded-lg py-3"
      >
        {loading ? 'Redirecting to checkout…' : `Pay deposit & lock in dates`}
      </button>
    </div>
  );
}
