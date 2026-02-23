"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCartCount } from "@/lib/cart/cart";

export function CartIcon() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Read initial count
    setCount(getCartCount());

    // Listen for storage changes (cross-tab) and custom cart events
    function onStorage(e: StorageEvent) {
      if (e.key === "tc_cart") setCount(getCartCount());
    }
    function onCartUpdate() {
      setCount(getCartCount());
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("tc_cart_updated", onCartUpdate);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("tc_cart_updated", onCartUpdate);
    };
  }, []);

  return (
    <Link
      href="/cart"
      aria-label={`View cart — ${count} item${count !== 1 ? "s" : ""}`}
      className="relative flex items-center justify-center w-9 h-9 text-gray-400 hover:text-white transition-colors"
    >
      {/* Cart icon SVG */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
        />
      </svg>
      {/* Badge */}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-[#16C2F3] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full leading-none">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
