import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Signs North Battleford SK | Coroplast & Banners | True Color" },
  description:
    "Custom signs for North Battleford SK businesses. Coroplast from $8/sqft, vehicle magnets, ACP aluminum, vinyl banners. Printed in Saskatoon — shipped to North Battleford.",
  alternates: { canonical: "/signs-north-battleford-sk" },
  openGraph: {
    title: "Signs North Battleford SK | True Color Display Printing",
    description:
      "Coroplast signs, vehicle magnets, ACP aluminum, and vinyl banners for North Battleford SK. Printed in Saskatoon — shipped to North Battleford. From $8/sqft.",
    url: "https://truecolorprinting.ca/signs-north-battleford-sk",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function SignsNorthBattlefordPage() {
  return (
    <IndustryPage
      canonicalSlug="signs-north-battleford-sk"
      primaryProductSlug="coroplast-signs"
      title="Signs & Printing North Battleford SK"
      subtitle="Coroplast signs, vehicle magnets, ACP aluminum, and vinyl banners — printed in Saskatoon, shipped to North Battleford."
      heroImage="/images/products/heroes/agriculture-hero-1200x500.webp"
      heroAlt="Signs and printing for North Battleford SK — True Color Display Printing Saskatoon"
      description="Grain operations, Indigenous-owned businesses, and contractors in the Battlefords area shouldn't have to settle for a local shop that outsources large-format work. True Color prints coroplast from $8/sqft, ACP aluminum from $13/sqft, and vehicle magnets from $24/sqft in-house on Roland UV equipment in Saskatoon — and ships directly to North Battleford, 140km northwest. Order online, approve your proof by email, delivered in 3–5 business days."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            Grain operations, Indigenous-owned businesses, and contractors in the Battlefords area
            often end up waiting two weeks for a sign because the local shop outsources large-format
            work. True Color prints everything in-house in Saskatoon on our Roland UV press and
            ships directly to North Battleford — 140km northwest. You approve a digital proof by
            email, we print once it&apos;s confirmed, and your order arrives in 3–5 business days.{" "}
            <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              Coroplast signs
            </Link>{" "}
            from $8/sqft are UV-printed and weather-resistant for 2–3 years outdoors. H-stakes
            at $2.50 each for yard and field use.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Service businesses and ag operations in the Battlefords need branding that travels
            with their equipment.{" "}
            <Link href="/vehicle-magnets-saskatoon" className="text-[#16C2F3] underline font-medium">
              Vehicle magnets
            </Link>{" "}
            from $24/sqft (minimum $45) stick securely to steel service truck doors and equipment
            cabs — remove cleanly with no adhesive residue. ACP aluminum signs from $13/sqft
            for permanent business and facility signage that handles northwest Saskatchewan winters.
            An 18×24&quot; ACP panel is $39; 24×36&quot; is $66. Vinyl banners from $8.25/sqft for
            seasonal promotions, grand openings, and community events.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order for North Battleford delivery: call (306) 954-8688 or submit your quote at
            truecolorprinting.ca. We email a digital proof for your approval before printing.
            Once approved and payment confirmed, we print in-house and ship to your North Battleford
            address. Standard timeline: 3–5 business days. No design file? Our in-house designer
            preps artwork from any format for $35 flat, same-day proof. Rush orders available for
            +$40 — place by 10 AM.
          </p>
        </>
      }
      products={[
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
      ]}
      whyPoints={[
        "In-house Roland UV press — no outsourcing markup, consistent colour on every order shipped to North Battleford",
        "Coroplast from $8/sqft — UV-printed, weatherproof for 2–3 years, H-stakes $2.50 each",
        "Vehicle magnets from $24/sqft — service truck and ag equipment branding across northwest SK",
        "ACP aluminum from $13/sqft — permanent facility and business signage, 10+ year outdoor lifespan",
        "Vinyl banners from $8.25/sqft — hemmed edges, grommets every 2 ft, 13oz outdoor vinyl",
        "Ships to North Battleford — approve proof by email, 3–5 business days to your door",
        "In-house designer — $35 flat, same-day proof, works from any logo or rough description",
      ]}
      faqs={[
        {
          q: "How do I order signs shipped to North Battleford?",
          a: "Submit your order at truecolorprinting.ca or call (306) 954-8688. We email a digital proof for approval. Once approved and payment confirmed, we print in Saskatoon and ship to your North Battleford address. Standard timeline is 3–5 business days total.",
        },
        {
          q: "What does shipping to North Battleford cost?",
          a: "Shipping is the customer's responsibility. We quote it before you commit. For a small order of 10 or fewer signs, shipping to North Battleford — 140km from Saskatoon — is typically $25–$40 by courier. Large runs and full-sheet ACP panels may cost more; call (306) 954-8688 for a quote.",
        },
        {
          q: "Do you print vehicle magnets for ag and service trucks in the Battlefords?",
          a: "Yes — 30mil vehicle magnets from $24/sqft (minimum $45). Custom rectangle or shaped. They stick securely to steel truck doors, remove cleanly, and are a popular choice for grain farmers, oilfield service crews, and contractors working northwest Saskatchewan.",
        },
        {
          q: "Can you print ACP aluminum signs for a business in North Battleford?",
          a: "Yes — ACP aluminum signs from $13/sqft. An 18×24\" panel is $39, 24×36\" is $66. ACP is the right choice for permanent outdoor business signage — survives 10+ years without fading or warping in harsh Saskatchewan winters. We print on Roland UV and ship flat to North Battleford.",
        },
        {
          q: "Is there a local print shop in North Battleford that beats your prices?",
          a: "There are print shops in the Battlefords, but most outsource large-format printing rather than producing it in-house. True Color owns our Roland UV press in Saskatoon, which keeps production costs lower. Many North Battleford customers find our pricing competitive even after factoring in shipping.",
        },
        {
          q: "What is the minimum order for North Battleford customers?",
          a: "No minimum order. You can order a single coroplast sign or one vehicle magnet. Volume discounts apply automatically as your order quantity grows. Business cards start at 250 for $45, flyers at 100 for $45.",
        },
      ]}
    />
  );
}
