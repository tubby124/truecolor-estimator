import type { Metadata } from "next";
import { AccountClientPage } from "./AccountClientPage";

export const metadata: Metadata = {
  title: "Your Orders — True Color",
  description: "View your order history and track order status with True Color Display Printing.",
  robots: { index: false },
};

export default function AccountPage() {
  return <AccountClientPage />;
}
