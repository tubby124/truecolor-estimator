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
            <HeartbeatsPanel heartbeats={data.heartbeats} />
            <OrphanPanel orphans={data.orphans} />
            <WaveDraftPanel rows={data.waveDrafts} />
            <LifecycleTable rows={data.rows} />
            <QuotesPanel quotes={data.quotes} />
            <SignupsPanel signups={data.signups} />
            <CouponsPanel redemptions={data.redemptions} />
            <EmailFeedPanel events={data.emailFeed} />
          </div>
        ) : null}
      </main>

      <footer className="border-t border-gray-100 py-5 text-center text-xs text-gray-400">
        True Color Staff Portal · Lifecycle harness · Internal use only
      </footer>
    </div>
  );
}
