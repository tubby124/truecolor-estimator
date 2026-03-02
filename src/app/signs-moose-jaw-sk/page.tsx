import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Signs Moose Jaw SK | Coroplast, Banners & Vehicle Magnets | True Color",
  description:
    "Custom signs and banners for Moose Jaw SK businesses. Coroplast from $8/sqft, vinyl banners, vehicle magnets. Printed in Saskatoon — shipped to Moose Jaw. True Color Display Printing.",
  alternates: { canonical: "/signs-moose-jaw-sk" },
  openGraph: {
    title: "Signs Moose Jaw SK | True Color Display Printing",
    description:
      "Coroplast signs, vinyl banners, and vehicle magnets for Moose Jaw SK. Printed in Saskatoon — shipped to Moose Jaw. From $8/sqft.",
    url: "https://truecolorprinting.ca/signs-moose-jaw-sk",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function SignsMooseJawPage() {
  return (
    <IndustryPage
      canonicalSlug="signs-moose-jaw-sk"
      primaryProductSlug="coroplast-signs"
      title="Signs & Printing Moose Jaw SK"
      subtitle="Coroplast signs, vinyl banners, and vehicle magnets — printed in Saskatoon, shipped to Moose Jaw."
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="Signs and printing for Moose Jaw SK businesses — True Color Display Printing Saskatoon"
      description="True Color Display Printing ships signs, banners, and print products to Moose Jaw businesses. Coroplast from $8/sqft, vinyl banners from $8.25/sqft, vehicle magnets from $24/sqft. Order online, approve your proof by email, delivered to Moose Jaw in 3–5 business days."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing, based at 216 33rd St W in Saskatoon, prints and ships
            professional signs and banners to Moose Jaw businesses, tourism operators,
            retailers, and contractors. Moose Jaw is home to a growing commercial sector —
            from Main Street retail to 15 Wing Moose Jaw area businesses —
            and professional signage matters.{" "}
            <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              Coroplast signs
            </Link>{" "}
            from $8/sqft. H-stakes at $2.50 each.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Vinyl banners from $8.25/sqft — hemmed, grommeted, printed on 13oz outdoor-rated vinyl
            that holds up in Saskatchewan wind and weather.{" "}
            <Link href="/vehicle-magnets-saskatoon" className="text-[#16C2F3] underline font-medium">
              Vehicle magnets
            </Link>{" "}
            from $24/sqft for service trucks, delivery vehicles, and contractor fleets.
            Retractable banner stands from $219 for trade shows and events.
            ACP aluminum signs from $13/sqft for permanent storefront and facility signage.
            Volume pricing applies automatically to all orders — no account required.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Ordering is straightforward: submit at truecolorprinting.ca or call (306) 954-8688.
            We send a digital proof for your approval before printing. After approval and payment,
            we print in-house in Saskatoon and ship to your Moose Jaw address.
            Standard timeline: 3–5 business days. No design file? Our designer preps
            artwork for $35–$50 — from any logo, photo, or rough description.
          </p>
        </>
      }
      products={[
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Business Cards", from: "250 for $40", slug: "business-cards" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
      ]}
      whyPoints={[
        "Coroplast from $8/sqft — UV-printed, weatherproof, H-stakes $2.50 each",
        "Vinyl banners from $8.25/sqft — grommets and hemming included as standard",
        "Vehicle magnets from $24/sqft — removable, no adhesive residue",
        "Retractable banner stands from $219 — complete and ready to use",
        "Ships to Moose Jaw — order online, proof approval by email",
        "In-house designer — from $35 to prep any file format",
      ]}
      faqs={[
        {
          q: "How do I order signs shipped to Moose Jaw?",
          a: "Submit your order at truecolorprinting.ca or call (306) 954-8688. We send a digital proof by email. Once you approve and payment is confirmed, we print in Saskatoon and ship to your Moose Jaw address. Standard timeline is 3–5 business days.",
        },
        {
          q: "What does shipping to Moose Jaw cost?",
          a: "Shipping is the customer's responsibility. We'll quote shipping when you place your order. For a small order of 10 or fewer coroplast signs, shipping to Moose Jaw is typically $20–$35. We'll confirm before you commit.",
        },
        {
          q: "Can you print banners for Moose Jaw events or festivals?",
          a: "Yes — vinyl banners from $8.25/sqft, hemmed and grommeted. 3×6 ft is $135, great for outdoor events. Retractable stands from $219 for indoor displays. Order at least 5 business days before your event to allow for production and shipping.",
        },
        {
          q: "Do you do vehicle magnets for Moose Jaw service businesses?",
          a: "Yes — 30mil vehicle magnets from $24/sqft. Custom shape or rectangle. Stick securely to steel doors and remove cleanly. Great for service companies, contractors, and delivery fleets in Moose Jaw.",
        },
        {
          q: "Can I get business cards and flyers shipped to Moose Jaw?",
          a: "Yes — 250 business cards (double-sided, full colour) for $40, shipped to Moose Jaw. Flyers start at $45 for 100. Business cards and flyers ship flat in a padded envelope or small box.",
        },
      ]}
    />
  );
}
