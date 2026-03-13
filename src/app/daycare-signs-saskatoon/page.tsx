import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Daycare Signs Saskatoon | Coroplast & Banners | True Color" },
  description:
    "Enrollment yard signs, banners, and window decals for Saskatoon daycares. Coroplast 18×24\" at $24 each. Bulk discounts on neighbourhood campaigns. Local pickup.",
  alternates: { canonical: "/daycare-signs-saskatoon" },
  openGraph: {
    title: "Daycare Signs Saskatoon | True Color Display Printing",
    description:
      "Coroplast yard signs from $24 each for Saskatoon daycares and preschools. Enrollment banners, window decals, and foamboard displays. Same-day rush +$40.",
    url: "https://truecolorprinting.ca/daycare-signs-saskatoon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

const descriptionNode = (
  <>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      Empty spots cost Saskatoon daycares real money — and a yard sign on the right corner fills
      them faster than any social media post. Coroplast yard signs are the most cost-effective
      enrollment tool: 18×24&quot; signs print for $24 each on durable 4mm corrugated plastic with
      H-stakes included. Order 5 or more and save 8%. A 20-sign neighbourhood campaign covers every
      major street in your catchment area for around $440. Our in-house Roland UV printer handles
      full-colour graphics so your logo, phone number, and enrollment message are sharp and readable
      at the curb.
    </p>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      For grand openings, enrollment-open announcements, and summer program launches, vinyl banners
      get noticed from the street. A 2×4&apos; banner prints for $66 with grommets included —
      hang it on your fence, above your entrance, or across a community centre notice board.
      Window decals from $11/sqft give your building a permanent look that communicates
      hours, license numbers, and brand identity to every parent driving by. Same-day rush
      is available for +$40 flat when ordered before 10 AM — call (306) 954-8688.
    </p>
    <p className="text-gray-600 text-lg leading-relaxed">
      Our in-house designer creates print-ready artwork for $35 flat with a same-day proof — you
      don&apos;t need to hire a graphic designer separately. We keep your files on record for
      fast seasonal reorders. Need signs for a school or education campaign beyond daycare?{" "}
      <Link
        href="/school-signs-saskatoon"
        className="text-[#16C2F3] underline font-medium"
      >
        See our school signs page
      </Link>
      . Ordering coroplast for an enrollment drive?{" "}
      <Link
        href="/coroplast-signs-saskatoon"
        className="text-[#16C2F3] underline font-medium"
      >
        Visit our coroplast sign pricing page
      </Link>{" "}
      for all sizes and bulk pricing.
    </p>
  </>
);

export default function DaycareSignsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="daycare-signs-saskatoon"
      primaryProductSlug="coroplast-signs"
      title="Daycare Signs Saskatoon"
      subtitle="Enrollment yard signs, grand opening banners, and window decals for Saskatoon daycares and preschools."
      heroImage="/images/products/heroes/healthcare-hero-1200x500.webp"
      heroAlt="Coroplast yard signs and vinyl banners for Saskatoon daycares and preschools printed by True Color Display Printing"
      description="Empty spots cost Saskatoon daycares real money — and a yard sign on the right corner fills them faster than social media. Coroplast yard signs: 18×24&quot; at $24 each, 4mm, H-stakes included. Order 5+ and save 8%. A 20-sign neighbourhood campaign is around $440. Vinyl banners from $66 for grand openings and enrollment-open announcements. Window decals from $11/sqft for permanent storefront branding. In-house designer $35 flat, same-day proof. Pickup at 216 33rd St W, Saskatoon."
      descriptionNode={descriptionNode}
      products={[
        { name: "Coroplast Signs", from: "18×24\" for $24", slug: "coroplast-signs" },
        { name: "Vinyl Banners", from: "2×4\' for $66", slug: "vinyl-banners" },
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
        { name: "Foamboard Displays", from: "from $10/sqft", slug: "foamboard-displays" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
      ]}
      whyPoints={[
        "Coroplast enrollment yard signs at $24 each — 18×24\", 4mm, H-stakes included, sharp at the curb",
        "Order 5+ and save 8% — 20-sign neighbourhood campaigns from ~$440 cover your full catchment area",
        "Vinyl banners from $66 with grommets — grand openings, enrollment-open, summer program launches",
        "Window decals from $11/sqft — permanent storefront branding every passing parent sees",
        "Foamboard lobby and classroom displays — lightweight, reprints easily each semester",
        "In-house designer $35 flat — handles your enrollment graphics, same-day proof",
        "Same-day rush +$40 flat — signs ready the day an enrollment window opens",
      ]}
      faqs={[
        {
          q: "What is the best sign for a daycare enrollment campaign in Saskatoon?",
          a: "Coroplast yard signs are the standard for enrollment campaigns. 18×24\" signs print for $24 each on 4mm corrugated plastic with H-stakes included for yard placement. Order 5 or more and save 8%. A 20-sign campaign covering your neighbourhood costs around $440 and generates immediate visibility among local parents.",
        },
        {
          q: "How many yard signs do I need for a neighbourhood enrollment campaign?",
          a: "Most daycares order 10–25 signs for a single neighbourhood campaign. Place them at key intersections, near schools, and in front of your facility. At $24 per 18×24\" sign (8% off for 5+), a 20-sign campaign is approximately $440. We keep your artwork on file for fast reorders when enrollment re-opens.",
        },
        {
          q: "What banner size works best for a daycare grand opening?",
          a: "A 3×6\' vinyl banner at $135 is the most common size for building frontage or fence banners. A 2×4\' banner at $66 works for smaller entries or community board postings. All banners include grommets and are printed on heavy-duty scrim vinyl using our Roland UV printer for outdoor durability.",
        },
        {
          q: "Can you design our enrollment graphics if we don't have artwork?",
          a: "Yes — our in-house designer creates print-ready artwork for $35 flat with a same-day proof. Bring your logo, your enrollment message, and your phone number. We handle the layout, sizing, and colour. You approve the proof before anything goes to print.",
        },
        {
          q: "What window graphics work for a daycare storefront?",
          a: "Window decals from $11/sqft (minimum $45) are standard for daycare storefronts. Common uses: hours of operation, licensing information, age groups served, and colourful brand graphics that communicate a welcoming environment. Decals are removable and can be updated seasonally without damaging the glass.",
        },
        {
          q: "How fast can you print signs for an enrollment deadline?",
          a: "Standard turnaround is 1–3 business days after artwork approval. Same-day rush is +$40 flat if ordered before 10 AM — call (306) 954-8688 to confirm availability. If enrollment opens on a Monday, order the previous Thursday or Friday for guaranteed standard delivery.",
        },
        {
          q: "Can I order foamboard displays for a classroom or lobby?",
          a: "Yes — foam board displays from $10/sqft (minimum $45 for 18×24\") are common for daycare lobbies and classrooms. Use them for program schedules, daily routines, parent communication boards, and seasonal theme displays. Lightweight and easy to reprint each semester.",
        },
        {
          q: "Do you print flyers for summer camp or after-school program promotion?",
          a: "Yes — flyers are effective for community drop distribution and school take-home packages. 100 flyers for $45, 500 for $135, printed on gloss or matte stock. Combine with a coroplast yard sign campaign for maximum enrollment reach across Saskatoon neighbourhoods.",
        },
      ]}
    />
  );
}
