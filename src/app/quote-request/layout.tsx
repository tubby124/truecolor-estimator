import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Custom Quote Request | True Color Display Printing Saskatoon",
  description:
    "Need something custom? Submit a quote request to True Color Display Printing in Saskatoon. Signs, banners, large format, installation, and design services. We'll reply same business day.",
  alternates: { canonical: "/quote-request" },
  openGraph: {
    title: "Custom Quote Request | True Color Display Printing",
    description:
      "Submit a custom print quote request to True Color Display Printing. Saskatoon local pickup. Same-day rush available.",
    url: "https://truecolorprinting.ca/quote-request",
    type: "website",
  },
};

export default function QuoteRequestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
