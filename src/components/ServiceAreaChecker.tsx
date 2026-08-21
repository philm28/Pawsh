import React, { useState } from "react";
import { supabase } from "../lib/supabase";

type CheckResult = {
  withinServiceArea: boolean;
  driveMinutes: number;
  distanceMiles: number;
  formattedAddress: string;
  outOfAreaFee: number | null;
};

interface ServiceAreaCheckerProps {
  /** Called when the address IS within the service area — e.g. to advance an intake form */
  onInService?: (result: CheckResult) => void;
  /** Slightly tighter layout for embedding inside a form step */
  compact?: boolean;
}

export default function ServiceAreaChecker({ onInService, compact = false }: ServiceAreaCheckerProps) {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);

  const [requestForm, setRequestForm] = useState({ fullName: "", email: "", phone: "" });
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setRequestSubmitted(false);

    const { data, error: fnError } = await supabase.functions.invoke("check-service-area", {
      body: { address },
    });

    setLoading(false);

    if (fnError || data?.error) {
      setError(data?.error || "Couldn't check that address. Please try again.");
      return;
    }

    setResult(data as CheckResult);
    if ((data as CheckResult).withinServiceArea) {
      onInService?.(data as CheckResult);
    }
  };

  const handleRequestAnyway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result) return;

    setRequestSubmitting(true);
    setError(null);

    const { error: fnError } = await supabase.functions.invoke("submit-out-of-area-request", {
      body: {
        ...requestForm,
        address: result.formattedAddress,
        driveMinutes: result.driveMinutes,
        distanceMiles: result.distanceMiles,
        outOfAreaFee: result.outOfAreaFee,
      },
    });

    setRequestSubmitting(false);

    if (fnError) {
      setError("Could not submit your request. Please try again or contact us directly.");
      return;
    }

    setRequestSubmitted(true);
  };

  return (
    <div className={compact ? "w-full max-w-md" : "w-full max-w-lg mx-auto"}>
      <form onSubmit={handleCheck} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter your address"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-yellow-400 px-5 py-2 font-semibold text-gray-900 hover:bg-yellow-500 disabled:opacity-60 transition-colors"
        >
          {loading ? "Checking..." : "Check Service Area"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {result && result.withinServiceArea && (
        <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="font-semibold text-green-800">You're in our service area! 🐾</p>
          <p className="text-sm text-green-700 mt-1">
            {result.formattedAddress} is about {result.driveMinutes} min from our home base.
          </p>
        </div>
      )}

      {result && !result.withinServiceArea && !requestSubmitted && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
          <p className="font-semibold text-amber-800">You're outside our standard service area</p>
          <p className="text-sm text-amber-700 mt-1">
            {result.formattedAddress} is about {result.driveMinutes} min from our home base
            (our standard area is 30 min or less). We can still come to you for a flat{" "}
            <strong>${result.outOfAreaFee} additional fee per visit</strong> — let us know and
            we'll follow up.
          </p>

          <form onSubmit={handleRequestAnyway} className="mt-3 space-y-2">
            <input
              type="text"
              placeholder="Full name"
              value={requestForm.fullName}
              onChange={(e) => setRequestForm((f) => ({ ...f, fullName: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={requestForm.email}
              onChange={(e) => setRequestForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            />
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={requestForm.phone}
              onChange={(e) => setRequestForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={requestSubmitting}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60 transition-colors"
            >
              {requestSubmitting ? "Submitting..." : "Request Service Anyway"}
            </button>
          </form>
        </div>
      )}

      {requestSubmitted && (
        <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="font-semibold text-blue-800">Thanks — we've got your request!</p>
          <p className="text-sm text-blue-700 mt-1">
            We'll reach out about availability and pricing for your area.
          </p>
        </div>
      )}
    </div>
  );
}
