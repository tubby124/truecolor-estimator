"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  oid: string;
}

/**
 * Polls /api/orders/payment-status every 4 seconds for up to 90 seconds.
 * Refreshes the page as soon as the order leaves pending_payment.
 * This is a fallback for when the Clover webhook updates the DB slightly
 * after the redirect lands — bridging the race window.
 */
export function CloverPaymentWatcher({ oid }: Props) {
  const router = useRouter();

  useEffect(() => {
    let attempts = 0;
    const MAX = 22; // ~90 seconds at 4s intervals

    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/orders/payment-status?oid=${oid}`);
        if (!res.ok) return;
        const { status } = (await res.json()) as { status: string };
        if (status !== "pending_payment") {
          clearInterval(interval);
          router.refresh();
        }
      } catch {
        // Network error — keep polling
      }
      if (attempts >= MAX) clearInterval(interval);
    }, 4000);

    return () => clearInterval(interval);
  }, [oid, router]);

  return null;
}
