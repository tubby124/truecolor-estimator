import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order with True Color Display Printing. Secure payment via card or e-Transfer. Local Saskatoon pickup at 216 33rd St W.",
  robots: { index: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
