import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

type Prediction = { description: string; placeId: string };

type CheckResult = {
  withinServiceArea: boolean;
  driveMinutes: number;
  distanceMiles: number;
  formattedAddress: string;
  outOfAreaFee: number | null;
};

interface ServiceAreaCheckerProps {
  onInService?: (result: CheckResult) => void;
  compact?: boolean;
}

function newSessionToken() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export default function ServiceAreaChecker({ onInService, compact = false }: ServiceAreaCheckerProps) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  const [selected, setSelected] = useState<Prediction | null>(null);
  const sessionTokenRef = useRef(newSessionToken());

  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);

  const [requestForm, setRequestForm] = useState({ fullName: "", email: "", phone: "" });
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (selected && query === selected.description) return;
    if (query.trim().length < 3) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    setPredictionsLoading(true);
    const timeout = setTimeout(async () => {
      const { data } = await supabase.functions.invoke("address-autocomplete", {
        body: { input: query, sessionToken: sessionTokenRef.current },
      });
      setPredictionsLoading(false);
      setPredictions(data?.predictions ?? []);
      setShowDropdown(true);
    }, 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleSelectPrediction = (p: Prediction) => {
    setSelected(p);
    setQuery(p.description);
    setShowDropdown(false);
    setPredictions([]);
    setResult(null);
    setError(null);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (selected && value !== selected.description) {
      setSelected(null);
      setResult(null);
    }
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    setChecking(true);
    setError(null);
    setResult(null);
    setRequestSubmitted(false);

    const { data, error: fnError } = await supabase.functions.invoke("check-service-area", {
      body: { placeId: selected.placeId },
    });

    setChecking(false);
    sessionTokenRef.current = newSessionToken();

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

    const { data, error: fnError } = await supabase.functions.invoke("submit-out-of-area-request", {
      body: {
        ...requestForm,
        address: result.formattedAddress,
        driveMinutes: result.driveMinutes,
        distanceMiles: result.distanceMiles,
        outOfAreaFee: result.outOfAreaFee,
      },
    });

    setRequestSubmitting(false);

    if (fnError || data?.error) {
      setError(data?.error || "Could not submit your request. Please try again or contact us directly.");
      return;
    }

    setRequestSubmitted(true);
  };

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/40 focus:border-yellow-400 transition-all";

  return (
    <div ref={containerRef} className={compact ? "w-full max-w-md" : "w-full max-w-lg mx-auto"}>
      <form onSubmit={handleCheck}>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Your address</label>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => predictions.length > 0 && setShowDropdown(true)}
            placeholder="Start typing your address…"
            className={inputClass}
            autoComplete="off"
            required
          />

          {showDropdown && (predictionsLoading || predictions.length > 0) && (
            <div className="absolute z-10 mt-1.5 w-full bg-white rounded-xl border border-gray-200 shadow-lg max-h-64 overflow-auto">
              {predictionsLoading && (
                <div className="px-4 py-3 text-sm text-gray-400">Searching…</div>
              )}
              {!predictionsLoading && predictions.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-400">No matching addresses</div>
              )}
              {!predictionsLoading &&
                predictions.map((p) => (
                  <button
                    key={p.placeId}
                    type="button"
                    onClick={() => handleSelectPrediction(p)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[#FBF1D9] transition-colors"
                  >
                    {p.description}
                  </button>
                ))}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1.5">Select your address from the list to continue.</p>

        <button
          type="submit"
          disabled={!selected || checking}
          className="mt-3 w-full rounded-xl px-5 py-2.5 font-semibold text-[#2B2620] disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#E8CB80" }}
        >
          {checking ? "Checking…" : "Check Service Area"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {result && result.withinServiceArea && (
        <div className="mt-4 rounded-xl bg-green-50 border border-green-200 p-4">
          <p className="font-semibold text-green-800">You're in our service area! 🐾</p>
          <p className="text-sm text-green-700 mt-1">
            {result.formattedAddress} is about {result.driveMinutes} min from our home base.
          </p>
        </div>
      )}

      {result && !result.withinServiceArea && !requestSubmitted && (
        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
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
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={requestForm.email}
              onChange={(e) => setRequestForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
              required
            />
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={requestForm.phone}
              onChange={(e) => setRequestForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={requestSubmitting}
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60 transition-colors"
            >
              {requestSubmitting ? "Submitting…" : "Request Service Anyway"}
            </button>
          </form>
        </div>
      )}

      {requestSubmitted && (
        <div className="mt-4 rounded-xl bg-blue-50 border border-blue-200 p-4">
          <p className="font-semibold text-blue-800">Thanks — we've got your request!</p>
          <p className="text-sm text-blue-700 mt-1">
            We'll reach out about availability and pricing for your area.
          </p>
        </div>
      )}
    </div>
  );
}
