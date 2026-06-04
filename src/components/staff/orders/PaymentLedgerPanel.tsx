"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  DerivedPaymentStatus,
  OrderPaymentLedgerEntry,
  OrderPaymentMethod,
  OrderPaymentSummary,
} from "@/lib/payments/order-ledger";

interface LedgerRow extends OrderPaymentLedgerEntry {
  id?: string;
  waveRecordedAt?: string | null;
  recordedAt?: string | null;
  notes?: string | null;
}

interface LedgerResponse {
  ok: true;
  order: { id: string; orderNumber: string; status: string; total: number };
  payments: LedgerRow[];
  summary: OrderPaymentSummary;
}

interface Props {
  orderId: string;
  orderNumber: string;
  orderTotal: number;
}

const METHOD_OPTIONS: Array<{ value: OrderPaymentMethod; label: string }> = [
  { value: "etransfer", label: "Interac e-Transfer" },
  { value: "clover", label: "Clover (card)" },
  { value: "cash", label: "Cash" },
  { value: "wave", label: "Wave (other)" },
  { value: "other", label: "Other" },
];

function fmtUSD(n: number): string {
  return `$${n.toFixed(2)}`;
}

function StatusChip({ status }: { status: DerivedPaymentStatus }) {
  const styles: Record<DerivedPaymentStatus, string> = {
    unpaid: "bg-gray-100 text-gray-700 border-gray-200",
    partial: "bg-amber-50 text-amber-800 border-amber-200",
    paid: "bg-emerald-50 text-emerald-800 border-emerald-200",
    overpaid: "bg-rose-50 text-rose-800 border-rose-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${styles[status]}`}>
      {status.toUpperCase()}
    </span>
  );
}

