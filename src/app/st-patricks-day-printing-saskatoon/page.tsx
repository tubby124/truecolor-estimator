import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "St. Patrick's Day Printing Saskatoon | Banners & Flyers | True Color",
  description:
    "Green banners, shamrock flyers, and window decals for Saskatoon bars, pubs & restaurants. Vinyl banners from $90. Same-day rush available. Local pickup 216 33rd St W.",
  keywords: [
    "st. patrick's day printing saskatoon",
    "st. patrick's day banners saskatoon",
    "shamrock banners saskatoon bars",
    "green banner printing saskatoon",
    "pub event banners saskatoon",
    "bar signage saskatoon st patricks",
    "window decals saskatoon restaurant",
  ],
  alternates: { canonical: "/st-patricks-day-printing-saskatoon" },
  openGraph: {
    title: "St. Patrick's Day Printing Saskatoon | Banners & Flyers | True Color",
    description:
      "Green banners, shamrock flyers, and window decals for Saskatoon bars, pubs & restaurants. Vinyl banners from $90. Same-day rush available.",
    url: "https://truecolorprinting.ca/st-patricks-day-printing-saskatoon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function StPatricksDayPage() {
  return (
    <IndustryPage
      canonicalSlug="st-patricks-day-printing-saskatoon"
      primaryProductSlug="vinyl-banners"
      title="St. Patrick's Day Printing Saskatoon"
      subtitle="Banners, window decals, and flyers for Saskatoon bars, pubs, and restaurants — ready in 48 hours. Same-day rush for +$40 flat."
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="St. Patrick's Day banners and window decals printed in Saskatoon by True Color Display Printing"
      description="True Color Display Printing produces vinyl banners, promotional flyers, and window decals for St. Patrick's Day events at Saskatoon bars, pubs, restaurants, and nightclubs. A 2×6 ft banner for your pub exterior is $90 + GST. Window decals from $11/sqft — removable after the event, no residue on glass. 250 glossy promotional flyers from $110 + GST. Standard turnaround: 48 hours from artwork approval. Same-day rush: +$40 flat, order before 10 AM. In-house Roland UV printer — no outsourcing delays. Local pickup at 216 33rd St W, Saskatoon, Saskatchewan."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            True Color Display Printing produces vinyl banners, promotional flyers, and window decals
            for St. Patrick&apos;s Day events at Saskatoon bars, pubs, restaurants, and nightclubs.
            Standard turnaround: 48 hours from artwork approval. Same-day rush: +$40 flat, order before
            10 AM. In-house Roland UV printer — no outsourcing, no surprises. Local pickup at
            216 33rd St W, Saskatoon, Saskatchewan.
          </p>

          <h3 className="text-xl font-bold text-[#1c1712] mb-3">
            What Saskatoon bars and restaurants order for St. Patrick&apos;s Day
          </h3>
          <p className="text-gray-600 leading-relaxed mb-8">
            The most popular St. Patrick&apos;s Day print order for a Saskatoon pub or bar: a 2×6 ft
            exterior vinyl banner ($90) announcing live music or drink specials, two or three window
            decals ($11/sqft) on the front windows in shamrock green, and 250 promotional flyers ($110)
            distributed around the neighbourhood in the two weeks before March 17. Retractable banner
            stands ($219 complete) are worth the investment if you run annual St. Patrick&apos;s Day
            events — reuse the stand every year and just reprint the graphic.
          </p>

          <h3 className="text-xl font-bold text-[#1c1712] mb-3">
            Ordering before March 17 — timing guide
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Order by <strong>March 10</strong> for standard 1–3 business day turnaround. If you&apos;re
            ordering after March 13, call (306) 954-8688 to request same-day rush (+$40 flat). True Color
            prints in-house on a Roland UV printer — no shipping delays from Toronto or Vancouver. If
            you&apos;ve ordered from us before, your artwork is on file — just call, confirm the quantity,
            and we&apos;re already running.
          </p>
        </>
      }
      products={[
        { name: "Vinyl Banners", from: "2×6ft from $90", slug: "vinyl-banners" },
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
        { name: "Flyers", from: "250 from $110", slug: "flyers" },
        { name: "Retractable Banners", from: "from $219 complete", slug: "retractable-banners" },
      ]}
      whyPoints={[
        "Vinyl banner 2×6ft for pub exteriors — $90 + GST, hemming and grommets included, ready in 48 hours",
        "Window decals from $11/sqft — removable after St. Patrick's Day, zero adhesive residue on glass",
        "250 promotional flyers on 80lb gloss — $110 + GST, double-sided printing included",
        "Retractable banner stand + full-colour shamrock print — $219 complete, reuse every year",
        "Same-day rush for +$40 flat — order before 10 AM, pick up same day — call (306) 954-8688",
        "In-house designer handles shamrock layouts, Celtic patterns, and custom bar branding — $35–50",
        "Local Saskatoon pickup at 216 33rd St W — no shipping delays from out-of-province printers",
      ]}
      faqs={[
        {
          q: "How much do St. Patrick's Day banners cost in Saskatoon?",
          a: "At True Color Display Printing (216 33rd St W, Saskatoon), a 2×6 ft vinyl banner — the most popular size for bar windows and pub exteriors — is $90 + GST. A 3×8 ft banner covering a restaurant window is $180 + GST. All banners include hemming and grommets. Order before March 10 for standard turnaround; same-day rush is available for +$40 flat.",
        },
        {
          q: "Can I get St. Patrick's Day flyers printed same day in Saskatoon?",
          a: "Yes — same-day rush is available at True Color Display Printing for a flat $40 fee when you order before 10 AM. Call (306) 954-8688 to confirm capacity. 250 glossy 8.5×11\" flyers on 80lb stock are $110 + GST. Most St. Patrick's Day flyer orders are ready in 1 business day.",
        },
        {
          q: "What's the best signage for a Saskatoon bar or pub during St. Patrick's Day?",
          a: "A vinyl banner on the exterior (2×6 ft, $90) announces the event to passing foot and vehicle traffic. Window decals from $11/sqft are cost-effective for storefronts — minimum $45. For inside the venue, a retractable banner stand ($219 complete) works well near the entrance. Flyers (250 for $110) distributed around the neighbourhood drive foot traffic in the days before March 17.",
        },
        {
          q: "How far in advance should I order St. Patrick's Day printing in Saskatoon?",
          a: "Order by March 10 for a March 17 event — that gives standard 1–3 business day turnaround with comfortable buffer. If ordering after March 13, call (306) 954-8688 to request same-day rush (+$40 flat). True Color prints in-house on a Roland UV printer — no outsourcing delays, no shipping wait.",
        },
        {
          q: "Do you print window decals for St. Patrick's Day promotions in Saskatoon?",
          a: "Yes — vinyl window decals at $11/sqft (minimum $45) are popular for Saskatoon restaurants and retail shops running St. Patrick's Day promotions. Decals are removable after the event with no adhesive residue on glass. For temporary promotions, perforated window vinyl ($8/sqft) lets customers see out while your design faces the street.",
        },
        {
          q: "Where can I get St. Patrick's Day printing done same day in Saskatoon?",
          a: "True Color Display Printing at 216 33rd St W, Saskatoon, SK offers same-day rush printing for a flat $40 fee. Call (306) 954-8688 before 10 AM to confirm capacity. We print vinyl banners, window decals, and flyers in-house on our Roland UV printer — no outsourcing, no delays. Pickup is available the same business day.",
        },
      ]}
    />
  );
}
