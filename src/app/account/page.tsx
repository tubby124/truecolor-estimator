import type { Metadata } from "next";
import { AccountClientPage } from "./AccountClientPage";

export const metadata: Metadata = {
  title: "Your Orders — True Color",
  robots: { index: false },
};

export default function AccountPage() {
  return <AccountClientPage />;
}
