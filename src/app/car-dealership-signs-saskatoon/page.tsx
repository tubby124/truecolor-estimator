import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Car Dealership Signs Saskatoon | Magnets & ACP | True Color" },
  description:
    "Vehicle magnets from $24/sqft, lot banners from $66, and ACP signs from $13/sqft for Saskatoon car dealerships and auto shops. Pickup at 216 33rd St W.",
  alternates: { canonical: "/car-dealership-signs-saskatoon" },
  openGraph: {
    title: "Car Dealership Signs Saskatoon | True Color Display Printing",
    description:
      "Vehicle magnets for demo fleets, monthly sales banners, coroplast price signs, and ACP lot signage for Saskatoon car dealerships and auto businesses. Rush +$40.",
    url: "https://truecolorprinting.ca/car-dealership-signs-saskatoon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

const descriptionNode = (
  <>
    End-of-month and your lot signage still says last month — that costs sales. Vehicle
    magnets are the fastest fix: from $24/sqft (minimum $45), they go on a demo or service
    fleet in seconds, remove without adhesive residue, and survive Saskatchewan winters on
    any steel panel. A standard 12×24" door magnet runs approximately $48. Order a set of
    10 matching magnets for your service loaners and rebranding is done before lunch.
    Monthly sales promotions drive the bulk of dealer print work: a 3×6 ft vinyl banner for
    your lot starts at $135 with grommets included, and our Roland UV in-house printer
    produces the bold, saturated reds and blacks that stop traffic on a busy strip — printed
    without outsourcing so there are no turnaround surprises when end-of-month hits on a
    Friday. Coroplast price signs (from $8/sqft) on individual vehicles — 18×24" at $24
    each — are the fastest-to-produce, most frequently reordered item at any dealership.
    Need permanent lot signage? ACP aluminum composite starts at $13/sqft and is the
    industry standard for exterior durability: rigid, weather-resistant, and rated for 10+
    years in Saskatchewan conditions. Our in-house Photoshop designer handles all artwork
    for $35 flat with a same-day proof — no agency markup, no delays when your sale starts
    tomorrow. Same-day rush is +$40 flat for orders placed before 10 AM. Located at
    216 33rd St W, Saskatoon — fleet orders welcome.{" "}
    See{" "}
    <Link
      href="/products/vehicle-magnets"
      className="text-[#16C2F3] underline font-medium"
    >
      vehicle magnet pricing and sizes
    </Link>{" "}
    or browse{" "}
    <Link
      href="/construction-signs-saskatoon"
      className="text-[#16C2F3] underline font-medium"
    >
      coroplast and ACP sign options
    </Link>
    .
  </>
);

export default function CarDealershipSignsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="car-dealership-signs-saskatoon"
      primaryProductSlug="vehicle-magnets"
      title="Car Dealership Signs Saskatoon"
      subtitle="End-of-month sale signage, demo fleet magnets, and permanent lot signs — printed in-house so you are never waiting on a supplier."
      heroImage="/images/products/heroes/construction-hero-1200x500.webp"
      heroAlt="Vehicle magnets and vinyl banners for Saskatoon car dealerships and auto businesses printed by True Color Display Printing"
      description="End-of-month and your lot signage still says last month — that costs sales. Vehicle magnets from $24/sqft rebrand your demo fleet in minutes: no adhesive residue, survives Saskatchewan winters. Monthly sales banners from $135 for a 3×6 ft, printed in-house on our Roland UV so there are no outsourcing delays when a sale starts Friday. Coroplast price signs from $8/sqft. ACP lot signage from $13/sqft for 10+ year durability. Designer $35 flat. Rush +$40."
      descriptionNode={descriptionNode}
      products={[
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
        { name: "Vinyl Banners", from: "2×4 ft from $66", slug: "vinyl-banners" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
      ]}
      whyPoints={[
        "Vehicle magnets from $24/sqft — rebrand your full demo or service fleet before noon, remove without residue, reapply daily",
        "Coroplast price signs from $8/sqft — 18×24\" at $24 each, the most frequently reordered item at any Saskatoon dealership",
        "Monthly sales banners from $135 for a 3×6 ft — printed in-house on Roland UV, no outsourcing delays when end-of-month hits on a Friday",
        "ACP aluminum lot signage from $13/sqft — rigid, weather-resistant, still looking right after 10+ Saskatchewan winters",
        "Window decals from $11/sqft — service hours, seasonal promotions, and brand panels on showroom glass",
        "In-house Photoshop designer — $35 flat, same-day proof, no agency markup when you need updated fleet graphics",
        "We print same-day for +$40 flat — order before 10 AM for end-of-month sale signage you need today",
      ]}
      faqs={[
        {
          q: "How much do vehicle magnets cost for a car dealership service fleet?",
          a: "Vehicle magnets are priced from $24/sqft with a minimum order of $45. A standard 12×24\" door magnet runs approximately $48. For a fleet of 10 loaner or service vehicles, expect to pay $480–$600 depending on magnet size. Magnets apply without adhesive, remove in seconds, and do not damage automotive paint.",
        },
        {
          q: "How do vehicle magnets hold up in Saskatchewan winters?",
          a: "Our vehicle magnets are printed on heavy-gauge magnetic material using UV-resistant inks on our Roland UV printer. They are rated for year-round outdoor use in Saskatchewan's climate. To maximize lifespan: remove weekly to prevent moisture trapping, store flat when not on the vehicle, and avoid applying over rust or body filler panels.",
        },
        {
          q: "What is the best banner size for a dealership lot promotion?",
          a: "The most common dealership lot banner is 3×6 ft ($135, grommets included) or 4×8 ft for larger lot entrances. For indoor showroom use, a 2×4 ft ($66) works well behind a reception desk or at a signing table. Our Roland UV printer handles bold dealership palettes — saturated reds, bright yellows, pure whites — that stay vivid in direct sunlight.",
        },
        {
          q: "Can you produce coroplast price signs for individual vehicles on the lot?",
          a: "Yes — coroplast signs are the most frequently reordered item at dealerships. An 18×24\" single-sided sign costs $24 and a 24×36\" runs $48. We print on 4mm or 6mm corrugated plastic. Turnaround is 1–3 business days. For high-volume reorders (weekly or bi-weekly price updates), we keep your template on file and turn changes around fast.",
        },
        {
          q: "What is the difference between coroplast and ACP for outdoor dealership signs?",
          a: "Coroplast (corrugated plastic) is lightweight, inexpensive (from $8/sqft), and ideal for temporary or frequently updated signage like vehicle price signs and short-term lot promotions. ACP (aluminum composite) is rigid, premium, and rated for 10+ years — from $13/sqft, it is the standard for permanent dealership lot entrance signs, directional arrows, and fascia-mounted branding.",
        },
        {
          q: "Can you print end-of-month sale signage on rush for a dealership?",
          a: "Yes — same-day rush is available for +$40 flat if you order before 10 AM. Standard turnaround is 1–3 business days from artwork approval. If your artwork is already on file from a previous order (same template, updated date or offer), rush orders are processed faster because proofing is minimal. Call (306) 954-8688 to confirm rush availability.",
        },
        {
          q: "Do you do window decals for auto dealership showroom glass?",
          a: "Yes — window decals are popular for showroom entrance doors, service bay windows, and promotional display areas. Priced from $11/sqft (minimum $45). Common uses at dealerships: service hours, seasonal promotion panels, brand accent graphics, and financing offer displays. Our Roland UV printer handles full-colour artwork including gradients and photography.",
        },
      ]}
    />
  );
}
