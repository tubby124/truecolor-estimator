/**
 * StaffActionsPanel — every staff button-press in the last 7 days.
 *
 * Reads from audit_events filtered to actor_type='staff'. Each row corresponds
 * to a real mutation API call (recordAuditEvent fires inside every staff
 * mutation route — orders, quotes, coupons, manual-order, send-email).
 *
 * If this panel is empty after a day of activity, audit instrumentation
 * is missing on a route somewhere — every mutation should produce a row.
 */

import Link from "next/link";

export interface StaffAction {
  id: string;
  at: string;
  actor: string;             // staff email
  event_type: string;        // dot-namespaced, e.g. "order.proof_sent"
  entity_type: string;       // "order" | "quote" | "coupon" | "customer"
  entity_id: string;
  order_number: string | null; // resolved when entity_type='order' and order is in 7d window
  detail: Record<string, unknown> | null;
}

const EVENT_PILLS: Record<string, { label: string; tone: string }> = {
  "order.manual_created":         { label: "Created order",       tone: "bg-emerald-100 text-emerald-800" },
  "order.manual_quote_created":   { label: "Created quote",       tone: "bg-emerald-50 text-emerald-700" },
  "order.status_changed":         { label: "Changed status",      tone: "bg-blue-100 text-blue-800" },
  "order.repriced":               { label: "Repriced order",      tone: "bg-amber-100 text-amber-800" },
  "order.refund_processed":       { label: "Marked refund done",  tone: "bg-rose-100 text-rose-800" },
  "order.etransfer_confirmed":    { label: "Confirmed e-transfer", tone: "bg-teal-100 text-teal-800" },
  "order.proof_sent":             { label: "Sent proof",          tone: "bg-purple-100 text-purple-800" },
  "order.customer_email_sent":    { label: "Sent custom email",   tone: "bg-indigo-100 text-indigo-800" },
  "order.payment_link_resent":    { label: "Resent pay link",     tone: "bg-cyan-100 text-cyan-800" },
  "order.notes_updated":          { label: "Updated notes",       tone: "bg-gray-100 text-gray-700" },
  "order.archived":               { label: "Archived",            tone: "bg-gray-200 text-gray-800" },
  "order.unarchived":             { label: "Unarchived",          tone: "bg-gray-100 text-gray-700" },
  "quote.priced_quote_sent":      { label: "Sent priced quote",   tone: "bg-emerald-100 text-emerald-800" },
  "quote.reply_sent":             { label: "Replied to quote",    tone: "bg-teal-100 text-teal-800" },
  "quote.marked_replied":         { label: "Marked replied",      tone: "bg-teal-50 text-teal-700" },
  "quote.unmarked_replied":       { label: "Unmarked replied",    tone: "bg-gray-100 text-gray-700" },
  "quote.archived":               { label: "Archived quote",      tone: "bg-gray-200 text-gray-800" },
  "quote.unarchived":             { label: "Unarchived quote",    tone: "bg-gray-100 text-gray-700" },
  "coupon.created":               { label: "Created coupon",      tone: "bg-pink-100 text-pink-800" },
  "coupon.activated":             { label: "Activated coupon",    tone: "bg-pink-50 text-pink-700" },
  "coupon.deactivated":           { label: "Deactivated coupon",  tone: "bg-gray-200 text-gray-800" },
  "customer.discount_assigned":   { label: "Assigned discount",   tone: "bg-pink-100 text-pink-800" },
  "customer.email_sent":          { label: "Emailed customer",    tone: "bg-indigo-100 text-indigo-800" },
  "order.pay_link_clicked":       { label: "Pay link clicked",    tone: "bg-green-100 text-green-800" },
};

