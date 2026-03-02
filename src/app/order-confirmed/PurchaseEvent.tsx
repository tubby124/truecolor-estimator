"use client";

import { useEffect } from "react";
import { trackPurchase } from "@/lib/analytics";

interface Props {
  orderNumber: string;
  total: number;
  paymentMethod: string;
}

export function PurchaseEvent({ orderNumber, total, paymentMethod }: Props) {
  useEffect(() => {
    trackPurchase({
      transaction_id: orderNumber,
      value: total,
      payment_method: paymentMethod,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
