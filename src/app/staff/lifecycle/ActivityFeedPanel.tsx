/**
 * ActivityFeedPanel — chronological feed of EVERY EVENT (not just emails).
 *
 * Inferred from timestamp columns across orders / customers / quote_requests /
 * discount_redemptions. Each event becomes a row in a unified timeline so the
 * "what happened" question has one answer.
 *
 * Event types covered:
 *   - signup            customer.created_at
 *   - order_placed      order.created_at
 *   - wave_approved     order.wave_invoice_approved_at
 *   - payment_recorded  order.wave_payment_recorded_at  (= Clover paid + Wave updated)
 *   - proof_sent        order.proof_sent_at
 *   - status_change     order.status when transitioned via cron / staff (derived)
 *   - quote_received    quote_request.created_at
 *   - quote_replied     quote_request.replied_at
 *   - coupon_redeemed   discount_redemption.redeemed_at
 *
 * NOTE: Until an audit_events table exists, this is best-effort inference.
 * State changes lacking a timestamp column (e.g. order moved pending_payment →
 * in_production manually) are not visible here. That's the next architectural
 * step — see footer note on the dashboard.
 */

import Link from "next/link";

export type ActivityType =
  | "signup"
  | "order_placed"
  | "wave_approved"
  | "wave_approve_failed"
  | "payment_recorded"
  | "proof_sent"
  | "quote_received"
  | "quote_replied"
  | "coupon_redeemed";

export interface ActivityEvent {
  id: string;
  at: string;              // ISO timestamp
  type: ActivityType;
  actor: "customer" | "staff" | "system";
  who_name: string | null; // customer/staff display
  who_email: string | null;
  detail: string;
  order_id: string | null;
  order_number: string | null;
}

const TYPE_LABELS: Record<ActivityType, { label: string; tone: string; actor: ActivityEvent["actor"] }> = {
  signup:           { label: "Signed up",       tone: "bg-cyan-100 text-cyan-800",     actor: "customer" },
  order_placed:     { label: "Order placed",    tone: "bg-emerald-100 text-emerald-800", actor: "customer" },
  wave_approved:    { label: "Wave approved",   tone: "bg-amber-100 text-amber-800",   actor: "staff"    },
  wave_approve_failed: { label: "Wave approve FAILED", tone: "bg-red-100 text-red-800",  actor: "system"   },
  payment_recorded: { label: "Payment captured", tone: "bg-blue-100 text-blue-800",    actor: "system"   },
  proof_sent:       { label: "Proof sent",      tone: "bg-purple-100 text-purple-800", actor: "staff"    },
  quote_received:   { label: "Quote received",  tone: "bg-emerald-50 text-emerald-700", actor: "customer" },
  quote_replied:    { label: "Quote replied",   tone: "bg-teal-100 text-teal-800",     actor: "staff"    },
  coupon_redeemed:  { label: "Coupon used",     tone: "bg-pink-100 text-pink-800",     actor: "customer" },
};

const ACTOR_DOT: Record<ActivityEvent["actor"], string> = {
  customer: "bg-emerald-500",
  staff:    "bg-amber-500",
  system:   "bg-blue-500",
};

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleString("en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function ActivityFeedPanel({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Activity (7d)</h2>
        <p className="text-xs text-gray-500">No events.</p>
      </section>
    );
  }

  // Roll-up counts by type
  const counts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Activity (7d) — {events.length} events
        </h2>
        <div className="flex flex-wrap items-center gap-1.5">
          {Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([type, n]) => (
              <span
                key={type}
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                  TYPE_LABELS[type as ActivityType]?.tone ?? "bg-gray-100 text-gray-600"
                }`}
              >
                {TYPE_LABELS[type as ActivityType]?.label ?? type} · {n}
              </span>
            ))}
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto max-h-[520px] overflow-y-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left font-semibold w-24">When</th>
              <th className="px-3 py-2 text-left font-semibold w-4"></th>
              <th className="px-3 py-2 text-left font-semibold">Event</th>
              <th className="px-3 py-2 text-left font-semibold">Who</th>
              <th className="px-3 py-2 text-left font-semibold">Detail</th>
              <th className="px-3 py-2 text-left font-semibold">Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.map((e) => {
              const t = TYPE_LABELS[e.type];
              return (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap font-mono">{fmtTime(e.at)}</td>
                  <td className="px-2 py-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${ACTOR_DOT[e.actor]}`} title={e.actor}></span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${t.tone}`}>
                      {t.label}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700">
                    {e.who_name ? (
                      <>
                        <div className="font-medium text-gray-900 truncate max-w-[160px]">{e.who_name}</div>
                        {e.who_email && <div className="text-[11px] text-gray-500 truncate max-w-[160px]">{e.who_email}</div>}
                      </>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700 truncate max-w-[320px]" title={e.detail}>{e.detail}</td>
                  <td className="px-3 py-2 text-xs">
                    {e.order_number ? (
                      <Link href={`/staff/orders?focus=${e.order_id}`} className="font-mono text-blue-700 hover:underline">{e.order_number}</Link>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>customer ·{" "}
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>staff ·{" "}
        <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>system
      </p>
    </section>
  );
}
