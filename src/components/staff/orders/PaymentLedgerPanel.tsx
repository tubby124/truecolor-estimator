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
      } else {
        setAmount("");
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

          {/* Record payment toggle / form */}
          {!formOpen ? (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              + Record payment
            </button>
          ) : (
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
        </>
      )}
    </div>
  );
}
