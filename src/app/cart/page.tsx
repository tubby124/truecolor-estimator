"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getCart, removeFromCart, addToCart, type CartItem } from "@/lib/cart/cart";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast, ToastContainer } from "@/components/ui/Toast";

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const { toasts, showToast, dismissToast } = useToast();

  useEffect(() => {
    setItems(getCart());
    setMounted(true);
  }, []);

  function handleRemove(id: string) {
    const removed = items.find((i) => i.id === id);
    const updated = removeFromCart(id);
    setItems(updated);
    if (removed) {
      const { id: _id, ...rest } = removed;
      showToast("Item removed", "info", {
        label: "Undo",
        onClick: () => {
          addToCart(rest);
          setItems(getCart());
        },
      });
    }
  }

  const subtotal = items.reduce((s, i) => s + i.sell_price, 0);
  const gstRate = items[0]?.gst_rate ?? 0.05;
  const gst = Math.round(subtotal * gstRate * 100) / 100;
  const total = subtotal + gst;

  if (!mounted)
    return (
      <div className="min-h-screen bg-white">
        <SiteNav />
        <main id="main-content" className="max-w-3xl mx-auto px-6 py-14">
          <Skeleton className="h-8 w-40 mb-8" />
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-5 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
            <div className="border-t border-gray-200 pt-6 mt-6 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <main id="main-content" className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="text-3xl font-bold text-[#1c1712] mb-8">Your Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-6">Your cart is empty.</p>
            <Link
              href="/quote"
              className="bg-[#16C2F3] text-white font-bold px-8 py-4 rounded-lg hover:bg-[#0fb0dd] transition-colors"
            >
              Get a Price →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Line items */}
            {items.map((item) => (
              <div
                key={item.id}
                className="border border-gray-100 rounded-xl p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="flex-1">
                  <p className="font-bold text-[#1c1712]">{item.product_name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{item.label}</p>
                  {/* Addon sub-rows from engine line_items */}
                  {item.line_items && item.line_items.length > 1 && (
                    <div className="mt-2 space-y-0.5">
                      {item.line_items.slice(1).map((li, i) => (
                        <p key={i} className="text-xs text-gray-400 pl-3 border-l-2 border-gray-100">
                          {li.description}: ${li.line_total.toFixed(2)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <p className="font-bold text-[#1c1712]">
                      ${item.sell_price.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">+ GST</p>
                  </div>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {/* Order total */}
            <div className="border-t border-gray-200 pt-6 mt-6 space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>GST ({Math.round(gstRate * 100)}%)</span>
                <span>${gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-[#1c1712] text-lg pt-2">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <div className="pt-4 space-y-3">
              <Link
                href="/checkout"
                className="block w-full bg-[#16C2F3] hover:bg-[#0fb0dd] text-white font-bold text-lg py-4 rounded-lg text-center transition-colors"
              >
                Proceed to Checkout →
              </Link>

              <Link
                href="/quote"
                className="block w-full border border-gray-200 text-gray-600 font-medium text-center py-3 rounded-lg hover:border-[#16C2F3] hover:text-[#16C2F3] transition-colors text-sm"
              >
                ← Keep shopping
              </Link>
            </div>

            {/* Trust note */}
            <p className="text-xs text-gray-400 text-center pt-2">
              All prices in CAD + 5% GST · Pickup at 216 33rd St W, Saskatoon
            </p>
          </div>
        )}
      </main>

      <SiteFooter />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
