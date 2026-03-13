import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Printing Lloydminster SK | Signs & Banners | True Color" },
  description:
    "Custom printing for Lloydminster SK businesses. Coroplast signs, vinyl banners, vehicle magnets, business cards. Printed in Saskatoon — shipped to Lloydminster. True Color Display Printing.",
  alternates: { canonical: "/printing-lloydminster-sk" },
  openGraph: {
    title: "Printing Lloydminster SK | True Color Display Printing",
    description:
      "Signs, banners, vehicle magnets, and business cards for Lloydminster SK businesses. Printed in Saskatoon — shipped to Lloydminster.",
    url: "https://truecolorprinting.ca/printing-lloydminster-sk",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function PrintingLloydminsterPage() {
  return (
    <IndustryPage
      canonicalSlug="printing-lloydminster-sk"
      primaryProductSlug="coroplast-signs"
      title="Signs & Printing Lloydminster SK"
      subtitle="Coroplast signs, vehicle magnets, vinyl banners, and business cards — shipped to Lloydminster from Saskatoon."
      heroImage="/images/products/heroes/agriculture-hero-1200x500.webp"
      heroAlt="Signs and printing for Lloydminster SK — True Color Display Printing Saskatoon"
      description="True Color Display Printing prints signs, banners, vehicle magnets, and business cards for Lloydminster SK businesses operating on both sides of the AB/SK border. We ship directly to Lloydminster from our Saskatoon shop. Order online or by phone — approved proofs, professional results, courier delivery in 3–5 business days."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing, located at 216 33rd St W in Saskatoon, ships professional
            print and signage to Lloydminster businesses serving the SK side of the border.
            The Lloydminster market is dominated by oil and gas, agriculture, and construction —
            industries that need durable signage.{" "}
            <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              Coroplast signs
            </Link>{" "}
            from $8/sqft handle prairie conditions. UV-printed{" "}
            <Link href="/vehicle-magnets-saskatoon" className="text-[#16C2F3] underline font-medium">
              vehicle magnets
            </Link>{" "}
            from $24/sqft stay on doors at highway speeds and remove without residue.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Vinyl banners from $8.25/sqft for storefronts and job sites. Business cards 250 for
            $45. Retractable banner stands from $219. ACP aluminum composite signs from $13/sqft
            for permanent facility and office signage that lasts 10+ years outdoors.
            Volume pricing applies automatically — no account or minimum spend required.
            Whether you need 5 signs or 500, pricing adjusts by quantity.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order for Lloydminster delivery: call (306) 954-8688 or submit at truecolorprinting.ca.
            We send a digital proof by email. Once approved and paid, we print in Saskatoon and
            ship to your Lloydminster SK address. Standard timeline: 3–5 business days.
            Our in-house designer preps files from any format — logo, Word doc, rough sketch —
            starting at $35.
          </p>
        </>
      }
      products={[
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
      ]}
      whyPoints={[
        "Coroplast from $8/sqft — UV-ink, weatherproof, built for prairie job sites",
        "Vehicle magnets from $24/sqft — highway-speed hold, removable without residue",
        "ACP aluminum signs from $13/sqft — 10+ year outdoor lifespan for permanent installs",
        "Business cards 250 for $45 — professional full-colour, double-sided",
        "Shipped to Lloydminster SK — order online, proof by email, courier delivery",
        "In-house designer: file prep from any format starting at $35",
      ]}
      faqs={[
        {
          q: "Do you print for Lloydminster SK businesses (not AB side)?",
          a: "Yes — we ship to Lloydminster SK addresses. Our pricing is in Canadian dollars. Note that we ship to the SK postal codes only. Call (306) 954-8688 if you have questions about your address.",
        },
        {
          q: "How long does shipping to Lloydminster take?",
          a: "Standard production is 1–3 business days in Saskatoon, then 1–2 days by courier to Lloydminster. Plan 3–5 business days total. Shipping cost is the customer's responsibility — we quote it before you commit.",
        },
        {
          q: "What products are popular for Lloydminster oil and gas companies?",
          a: "Vehicle magnets are the most popular — fleet branding that goes on at job start and comes off cleanly. Coroplast signs for site safety and directionals. ACP aluminum for yard and gate signs. Business cards for field staff. Call (306) 954-8688 to discuss your specific needs.",
        },
        {
          q: "Can I get vehicle magnets that work on truck doors in Saskatchewan winter?",
          a: "Yes — our 30mil magnets adhere securely to steel doors in cold weather. Apply to clean, dry surfaces. Remove periodically in extreme cold to prevent corner lifting. They hold well at highway speeds — 100+ km/h.",
        },
        {
          q: "Do you offer volume pricing for large Lloydminster orders?",
          a: "Yes — volume pricing applies automatically. Coroplast: 8% off at 5+ signs, 17% off at 10+ signs, 23% off at 25+ signs. Vinyl banners: 5% off at 5+ banners, 10% off at 10+, 15% off at 25+ banners. No account needed.",
        },
        {
          q: "What are the most popular products for Lloydminster construction companies?",
          a: "Job site coroplast signs from $8/sqft, vehicle magnets for fleet trucks from $24/sqft, and ACP aluminum signs for permanent facility and yard identification from $13/sqft. We also print safety signs, directional signage, and hoarding banners for construction hoardings.",
        },
        {
          q: "Can I pick up my order in Saskatoon instead of shipping to Lloydminster?",
          a: "Yes — Saskatoon pickup is available at 216 33rd St W, Monday to Friday 9 AM – 5 PM. If you're making a trip to Saskatoon anyway, this is the fastest option. Same-day production (+$40 rush) means you can order in the morning and pick up by 4 PM.",
        },
      ]}
    />
  );
}