function pillFor(eventType: string): { label: string; tone: string } {
  return EVENT_PILLS[eventType] ?? { label: eventType, tone: "bg-gray-100 text-gray-700" };
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleString("en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function summarizeDetail(eventType: string, detail: Record<string, unknown> | null): string {
  if (!detail) return "";
  switch (eventType) {
    case "order.status_changed":
      return `${detail.from ?? "?"} → ${detail.to ?? "?"}`;
    case "order.proof_sent":
      return `${detail.new_proofs_count ?? "?"} proof(s) → ${detail.recipient ?? "?"}`;
    case "order.customer_email_sent":
    case "customer.email_sent":
      return `"${String(detail.subject ?? "").slice(0, 60)}" → ${detail.recipient ?? "?"}`;
    case "order.payment_link_resent":
      return `$${Number(detail.total ?? 0).toFixed(2)} → ${detail.recipient ?? "?"}`;
    case "order.manual_created":
    case "order.manual_quote_created":
      return `${detail.item_count ?? "?"} item(s) · ${detail.customer_email ?? "?"}`;
    case "order.repriced":
      return `Δ $${Number(detail.delta ?? 0).toFixed(2)} · ${String(detail.reason ?? "").slice(0, 40)}`;
    case "order.refund_processed":
      return `${detail.method ?? "?"} · $${Number(detail.amount ?? 0).toFixed(2)}`;
    case "quote.priced_quote_sent":
      return `$${(Number(detail.total_cents ?? 0) / 100).toFixed(2)} · ${detail.line_items_count ?? "?"} line(s) → ${detail.recipient ?? "?"}`;
    case "quote.reply_sent":
      return `"${String(detail.subject ?? "").slice(0, 60)}" → ${detail.recipient ?? "?"}${detail.has_pay_now ? " · Pay Now" : ""}`;
    case "coupon.created":
      return `${detail.code ?? "?"} · ${detail.type ?? "?"} · $${detail.discount_amount ?? "?"}`;
    case "customer.discount_assigned":
      return `${detail.code ?? "?"}`;
    case "order.notes_updated":
      return detail.has_notes ? `${detail.length ?? 0} chars` : "cleared";
    default:
      return "";
  }
}

export function StaffActionsPanel({ actions }: { actions: StaffAction[] }) {
  if (actions.length === 0) {
    return (
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Staff actions (7d)</h2>
        <p className="text-xs text-gray-500 px-3 py-3 bg-white border border-gray-200 rounded-xl">
          No staff actions recorded yet. If staff have been using the portal, audit instrumentation may be missing.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Button presses (7d) · staff actions + customer pay-link clicks</h2>
        <span className="text-xs text-gray-500">{actions.length} event{actions.length === 1 ? "" : "s"}</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2 text-left font-semibold w-[110px]">When</th>
                <th className="px-3 py-2 text-left font-semibold w-[180px]">Action</th>
                <th className="px-3 py-2 text-left font-semibold">Target</th>
                <th className="px-3 py-2 text-left font-semibold">Detail</th>
                <th className="px-3 py-2 text-left font-semibold w-[200px]">Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {actions.slice(0, 100).map((a) => {
                const pill = pillFor(a.event_type);
                const summary = summarizeDetail(a.event_type, a.detail);
                return (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-xs text-gray-600 font-mono whitespace-nowrap">{fmtTime(a.at)}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${pill.tone}`}>
                        {pill.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-700">
                      {a.entity_type === "order" && a.order_number ? (
                        <Link href={`/staff/orders#order-${a.order_number}`} className="text-amber-600 hover:underline font-mono">
                          {a.order_number}
                        </Link>
                      ) : a.entity_type === "quote" ? (
                        <span className="text-gray-500 font-mono">quote/{a.entity_id.slice(0, 8)}</span>
                      ) : a.entity_type === "customer" ? (
                        <span className="text-gray-700 font-mono truncate">{a.entity_id}</span>
                      ) : a.entity_type === "coupon" ? (
                        <span className="text-pink-700 font-mono">coupon/{a.entity_id.slice(0, 8)}</span>
                      ) : (
                        <span className="text-gray-400 font-mono">{a.entity_type}/{a.entity_id.slice(0, 8)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 truncate max-w-[420px]" title={summary}>{summary}</td>
                    <td className="px-3 py-2 text-xs text-gray-500 font-mono truncate">{a.actor}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {actions.length > 100 && (
          <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-[11px] text-gray-500">
            Showing 100 of {actions.length}. Older actions trimmed.
          </div>
        )}
      </div>
    </section>
  );
}