export function PaymentLedgerPanel({ orderId, orderNumber, orderTotal }: Props) {
  const [data, setData] = useState<LedgerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<OrderPaymentMethod>("etransfer");
  const [payerName, setPayerName] = useState("");
  const [payerCompany, setPayerCompany] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [externalReference, setExternalReference] = useState("");
  const [notes, setNotes] = useState("");

  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [recordError, setRecordError] = useState<string | null>(null);

  // ── Send payment link state ──────────────────────────────────────────────
  // Distinct from "Record payment" (which logs money that already arrived).
  // This emails a Clover Pay Now link for a specific amount to a specific
  // payer — the split / partial-payment workhorse.
  const [linkFormOpen, setLinkFormOpen] = useState(false);
  const [linkSubmitting, setLinkSubmitting] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<{ email: string; amount: number } | null>(null);
  const [linkAmount, setLinkAmount] = useState<string>("");
  const [linkPayerName, setLinkPayerName] = useState("");
  const [linkPayerCompany, setLinkPayerCompany] = useState("");
  const [linkPayerEmail, setLinkPayerEmail] = useState("");
  const [linkNotes, setLinkNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/orders/${orderId}/payments`);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: "Failed to load" }));
        throw new Error(errBody.error ?? `HTTP ${res.status}`);
      }
      const body = (await res.json()) as LedgerResponse;
      setData(body);
      if (body.summary.balanceDue > 0) {
        setAmount(body.summary.balanceDue.toFixed(2));
        setLinkAmount(body.summary.balanceDue.toFixed(2));
      } else {
        setAmount("");
        setLinkAmount("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payment ledger");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { void load(); }, [load]);

  const resetForm = () => {
    setPayerName("");
    setPayerCompany("");
    setPayerEmail("");
    setExternalReference("");
    setNotes("");
    setSubmitError(null);
  };

  const submitPayment = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/staff/orders/${orderId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          method,
          payer: {
            name: payerName.trim() || null,
            company: payerCompany.trim() || null,
            email: payerEmail.trim() || null,
          },
          externalReference: externalReference.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      resetForm();
      setFormOpen(false);
      await load();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  // Send a Clover Pay Now link for `linkAmount` to `linkPayerEmail`. The server
  // generates a fresh HMAC token, sends a paymentRequest email customised for
  // this payer, and writes an audit row. Staff manually records the payment
  // when it lands via the Record payment form (webhook auto-attribution is a
  // follow-up).
  const submitPaymentLink = async () => {
    setLinkSubmitting(true);
    setLinkError(null);
    setLinkSuccess(null);
    try {
      const res = await fetch(`/api/staff/orders/${orderId}/send-payment-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(linkAmount),
          payer: {
            name: linkPayerName.trim() || null,
            email: linkPayerEmail.trim() || null,
            company: linkPayerCompany.trim() || null,
          },
          notes: linkNotes.trim() || null,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      setLinkSuccess({ email: body.sentTo, amount: body.amount });
      // Reset name fields but keep the form open so staff can send a second
      // link to a different payer immediately (the split-payment workflow).
      setLinkPayerName("");
      setLinkPayerCompany("");
      setLinkPayerEmail("");
      setLinkNotes("");
      // Decrement the suggested amount to whatever's left after this link.
      if (data?.summary?.balanceDue) {
        const remaining = Math.max(0, data.summary.balanceDue - Number(linkAmount));
        setLinkAmount(remaining > 0 ? remaining.toFixed(2) : "");
      }
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : "Failed to send payment link");
    } finally {
      setLinkSubmitting(false);
    }
  };

  const splitInHalf = () => {
    if (!data?.summary?.balanceDue) return;
    const half = Math.round(data.summary.balanceDue * 50) / 100; // round to cents
    setLinkAmount(half.toFixed(2));
  };

  const recordToWave = async (paymentId: string) => {
    setRecordingId(paymentId);
    setRecordError(null);
    try {
      const res = await fetch(`/api/staff/orders/${orderId}/payments/${paymentId}/record-wave`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      await load();
    } catch (err) {
      setRecordError(err instanceof Error ? err.message : "Failed to record in Wave");
    } finally {
      setRecordingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Payment Ledger</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Order {orderNumber} · Total {fmtUSD(orderTotal)}</p>
        </div>
        {data?.summary && <StatusChip status={data.summary.status} />}
      </div>

      {loading && <p className="text-xs text-gray-400">Loading payment history...</p>}

      {error && (
        <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-2.5 py-1.5">
          {error}
        </p>
      )}

      {data && !loading && (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Paid</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{fmtUSD(data.summary.amountPaid)}</p>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Balance Due</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{fmtUSD(data.summary.balanceDue)}</p>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Entries</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{data.summary.countedPayments}</p>
            </div>
          </div>

          {data.summary.status === "overpaid" && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">
              Overpaid by {fmtUSD(data.summary.overpaidAmount)} — staff review required before refund or void.
            </div>
          )}

          {/* Payment rows */}
          {data.payments.length === 0 ? (
            <p className="text-xs text-gray-400 italic mb-4">No payments recorded yet.</p>
          ) : (
            <div className="mb-4 border border-gray-100 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold">Amount</th>
                    <th className="text-left px-3 py-2 font-semibold">Method</th>
                    <th className="text-left px-3 py-2 font-semibold">Payer</th>
                    <th className="text-left px-3 py-2 font-semibold">Recorded</th>
                    <th className="text-left px-3 py-2 font-semibold">Wave</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((p) => {
                    const recordedDate = p.recordedAt ? new Date(p.recordedAt).toLocaleDateString() : "—";
                    const waveSynced = Boolean(p.waveRecordedAt);
                    const isVoided = p.status === "voided" || p.status === "refunded";
                    return (
                      <tr key={p.id} className={`border-t border-gray-100 ${isVoided ? "opacity-50" : ""}`}>
                        <td className="px-3 py-2 font-medium text-gray-800">{fmtUSD(p.amount)}</td>
                        <td className="px-3 py-2 text-gray-600 uppercase text-[10px]">{p.method}</td>
                        <td className="px-3 py-2 text-gray-600">
                          {p.payer?.company || p.payer?.name || p.payer?.email || "—"}
                        </td>
                        <td className="px-3 py-2 text-gray-500">{recordedDate}</td>
                        <td className="px-3 py-2">
                          {isVoided ? (
                            <span className="text-[10px] text-gray-400">{p.status}</span>
                          ) : waveSynced ? (
                            <span className="text-[10px] text-emerald-700 font-semibold">Synced</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => p.id && void recordToWave(p.id)}
                              disabled={recordingId === p.id || !p.id}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                              {recordingId === p.id ? "Recording..." : "Record to Wave"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {recordError && (
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-2.5 py-1.5 mb-3">
              {recordError}
            </p>
          )}

          {/* Action row — two buttons explain the difference in plain English */}
          {!formOpen && !linkFormOpen && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setFormOpen(true); setLinkSuccess(null); }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  + Record payment
                </button>
                <span className="text-[10px] text-gray-400">money already received (e-transfer, cash, manual Wave)</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setLinkFormOpen(true); setLinkSuccess(null); }}
                  disabled={(data?.summary?.balanceDue ?? 0) <= 0.01}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-[#16C2F3] text-white hover:bg-[#0fb0dd] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  📨 Send payment link
                </button>
                <span className="text-[10px] text-gray-400">email a Clover Pay Now link to a specific person for a specific amount (use this to split between payers)</span>
              </div>
              {linkSuccess && (
                <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-1.5">
                  ✓ Payment link for {fmtUSD(linkSuccess.amount)} sent to <span className="font-mono">{linkSuccess.email}</span>
                </p>
              )}
            </div>
          )}

          {formOpen && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2.5">
              <p className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider">New payment</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] uppercase text-gray-500 font-semibold">Amount (CAD)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-0.5 w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase text-gray-500 font-semibold">Method</span>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as OrderPaymentMethod)}
                    className="mt-0.5 w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {METHOD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <label className="block">
                  <span className="text-[10px] uppercase text-gray-500 font-semibold">Payer name</span>
                  <input
                    type="text"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    className="mt-0.5 w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase text-gray-500 font-semibold">Company</span>
                  <input
                    type="text"
                    value={payerCompany}
                    onChange={(e) => setPayerCompany(e.target.value)}
                    className="mt-0.5 w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase text-gray-500 font-semibold">Email</span>
                  <input
                    type="email"
                    value={payerEmail}
                    onChange={(e) => setPayerEmail(e.target.value)}
                    className="mt-0.5 w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </label>
              </div>
              <p className="text-[10px] text-gray-500">
                At least one of name / company / email is required.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] uppercase text-gray-500 font-semibold">External ref (optional)</span>
                  <input
                    type="text"
                    value={externalReference}
                    onChange={(e) => setExternalReference(e.target.value)}
                    placeholder="e-transfer code, cheque #, etc."
                    className="mt-0.5 w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase text-gray-500 font-semibold">Notes (optional)</span>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-0.5 w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </label>
              </div>

              {submitError && (
                <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-2.5 py-1.5">
                  {submitError}
                </p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => void submitPayment()}
                  disabled={submitting || !amount || Number(amount) <= 0}
                  className="text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Recording..." : "Record"}
                </button>
                <button
                  type="button"
                  onClick={() => { setFormOpen(false); resetForm(); }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Send payment link form — emails a Clover Pay Now link for a
              specific amount to a specific payer. Use this to split an invoice
              across multiple payers (each gets their own link). */}
          {linkFormOpen && (
            <div className="rounded-lg border border-[#16C2F3]/30 bg-cyan-50/40 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-cyan-900 uppercase tracking-wider">📨 Send payment link</p>
                {(data?.summary?.balanceDue ?? 0) > 0.01 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setLinkAmount((data?.summary?.balanceDue ?? 0).toFixed(2))}
                      className="text-[10px] font-semibold text-cyan-700 hover:text-cyan-900 underline underline-offset-2"
                    >
                      Use full balance ({fmtUSD(data?.summary?.balanceDue ?? 0)})
                    </button>
                    <span className="text-[10px] text-gray-300">·</span>
                    <button
                      type="button"
                      onClick={splitInHalf}
                      className="text-[10px] font-semibold text-cyan-700 hover:text-cyan-900 underline underline-offset-2"
                    >
                      Split in half ({fmtUSD((data?.summary?.balanceDue ?? 0) / 2)})
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <label className="block">
                  <span className="text-[10px] uppercase text-gray-500 font-semibold">Amount (CAD)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={linkAmount}
                    onChange={(e) => setLinkAmount(e.target.value)}
                    className="mt-0.5 w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </label>
                <label className="block col-span-2">
                  <span className="text-[10px] uppercase text-gray-500 font-semibold">Send to (email) *</span>
                  <input
                    type="email"
                    value={linkPayerEmail}
                    onChange={(e) => setLinkPayerEmail(e.target.value)}
                    placeholder="payer@company.com"
                    className="mt-0.5 w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] uppercase text-gray-500 font-semibold">Payer name</span>
                  <input
                    type="text"
                    value={linkPayerName}
                    onChange={(e) => setLinkPayerName(e.target.value)}
                    placeholder="Jane Doe"
                    className="mt-0.5 w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase text-gray-500 font-semibold">Company</span>
                  <input
                    type="text"
                    value={linkPayerCompany}
                    onChange={(e) => setLinkPayerCompany(e.target.value)}
                    placeholder="ACME Corp"
                    className="mt-0.5 w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </label>
              </div>
              <p className="text-[10px] text-gray-500">Provide the payer&apos;s name OR company (one is required).</p>

              <label className="block">
                <span className="text-[10px] uppercase text-gray-500 font-semibold">Message in the email (optional)</span>
                <input
                  type="text"
                  value={linkNotes}
                  onChange={(e) => setLinkNotes(e.target.value)}
                  placeholder="E.g. Your half of order TC-2026-0123 — thanks for sponsoring this run."
                  maxLength={500}
                  className="mt-0.5 w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </label>

              {linkError && (
                <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-2.5 py-1.5">
                  {linkError}
                </p>
              )}

              {linkSuccess && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-1.5">
                  ✓ Sent {fmtUSD(linkSuccess.amount)} link to <span className="font-mono">{linkSuccess.email}</span>. Add another payer below, or close the form.
                </p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => void submitPaymentLink()}
                  disabled={
                    linkSubmitting
                      || !linkAmount
                      || Number(linkAmount) <= 0
                      || !linkPayerEmail
                      || (!linkPayerName && !linkPayerCompany)
                  }
                  className="text-xs font-semibold px-3 py-1.5 rounded-md bg-[#16C2F3] text-white hover:bg-[#0fb0dd] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {linkSubmitting ? "Sending..." : "Send link"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLinkFormOpen(false);
                    setLinkError(null);
                    setLinkPayerName("");
                    setLinkPayerCompany("");
                    setLinkPayerEmail("");
                    setLinkNotes("");
                  }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
