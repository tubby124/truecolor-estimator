"use client";

import { useEffect } from "react";
import { type Ga4Item } from "@/lib/analytics";
import { metaTrackPurchase } from "@/lib/analytics/metaPixel";
import { type RevenueConversionType } from "@/lib/analytics/conversions";
import {
  claimClientEvent,
  purchaseEventStorageKey,
} from "@/lib/analytics/client-event-dedupe";

interface Props {
  orderId: string;
  orderNumber: string;
  total: number;
  paymentMethod: string;
  items?: Ga4Item[];
  tax?: number;
  googleAdsValue: number;
  conversionType: RevenueConversionType | null;
  conversionKey: string | null;
}

export function PurchaseEvent({
  orderId,
  orderNumber,
  total,
  paymentMethod,
  items,
  tax,
  googleAdsValue,
  conversionType,
  conversionKey,
}: Props) {
  useEffect(() => {
    if (!claimClientEvent(
      window.localStorage,
      purchaseEventStorageKey(orderNumber),
      orderNumber,
    )) {
      return;
    }
    // GA4 and Google Ads revenue are delivered through the durable server outbox only. Browser
    // confirmations can reload or race payment webhooks, so they must not
    // produce a second purchase or biddable revenue conversion.
    void orderId;
    void total;
    void paymentMethod;
    void tax;
    void googleAdsValue;
    void conversionType;
    void conversionKey;
    // Meta Pixel: Purchase — eventID set to order_number for client+server CAPI dedup
    metaTrackPurchase({
      content_ids: (items ?? []).map((i) => i.item_id),
      value: total,
      num_items: (items ?? []).reduce((s, i) => s + (i.quantity ?? 1), 0),
      contents: (items ?? []).map((i) => ({ id: i.item_id, quantity: i.quantity ?? 1, item_price: i.price ?? 0 })),
    }, { eventId: orderNumber });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
