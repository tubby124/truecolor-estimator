import type { Metadata } from "next";
import { PaymentResult } from "../PaymentResult";

export const metadata: Metadata = {
  title: "Payment Verification — True Color",
  robots: { index: false, follow: false },
};

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ oid?: string; orderId?: string; checkoutSessionId?: string; sessionId?: string }>;
}) {
  return <PaymentResult kind="success" searchParams={await searchParams} />;
}
