import type { Metadata } from "next";
import { PaymentResult } from "../PaymentResult";

export const metadata: Metadata = {
  title: "Checkout Cancelled — True Color",
  robots: { index: false, follow: false },
};

export default async function PaymentCancelledPage({
  searchParams,
}: {
  searchParams: Promise<{ oid?: string; orderId?: string; checkoutSessionId?: string; sessionId?: string }>;
}) {
  return <PaymentResult kind="cancelled" searchParams={await searchParams} />;
}
