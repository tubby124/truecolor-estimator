import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { CustomersTable } from "./CustomersTable";
import { LOGO_PATH } from "@/lib/config";

export const metadata: Metadata = {
  title: "Customers — True Color Staff",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export interface CustomerRow {
  id: string;
  name: string | null;
  email: string;
  company: string | null;
  phone: string | null;
  created_at: string;
  order_count: number;
  total_spend: number;
  last_order_date: string | null;
  quote_count: number;
  unreplied_quotes: number;
  /** True = auth account exists but no order has been placed yet */
  account_only: boolean;
  /** OAuth provider, e.g. "google", "email" */
  auth_provider: string | null;
  email_confirmed: boolean;
}

export default async function StaffCustomersPage() {
  let customers: CustomerRow[] = [];
  let fetchError: string | null = null;

  try {
    customers = await fetchCustomers();
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Could not load customers";
  }

  const totalUnreplied = customers.reduce((n, c) => n + c.unreplied_quotes, 0);

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
              Customers
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
              href="/staff/quotes"
              className="inline-flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold px-4 min-h-[44px] rounded-lg transition-colors whitespace-nowrap"
            >
              Quotes
              {totalUnreplied > 0 && (
                <span className="bg-amber-400 text-[#1c1712] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalUnreplied}
                </span>
              )}
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
          <h1 className="text-3xl font-bold text-[#1c1712]">Customers</h1>
          <p className="text-gray-500 text-sm mt-1">
            {customers.length} customer{customers.length !== 1 ? "s" : ""} — click any row to view quotes and send replies
          </p>
        </div>

        {fetchError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-semibold">Could not load customers</p>
            <p className="text-red-500 text-sm mt-1">{fetchError}</p>
          </div>
        ) : (
          <CustomersTable customers={customers} />
        )}
      </main>

      <footer className="border-t border-gray-100 py-5 text-center text-xs text-gray-400">
        True Color Staff Portal · Internal use only
      </footer>
    </div>
  );
}

async function fetchCustomers(): Promise<CustomerRow[]> {
  const supabase = createServiceClient();

  // Fetch customers, auth users, and quote counts in parallel
  const [customersResult, authResult, quoteRowsResult] = await Promise.all([
    supabase
      .from("customers")
      .select(`id, name, email, company, phone, created_at, orders ( id, total, created_at )`)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    supabase.from("quote_requests").select("email, replied_at"),
  ]);

  if (customersResult.error) throw new Error(customersResult.error.message);

  const quoteCounts: Record<string, { total: number; unreplied: number }> = {};
  for (const q of quoteRowsResult.data ?? []) {
    const e = (q.email as string)?.toLowerCase() ?? "";
    if (!quoteCounts[e]) quoteCounts[e] = { total: 0, unreplied: 0 };
    quoteCounts[e].total++;
    if (!q.replied_at) quoteCounts[e].unreplied++;
  }

  // Build customer rows from the `customers` table
  const customerEmailSet = new Set<string>();
  const rows: CustomerRow[] = (customersResult.data ?? []).map((c) => {
    const orders = (c.orders ?? []) as Array<{ id: string; total: number | null; created_at: string }>;
    const emailKey = (c.email as string)?.toLowerCase() ?? "";
    customerEmailSet.add(emailKey);
    const sortedOrders = [...orders].sort((a, b) => b.created_at.localeCompare(a.created_at));
    return {
      id: c.id as string,
      name: (c.name as string | null) ?? null,
      email: c.email as string,
      company: (c.company as string | null) ?? null,
      phone: (c.phone as string | null) ?? null,
      created_at: c.created_at as string,
      order_count: orders.length,
      total_spend: orders.reduce((sum, o) => sum + (o.total ?? 0), 0),
      last_order_date: sortedOrders[0]?.created_at ?? null,
      quote_count: quoteCounts[emailKey]?.total ?? 0,
      unreplied_quotes: quoteCounts[emailKey]?.unreplied ?? 0,
      account_only: false,
      auth_provider: null,
      email_confirmed: true,
    };
  });

  // Add auth users who don't have a customer record (signed up but no order yet)
  const authUsers = authResult.data?.users ?? [];
  for (const u of authUsers) {
    if (!u.email) continue;
    const emailKey = u.email.toLowerCase();
    if (customerEmailSet.has(emailKey)) continue;
    const provider = u.app_metadata?.provider as string | undefined ?? null;
    rows.push({
      id: u.id,
      name: (u.user_metadata?.full_name ?? u.user_metadata?.name ?? null) as string | null,
      email: u.email,
      company: null,
      phone: null,
      created_at: u.created_at,
      order_count: 0,
      total_spend: 0,
      last_order_date: null,
      quote_count: quoteCounts[emailKey]?.total ?? 0,
      unreplied_quotes: quoteCounts[emailKey]?.unreplied ?? 0,
      account_only: true,
      auth_provider: provider,
      email_confirmed: !!u.email_confirmed_at,
    });
  }

  // Sort: unreplied first, then most recent
  rows.sort((a, b) => {
    if (b.unreplied_quotes !== a.unreplied_quotes) return b.unreplied_quotes - a.unreplied_quotes;
    return b.created_at.localeCompare(a.created_at);
  });

  return rows;
}
