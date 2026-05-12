"use client";

import { useEffect } from "react";
import { trackPurchase, type Ga4Item } from "@/lib/analytics";

interface Props {
  orderNumber: string;
  total: number;
  paymentMethod: string;
  items?: Ga4Item[];
  tax?: number;
}

export function PurchaseEvent({ orderNumber, total, paymentMethod, items, tax }: Props) {
  useEffect(() => {
    trackPurchase({
      transaction_id: orderNumber,
      value: total,
      payment_method: paymentMethod,
      items: items ?? [],
      tax: tax ?? 0,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
