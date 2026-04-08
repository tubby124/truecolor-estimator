"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  oid: string;
}

/**
 * Polls /api/orders/payment-status every 4 seconds for up to 90 seconds.
 * Refreshes the page as soon as the order leaves pending_payment.
 * If polling times out, shows a clear failure message so the customer
 * knows their payment did not go through.
 */
export function CloverPaymentWatcher({ oid }: Props) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

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
      if (attempts >= MAX) {
        clearInterval(interval);
        setTimedOut(true);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [oid, router]);

  if (timedOut) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-left mb-8">
        <p className="font-bold text-red-800 mb-1">Payment not confirmed</p>
        <p className="text-sm text-red-700 leading-relaxed mb-3">
          We could not confirm your card payment. Your card may have been declined,
          or the transaction timed out. Any pending holds on your bank statement
          will expire automatically within a few business days — you have not been charged.
        </p>
        <p className="text-sm text-red-700 leading-relaxed">
          Please try paying again using the link in your email, use a different card,
          or contact us at{" "}
          <a href="tel:+13069548688" className="underline font-semibold">(306) 954-8688</a>{" "}
          to pay over the phone.
        </p>
      </div>
    );
  }

  return null;
}
