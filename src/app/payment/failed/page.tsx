import type { Metadata } from "next";
import { PaymentResult } from "../PaymentResult";

export const metadata: Metadata = {
  title: "Payment Did Not Complete — True Color",
  robots: { index: false, follow: false },
};

export default async function PaymentFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ oid?: string; orderId?: string; checkoutSessionId?: string; sessionId?: string }>;
}) {
  return <PaymentResult kind="failed" searchParams={await searchParams} />;
}
