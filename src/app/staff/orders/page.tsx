import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import { createServiceClient } from "@/lib/supabase/server";
import { OrdersTable } from "./OrdersTable";
import { LOGO_PATH } from "@/lib/config";

export const metadata: Metadata = {
  title: "Orders — True Color Staff",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function StaffOrdersPage() {
  let orders: Awaited<ReturnType<typeof fetchOrders>> = [];
  let fetchError: string | null = null;

  try {
    orders = await fetchOrders();
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Could not load orders";
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Staff header — mirrors the estimator header for consistency */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
          {/* Left: logo + page title */}
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_PATH} alt="True Color Display Printing" className="h-8 w-auto object-contain flex-shrink-0" />
            <span className="text-sm font-semibold text-[#1c1712] truncate">Orders</span>
          </div>

          {/* Right: nav actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/"
              className="inline-flex items-center min-h-[44px] px-2 text-xs text-gray-400 hover:text-gray-600 transition-colors whitespace-nowrap"
              aria-label="Back to website"
            >
              ← Website
            </Link>
            <Link
              href="/staff"
              className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold px-4 min-h-[44px] rounded-lg transition-colors whitespace-nowrap"
              aria-label="Open staff estimator to create a new quote"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Make a Quote</span>
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1c1712]">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Staff view — manage all orders</p>
        </div>

        {fetchError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-semibold">Could not load orders</p>
            <p className="text-red-500 text-sm mt-1">{fetchError}</p>
            <p className="text-gray-500 text-xs mt-3">
              Check that SUPABASE_SECRET_KEY is set in Vercel environment variables.
            </p>
          </div>
        ) : (
          <OrdersTable initialOrders={orders} />
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

async function fetchOrders() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      status,
      is_rush,
      is_archived,
      archived_at,
      subtotal,
      gst,
      total,
      payment_method,
      wave_invoice_id,
      wave_invoice_approved_at,
      wave_payment_recorded_at,
      created_at,
      notes,
      staff_notes,
      proof_storage_path,
      proof_sent_at,
      file_storage_paths,
      customers ( name, email, company, phone ),
      order_items (
        id,
        product_name,
        qty,
        width_in,
        height_in,
        sides,
        design_status,
        line_total,
        category,
        file_storage_path
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);

  return data ?? [];
}
