import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Signs North Battleford SK | Coroplast, Banners & Magnets | True Color",
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
      description="True Color Display Printing ships signs, banners, vehicle magnets, and business cards to North Battleford and the Battlefords area. Northwest Saskatchewan's agriculture and retail hub deserves professional signage — we print it in Saskatoon on Roland UV equipment and ship directly to you. Coroplast from $8/sqft, ACP aluminum from $13/sqft, vehicle magnets from $24/sqft. Order online, approve your proof by email, delivered in 3–5 business days. North Battleford is 140km northwest of Saskatoon."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing, located at 216 33rd St W in Saskatoon, prints and ships
            professional signs to North Battleford businesses — 140km northwest of Saskatoon in
            Saskatchewan. The Battlefords area is a regional hub for agriculture, Indigenous
            businesses, and retail serving northwest SK. Whether you run a grain farm, a
            contracting business, or a Main Street shop,{" "}
            <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              coroplast signs
            </Link>{" "}
            from $8/sqft are UV-printed on our Roland press and weather-resistant for 2–3
            years outdoors. H-stakes at $2.50 each for yard and field use.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Agriculture and service businesses in the Battlefords need signage that travels with
            their work.{" "}
            <Link href="/vehicle-magnets-saskatoon" className="text-[#16C2F3] underline font-medium">
              Vehicle magnets
            </Link>{" "}
            from $24/sqft (minimum $45) stick securely to steel service truck doors and equipment
            cabs — remove cleanly with no adhesive residue. ACP aluminum signs from $13/sqft
            for permanent business and facility signage that handles northwest Saskatchewan winters.
            An 18×24" ACP panel is $39; 24×36" is $66. Vinyl banners from $8.25/sqft for
            seasonal promotions, grand openings, and community events.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order for North Battleford delivery: call (306) 954-8688 or submit your quote at
            truecolorprinting.ca. We email a digital proof for your approval before printing.
            Once approved and payment confirmed, we print in-house on our Roland UV and ship to
            your North Battleford address. Standard timeline: 3–5 business days. No design file?
            Our in-house designer preps artwork from any format for $35 flat, same-day proof.
            Rush orders available for +$40 — place by 10 AM.
          </p>
        </>
      }
      products={[
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Business Cards", from: "250 for $40", slug: "business-cards" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
      ]}
      whyPoints={[
        "Coroplast from $8/sqft — UV-printed on Roland press, weatherproof, H-stakes $2.50 each",
        "Vehicle magnets from $24/sqft — service truck and equipment branding across northwest SK",
        "ACP aluminum from $13/sqft — permanent facility and business signage, 10+ year lifespan",
        "Vinyl banners from $8.25/sqft — hemmed edges, grommets every 2 ft, 13oz outdoor vinyl",
        "Ships to North Battleford — order online, approve proof by email, 3–5 business days",
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
          a: "No minimum order. You can order a single coroplast sign or one vehicle magnet. Volume discounts apply automatically as your sqft total grows — coroplast drops from $8/sqft at low volumes. Business cards start at 250 for $40, flyers at 100 for $45.",
        },
      ]}
    />
  );
}
