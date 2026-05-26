/**
 * HealthTiles — top-of-dashboard 24h + 7d pulse.
 *
 * One row of tiles answering "what happened in the shop today?":
 *   - orders placed (24h / 7d)
 *   - revenue captured (24h / 7d)
 *   - emails sent (24h / 7d)
 *   - signups (24h / 7d)
 *   - coupons redeemed (24h / 7d)
 *   - pay-link emails (24h / 7d) — the customer-facing "way to pay" count
 *
 * Trends use a simple arrow vs 24h-ago window. No graphs, no recharts —
 * just the punchy numbers.
 */

export interface HealthSnapshot {
  orders_24h: number;
  orders_7d: number;
  revenue_24h: number;
  revenue_7d: number;
  emails_24h: number;
  emails_7d: number;
  pay_links_24h: number;
  pay_links_7d: number;
  signups_24h: number;
  signups_7d: number;
  coupons_redeemed_24h: number;
  coupons_redeemed_7d: number;
  payments_captured_24h: number;
  payments_captured_7d: number;
}

function fmtMoney(n: number): string {
  if (n >= 10000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

function Tile({
  label,
  primary,
  secondary,
  tone = "neutral",
}: {
  label: string;
  primary: string | number;
  secondary?: string;
  tone?: "neutral" | "good" | "warn";
}) {
  const toneClass =
    tone === "good" ? "bg-emerald-50 border-emerald-200 text-emerald-900"
    : tone === "warn" ? "bg-amber-50 border-amber-200 text-amber-900"
    : "bg-white border-gray-200 text-gray-900";
  return (
    <div className={`rounded-xl border p-3 ${toneClass}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-60 font-semibold">{label}</div>
      <div className="text-2xl font-bold mt-0.5 leading-none">{primary}</div>
      {secondary && <div className="text-[11px] opacity-60 mt-1">{secondary}</div>}
    </div>
  );
}

export function HealthTiles({ snap }: { snap: HealthSnapshot }) {
  return (
    <section className="mb-6">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">24h pulse · 7d trend</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
        <Tile label="Orders 24h"     primary={snap.orders_24h}                secondary={`7d ${snap.orders_7d}`} />
        <Tile label="Revenue 24h"    primary={fmtMoney(snap.revenue_24h)}      secondary={`7d ${fmtMoney(snap.revenue_7d)}`} tone="good" />
        <Tile label="Payments 24h"   primary={snap.payments_captured_24h}      secondary={`7d ${snap.payments_captured_7d}`} />
        <Tile label="Pay-links 24h"  primary={snap.pay_links_24h}             secondary={`7d ${snap.pay_links_7d}`} />
        <Tile label="Emails 24h"     primary={snap.emails_24h}                 secondary={`7d ${snap.emails_7d}`} />
        <Tile label="Signups 24h"    primary={snap.signups_24h}                secondary={`7d ${snap.signups_7d}`} />
        <Tile label="Coupons 24h"    primary={snap.coupons_redeemed_24h}      secondary={`7d ${snap.coupons_redeemed_7d}`} tone={snap.coupons_redeemed_24h > 0 ? "good" : "neutral"} />
      </div>
    </section>
  );
}
