"use client";

import { CheckCircle2, ShoppingBag } from "lucide-react";
import { PaidCtaLink } from "@/components/paid/PaidProductLink";

interface PaidCartConfirmationProps {
  productName: string;
}

export const PAID_CART_ACTIONS = [
  { href: "/why-true-color", label: "Continue shopping", action: "continue_shopping" },
  { href: "/cart", label: "View cart", action: "view_cart" },
  { href: "/checkout", label: "Checkout", action: "checkout" },
] as const;

export function PaidCartConfirmation({ productName }: PaidCartConfirmationProps) {
  return (
    <aside
      aria-label="Item added to cart"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-200 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-16px_45px_rgba(28,23,18,0.16)] backdrop-blur sm:px-5"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3" role="status" aria-live="polite">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 size={23} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-black text-[#1c1712]">Added to cart</p>
            <p className="truncate text-sm text-gray-600">{productName} is ready for checkout.</p>
          </div>
        </div>

        <nav aria-label="Cart next steps" className="grid grid-cols-3 gap-2 sm:flex sm:shrink-0">
          <PaidCtaLink
            href={PAID_CART_ACTIONS[0].href}
            action={PAID_CART_ACTIONS[0].action}
            placement="post_add_to_cart"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-2 text-center text-xs font-bold leading-tight text-[#1c1712] transition hover:border-[#16C2F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16C2F3] sm:px-4 sm:text-sm"
          >
            Continue shopping
          </PaidCtaLink>
          <PaidCtaLink
            href={PAID_CART_ACTIONS[1].href}
            action={PAID_CART_ACTIONS[1].action}
            placement="post_add_to_cart"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-2 text-center text-xs font-bold text-[#1c1712] transition hover:border-[#16C2F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16C2F3] sm:px-4 sm:text-sm"
          >
            View cart
          </PaidCtaLink>
          <PaidCtaLink
            href={PAID_CART_ACTIONS[2].href}
            action={PAID_CART_ACTIONS[2].action}
            placement="post_add_to_cart"
            className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg bg-[#c92719] px-2 text-center text-xs font-black text-white transition hover:bg-[#a91f14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c92719] focus-visible:ring-offset-2 sm:px-4 sm:text-sm"
          >
            <ShoppingBag size={15} aria-hidden="true" />
            Checkout
          </PaidCtaLink>
        </nav>
      </div>
    </aside>
  );
}
