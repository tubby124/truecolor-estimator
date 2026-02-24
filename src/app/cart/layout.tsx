import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review your order before checkout. Signs, banners, business cards, and more from True Color Display Printing in Saskatoon.",
  robots: { index: false },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
