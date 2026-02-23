"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getCart, clearCart, type CartItem } from "@/lib/cart/cart";
import type { CreateOrderRequest } from "@/app/api/orders/route";
import { uploadArtworkFile } from "@/lib/supabase/storage";

const GST_RATE = 0.05;
const RUSH_FEE = 40;

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Contact form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [isRush, setIsRush] = useState(false);

  // Notes + artwork
  const [notes, setNotes] = useState("");
  const [artworkFile, setArtworkFile] = useState<File | null>(null);

  // Payment state
  const [payMethod, setPayMethod] = useState<"clover_card" | "etransfer">("clover_card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setItems(getCart());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const subtotal = items.reduce((s, i) => s + i.sell_price, 0);
  const rush = isRush ? RUSH_FEE : 0;
  const gst = Math.round((subtotal + rush) * GST_RATE * 100) / 100;
  const total = subtotal + rush + gst;

  async function handleSubmit() {
    setError("");
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setLoading(true);
    try {
      // Upload artwork file first if provided
      let filePath: string | undefined;
      if (artworkFile) {
        try {
          filePath = await uploadArtworkFile(artworkFile);
        } catch (uploadErr) {
          console.warn("[checkout] file upload failed (non-fatal):", uploadErr);
          // Non-fatal — continue without file
        }
      }

      const body: CreateOrderRequest = {
        items,
        contact: { name, email, company: company || undefined, phone: phone || undefined },
        is_rush: isRush,
        payment_method: payMethod,
        notes: notes.trim() || undefined,
        file_storage_path: filePath,
      };
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        orderId?: string;
        orderNumber?: string;
        checkoutUrl?: string | null;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Could not create order");
      clearCart();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        window.location.href = "/order-confirmed";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <SiteNav />
        <main className="max-w-2xl mx-auto px-6 py-20 text-center">
          <p className="text-gray-400 text-lg mb-6">Your cart is empty.</p>
          <Link
            href="/quote"
            className="bg-[#16C2F3] text-white font-bold px-8 py-4 rounded-lg hover:bg-[#0fb0dd] transition-colors"
          >
            Get a Price →
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <main className="max-w-5xl mx-auto px-6 py-14">
        <h1 className="text-3xl font-bold text-[#1c1712] mb-10">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left — Contact + Notes + Artwork + Payment */}
          <div className="space-y-8">
            {/* Contact */}
            <section>
              <h2 className="text-lg font-bold text-[#1c1712] mb-4">Your info</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1" htmlFor="name">
                      Name *
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                      placeholder="Jane Smith"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1" htmlFor="email">
                      Email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                      placeholder="jane@example.com"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1" htmlFor="company">
                      Company (optional)
                    </label>
                    <input
                      id="company"
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                      placeholder="ABC Realty"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1" htmlFor="phone">
                      Phone (optional)
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                      placeholder="(306) 555-0100"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Order notes */}
            <section>
              <h2 className="text-lg font-bold text-[#1c1712] mb-3">Notes for your order</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g. 2 signs with logo on left, 1 with logo right. Or: picking up Tuesday AM."
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3] resize-none"
              />
            </section>

            {/* Artwork file */}
            <section>
              <h2 className="text-lg font-bold text-[#1c1712] mb-3">Attach your artwork</h2>
              <label className="block">
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#16C2F3] transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.ai,.eps,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => setArtworkFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  {artworkFile ? (
                    <div>
                      <p className="font-semibold text-[#1c1712] text-sm">📎 {artworkFile.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{(artworkFile.size / 1024 / 1024).toFixed(1)} MB</p>
                      <p className="text-xs text-[#16C2F3] mt-2">Click to change file</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-500">Drop your file here or click to browse</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, AI, EPS, JPG, PNG — up to 50MB</p>
                    </div>
                  )}
                </div>
              </label>
              <p className="text-xs text-gray-400 mt-2">
                No file yet? Bring it on USB or email us after — our designer starts at $35.
              </p>
            </section>

            {/* Rush toggle */}
            <section>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isRush}
                  onChange={(e) => setIsRush(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#16C2F3]"
                />
                <div>
                  <p className="font-semibold text-[#1c1712] group-hover:text-[#16C2F3] transition-colors">
                    Rush my order — +$40
                  </p>
                  <p className="text-sm text-gray-500">
                    Ready the same day if ordered before 10 AM. Call to confirm.
                  </p>
                </div>
              </label>
            </section>

            {/* Payment method */}
            <section>
              <h2 className="text-lg font-bold text-[#1c1712] mb-4">Payment</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-[#16C2F3] transition-colors has-[:checked]:border-[#16C2F3] has-[:checked]:bg-[#f0fbff]">
                  <input
                    type="radio"
                    name="pay"
                    value="clover_card"
                    checked={payMethod === "clover_card"}
                    onChange={() => setPayMethod("clover_card")}
                    className="accent-[#16C2F3]"
                  />
                  <div>
                    <p className="font-semibold text-sm text-[#1c1712]">Pay by card</p>
                    <p className="text-xs text-gray-500">Visa, Mastercard, Amex — secure Clover checkout</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-[#16C2F3] transition-colors has-[:checked]:border-[#16C2F3] has-[:checked]:bg-[#f0fbff]">
                  <input
                    type="radio"
                    name="pay"
                    value="etransfer"
                    checked={payMethod === "etransfer"}
                    onChange={() => setPayMethod("etransfer")}
                    className="accent-[#16C2F3]"
                  />
                  <div>
                    <p className="font-semibold text-sm text-[#1c1712]">Interac e-Transfer</p>
                    <p className="text-xs text-gray-500">Send to info@true-color.ca — auto-deposit enabled</p>
                  </div>
                </label>
              </div>

              {/* eTransfer details */}
              {payMethod === "etransfer" && (
                <div className="mt-4 bg-[#f4efe9] rounded-xl p-5 text-sm space-y-2">
                  <p className="font-bold text-[#1c1712]">Send e-Transfer to:</p>
                  <p className="text-gray-700">
                    <span className="font-mono">info@true-color.ca</span>
                  </p>
                  <p className="text-gray-700">
                    Amount: <span className="font-bold">${total.toFixed(2)}</span>
                  </p>
                  <p className="text-gray-700">
                    Reference: your name + order details
                  </p>
                  <p className="text-gray-500 text-xs mt-2">
                    Auto-deposit is enabled — no security question needed. We&apos;ll confirm by email within 1 business day.
                  </p>
                </div>
              )}
            </section>

            {/* Error */}
            {error && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            {/* Submit */}
            {payMethod === "clover_card" ? (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-[#16C2F3] hover:bg-[#0fb0dd] disabled:opacity-60 text-white font-bold text-lg py-4 rounded-xl transition-colors"
              >
                {loading ? "Creating order…" : `Pay $${total.toFixed(2)} →`}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-[#1c1712] hover:bg-black disabled:opacity-60 text-white font-bold text-lg py-4 rounded-xl transition-colors"
              >
                {loading ? "Submitting order…" : `Submit order — pay $${total.toFixed(2)} by e-Transfer`}
              </button>
            )}
            {payMethod === "etransfer" && !loading && (
              <div className="text-center py-0 border border-gray-100 rounded-xl p-4">
                <p className="text-sm text-gray-500">
                  After submitting, send your e-Transfer, then{" "}
                  <a href="mailto:info@true-color.ca" className="text-[#16C2F3] underline">
                    email us
                  </a>{" "}
                  your order details.
                </p>
                <p className="text-xs text-gray-400 mt-1">We&apos;ll confirm and start production within 1 business day.</p>
              </div>
            )}

            <p className="text-xs text-gray-400 text-center">
              Need help? Call{" "}
              <a href="tel:+13069548688" className="underline">
                (306) 954-8688
              </a>
            </p>
          </div>

          {/* Right — Order Summary */}
          <div>
            <div className="bg-gray-50 rounded-2xl p-6 sticky top-24">
              <h2 className="text-lg font-bold text-[#1c1712] mb-5">Order summary</h2>

              <div className="space-y-3 mb-5">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#1c1712]">{item.product_name}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.label}</p>
                    </div>
                    <p className="text-sm font-bold text-[#1c1712] shrink-0">
                      ${item.sell_price.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {isRush && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Rush fee</span>
                    <span>${RUSH_FEE.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>GST (5%)</span>
                  <span>${gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-[#1c1712] text-base pt-2">
                  <span>Total</span>
                  <span>${total.toFixed(2)} CAD</span>
                </div>
              </div>

              <div className="mt-5 text-xs text-gray-400 space-y-1">
                <p>📍 Pickup: 216 33rd St W, Saskatoon</p>
                <p>📞 Questions: (306) 954-8688</p>
              </div>

              <Link
                href="/cart"
                className="block text-center text-xs text-gray-400 hover:text-[#16C2F3] mt-4 transition-colors"
              >
                ← Edit cart
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
