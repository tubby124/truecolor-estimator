/**
 * /staff/lifecycle — Shop control tower.
 *
 * Every customer touchpoint visible in one place:
 *   - cron heartbeats (silent-death detector)
 *   - orphans (orders with no Pay Now link — auto recovery URL per row)
 *   - per-order lifecycle pips (Wave draft, paid, customer emails, staff notif)
 *   - quote_requests inflow + reply state
 *   - signup funnel (welcome / account-ready / coupon / first-order)
 *   - email feed (every email sent last 7d, classified)
 *   - coupon redemptions
 *   - Wave bookkeeping needs-attention list
 *
 * Read-only join across orders, email_log, quote_requests, customers,
 * discount_redemptions, discount_codes, cron_runs. No new data writes.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { LOGO_PATH } from "@/lib/config";
import { fetchLifecycleData } from "./data";
import { LifecycleTable } from "./LifecycleTable";
import { HeartbeatsPanel } from "./HeartbeatsPanel";
import { OrphanPanel } from "./OrphanPanel";
import { QuotesPanel } from "./QuotesPanel";
import { SignupsPanel } from "./SignupsPanel";
import { EmailFeedPanel } from "./EmailFeedPanel";
import { CouponsPanel } from "./CouponsPanel";
import { WaveDraftPanel } from "./WaveDraftPanel";
import { ActivityFeedPanel } from "./ActivityFeedPanel";
import { BookkeepingRiskPanel } from "./BookkeepingRiskPanel";
import { HealthTiles } from "./HealthTiles";
import { PendingCouponsPanel } from "./PendingCouponsPanel";
import { CartAbandonPanel } from "./CartAbandonPanel";
import { FailedEmailsPanel } from "./FailedEmailsPanel";
import { TelegramHealthPanel } from "./TelegramHealthPanel";
import { IndustryBlitzPanel } from "./IndustryBlitzPanel";
import { SeoRankMoversPanel } from "./SeoRankMoversPanel";
import { PriceConsistencyPanel } from "./PriceConsistencyPanel";

export const metadata: Metadata = {
  title: "Lifecycle — True Color Staff",
  robots: { index: false },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LifecyclePage() {
  let data: Awaited<ReturnType<typeof fetchLifecycleData>> | null = null;
  let fetchError: string | null = null;

  try {
    data = await fetchLifecycleData();
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Could not load lifecycle";
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_PATH} alt="True Color Display Printing" className="h-8 w-auto object-contain flex-shrink-0" />
            <span className="text-sm font-semibold text-[#1c1712] truncate">Lifecycle</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/staff/orders" className="inline-flex items-center min-h-[44px] px-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Orders</Link>
            <Link href="/staff/quotes" className="inline-flex items-center min-h-[44px] px-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Quotes</Link>
            <Link href="/staff" className="inline-flex items-center min-h-[44px] px-4 bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold rounded-lg transition-colors">Estimator</Link>
          </nav>
        </div>
      </header>

      <main id="main-content" className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#1c1712]">Lifecycle</h1>
          <p className="text-gray-500 text-sm mt-1">
            Last 7 days · every customer touchpoint in one place
          </p>
        </div>

        {fetchError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-semibold">Could not load lifecycle</p>
            <p className="text-red-500 text-sm mt-1">{fetchError}</p>
          </div>
        ) : data ? (
          <div className="space-y-2">
            <HealthTiles snap={data.health} />
            <HeartbeatsPanel heartbeats={data.heartbeats} />
            <TelegramHealthPanel h={data.telegramHealth} />
            <PriceConsistencyPanel rows={data.priceConsistency} />
            <BookkeepingRiskPanel rows={data.bookkeepingRisks} />
            <OrphanPanel orphans={data.orphans} />
            <WaveDraftPanel rows={data.waveDrafts} />
            <CartAbandonPanel rows={data.cartAbandons} />
            <FailedEmailsPanel rows={data.failedEmails} />
            <LifecycleTable rows={data.rows} />
            <ActivityFeedPanel events={data.activity} />
            <QuotesPanel quotes={data.quotes} />
            <SignupsPanel signups={data.signups} />
            <PendingCouponsPanel rows={data.pendingCoupons} />
            <CouponsPanel redemptions={data.redemptions} />
            <SeoRankMoversPanel movers={data.seoMovers} />
            <IndustryBlitzPanel snap={data.blitz} />
            <EmailFeedPanel events={data.emailFeed} />
          </div>
        ) : null}

        <section className="mt-10 p-5 rounded-xl border border-gray-200 bg-gray-50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">What this dashboard does NOT see yet</h3>
          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
            <li><strong>Supabase Auth emails</strong> (signup verification, password reset, magic-link). Sent by Supabase, not our app → never hit <code className="bg-white px-1 rounded">email_log</code>. To close: subscribe to Supabase Auth webhooks and log them.</li>
            <li><strong>Wave-sent emails</strong> (Wave can email customers when an invoice is approved through Wave UI). Not in our log. To close: poll Wave invoice events or stop using Wave-side sending (we already retired this flow 2026-05-26).</li>
            <li><strong>Brevo campaign sends</strong> (bulk marketing). Tracked in Brevo, not here. To close: pull Brevo campaign events into a separate panel.</li>
            <li><strong>Order status transitions</strong> (e.g. pending_payment → in_production triggered by Albert) — only visible if they have a timestamp column (proof_sent_at, wave_payment_recorded_at). Manual status flips are invisible. To close: add an <code className="bg-white px-1 rounded">audit_events</code> table + write on every transition.</li>
            <li><strong>Failed email sends</strong> — Resend rejections, soft bounces, blocks. <code className="bg-white px-1 rounded">smtp.ts</code> only logs <code className="bg-white px-1 rounded">status: &quot;sent&quot;</code> on success. To close: pull Resend webhook events into the log.</li>
            <li><strong>Customer support replies inbound</strong> — replies to info@true-color.ca don&apos;t hit this dashboard. To close: forward via Brevo inbound parsing or Gmail API.</li>
          </ul>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-5 text-center text-xs text-gray-400">
        True Color Staff Portal · Lifecycle harness · Internal use only
      </footer>
    </div>
  );
}
