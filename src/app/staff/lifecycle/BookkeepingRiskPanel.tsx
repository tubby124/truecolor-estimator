/**
 * BookkeepingRiskPanel — surface every silent-fail surface from the audit.
 *
 * These are the orders where Wave / Clover / Supabase have drifted from each
 * other in ways that produce no error and no Telegram alert — they only show
 * up as missing dollars when someone reconciles.
 *
 * Categories (each shown as a sub-section if non-empty):
 *   - NO_WAVE_INVOICE     : paid order with NULL wave_invoice_id (Wave outage at create time)
 *   - HALF_RECORDED       : Wave approved but wave_payment_recorded_at NULL (the 2026-05-22 bug class)
 *   - NULL_PAYMENT_REF    : clover_card order with NULL payment_reference (Clover webhook can't match)
 *   - INVOICE_NUMBER_HOLE : wave_invoice_id set without wave_invoice_number, or vice versa
 *   - SLA_VIOLATION       : pending_payment > 72h (cron payment-followup should have caught it)
 */

import Link from "next/link";

export type BookkeepingRiskCategory =
  | "no_wave_invoice"
  | "half_recorded"
  | "null_payment_ref"
  | "invoice_number_hole"
  | "sla_violation";

export interface BookkeepingRiskRow {
  id: string;
  order_number: string;
  customer_name: string;
  status: string;
  payment_method: string;
  total: number;
  age_hours: number;
  category: BookkeepingRiskCategory;
  diagnosis: string;
  remediation: string;
}

const CATEGORY_LABEL: Record<BookkeepingRiskCategory, { label: string; tone: string; severity: number }> = {
  no_wave_invoice:     { label: "No Wave invoice",       tone: "bg-red-100 text-red-800",       severity: 1 },
  half_recorded:       { label: "Wave half-recorded",    tone: "bg-red-100 text-red-800",       severity: 1 },
  null_payment_ref:    { label: "NULL payment_reference", tone: "bg-amber-100 text-amber-800", severity: 2 },
  invoice_number_hole: { label: "Invoice number hole",    tone: "bg-amber-100 text-amber-800", severity: 3 },
  sla_violation:       { label: "Pending > 72h",         tone: "bg-amber-100 text-amber-800",  severity: 2 },
};

function fmtAge(hours: number): string {
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

export function BookkeepingRiskPanel({ rows }: { rows: BookkeepingRiskRow[] }) {
  if (rows.length === 0) {
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Bookkeeping risk</h2>
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">clean — no silent desyncs</span>
        </div>
      </section>
    );
  }

  // Group by category for severity sorting
  rows.sort((a, b) => CATEGORY_LABEL[a.category].severity - CATEGORY_LABEL[b.category].severity);
  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Bookkeeping risk — {rows.length} order{rows.length !== 1 ? "s" : ""} need attention
        </h2>
        <div className="flex flex-wrap items-center gap-1.5">
          {Object.entries(counts).map(([cat, n]) => (
            <span key={cat} className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${CATEGORY_LABEL[cat as BookkeepingRiskCategory].tone}`}>
              {CATEGORY_LABEL[cat as BookkeepingRiskCategory].label} · {n}
            </span>
          ))}
        </div>
      </div>
      <div className="bg-white border border-red-200 rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-red-50/40 text-gray-700 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Order</th>
              <th className="px-3 py-2 text-left font-semibold">Customer</th>
              <th className="px-3 py-2 text-right font-semibold">Total</th>
              <th className="px-3 py-2 text-left font-semibold">Issue</th>
              <th className="px-3 py-2 text-left font-semibold">Diagnosis</th>
              <th className="px-3 py-2 text-left font-semibold">Fix</th>
              <th className="px-3 py-2 text-right font-semibold">Age</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => {
              const c = CATEGORY_LABEL[r.category];
              return (
                <tr key={`${r.id}-${r.category}`} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                    <Link href={`/staff/orders?focus=${r.id}`} className="text-blue-700 hover:underline">{r.order_number}</Link>
                    <div className="text-[10px] text-gray-500 mt-0.5">{r.status} · {r.payment_method}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700 truncate max-w-[160px]">{r.customer_name}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-gray-800">${r.total.toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${c.tone}`}>{c.label}</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700 max-w-[260px]">{r.diagnosis}</td>
                  <td className="px-3 py-2 text-xs text-gray-700 max-w-[280px]">{r.remediation}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-gray-600">{fmtAge(r.age_hours)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
