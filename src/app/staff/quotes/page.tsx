import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { QuotesTable } from "./QuotesTable";
import { LOGO_PATH } from "@/lib/config";

export const metadata: Metadata = {
  title: "Quote Requests — True Color Staff",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export interface ItemMeta {
  product: string;
  qty: string;
  material: string;
  dimensions: string;
  sides: string;
  notes: string;
}

export interface QuoteRequest {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  items: ItemMeta[];
  file_links: string[] | null;
}

export default async function StaffQuotesPage() {
  let quotes: QuoteRequest[] = [];
  let fetchError: string | null = null;

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("quote_requests")
      .select("id, created_at, name, email, phone, items, file_links")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw new Error(error.message);
    quotes = (data ?? []) as QuoteRequest[];
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Could not load quotes";
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_PATH}
              alt="True Color Display Printing"
              className="h-8 w-auto object-contain flex-shrink-0"
            />
            <span className="text-sm font-semibold text-[#1c1712] truncate">
              Quote Requests
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/"
              className="inline-flex items-center min-h-[44px] px-2 text-xs text-gray-400 hover:text-gray-600 transition-colors whitespace-nowrap"
            >
              ← Website
            </Link>
            <Link
              href="/staff/orders"
              className="inline-flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold px-4 min-h-[44px] rounded-lg transition-colors whitespace-nowrap"
            >
              Orders
            </Link>
            <Link
              href="/staff"
              className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold px-4 min-h-[44px] rounded-lg transition-colors whitespace-nowrap"
            >
              Make a Quote
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1c1712]">Quote Requests</h1>
          <p className="text-gray-500 text-sm mt-1">
            Incoming requests from the website form — {quotes.length} total
          </p>
        </div>

        {fetchError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-semibold">Could not load quotes</p>
            <p className="text-red-500 text-sm mt-1">{fetchError}</p>
          </div>
        ) : (
          <QuotesTable quotes={quotes} />
        )}
      </main>

      <footer className="border-t border-gray-100 py-5 text-center text-xs text-gray-400">
        True Color Staff Portal · Internal use only
      </footer>
    </div>
  );
}
