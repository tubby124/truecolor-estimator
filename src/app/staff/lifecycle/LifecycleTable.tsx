/**
 * LifecycleTable — per-order green/red lifecycle grid.
 * Server-rendered (no useState); upgrade to client later if filters needed.
 */

export interface LifecycleRow {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: string;
  payment_method: string;
  total: number;
  is_rush: boolean;
  wave_invoice_id: string | null;
  wave_paid: boolean;
  created_at: string;
  age_hours: number;
  stuck_pending_payment: boolean;
  emails: {
    customer_confirm: boolean;
    pay_link: boolean;
    receipt: boolean;
    proof: boolean;
    review: boolean;
    staff_notif: boolean;
  };
}

function Pip({
  ok,
  label,
  muted,
}: {
  ok: boolean;
  label: string;
  muted?: boolean;
}) {
  if (muted) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-300 text-xs" title={`${label}: n/a`}>
        ·
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
        ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
      }`}
      title={`${label}: ${ok ? "yes" : "no"}`}
    >
      {ok ? "✓" : "✗"}
    </span>
  );
}

function fmtAge(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

function fmtCurrency(n: number): string {
  return n.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function statusBadge(status: string, stuck: boolean): React.ReactNode {
  const base = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium";
  if (stuck) {
    return (
      <span className={`${base} bg-red-100 text-red-800 ring-1 ring-red-200`}>
        {status} · stuck
      </span>
    );
  }
  const tone =
    status === "pending_payment"
      ? "bg-amber-100 text-amber-800"
      : status === "paid" || status === "in_production"
      ? "bg-emerald-100 text-emerald-800"
      : status === "ready_for_pickup" || status === "completed"
      ? "bg-blue-100 text-blue-800"
      : status === "cancelled"
      ? "bg-gray-200 text-gray-700"
      : "bg-gray-100 text-gray-700";
  return <span className={`${base} ${tone}`}>{status}</span>;
}

export function LifecycleTable({ rows }: { rows: LifecycleRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
        <p className="text-gray-600 font-medium">No orders in the last 7 days</p>
        <p className="text-gray-400 text-sm mt-1">Quiet week, or the window cut you off — check /staff/orders for full history.</p>
      </div>
    );
  }

  // Summary counts (top-line health)
  const totals = {
    orders: rows.length,
    stuck: rows.filter((r) => r.stuck_pending_payment).length,
    wave_drafted: rows.filter((r) => !!r.wave_invoice_id).length,
    wave_paid: rows.filter((r) => r.wave_paid).length,
    confirm_missing: rows.filter((r) => !r.emails.customer_confirm).length,
    staff_notif_missing: rows.filter((r) => !r.emails.staff_notif).length,
  };

  return (
    <div className="space-y-4">
      {/* Summary band */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <SummaryCard label="Orders (7d)" value={totals.orders} tone="neutral" />
        <SummaryCard label="Stuck" value={totals.stuck} tone={totals.stuck > 0 ? "bad" : "good"} />
        <SummaryCard label="Wave drafted" value={`${totals.wave_drafted}/${totals.orders}`} tone={totals.wave_drafted === totals.orders ? "good" : "warn"} />
        <SummaryCard label="Wave paid" value={totals.wave_paid} tone="neutral" />
        <SummaryCard label="No confirm email" value={totals.confirm_missing} tone={totals.confirm_missing > 0 ? "warn" : "good"} />
        <SummaryCard label="No staff notif" value={totals.staff_notif_missing} tone={totals.staff_notif_missing > 0 ? "warn" : "good"} />
      </div>

      {/* Lifecycle table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Order</th>
              <th className="px-3 py-2 text-left font-semibold">Customer</th>
              <th className="px-3 py-2 text-left font-semibold">Status</th>
              <th className="px-3 py-2 text-right font-semibold">Total</th>
              <th className="px-3 py-2 text-center font-semibold" title="Wave draft created">W-Draft</th>
              <th className="px-3 py-2 text-center font-semibold" title="Wave payment recorded">W-Paid</th>
              <th className="px-3 py-2 text-center font-semibold" title="Customer order confirmation email">Confirm</th>
              <th className="px-3 py-2 text-center font-semibold" title="Pay link / quote email sent">Pay Link</th>
              <th className="px-3 py-2 text-center font-semibold" title="Receipt email sent">Receipt</th>
              <th className="px-3 py-2 text-center font-semibold" title="Proof sent / approval email">Proof</th>
              <th className="px-3 py-2 text-center font-semibold" title="Staff NEW ORDER notification">Staff</th>
              <th className="px-3 py-2 text-center font-semibold" title="Review request email">Review</th>
              <th className="px-3 py-2 text-right font-semibold">Age</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => {
              const waveExpected = r.payment_method !== "etransfer"; // etransfer manual orders don't always draft
              const receiptExpected = r.status === "paid" || r.status === "in_production" || r.status === "ready_for_pickup" || r.status === "completed";
              const reviewExpected = r.status === "completed";
              return (
                <tr key={r.id} className={r.stuck_pending_payment ? "bg-red-50/40" : "hover:bg-gray-50"}>
                  <td className="px-3 py-2 font-mono text-xs text-gray-800">
                    <div className="flex items-center gap-1.5">
                      <span>{r.order_number}</span>
                      {r.is_rush && <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-bold">RUSH</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-900 truncate max-w-[180px]">{r.customer_name}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[180px]">{r.customer_email}</div>
                  </td>
                  <td className="px-3 py-2">{statusBadge(r.status, r.stuck_pending_payment)}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-gray-700">{fmtCurrency(r.total)}</td>
                  <td className="px-3 py-2 text-center"><Pip ok={!!r.wave_invoice_id} label="Wave draft" muted={!waveExpected} /></td>
                  <td className="px-3 py-2 text-center"><Pip ok={r.wave_paid} label="Wave paid" muted={!waveExpected || r.status === "pending_payment"} /></td>
                  <td className="px-3 py-2 text-center"><Pip ok={r.emails.customer_confirm} label="Customer confirm" /></td>
                  <td className="px-3 py-2 text-center"><Pip ok={r.emails.pay_link} label="Pay link" muted={r.payment_method === "etransfer"} /></td>
                  <td className="px-3 py-2 text-center"><Pip ok={r.emails.receipt} label="Receipt" muted={!receiptExpected} /></td>
                  <td className="px-3 py-2 text-center"><Pip ok={r.emails.proof} label="Proof" muted={r.status === "pending_payment" || r.status === "cancelled"} /></td>
                  <td className="px-3 py-2 text-center"><Pip ok={r.emails.staff_notif} label="Staff notif" /></td>
                  <td className="px-3 py-2 text-center"><Pip ok={r.emails.review} label="Review request" muted={!reviewExpected} /></td>
                  <td className="px-3 py-2 text-right text-xs text-gray-600 font-mono">{fmtAge(r.age_hours)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        Green ✓ = side-effect fired · Red ✗ = expected but missing (red flag) · Gray · = not applicable for this state.
        Email matching is by customer email + subject pattern (no order_id link on email_log yet); false negatives possible if a customer has multiple orders the same week.
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "good" | "bad" | "warn" | "neutral";
}) {
  const toneClass =
    tone === "good"
      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
      : tone === "bad"
      ? "bg-red-50 border-red-200 text-red-800"
      : tone === "warn"
      ? "bg-amber-50 border-amber-200 text-amber-800"
      : "bg-gray-50 border-gray-200 text-gray-800";
  return (
    <div className={`rounded-xl border p-3 ${toneClass}`}>
      <div className="text-xs uppercase tracking-wider opacity-70">{label}</div>
      <div className="text-2xl font-bold mt-0.5">{value}</div>
    </div>
  );
}
