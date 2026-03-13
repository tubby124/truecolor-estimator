import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Church Banners Saskatoon | From $66 | True Color" },
  description:
    "Church and faith community banners in Saskatoon from $66. Vinyl banners, coroplast signs, retractable banners, foamboard displays. Same-day rush +$40. 216 33rd St W.",
  alternates: { canonical: "/church-banners-saskatoon" },
  openGraph: {
    title: "Church Banners Saskatoon | True Color Display Printing",
    description:
      "Faith community banners from $66. Vinyl, coroplast, retractable, foamboard. Same-day rush available. Local Saskatoon pickup at 216 33rd St W.",
    url: "https://truecolorprinting.ca/church-banners-saskatoon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function ChurchBannersSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="church-banners-saskatoon"
      primaryProductSlug="vinyl-banners"
      title="Church Banners Saskatoon"
      subtitle="Your Sunday service announcement needs to be up before Saturday — that's the turnaround Saskatoon faith communities count on."
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="Church and faith community banners printed in Saskatoon"
      description="True Color prints banners, signs, and displays for churches, mosques, temples, and faith communities across Saskatoon. Vinyl banners start at $66 (2×4&quot;), printed in-house on our Roland UV printer with grommets included. Coroplast signs from $30 for parking and wayfinding. Retractable banners from $219 for lobby entrances. Foamboard displays from $45 for indoor event boards. Same-day rush available for +$40 flat on orders placed before 10 AM. In-house designer $35 flat with same-day proof — perfect for Easter, Christmas, Ramadan, and community outreach campaigns. Pickup at 216 33rd St W, Saskatoon or call (306) 954-8688."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            Easter banners, Christmas service announcements, Ramadan and Eid displays, community
            outreach campaigns — faith communities in Saskatoon run on tight event timelines and
            tighter budgets. Vinyl banners from $66 (2×4&quot;, grommets included) go up fast and
            come down clean. We print in-house on our Roland UV printer, so colour is sharp and
            orders are ready in 1–3 business days. Same-day rush is available for +$40 flat on
            orders placed before 10 AM.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Outdoor vinyl banners are the most common seasonal piece — hung across a fence,
            building fascia, or tent frame to announce service times, special events, or
            holiday gatherings. A 3×6&quot; banner ($135) is visible from the street and holds
            full event details. For{" "}
            <Link href="/ramadan-eid-banners-saskatoon" className="text-[#16C2F3] underline font-medium">
              Ramadan and Eid banners
            </Link>
            {" "}we print on short notice so you&apos;re ready before the month begins.
            Grommets and finished edges are standard — no extra charge.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Inside your building, retractable banners ($219 Economy, $299 Deluxe) work well
            in lobbies and entrances — pull up, pull down, store flat between events. Foamboard
            displays from $45 work as event program boards, welcome signs, speaker bios, and
            silent auction item boards. For coroplast parking and wayfinding signs, we print
            18×24&quot; from $30. Need brochures for a community program or outreach campaign?
            Tri-fold brochures run 100 for $70. Visit the{" "}
            <Link href="/event-banners" className="text-[#16C2F3] underline font-medium">
              event banners page
            </Link>
            {" "}for full sizing and pricing on temporary event signage.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Our in-house designer handles scripture text, seasonal imagery, Arabic script, and
            custom layouts for $35 flat with same-day proof turnaround — no outside agency
            needed. We work within faith community budgets and can advise on the most
            cost-effective combination for your event. Pickup at 216 33rd St W, Saskatoon or
            call (306) 954-8688 to talk through your order.
          </p>
        </>
      }
      products={[
        { name: "Vinyl Banners", from: "from $66", slug: "vinyl-banners" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Coroplast Signs", from: "from $30", slug: "coroplast-signs" },
        { name: "Foamboard Displays", from: "from $45", slug: "foamboard-displays" },
        { name: "Brochures (tri-fold)", from: "from $70 / 100", slug: "brochures" },
      ]}
      whyPoints={[
        "Street-visible event announcement from $66 — 2×4\" vinyl banner with grommets, Roland UV outdoor-rated",
        "3×6\" service banner from $135 — readable from the road, holds full event details",
        "Pull up before service, roll down after — retractable banners from $219, store flat between events",
        "Parking and wayfinding sorted — coroplast signs 18×24\" from $30 each",
        "Event boards for every room — foamboard displays from $45, programs, speaker bios, welcome signs",
        "Community handouts for 100 people — tri-fold brochures 100 for $70",
        "Christmas Eve banner ready if you order before 10 AM — same-day rush +$40 flat",
        "Arabic script, scripture text, seasonal imagery — in-house designer $35 flat, same-day proof",
      ]}
      faqs={[
        {
          q: "How much does a church banner cost in Saskatoon?",
          a: "Vinyl banners start at $66 for 2×4\" with grommets included. A 3×6\" outdoor banner for service announcements is $135. Larger 4×8\" banners for building fascia or tent frames are $264. All banners are printed in-house on our Roland UV printer — colourfast, outdoor-rated, finished edges standard.",
        },
        {
          q: "Can you print Easter and Christmas banners on short notice?",
          a: "Yes — standard turnaround is 1–3 business days from artwork approval. Same-day rush is available for +$40 flat on orders placed before 10 AM. Most seasonal banners are ready within 24 hours on rush. Call (306) 954-8688 to confirm availability.",
        },
        {
          q: "Do you print banners for Ramadan and Eid events?",
          a: "Yes — we print Ramadan and Eid banners for Saskatoon mosques and Muslim community organizations. We can print Arabic script, crescent moon imagery, and bilingual layouts. Banners from $66 (2×4\"). Designer available for $35 flat if you need a layout built from scratch.",
        },
        {
          q: "What kind of indoor signage works best for church events?",
          a: "Retractable banners ($219–$349) are the most versatile — pull up for service, pull down and store flat between events. Foamboard displays from $45 work as welcome boards, event programs, speaker bios, and auction item signs. Both are easy to set up without tools or mounting hardware.",
        },
        {
          q: "Can you print parking and wayfinding signs for a large service or event?",
          a: "Yes — coroplast signs on H-stakes are the most common solution. 18×24\" from $24 each. \"Parking\", \"Entrance\", \"Overflow Parking\", \"Event This Way\" — we can print any directional messaging. Order 5+ and save 8%. Stakes are $2.50 each.",
        },
        {
          q: "Do you print brochures for community programs and outreach?",
          a: "Yes — tri-fold brochures on 80lb gloss: 100 for $70, 250 for $105, 500 for $195. Common uses include newcomer welcome packages, food bank program guides, community event handouts, and outreach campaign materials. Design is $35 flat.",
        },
        {
          q: "How do I get a design done if we don't have a graphic designer?",
          a: "Our in-house designer handles it for $35 flat with same-day proof turnaround. Bring your logo (or describe your community), the text you want, and any imagery or colour references. We handle everything from there. Most faith community layouts are proofed within a few hours.",
        },
        {
          q: "Where can churches get banners printed in Saskatoon?",
          a: "True Color Display Printing at 216 33rd St W, Saskatoon — (306) 954-8688. We print in-house, offer same-day rush, and have an in-house designer for $35 flat. We serve churches, mosques, temples, and all faith communities across Saskatoon.",
        },
      ]}
    />
  );
}
