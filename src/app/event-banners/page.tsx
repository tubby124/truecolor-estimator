import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Event Banners Saskatoon | Vinyl, Foam Board & Retractable Stands | True Color",
  description:
    "Banners, foam boards, and retractable stands for Saskatoon events. Same-day options. One shop for signage, banners, and print. Local pickup.",
  alternates: { canonical: "/event-banners" },
};

export default function EventBannersPage() {
  return (
    <IndustryPage
      title="Event Banners & Signage Saskatoon"
      subtitle="The event is Saturday. The banner needs to be there."
      heroImage="/images/products/heroes/sports-hero-1200x500.webp"
      heroAlt="Event banners and signage Saskatoon"
      description="Event timelines compress fast. True Color supplies 13oz hemmed vinyl banners, foam board signs, retractable banner stands, and coroplast directionals — all from one shop. Last-minute spec changes happen — we adjust without drama. Local pickup at 216 33rd St W."
      products={[
        { name: "Vinyl Banners", from: "from $66", slug: "vinyl-banners" },
        { name: "Foam Board Signs", from: "from $45", slug: "foam-board-signs" },
        { name: "Retractable Banner Stands", from: "from $219", slug: "retractable-banners" },
        { name: "Coroplast Signs", from: "from $30", slug: "coroplast-signs" },
      ]}
      whyPoints={[
        "3×6 ft hemmed vinyl banner: $135 — grommets included, no upcharge",
        "Retractable banner stand with printing from $219 — complete, ready to use",
        "Foam board table signs and directionals — fast and lightweight",
        "Same-day available if ordered by 10 AM — +$40 rush flat",
        "Multiple items from one shop — saves coordination headaches",
      ]}
      faqs={[
        {
          q: "What's the most popular banner size for events?",
          a: "3×6 ft is the standard for most indoor and outdoor events. 4×8 ft is popular for trade shows and large venue backdrops. Custom sizes are available.",
        },
        {
          q: "Do grommets and hemming come standard?",
          a: "Yes — all vinyl banners include hemmed edges and grommets at no extra charge. No hidden upcharges.",
        },
        {
          q: "Can I get everything for an event from one order?",
          a: "Yes — banner, foam boards, coroplast directionals, and a retractable stand can all be ordered in one go. We print everything in-house.",
        },
        {
          q: "I need a banner by Friday for a Saturday event. Is that possible?",
          a: "Order by Wednesday for standard turnaround. Order by Thursday with rush (+$40) for Friday pickup. Call us to confirm: (306) 954-8688.",
        },
      ]}
    />
  );
}
