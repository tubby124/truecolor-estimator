/**
 * EmailFeedPanel — chronological feed of every email sent in the last 7d.
 *
 * The single answer to "where did that email go?" — every paymentRequest,
 * orderConfirmation, staff notification, welcome, account-ready, proof, receipt,
 * review request, cron alert, follow-up. Classified by subject pattern,
 * linked to order_number when known.
 */

import Link from "next/link";

export interface EmailEvent {
  id: string;
  sent_at: string;
  to_address: string;
  subject: string;
  status: string;
  order_id: string | null;
  order_number: string | null;
  type: EmailType;
}

export type EmailType =
  | "pay_link"          // Payment Request / Your Quote / Complete your payment / Your Custom Print Quote
  | "order_confirm"     // Order TC-XXXX received / confirmed
  | "receipt"           // Receipt — TC-XXXX
  | "account_ready"     // Your True Color account is ready / Your True Color account
  | "welcome"           // Welcome to True Color
  | "proof"             // proofs ready / approve your
  | "review_request"    // How did your order turn out
  | "status_update"     // Payment confirmed / on the press / are ready / eTransfer confirmed / file updated
  | "coupon_issued"     // Your $X discount is ready
  | "staff_reply"       // Re: <original subject> (send-reply / staff manual email)
  | "staff_notif"       // NEW ORDER / NEW ACCOUNT
  | "follow_up"         // payment-followup / "is waiting" / "left something"
  | "digest"            // Aging Orders Digest
  | "cron_alert"        // ⚠️ quotes waiting / system alert
  | "other";

export function classifyEmail(subject: string): EmailType {
  const s = subject ?? "";
  // Staff/admin first (these go to info@true-color.ca or staff addresses)
  if (/^NEW ORDER|^NEW ACCOUNT/i.test(s)) return "staff_notif";
  if (/^True Color — Aging Orders Digest/i.test(s)) return "digest";
  if (/^⚠️|alert|system check/i.test(s)) return "cron_alert";
  // Customer-facing
  if (/^Welcome to True Color/i.test(s)) return "welcome";
  if (/account is ready|^Your True Color account/i.test(s)) return "account_ready";
  if (/discount is ready/i.test(s)) return "coupon_issued";
  if (/^Receipt —/i.test(s)) return "receipt";
  if (/proofs? ready|approve your/i.test(s)) return "proof";
  if (/How did your .* turn out|review/i.test(s)) return "review_request";
  // Status transitions
  if (/^Payment confirmed|on the press|are ready —|eTransfer confirmed|\[File updated\]/i.test(s)) return "status_update";
  // Follow-up / abandoned
  if (/is waiting|left something/i.test(s)) return "follow_up";
  // Pay-link bearing
  if (/^Payment Request|^Your Quote|^Your Custom Print Quote|Complete your payment/i.test(s)) return "pay_link";
  if (/Order .* received|Order .* confirmed/i.test(s)) return "order_confirm";
  // Staff reply (catch-all for "Re:" prefix)
  if (/^Re:\s/i.test(s)) return "staff_reply";
  return "other";
}

const TYPE_LABELS: Record<EmailType, { label: string; tone: string }> = {
  pay_link:       { label: "Pay link",      tone: "bg-blue-100 text-blue-800" },
  order_confirm:  { label: "Order confirm", tone: "bg-emerald-100 text-emerald-800" },
  receipt:        { label: "Receipt",       tone: "bg-emerald-100 text-emerald-800" },
  account_ready:  { label: "Account ready", tone: "bg-cyan-100 text-cyan-800" },
  welcome:        { label: "Welcome",       tone: "bg-cyan-100 text-cyan-800" },
  proof:          { label: "Proof",         tone: "bg-purple-100 text-purple-800" },
  review_request: { label: "Review req",    tone: "bg-purple-100 text-purple-800" },
  status_update:  { label: "Status",        tone: "bg-indigo-100 text-indigo-800" },
  coupon_issued:  { label: "Coupon issued", tone: "bg-pink-100 text-pink-800" },
  staff_reply:    { label: "Staff reply",   tone: "bg-teal-100 text-teal-800" },
  staff_notif:    { label: "Staff notif",   tone: "bg-gray-200 text-gray-700" },
  follow_up:      { label: "Follow-up",     tone: "bg-amber-100 text-amber-800" },
  digest:         { label: "Digest",        tone: "bg-amber-100 text-amber-800" },
  cron_alert:     { label: "Cron alert",    tone: "bg-amber-100 text-amber-800" },
  other:          { label: "Other",         tone: "bg-gray-100 text-gray-600" },
};

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleString("en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function EmailFeedPanel({ events }: { events: EmailEvent[] }) {
  if (events.length === 0) {
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Email feed (7d)</h2>
          <span className="text-xs text-gray-500">none</span>
        </div>
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
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Email feed (7d) — {events.length} sent
        </h2>
        <div className="flex flex-wrap items-center gap-1.5">
          {Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([type, n]) => (
              <span
                key={type}
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                  TYPE_LABELS[type as EmailType]?.tone ?? "bg-gray-100 text-gray-600"
                }`}
              >
                {TYPE_LABELS[type as EmailType]?.label ?? type} · {n}
              </span>
            ))}
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto max-h-[480px] overflow-y-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left font-semibold w-24">When</th>
              <th className="px-3 py-2 text-left font-semibold">Type</th>
              <th className="px-3 py-2 text-left font-semibold">To</th>
              <th className="px-3 py-2 text-left font-semibold">Subject</th>
              <th className="px-3 py-2 text-left font-semibold">Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.map((e) => {
              const t = TYPE_LABELS[e.type];
              return (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap font-mono">{fmtTime(e.sent_at)}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${t.tone}`}>
                      {t.label}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700 truncate max-w-[200px]" title={e.to_address}>{e.to_address}</td>
                  <td className="px-3 py-2 text-xs text-gray-800 truncate max-w-[360px]" title={e.subject}>{e.subject}</td>
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
    </section>
  );
}
