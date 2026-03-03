import type { Metadata } from "next";
import { CouponsClient } from "./CouponsClient";

export const metadata: Metadata = {
  title: "Coupons — True Color Staff",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default function StaffCouponsPage() {
  return <CouponsClient />;
}
