import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Signs Prince Albert SK | Coroplast & Banners | True Color" },
  description:
    "Custom signs and banners for Prince Albert SK businesses. Coroplast from $8/sqft, vinyl banners from $8.25/sqft, business cards. Printed in Saskatoon — shipped to Prince Albert.",
  alternates: { canonical: "/signs-prince-albert-sk" },
  openGraph: {
    title: "Signs Prince Albert SK | True Color Display Printing",
    description:
      "Coroplast signs, vinyl banners, and business cards for Prince Albert SK. Printed in Saskatoon — shipped to PA. True Color Display Printing.",
    url: "https://truecolorprinting.ca/signs-prince-albert-sk",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function SignsPrinceAlbertPage() {
  return (
    <IndustryPage
      canonicalSlug="signs-prince-albert-sk"
      primaryProductSlug="coroplast-signs"
      title="Signs & Printing Prince Albert SK"
      subtitle="Coroplast signs, vinyl banners, and business cards — printed in Saskatoon, shipped to Prince Albert."
      heroImage="/images/products/heroes/construction-hero-1200x500.webp"
      heroAlt="Signs and printing for Prince Albert SK businesses — True Color Display Printing Saskatoon"
      description="True Color Display Printing serves Prince Albert businesses with professional signs, banners, and print. We print in-house in Saskatoon on Roland UV equipment and ship directly to Prince Albert — order online or by phone, approve your proof by email, and your order arrives in 3–5 business days."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing, located at 216 33rd St W in Saskatoon, ships signs,
            banners, and print products to Prince Albert businesses, healthcare organizations,
            retailers, and contractors. Whether you need{" "}
            <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              coroplast yard signs
            </Link>{" "}
            for a job site, a{" "}
            <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              vinyl banner
            </Link>{" "}
            for a storefront, or vehicle magnets for your fleet — we print everything in-house
            and ship it to you. Coroplast from $8/sqft. Vinyl banners from $8.25/sqft.
            H-stakes at $2.50 each.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Volume pricing applies automatically to Prince Albert orders — no account required.
            Coroplast: 8% off at 5+ signs, 17% off at 10+ signs. Banners: 15% off at 25+ banners.
            We also print business cards (250 for $45), flyers, vehicle magnets, retractable
            banner stands, and aluminum composite (ACP) signs for permanent installations.
            One supplier for everything your Prince Albert business needs to look professional.
          </p>
          <p className="text-gray-600 leading-relaxed">
            No design file? Our in-house designer handles file prep for $35–$50.
            Bring a logo in any format, a rough sketch, or just a description of what you need.
            To order: call (306) 954-8688 or submit your quote at truecolorprinting.ca.
            We email a digital proof, you approve, we ship. Standard timeline: 3–5 business days
            from order to delivery in Prince Albert.
          </p>
        </>
      }
      products={[
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
      ]}
      whyPoints={[
        "Coroplast from $8/sqft — UV-printed, weatherproof, built for Saskatchewan winters",
        "Vinyl banners from $8.25/sqft — grommets and hemming included",
        "Vehicle magnets from $24/sqft — removable fleet branding",
        "Business cards 250 for $45 — sharp colour, same-day in Saskatoon, shipped to PA",
        "In-house designer — file prep from any format, starting at $35",
        "Shipped to Prince Albert — order online, approve by email, courier delivery",
      ]}
      faqs={[
        {
          q: "How do I order signs for delivery to Prince Albert?",
          a: "Submit your order at truecolorprinting.ca or call (306) 954-8688. We email a digital proof for your approval. After approval and payment, we print in Saskatoon and ship to your Prince Albert address. Standard timeline is 3–5 business days.",
        },
        {
          q: "What does shipping to Prince Albert cost?",
          a: "Shipping is the customer's responsibility. We'll provide a shipping estimate when you place your order. For small orders (10 or fewer signs), shipping is typically $20–$40 by courier. For large runs, call us to discuss logistics.",
        },
        {
          q: "Can you print same-day for Prince Albert orders?",
          a: "Rush production (+$40 flat) reduces our production time to same-day in Saskatoon, but shipping to Prince Albert still takes 1–2 business days. For truly urgent needs, consider picking up in Saskatoon or call (306) 954-8688 to discuss options.",
        },
        {
          q: "What types of businesses in Prince Albert do you serve?",
          a: "We serve PA contractors, healthcare organizations, retail shops, restaurants, real estate agents, non-profits, and event organizers. Common orders include job site signage, storefront banners, vehicle magnets for service fleets, and business cards.",
        },
        {
          q: "Can I get ACP aluminum signs shipped to Prince Albert?",
          a: "Yes — 3mm aluminum composite signs from $13/sqft. These are permanent signs that last 10+ years outdoors. Popular for business frontage, healthcare facilities, and office buildings. Ships flat, protected with foam packaging.",
        },
        {
          q: "Can Prince Albert businesses get business cards and flyers shipped?",
          a: "Yes — 250 business cards (double-sided, full colour) from $45. Flyers start at $45 for 100. Both ship flat in padded packaging. Timeline: 3–5 business days including shipping to Prince Albert.",
        },
        {
          q: "Do you print for healthcare organizations in Prince Albert?",
          a: "Yes — Victoria Hospital, clinics, and healthcare offices in PA are common customers. We print wayfinding signs (ACP from $13/sqft), banner stands for waiting rooms (from $219), business cards, and appointment reminder cards. Everything ships directly to your Prince Albert address.",
        },
      ]}
    />
  );
}
