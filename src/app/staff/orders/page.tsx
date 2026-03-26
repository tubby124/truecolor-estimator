import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import { OrdersTable } from "./OrdersTable";
import { StaffOrdersActions } from "./StaffOrdersActions";
import { LOGO_PATH } from "@/lib/config";

export const metadata: Metadata = {
  title: "Orders — True Color Staff",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function StaffOrdersPage() {
  let orders: Awaited<ReturnType<typeof fetchOrders>> = [];
  let fetchError: string | null = null;
  let newQuoteCount = 0;

  try {
    [orders, newQuoteCount] = await Promise.all([
      fetchOrders(),
      fetchNewQuoteCount(),
    ]);
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

          {/* Right: nav actions (Request Payment + Social Studio + Make a Quote) */}
          <StaffOrdersActions newQuoteCount={newQuoteCount} />
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

      <footer className="border-t border-gray-100 py-5 text-center text-xs text-gray-400">
        True Color Staff Portal · Internal use only
      </footer>
    </div>
  );
}

async function fetchNewQuoteCount(): Promise<number> {
  const supabase = createServiceClient();
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  // Count unreplied quotes from the last 7 days (replied_at column may not exist yet)
  try {
    const { count } = await supabase
      .from("quote_requests")
      .select("*", { count: "exact", head: true })
      .gte("created_at", cutoff)
      .is("replied_at", null);
    return count ?? 0;
  } catch {
    // Fallback: count all quotes from last 7 days if replied_at column doesn't exist yet
    const { count } = await supabase
      .from("quote_requests")
      .select("*", { count: "exact", head: true })
      .gte("created_at", cutoff);
    return count ?? 0;
  }
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
      proof_storage_paths,
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
