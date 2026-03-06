import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Event Banners Saskatoon | From $66 | True Color" },
  description:
    "Banners, foam boards, and retractable stands for Saskatoon events. Same-day options. One shop for signage, banners, and print. Local pickup.",
  alternates: { canonical: "/event-banners" },
  openGraph: {
    title: "Event Banners Saskatoon | True Color",
    description:
      "Vinyl banners, foam boards, retractable stands for Saskatoon events. Same-day available. Local pickup at 216 33rd St W.",
    url: "https://truecolorprinting.ca/event-banners",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function EventBannersPage() {
  return (
    <IndustryPage
      canonicalSlug="event-banners"
      primaryProductSlug="vinyl-banners"
      title="Event Banners & Signage Saskatoon"
      subtitle="The event is Saturday. The banner needs to be there."
      heroImage="/images/products/heroes/sports-hero-1200x500.webp"
      heroAlt="Event banners and signage Saskatoon"
      description="Event timelines compress fast. True Color supplies 13oz hemmed vinyl banners, foam board signs, retractable banner stands, and coroplast directionals — all from one shop. Last-minute spec changes happen — we adjust without drama. Local pickup at 216 33rd St W."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            Event timelines compress fast — and the last thing you need is chasing three vendors for a
            Saturday setup. True Color Display Printing in Saskatoon prints everything your event needs
            under one roof: 13oz hemmed{" "}
            <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              vinyl banners
            </Link>
            , foam board signs, retractable banner stands, and coroplast directional signs.
            Trade shows, grand openings, charity galas, community fundraisers, farmers markets —
            we've printed signage for all of it.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Pricing is clear from the start. A 3×6 ft vinyl banner is $135, grommets and hemming
            included — no upcharge. A{" "}
            <Link href="/retractable-banners-saskatoon" className="text-[#16C2F3] underline font-medium">
              retractable banner stand
            </Link>{" "}
            with full-colour printing starts at $219, ready to use right out of the box.
            Foam board table signs start at $45. Need multiple items for one event? Order everything
            together — we print it all in-house so there&apos;s no vendor coordination and no dropped
            balls between suppliers.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Same-day event printing is available if you order before 10 AM — add a flat $40 rush
            fee and we confirm capacity by phone. Last-minute spec changes happen at events
            (a sponsor added, a time updated) — call us at (306) 954-8688 and we adjust without
            drama. Local pickup at 216 33rd St W, Saskatoon — no shipping wait, no courier
            damage risk, no guessing when your order arrives.
          </p>
        </>
      }
      products={[
        { name: "Vinyl Banners", from: "from $66", slug: "vinyl-banners" },
        { name: "Foam Board Signs", from: "from $45", slug: "foamboard-displays" },
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
        {
          q: "Are your event banners suitable for outdoor use in Saskatchewan?",
          a: "Yes — 13oz scrim vinyl is outdoor-rated, wind-resistant, and UV-stable. Hemmed edges prevent tearing. Grommets every 2 ft allow secure tie-down in wind. For outdoor winter events in Saskatchewan, use grommets and bungee cords rather than zip ties to allow flex in high wind.",
        },
        {
          q: "Where is True Color Display Printing located in Saskatoon?",
          a: "We're at 216 33rd St W, Saskatoon, SK S7L 0V5 — open Monday to Friday, 9 AM to 5 PM. Free local pickup on all orders. For same-day pickup, order before 10 AM and call (306) 954-8688 to confirm capacity.",
        },
      ]}
    />
  );
}
