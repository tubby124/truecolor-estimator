"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { addToCart } from "@/lib/cart/cart";
import { AuthGate } from "@/components/account/AuthGate";
import { PasswordResetForm } from "@/components/account/PasswordResetForm";
import { OrdersList } from "@/components/account/OrdersList";
import { QuotesList } from "@/components/account/QuotesList";
import { ProfileForm } from "@/components/account/ProfileForm";
import { WelcomeBanner } from "@/components/account/WelcomeBanner";
import { ReceiptModal } from "@/components/account/ReceiptModal";
import type { Order, SessionData, QuoteRequest, CustomerProfile } from "@/components/account/types";
import { STAFF_EMAIL } from "@/components/account/constants";

// ─── Main component ───────────────────────────────────────────────────────────

export function AccountClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [reorderedId, setReorderedId] = useState<string | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // File upload state
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [uploadDone, setUploadDone] = useState<Set<string>>(new Set());
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Quote requests
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);

  // Profile editing
  const [profile, setProfile] = useState<CustomerProfile>({ name: "", phone: "", company: "", address: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  const isReset =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("reset") === "1";

  const isWelcome =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("welcome") === "1";

  // ── Fetch orders ────────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async (tok: string) => {
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/account/orders", {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const data: { orders?: Order[] } = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch (err) {
      console.error("[account] fetchOrders:", err);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const fetchQuotes = useCallback(async (tok: string) => {
    setQuotesLoading(true);
    try {
      const res = await fetch("/api/account/quotes", {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const data: { quotes?: QuoteRequest[] } = await res.json();
      if (data.quotes) setQuoteRequests(data.quotes);
    } catch (err) {
      console.error("[account] fetchQuotes:", err);
    } finally {
      setQuotesLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async (tok: string) => {
    try {
      const res = await fetch("/api/account/profile", {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const data: Partial<CustomerProfile> = await res.json();
      setProfile({
        name: data.name ?? "",
        phone: data.phone ?? "",
        company: data.company ?? "",
        address: data.address ?? "",
      });
    } catch (err) {
      console.error("[account] fetchProfile:", err);
    }
  }, []);

  // ── Auth + initial load ─────────────────────────────────────────────────────

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email?.toLowerCase() === STAFF_EMAIL) {
        router.replace("/staff/orders");
        return;
      }
      if (session) setSession(session as SessionData);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        if (session.user?.email?.toLowerCase() === STAFF_EMAIL) {
          router.replace("/staff/orders");
          return;
        }
        setSession(session as SessionData);
        setLoading(false);
      } else {
        setSession(null);
        setOrders([]);
        setLoading(false);
      }
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        supabase.auth.getSession().then(({ data: { session: s } }) => {
          if (!s) {
            setSession(null);
            setOrders([]);
          }
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      listener.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  // ── Load orders / quotes / profile on session ───────────────────────────────

  useEffect(() => {
    if (!session) return;
    fetchOrders(session.access_token);
    fetchQuotes(session.access_token);
    fetchProfile(session.access_token);
  }, [session, fetchOrders, fetchQuotes, fetchProfile]);

  // ── Supabase Realtime: live order sync ─────────────────────────────────────
  // Listens to changes on the orders table. When staff updates status, uploads proof, etc.
  // the customer sees it instantly.

  useEffect(() => {
    if (!session) return;

    const supabase = createClient();
    const channel = supabase
      .channel("customer-orders-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchOrders(session.access_token);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session, fetchOrders]);

  // ── Action handlers ─────────────────────────────────────────────────────────

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setSession(null);
    setOrders([]);
    setQuoteRequests([]);
    setProfile({ name: "", phone: "", company: "", address: "" });
  }

  function handleReorder(order: Order) {
    order.order_items.forEach((item) => {
      addToCart({
        product_name: item.product_name,
        product_slug: item.category.toLowerCase().replace(/_/g, "-"),
        category: item.category,
        label: `${
          item.width_in && item.height_in
            ? `${item.width_in}\u00d7${item.height_in}" \u2014 `
            : ""
        }${item.category === "BOOKLET" ? "~80 pages" : item.sides === 2 ? "Double-sided" : "Single-sided"} \u00d7 ${item.qty}`,
        config: {
          category: item.category,
          material_code: item.material_code ?? undefined,
          width_in: item.width_in ?? undefined,
          height_in: item.height_in ?? undefined,
          sides: item.sides,
          qty: item.qty,
          design_status: item.design_status,
        },
        sell_price: item.line_total,
        gst_rate: 0.05,
        qty: item.qty,
      });
    });
    setReorderedId(order.id);
    setTimeout(() => router.push("/cart"), 800);
  }

  async function handleProfileSave() {
    if (!session) return;
    setProfileSaving(true);
    setProfileError("");
    setProfileSaved(false);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        const d: { error?: string } = await res.json();
        throw new Error(d.error ?? "Save failed");
      }
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleFileUpload(orderId: string, file: File) {
    setUploadingFile(orderId);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/account/orders/${orderId}/upload-file`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session!.access_token}` },
        body: form,
      });
      const data: { ok?: boolean; filePath?: string; error?: string } =
        await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setUploadDone((prev) => new Set([...prev, orderId]));
      await fetchOrders(session!.access_token);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed. Please try again."
      );
    } finally {
      setUploadingFile(null);
    }
  }

  // ── Loading state ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <SiteNav />
        <main id="main-content" className="max-w-3xl mx-auto px-6 py-20 text-center">
          <div className="h-8 w-32 bg-gray-100 rounded animate-pulse mx-auto" />
        </main>
      </div>
    );
  }

  // ── Password reset ───────────────────────────────────────────────────────────

  if (isReset) {
    return <PasswordResetForm onDone={(s) => { setSession(s); setLoading(false); }} />;
  }

  // ── Not logged in ────────────────────────────────────────────────────────────

  if (!session) {
    return <AuthGate onSessionCreated={(s) => { setSession(s); setLoading(false); }} />;
  }

  // ── Logged in — order dashboard ──────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />
      <main id="main-content" className="max-w-3xl mx-auto px-4 sm:px-6 py-12">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1c1712]">Your orders</h1>
            <p className="text-gray-500 text-sm mt-1">{session.user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors mt-1"
          >
            Sign out
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 flex-wrap mb-8 text-sm">
          <Link
            href="/products"
            className="bg-[#16C2F3] text-white font-bold px-4 py-2 rounded-lg hover:bg-[#0fb0dd] transition-colors"
          >
            Get a price &rarr;
          </Link>
          <a
            href="tel:+13069548688"
            className="border border-gray-200 text-gray-600 font-semibold px-4 py-2 rounded-lg hover:border-[#16C2F3] hover:text-[#16C2F3] transition-colors"
          >
            📞 (306) 954-8688
          </a>
          <a
            href="mailto:info@true-color.ca"
            className="border border-gray-200 text-gray-600 font-semibold px-4 py-2 rounded-lg hover:border-[#16C2F3] hover:text-[#16C2F3] transition-colors"
          >
            ✉ Email us
          </a>
        </div>

        {/* WELCOME10 banner — shown for new customers with no orders yet */}
        {(isWelcome || (!ordersLoading && orders.length === 0)) && <WelcomeBanner />}

        {/* Orders list */}
        <OrdersList
          orders={orders}
          ordersLoading={ordersLoading}
          expandedOrder={expandedOrder}
          setExpandedOrder={setExpandedOrder}
          uploadingFile={uploadingFile}
          uploadDone={uploadDone}
          uploadError={uploadError}
          reorderedId={reorderedId}
          onReorder={handleReorder}
          onFileUpload={handleFileUpload}
          onReceiptClick={setReceiptOrder}
        />

        {/* Quote requests */}
        <QuotesList quoteRequests={quoteRequests} quotesLoading={quotesLoading} />

        {/* Profile */}
        <ProfileForm
          profile={profile}
          setProfile={setProfile}
          onSave={handleProfileSave}
          saving={profileSaving}
          saved={profileSaved}
          error={profileError}
        />

      </main>
      <SiteFooter />

      {/* Receipt modal */}
      {receiptOrder && (
        <ReceiptModal
          order={receiptOrder}
          email={session.user.email ?? ""}
          onClose={() => setReceiptOrder(null)}
        />
      )}
    </div>
  );
}
