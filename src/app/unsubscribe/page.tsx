/**
 * /unsubscribe — Human-friendly unsubscribe confirmation page.
 *
 * GET behaviour:
 *   - ?email=foo@bar.com           → unsubscribe immediately + show confirmation
 *   - ?email=foo@bar.com&done=1    → just show confirmation (already processed)
 *   - no email                     → generic "manage preferences" message
 *
 * Backs the link used in payment-followup.ts and (soon) the List-Unsubscribe
 * mailto/URL header set in smtp.ts. RFC 8058 one-click POST goes to the API
 * route at /api/email/unsubscribe-one-click; this page is the human path.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { createServiceClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Unsubscribed | True Color Display Printing",
  description: "Manage your email preferences for True Color Display Printing.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

async function processUnsubscribe(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) return;
  try {
    const supabase = createServiceClient();
    await supabase
      .from("customers")
      .update({
        marketing_consent: false,
        consent_at: new Date().toISOString(),
      })
      .eq("email", normalized);
    console.log(`[unsubscribe page] ${normalized} opted out`);
  } catch (err) {
    console.error("[unsubscribe page] failed:", err instanceof Error ? err.message : err);
  }
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; done?: string }>;
}) {
  const params = await searchParams;
  const email = (params.email ?? "").trim();
  const alreadyDone = params.done === "1";

  if (email && !alreadyDone) {
    await processUnsubscribe(email);
  }

  const displayEmail = email || "your email address";

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <main id="main-content" className="max-w-xl mx-auto px-6 py-20">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 border border-green-200">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-[#1c1712]">You&apos;ve been unsubscribed</h1>

          <p className="text-gray-600 leading-relaxed">
            {email ? (
              <>
                <span className="font-medium text-[#1c1712]">{displayEmail}</span> will no longer receive
                marketing or follow-up emails from True Color Display Printing.
              </>
            ) : (
              <>You will no longer receive marketing emails from True Color Display Printing.</>
            )}
          </p>

          <p className="text-sm text-gray-500 leading-relaxed">
            Order confirmations, receipts, proofs, and pickup notifications for active orders will still be
            sent — they&apos;re transactional and required.
          </p>

          <div className="pt-4 space-y-3">
            <Link
              href="/"
              className="inline-block bg-[#16C2F3] hover:bg-[#0fb0dd] text-white font-bold px-8 py-4 rounded-lg transition-colors"
            >
              Back to truecolorprinting.ca
            </Link>
            <p className="text-xs text-gray-400">
              Changed your mind? Email{" "}
              <a href="mailto:info@true-color.ca" className="text-[#16C2F3] hover:underline">
                info@true-color.ca
              </a>{" "}
              or call (306) 954-8688.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
