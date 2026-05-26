"use client";

/**
 * RepriceModal — staff "reprice this order" action.
 *
 * Opens from StaffOrderCard when staff needs to adjust the price post-quote
 * (design complexity caught during production, larger than quoted, material
 * upgrade requested, customer add-on). Sends a customer email + mints a
 * Clover Pay Now link for the delta if positive.
 *
 * Refund leg (DECREASE) is informational only today — the customer is told
 * to expect a refund in 3-5 days, and staff processes the Clover refund
 * manually. Full refund-route automation is a follow-up.
 */

import { useState } from "react";

const REASONS = [
  { value: "DESIGN_COMPLEXITY",   label: "Design complexity higher than quoted" },
  { value: "LARGER_THAN_QUOTED",  label: "Larger than quoted" },
  { value: "MATERIAL_UPGRADE",    label: "Material upgrade" },
  { value: "ADD_ON",              label: "Customer add-on (rush / finishing)" },
  { value: "OTHER",               label: "Other (explain below)" },
] as const;

interface Props {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  currentTotal: number;
  onClose: () => void;
  onSuccess: (result: { new_total: number; delta: number; mode: string; pay_link_url: string | null }) => void;
}

export function RepriceModal(p: Props) {
  const [newTotal, setNewTotal] = useState(p.currentTotal.toFixed(2));
  const [reason, setReason] = useState<string>("DESIGN_COMPLEXITY");
  const [explanation, setExplanation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const newTotalNum = Number(newTotal);
  const delta = Number.isFinite(newTotalNum) ? Math.round((newTotalNum - p.currentTotal) * 100) / 100 : 0;
  const mode = delta > 0.01 ? "INCREASE" : delta < -0.01 ? "DECREASE" : "NO_CHANGE";
  const valid = Number.isFinite(newTotalNum) && newTotalNum > 0 && (reason !== "OTHER" || explanation.trim().length > 0);

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/staff/orders/${p.orderId}/reprice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_total: newTotalNum,
          reason,
          explanation: explanation.trim() || undefined,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; new_total?: number; delta?: number; mode?: string; pay_link_url?: string | null };
      if (!res.ok || !json.ok) {
        setError(json.error ?? `HTTP ${res.status}`);
        setSubmitting(false);
        return;
      }
      p.onSuccess({
        new_total: json.new_total ?? newTotalNum,
        delta: json.delta ?? delta,
        mode: json.mode ?? mode,
        pay_link_url: json.pay_link_url ?? null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={p.onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Reprice order {p.orderNumber}</h2>
        <p className="text-xs text-gray-500 mb-4">{p.customerName} · {p.customerEmail}</p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Original total</label>
            <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm font-mono text-gray-700">${p.currentTotal.toFixed(2)}</div>
          </div>

          <div>
            <label htmlFor="rp-new-total" className="block text-xs font-semibold text-gray-600 mb-1">Updated total ($)</label>
            <input
              id="rp-new-total"
              type="number"
              step="0.01"
              min="0"
              value={newTotal}
              onChange={(e) => setNewTotal(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {mode !== "NO_CHANGE" && (
            <div className={`px-3 py-2 rounded-lg border text-sm ${mode === "INCREASE" ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-emerald-50 border-emerald-200 text-emerald-900"}`}>
              {mode === "INCREASE"
                ? <>Customer will owe <strong>${delta.toFixed(2)}</strong> &mdash; a Pay Now link will be emailed.</>
                : <>Customer will be refunded <strong>${Math.abs(delta).toFixed(2)}</strong> &mdash; <span className="text-emerald-700">process refund in Clover manually after sending.</span></>}
            </div>
          )}

          <div>
            <label htmlFor="rp-reason" className="block text-xs font-semibold text-gray-600 mb-1">Reason</label>
            <select
              id="rp-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="rp-explanation" className="block text-xs font-semibold text-gray-600 mb-1">
              Explanation{reason === "OTHER" && <span className="text-red-600"> *</span>}
            </label>
            <textarea
              id="rp-explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={3}
              placeholder={reason === "OTHER" ? "Required for 'Other' — explain why" : "Optional context for the customer"}
              maxLength={500}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-gray-400 mt-0.5">{explanation.length}/500</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-between gap-2 mt-5">
          <button
            onClick={p.onClose}
            disabled={submitting}
            className="text-sm px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          {confirming ? (
            <button
              onClick={submit}
              disabled={!valid || submitting}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              {submitting ? "Sending…" : `Yes — email customer ${mode === "INCREASE" ? "& Pay Now link" : mode === "DECREASE" ? "+ refund notice" : ""}`}
            </button>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              disabled={!valid}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              Review &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
