import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Same Day Printing Saskatoon | Rush +$40 Flat | True Color Display Printing",
  description:
    "Same-day printing in Saskatoon. Order before 10 AM, pick up by 5 PM. Signs, banners, business cards, flyers. Rush fee $40 flat — no per-item upcharge. 216 33rd St W.",
  alternates: { canonical: "/same-day-printing-saskatoon" },
  openGraph: {
    title: "Same Day Printing Saskatoon | True Color Display Printing",
    description:
      "Order before 10 AM, ready by 5 PM. Signs, banners, cards, flyers. Rush +$40 flat. Local Saskatoon pickup.",
    url: "https://truecolorprinting.ca/same-day-printing-saskatoon",
    type: "website",
  },
};

export default function SameDayPrintingSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="same-day-printing-saskatoon"
      title="Same Day Printing Saskatoon"
      subtitle="Order before 10 AM — pick up by 5 PM. Rush is +$40 flat, no per-item upcharge."
      heroImage="/images/products/heroes/construction-hero-1200x500.webp"
      heroAlt="Same day printing Saskatoon — signs, banners, and cards ready today"
      description="True Color Display Printing offers genuine same-day printing in Saskatoon. Order before 10 AM and we confirm availability by phone — your order is ready by 5 PM the same day. The rush fee is a flat $40 added to your order total, not a per-item surcharge. We print coroplast signs, vinyl banners, business cards, flyers, and vehicle magnets in-house on our Roland UV printer. No outsourcing, no shipping wait, no excuses."
      products={[
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Business Cards", from: "250 for $40", slug: "business-cards" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
        { name: "Foamboard Displays", from: "from $8/sqft", slug: "foamboard-displays" },
      ]}
      whyPoints={[
        "Rush fee is $40 flat on the full order — no per-sign or per-item upcharge",
        "Order before 10 AM — ready for pickup by 5 PM the same day",
        "In-house Roland UV printer — we never outsource, so we control the timeline",
        "In-house designer: bring your file or we prep it on the spot (from $35)",
        "Call (306) 954-8688 to confirm same-day capacity before ordering",
        "Pickup at 216 33rd St W, Saskatoon — no shipping delay, ever",
      ]}
      faqs={[
        {
          q: "How does same-day printing work at True Color?",
          a: "Order before 10 AM and call (306) 954-8688 to confirm capacity. We add a flat $40 rush fee to your order total. Your prints are ready for pickup by 5 PM the same business day. Same-day applies to: coroplast signs, vinyl banners, foamboard, flyers, business cards, and vehicle magnets.",
        },
        {
          q: "What's the rush fee?",
          a: "A flat $40 added to your order. Not per sign, not per sqft — just $40 total regardless of order size. So if you're ordering 20 signs, the rush fee is still $40.",
        },
        {
          q: "What products are available same-day?",
          a: "Coroplast signs, vinyl banners, foamboard displays, flyers, business cards, and vehicle magnets. Aluminum composite (ACP) signs may require an extra day. Call to confirm for your specific order.",
        },
        {
          q: "What if I don't have a print-ready file?",
          a: "Our in-house designer can prep your file on the spot starting at $35. Bring a logo (any quality), a sketch, or a reference photo. Design turnaround is usually under 2 hours for simple layouts.",
        },
        {
          q: "Do you offer same-day delivery in Saskatoon?",
          a: "We don't deliver — but we're at 216 33rd St W, which is 10 minutes from most of Saskatoon. Pickup is free, instant, and you can inspect your order before you leave.",
        },
        {
          q: "I need signs for an event tomorrow morning. Can you help?",
          a: "Yes — order by end of business today (5 PM) for next-morning standard turnaround with no rush fee. Or order first thing tomorrow before 10 AM for same-day rush. Call us and we'll figure it out.",
        },
      ]}
    />
  );
}
