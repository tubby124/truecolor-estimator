/**
 * SignupsPanel — every customer who signed up in the last 7d.
 *
 * Shows: welcome email delivered? account-ready email delivered? first-order
 * placed? coupon issued? — so Hasan can see at a glance which signups
 * converted and which sit cold.
 *
 * Each customer email links to /staff/lifecycle/customer/[email] drill-down.
 */
import Link from "next/link";

export interface SignupRow {
  id: string;
  email: string;
  name: string;
  created_at: string;
  age_hours: number;
  order_count: number;
  total_spent: number;
  welcome_email_sent: boolean;
  account_ready_email_sent: boolean;
  coupon_issued: boolean;
  coupon_redeemed: boolean;
  // Attribution from their first order (null if no order placed yet)
  first_order_source: string | null;          // referrer_source — google, google-maps, chatgpt, direct, internal, etc.
  first_order_medium: string | null;          // referrer_medium — organic, local, ai-search, direct, etc.
  first_order_utm_source: string | null;
  first_order_utm_campaign: string | null;
  first_order_raw_referrer: string | null;    // full URL for tooltip
}

function fmtAge(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

function SourceChip({ row }: { row: SignupRow }) {
  const src = row.first_order_source;
  const med = row.first_order_medium;
  const campaign = row.first_order_utm_campaign;
  const utmSrc = row.first_order_utm_source;
  if (!src) {
    return <span className="text-xs text-gray-400">—</span>;
  }
  const color =
    med === "ai-search" ? "bg-purple-100 text-purple-800" :
    med === "local" ? "bg-emerald-100 text-emerald-800" :
    med === "organic" ? "bg-sky-100 text-sky-800" :
    med === "social" ? "bg-pink-100 text-pink-800" :
    med === "direct" ? "bg-gray-100 text-gray-700" :
    med === "referral" ? "bg-amber-100 text-amber-800" :
    "bg-gray-100 text-gray-600";
  const label = utmSrc && utmSrc !== src ? `${utmSrc}` : src;
  const title = [
    `source: ${src}`,
    med ? `medium: ${med}` : null,
    campaign ? `campaign: ${campaign}` : null,
    row.first_order_raw_referrer ? `from: ${row.first_order_raw_referrer}` : null,
  ].filter(Boolean).join("\n");
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${color}`} title={title}>
      {label}{campaign ? ` · ${campaign}` : ""}
    </span>
  );
}

function Pip({ ok, label, muted }: { ok: boolean; label: string; muted?: boolean }) {
  if (muted) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-300 text-[10px]" title={`${label}: n/a`}>·</span>
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
        ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
      }`}
      title={`${label}: ${ok ? "yes" : "no"}`}
    >
      {ok ? "✓" : "✗"}
    </span>
  );
}

export function SignupsPanel({ signups }: { signups: SignupRow[] }) {
  if (signups.length === 0) {
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Signups (7d)</h2>
          <span className="text-xs text-gray-500">none this week</span>
        </div>
      </section>
    );
  }

  const totalSignups = signups.length;
  const firstOrderConverted = signups.filter((s) => s.order_count > 0).length;
  const coldSignups = signups.filter((s) => s.order_count === 0 && s.age_hours > 24).length;

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Signups (7d)</h2>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-gray-700">{totalSignups} signed up</span>
          <span className="text-emerald-700">· {firstOrderConverted} ordered</span>
          {coldSignups > 0 && <span className="text-amber-700">· {coldSignups} cold &gt; 24h</span>}
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Customer</th>
              <th className="px-3 py-2 text-left font-semibold" title="First-order traffic source (referrer or utm)">Source</th>
              <th className="px-3 py-2 text-center font-semibold" title="Welcome email sent">Welcome</th>
              <th className="px-3 py-2 text-center font-semibold" title="Account-ready email sent">Acct Ready</th>
              <th className="px-3 py-2 text-center font-semibold" title="Coupon issued (pending discount on account)">Coupon</th>
              <th className="px-3 py-2 text-center font-semibold" title="Coupon redeemed on an order">Used</th>
              <th className="px-3 py-2 text-center font-semibold" title="Has placed at least one order">First order</th>
              <th className="px-3 py-2 text-right font-semibold">Spent</th>
              <th className="px-3 py-2 text-right font-semibold">Age</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {signups.map((s) => (
              <tr key={s.id} className={s.order_count === 0 && s.age_hours > 24 ? "bg-amber-50/30" : "hover:bg-gray-50"}>
                <td className="px-3 py-2">
                  <div className="font-medium text-gray-900 truncate max-w-[200px]">{s.name || "—"}</div>
                  <Link href={`/staff/lifecycle/customer/${encodeURIComponent(s.email)}`} className="text-xs text-blue-700 hover:underline truncate max-w-[200px] block">{s.email}</Link>
                </td>
                <td className="px-3 py-2"><SourceChip row={s} /></td>
                <td className="px-3 py-2 text-center"><Pip ok={s.welcome_email_sent} label="Welcome" /></td>
                <td className="px-3 py-2 text-center"><Pip ok={s.account_ready_email_sent} label="Account ready" /></td>
                <td className="px-3 py-2 text-center"><Pip ok={s.coupon_issued} label="Coupon issued" /></td>
                <td className="px-3 py-2 text-center"><Pip ok={s.coupon_redeemed} label="Coupon redeemed" muted={!s.coupon_issued} /></td>
                <td className="px-3 py-2 text-center"><Pip ok={s.order_count > 0} label="First order" /></td>
                <td className="px-3 py-2 text-right font-mono text-xs text-gray-700">
                  {s.total_spent > 0 ? `$${s.total_spent.toFixed(2)}` : "—"}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs text-gray-600">{fmtAge(s.age_hours)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
