"use client";

import { useEffect } from "react";
import { trackPurchase, trackRevenueConversion, type Ga4Item } from "@/lib/analytics";
import { metaTrackPurchase } from "@/lib/analytics/metaPixel";
import {
  conversionTransactionId,
  type RevenueConversionType,
} from "@/lib/analytics/conversions";

interface Props {
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
    trackPurchase({
      transaction_id: orderNumber,
      value: total,
      payment_method: paymentMethod,
      items: items ?? [],
      tax: tax ?? 0,
    });
    const adsTransactionId = conversionType
      ? conversionTransactionId({ conversionType, conversionKey, orderNumber })
      : null;
    if (conversionType && adsTransactionId && googleAdsValue > 0) {
      trackRevenueConversion({
        conversion_type: conversionType,
        transaction_id: adsTransactionId,
        value: googleAdsValue,
      });
      // Google Ads revenue is delivered by the durable server outbox created
      // when payment is confirmed. Do not also fire a browser Ads conversion:
      // confirmation reloads and late webhooks must never duplicate revenue.
    }
    // Meta Pixel: Purchase — eventID set to order_number for client+server CAPI dedup
    metaTrackPurchase({
      content_ids: (items ?? []).map((i) => i.item_id),
      value: total,
      num_items: (items ?? []).reduce((s, i) => s + (i.quantity ?? 1), 0),
      contents: (items ?? []).map((i) => ({ id: i.item_id, quantity: i.quantity ?? 1, item_price: i.price ?? 0 })),
      eventId: orderNumber,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
