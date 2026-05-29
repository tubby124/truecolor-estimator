/**
 * /staff/lifecycle/customer/[email]
 *
 * Per-customer drill-down. Shows every email, every order, every coupon,
 * every audit event for a single customer in one chronological timeline.
 *
 * Linked from email + order rows on the main /staff/lifecycle dashboard.
 *
 * Email is URL-encoded in the route param. Server-rendered, read-only.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { LOGO_PATH } from "@/lib/config";
import { classifyEmail } from "../../EmailFeedPanel";

export const metadata: Metadata = {
  title: "Customer Timeline — True Color Staff",
  robots: { index: false },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  params: Promise<{ email: string }>;
}

type TimelineEvent = {
  at: string;
  source: "email" | "order" | "audit" | "redemption" | "signup";
  type: string;
  label: string;
  detail: string;
  order_number: string | null;
  order_id: string | null;
};

export default async function CustomerDrilldownPage({ params }: Props) {
  const { email: emailParam } = await params;
  const email = decodeURIComponent(emailParam).toLowerCase();

  const supabase = createServiceClient();

  // ── Fetch the customer record ───────────────────────────────────────────
  const { data: customer } = await supabase
    .from("customers")
    .select("id, email, name, company, phone, address, created_at, order_count, total_spent, pending_discount_code, marketing_consent")
    .ilike("email", email)
    .maybeSingle();

  // ── Fetch every order for this customer ─────────────────────────────────
  const { data: orders } = customer
    ? await supabase
        .from("orders")
        .select("id, order_number, status, payment_method, total, is_rush, wave_invoice_id, wave_invoice_number, wave_invoice_approved_at, wave_payment_recorded_at, proof_sent_at, paid_at, ready_at, completed_at, created_at, updated_at")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  // ── Every email_log row (matched by order_id or to_address) ─────────────
  const orderIds = (orders ?? []).map((o) => o.id);
  const emailQueries = await Promise.all([
    supabase
      .from("email_log")
      .select("id, sent_at, subject, status, opened_at, clicked_at, bounced_at, complained_at, last_event_detail, order_id")
      .ilike("to_address", email)
      .order("sent_at", { ascending: false })
      .limit(500),
    orderIds.length > 0
      ? supabase
          .from("email_log")
          .select("id, sent_at, subject, status, opened_at, clicked_at, bounced_at, complained_at, last_event_detail, order_id")
          .in("order_id", orderIds)
          .order("sent_at", { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [] as Array<{ id: string }> }),
  ]);
  const emails: Array<{
    id: string;
    sent_at: string;
    subject: string;
    status: string;
    opened_at: string | null;
    clicked_at: string | null;
    bounced_at: string | null;
    complained_at: string | null;
    last_event_detail: string | null;
    order_id: string | null;
  }> = [];
  const seen = new Set<string>();
  for (const row of [...(emailQueries[0].data ?? []), ...(emailQueries[1].data ?? [])]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    emails.push(row as typeof emails[number]);
  }

  // ── Coupon redemptions ──────────────────────────────────────────────────
  const { data: redemptions } = customer
    ? await supabase
        .from("discount_redemptions")
        .select("id, code_id, order_id, amount_saved, redeemed_at, discount_codes(code, type)")
        .eq("customer_id", customer.id)
        .order("redeemed_at", { ascending: false })
    : { data: [] };

  // ── Audit events (by customer email as actor OR by order entity_id) ─────
  const { data: auditByActor } = await supabase
    .from("audit_events")
    .select("id, at, actor_type, actor_id, event_type, entity_type, entity_id, detail")
    .ilike("actor_id", email)
    .order("at", { ascending: false })
    .limit(200);
  const { data: auditByOrder } = orderIds.length > 0
    ? await supabase
        .from("audit_events")
        .select("id, at, actor_type, actor_id, event_type, entity_type, entity_id, detail")
        .eq("entity_type", "order")
        .in("entity_id", orderIds)
        .order("at", { ascending: false })
        .limit(200)
    : { data: [] };
  const auditAll = [...(auditByActor ?? []), ...(auditByOrder ?? [])];
  const auditDedup = new Map(auditAll.map((a) => [a.id, a]));
  const audits = Array.from(auditDedup.values());

  // ── Build unified timeline ──────────────────────────────────────────────
  const timeline: TimelineEvent[] = [];

  if (customer?.created_at) {
    timeline.push({
      at: customer.created_at,
      source: "signup",
      type: "signup",
      label: "Customer signed up",
      detail: `name: ${customer.name ?? "—"} · marketing_consent: ${customer.marketing_consent ?? false}`,
      order_number: null,
      order_id: null,
    });
  }

  const orderNumberById = new Map<string, string>((orders ?? []).map((o) => [o.id, o.order_number ?? ""]));

  for (const o of orders ?? []) {
    if (o.created_at) timeline.push({
      at: o.created_at, source: "order", type: "order_created",
      label: `Order ${o.order_number} placed`,
      detail: `$${Number(o.total ?? 0).toFixed(2)} · ${o.payment_method} · ${o.is_rush ? "RUSH" : "standard"}`,
      order_number: o.order_number ?? null, order_id: o.id,
    });
    if (o.wave_invoice_approved_at) timeline.push({
      at: o.wave_invoice_approved_at, source: "order", type: "wave_approved",
      label: "Invoice approved",
      detail: `Inv #${o.wave_invoice_number ?? "?"}`,
      order_number: o.order_number ?? null, order_id: o.id,
    });
    if (o.wave_payment_recorded_at) timeline.push({
      at: o.wave_payment_recorded_at, source: "order", type: "payment_recorded",
      label: "Payment captured + Wave updated",
      detail: `$${Number(o.total ?? 0).toFixed(2)}`,
      order_number: o.order_number ?? null, order_id: o.id,
    });
    if (o.proof_sent_at) timeline.push({
      at: o.proof_sent_at, source: "order", type: "proof_sent",
      label: "Proof emailed",
      detail: "",
      order_number: o.order_number ?? null, order_id: o.id,
    });
    if (o.ready_at) timeline.push({
      at: o.ready_at, source: "order", type: "ready",
      label: "Ready for pickup",
      detail: "",
      order_number: o.order_number ?? null, order_id: o.id,
    });
    if (o.completed_at) timeline.push({
      at: o.completed_at, source: "order", type: "completed",
      label: "Order completed",
      detail: "",
      order_number: o.order_number ?? null, order_id: o.id,
    });
  }

  for (const e of emails) {
    const detailParts: string[] = [];
    if (e.opened_at)     detailParts.push(`opened ${new Date(e.opened_at).toLocaleString()}`);
    if (e.clicked_at)    detailParts.push(`clicked ${new Date(e.clicked_at).toLocaleString()}`);
    if (e.bounced_at)    detailParts.push(`BOUNCED ${new Date(e.bounced_at).toLocaleString()}`);
    if (e.complained_at) detailParts.push(`SPAM ${new Date(e.complained_at).toLocaleString()}`);
    timeline.push({
      at: e.sent_at, source: "email", type: classifyEmail(e.subject ?? ""),
      label: e.subject ?? "(no subject)",
      detail: detailParts.length > 0 ? detailParts.join(" · ") : `status: ${e.status}`,
      order_number: e.order_id ? orderNumberById.get(e.order_id) ?? null : null,
      order_id: e.order_id,
    });
  }

  for (const r of redemptions ?? []) {
    const code = Array.isArray(r.discount_codes) ? r.discount_codes[0] : r.discount_codes;
    timeline.push({
      at: r.redeemed_at, source: "redemption", type: "coupon_redeemed",
      label: `Coupon used: ${code?.code ?? "?"}`,
      detail: `-$${Number(r.amount_saved ?? 0).toFixed(2)}`,
      order_number: r.order_id ? orderNumberById.get(r.order_id) ?? null : null,
      order_id: r.order_id,
    });
  }

  for (const a of audits) {
    timeline.push({
      at: a.at, source: "audit", type: a.event_type,
      label: a.event_type,
      detail: a.detail ? JSON.stringify(a.detail) : `actor: ${a.actor_type}/${a.actor_id ?? "?"}`,
      order_number: a.entity_type === "order" ? orderNumberById.get(a.entity_id) ?? null : null,
      order_id: a.entity_type === "order" ? a.entity_id : null,
    });
  }

  timeline.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_PATH} alt="True Color" className="h-8 w-auto object-contain flex-shrink-0" />
            <span className="text-sm font-semibold text-[#1c1712] truncate">Customer drill-down</span>
          </div>
          <Link href="/staff/lifecycle" className="text-sm text-gray-600 hover:text-gray-900">← Lifecycle</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-[#1c1712] mb-1">{customer?.name ?? "Unknown customer"}</h1>
        <p className="text-sm text-gray-600 mb-6">{email}</p>

        {!customer ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <p className="text-amber-900 font-semibold">No customer record for {email}</p>
            <p className="text-amber-700 text-sm mt-1">Anonymous email — only email_log + audit rows below will populate.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card label="Lifetime orders" value={String(customer.order_count ?? 0)} />
            <Card label="Lifetime spent" value={`$${Number(customer.total_spent ?? 0).toFixed(2)}`} />
            <Card label="Company" value={customer.company ?? "—"} />
            <Card label="Phone" value={customer.phone ?? "—"} />
            <Card label="Pending coupon" value={customer.pending_discount_code ?? "none"} tone={customer.pending_discount_code ? "warn" : "neutral"} />
            <Card label="Marketing consent" value={customer.marketing_consent ? "yes" : "no"} />
            <Card label="Signed up" value={customer.created_at ? new Date(customer.created_at).toLocaleDateString() : "—"} />
            <Card label="Total events" value={String(timeline.length)} />
          </div>
        )}

        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Timeline ({timeline.length} events)</h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {timeline.length === 0 ? (
            <p className="text-sm text-gray-500 p-6 text-center">No events for this customer.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {timeline.map((t, idx) => (
                <li key={`${t.source}-${idx}`} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="text-xs text-gray-500 font-mono whitespace-nowrap pt-0.5 w-32 flex-shrink-0">
                      {new Date(t.at).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${sourceTone(t.source)} flex-shrink-0`}>
                      {t.source}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">{t.label}</div>
                      {t.detail && <div className="text-xs text-gray-600 mt-0.5 truncate">{t.detail}</div>}
                    </div>
                    {t.order_number && (
                      <Link href={`/staff/orders?focus=${t.order_id}`} className="text-xs font-mono text-blue-700 hover:underline flex-shrink-0">{t.order_number}</Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

function Card({ label, value, tone }: { label: string; value: string; tone?: "warn" | "neutral" }) {
  const toneClass = tone === "warn" ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200";
  return (
    <div className={`rounded-xl border p-3 ${toneClass}`}>
      <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{label}</div>
      <div className="text-sm font-bold text-gray-900 mt-1 truncate">{value}</div>
    </div>
  );
}

function sourceTone(s: TimelineEvent["source"]): string {
  switch (s) {
    case "email":      return "bg-blue-100 text-blue-800";
    case "order":      return "bg-emerald-100 text-emerald-800";
    case "audit":      return "bg-purple-100 text-purple-800";
    case "redemption": return "bg-pink-100 text-pink-800";
    case "signup":     return "bg-cyan-100 text-cyan-800";
  }
}
