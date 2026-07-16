"use client";

import { useEffect } from "react";
import { trackPurchase, type Ga4Item } from "@/lib/analytics";
import { metaTrackPurchase } from "@/lib/analytics/metaPixel";
import { sendGoogleAdsPurchase } from "@/lib/analytics/google-ads";

interface Props {
  orderNumber: string;
  total: number;
  paymentMethod: string;
  items?: Ga4Item[];
  tax?: number;
}

export function PurchaseEvent({
  orderNumber,
  total,
  paymentMethod,
  items,
  tax,
}: Props) {
  useEffect(() => {
    trackPurchase({
      transaction_id: orderNumber,
      value: total,
      payment_method: paymentMethod,
      items: items ?? [],
      tax: tax ?? 0,
    });
    void sendGoogleAdsPurchase({
      conversionLabel: process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_CONVERSION_LABEL,
      transactionId: orderNumber,
      value: total,
    });
    // Meta Pixel: Purchase — eventID set to order_number for client+server CAPI dedup
    metaTrackPurchase({
      content_ids: (items ?? []).map((i) => i.item_id),
      value: total,
      num_items: (items ?? []).reduce((s, i) => s + (i.quantity ?? 1), 0),
      contents: (items ?? []).map((i) => ({ id: i.item_id, quantity: i.quantity ?? 1, item_price: i.price ?? 0 })),
    });
    // Manual fbq call with eventID (the helper doesn't accept it) — enables dedup with server CAPI
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "Purchase", {
        content_type: "product",
        currency: "CAD",
        value: total,
        content_ids: (items ?? []).map((i) => i.item_id),
        contents: (items ?? []).map((i) => ({ id: i.item_id, quantity: i.quantity ?? 1, item_price: i.price ?? 0 })),
      }, { eventID: orderNumber });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
