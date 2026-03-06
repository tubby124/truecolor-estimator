import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Signs Yorkton SK | Coroplast & Banners | True Color" },
  description:
    "Custom signs for Yorkton SK businesses. Vehicle magnets from $24/sqft, vinyl banners from $8.25/sqft, coroplast from $8/sqft. Printed in Saskatoon — shipped to Yorkton.",
  alternates: { canonical: "/signs-yorkton-sk" },
  openGraph: {
    title: "Signs Yorkton SK | True Color Display Printing",
    description:
      "Vehicle magnets, vinyl banners, coroplast signs, and ACP aluminum for Yorkton SK. Printed in Saskatoon — shipped to Yorkton. From $8/sqft.",
    url: "https://truecolorprinting.ca/signs-yorkton-sk",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function SignsYorktonPage() {
  return (
    <IndustryPage
      canonicalSlug="signs-yorkton-sk"
      primaryProductSlug="vehicle-magnets"
      title="Signs & Printing Yorkton SK"
      subtitle="Vehicle magnets, vinyl banners, coroplast signs, and ACP aluminum — printed in Saskatoon, shipped to Yorkton."
      heroImage="/images/products/heroes/agriculture-hero-1200x500.webp"
      heroAlt="Signs and printing for Yorkton SK businesses — True Color Display Printing Saskatoon"
      description="Ag equipment dealers, grain and livestock operations, and retail businesses in Yorkton shouldn't have to wait on a local shop that outsources large-format work. True Color prints vehicle magnets from $24/sqft, vinyl banners from $8.25/sqft, and coroplast from $8/sqft in-house on Roland UV equipment in Saskatoon — and ships directly to Yorkton, about 180km east. Order online, approve your proof by email, delivered in 3–5 business days."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            Ag equipment dealers, grain and livestock operations, and healthcare facilities in
            Yorkton need signage that keeps up with their work — not a two-week wait from a local
            shop that outsources large-format printing. True Color prints everything in-house in
            Saskatoon on our Roland UV press and ships directly to Yorkton, about 180km east.{" "}
            <Link href="/vehicle-magnets-saskatoon" className="text-[#16C2F3] underline font-medium">
              Vehicle magnets
            </Link>{" "}
            from $24/sqft (minimum $45) give ag equipment dealers and service fleets removable
            branding on every truck door — stick securely to steel, remove cleanly, no adhesive
            residue.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Coroplast signs from $8/sqft for Yorkton retailers, real estate listings, and
            seasonal promotions — UV-printed on our Roland press, 2–3 year outdoor lifespan,
            H-stakes at $2.50 each.{" "}
            <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              Vinyl banners
            </Link>{" "}
            from $8.25/sqft for Yorkton events, grand openings, and agricultural fairs —
            hemmed edges, grommets every 2 ft, 13oz outdoor-rated vinyl that holds up on the
            prairies. A 2×4 ft banner is $66; 3×6 ft is $135. ACP aluminum signs from $13/sqft
            for permanent storefronts and facility signage.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order for Yorkton delivery: call (306) 954-8688 or submit at truecolorprinting.ca.
            We send a digital proof by email for your approval before printing. After approval
            and payment, we print in-house and ship to your Yorkton address. Standard timeline:
            3–5 business days. No design file? Our in-house designer handles it for $35 flat,
            same-day proof. Rush orders for +$40 — place by 10 AM for same-day production.
          </p>
        </>
      }
      products={[
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Business Cards", from: "250 for $40", slug: "business-cards" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
      ]}
      whyPoints={[
        "In-house Roland UV press — no outsourcing, consistent colour on every order shipped to Yorkton",
        "Vehicle magnets from $24/sqft — removable fleet branding for ag dealers and service trucks",
        "Vinyl banners from $8.25/sqft — 13oz outdoor vinyl, hemmed and grommeted as standard",
        "Coroplast from $8/sqft — UV-printed, H-stakes $2.50 each, 2–3 year outdoor lifespan",
        "ACP aluminum from $13/sqft — permanent storefronts and facility signs, 10+ year lifespan",
        "Ships to Yorkton — approve proof by email, 3–5 business days to your door",
        "In-house designer — $35 flat, same-day proof, any format accepted",
      ]}
      faqs={[
        {
          q: "How do I order signs shipped to Yorkton?",
          a: "Submit your order at truecolorprinting.ca or call (306) 954-8688. We email a digital proof for your approval. Once approved and payment confirmed, we print in Saskatoon and ship to your Yorkton address. Standard timeline is 3–5 business days.",
        },
        {
          q: "What does shipping to Yorkton cost?",
          a: "Shipping is the customer's responsibility. We quote it before you commit. For a small order — 10 or fewer signs — shipping to Yorkton (about 180km from Saskatoon) is typically $25–$45 by courier. We'll confirm the shipping cost before you finalize your order.",
        },
        {
          q: "Do you print vehicle magnets for Yorkton ag equipment and service fleets?",
          a: "Yes — 30mil vehicle magnets from $24/sqft (minimum $45). Popular with Yorkton ag equipment dealers, grain buyers, and service companies. Custom rectangle or shaped. Stick securely to steel doors, remove cleanly with no adhesive residue — ideal for seasonal fleet branding.",
        },
        {
          q: "Can you print vinyl banners for events in Yorkton?",
          a: "Yes — vinyl banners from $8.25/sqft. A 2×4 ft banner is $66 and a 3×6 ft is $135, hemmed and grommeted. Order at least 5–6 business days before your event date to allow for production and shipping to Yorkton.",
        },
        {
          q: "Are there local print shops in Yorkton that offer the same products?",
          a: "Yorkton has some print services, but large-format UV printing is often outsourced by local shops, adding cost and time. True Color owns our Roland UV press in Saskatoon — we produce in-house and ship directly. Many Yorkton customers find our prices comparable or lower even with shipping included.",
        },
        {
          q: "Do you have a minimum order for Yorkton customers?",
          a: "No minimum. Order a single vehicle magnet or one banner. Volume pricing applies automatically — coroplast drops from $8/sqft at higher quantities. Business cards start at 250 for $40 and flyers at 100 for $45, both shipped to Yorkton.",
        },
      ]}
    />
  );
}
