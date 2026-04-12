import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Vehicle Magnets Regina SK | From $45 | True Color" },
  description:
    "Custom vehicle magnets for Regina SK businesses. From $45 ($24/sqft) — fleet branding, oil services, retail. Printed in Saskatoon, shipped to Regina. True Color Display Printing.",
  alternates: { canonical: "/vehicle-magnets-regina" },
  openGraph: {
    title: "Vehicle Magnets Regina SK | True Color Display Printing",
    description:
      "Custom vehicle magnets from $45 shipped to Regina. Fleet branding, oil services, retail. Roland UV-printed — True Color Display Printing, Saskatoon.",
    url: "https://truecolorprinting.ca/vehicle-magnets-regina",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function VehicleMagnetsReginaPage() {
  return (
    <IndustryPage
      canonicalSlug="vehicle-magnets-regina"
      primaryProductSlug="vehicle-magnets"
      title="Vehicle Magnets Regina SK"
      subtitle="Removable fleet branding from $45 — printed in Saskatoon, shipped to Regina."
      heroImage="/images/products/heroes/construction-hero-1200x500.webp"
      heroAlt="Vehicle magnets for Regina SK fleet branding — True Color Display Printing Saskatoon"
      description="True Color Display Printing in Saskatoon prints custom vehicle magnets for Regina businesses — oil field services, contractors, government fleet vehicles, and retail delivery. From $45 ($24/sqft), printed on our Roland UV press. Shipped directly to Regina in 3–5 business days."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing, based at 216 33rd St W in Saskatoon, prints and ships{" "}
            <Link href="/vehicle-magnets-saskatoon" className="text-[#16C2F3] underline font-medium">
              custom vehicle magnets
            </Link>{" "}
            to Regina businesses and fleet operators across southern Saskatchewan. Regina is
            260 km south of Saskatoon — a major hub for oil field services, government fleets,
            and retail delivery. Our magnets start at $24/sqft ($45 for a standard 12×24&quot;
            sign), UV-printed on 30-mil magnetic stock that holds firmly on steel doors and
            panels without scratching your paint.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Vehicle magnets are ideal for Regina businesses that share vehicles between personal
            and commercial use, or that need removable branding for seasonal campaigns. Order{" "}
            <Link href="/coroplast-signs-regina" className="text-[#16C2F3] underline font-medium">
              coroplast signs
            </Link>{" "}
            and vehicle magnets together to keep your branding consistent from job site to
            vehicle. Common sizes for Regina fleet operators: 12×18&quot; (door signs, $27),
            12×24&quot; ($45), and 18×24&quot; ($54). Custom sizes available up to 24×48&quot;.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: submit your quote at truecolorprinting.ca or call (306) 954-8688. We send
            a digital proof by email before printing. Once approved and payment confirmed, we
            print and ship to your Regina address. Standard turnaround is 1–3 business days
            after approval, plus 1–2 days shipping. No print-ready file? Our in-house designer
            can build your layout from a logo, business card, or rough sketch for $35–$50.
          </p>
        </>
      }
      products={[
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
      ]}
      whyPoints={[
        "Vehicle magnets from $24/sqft — 30-mil magnetic stock, Roland UV-printed",
        "Removable branding — no adhesive, no paint damage, swap vehicles instantly",
        "Oil services, government fleet, and retail delivery experience in Regina market",
        "Match your coroplast signs or banners — consistent fleet-to-site branding",
        "Ships to Regina — 3–5 business days after artwork approval",
        "In-house Roland UV press — no outsourcing, faster turnaround, lower cost",
      ]}
      faqs={[
        {
          q: "How do I order vehicle magnets shipped to Regina?",
          a: "Order online at truecolorprinting.ca or call (306) 954-8688. Send us your logo or artwork. We email a proof for approval, then print and ship to your Regina address via courier. Standard turnaround: 3–5 business days total.",
        },
        {
          q: "How much do vehicle magnets cost for a Regina delivery order?",
          a: "Magnets start at $24/sqft. A 12×24\" magnet is $45. An 18×24\" magnet is $54. A 24×48\" magnet is $144. Shipping to Regina is the customer's responsibility — call (306) 954-8688 for a shipping estimate.",
        },
        {
          q: "Will magnets stay on my vehicle in Regina winters?",
          a: "Our 30-mil magnetic stock holds firmly in cold temperatures on clean, flat steel surfaces. Apply to a clean, dry panel. Avoid placing over plastic trim, rivets, or curved body lines. Remove periodically in winter to prevent moisture trapping.",
        },
        {
          q: "Can I order magnets for a Regina oil field service fleet?",
          a: "Yes — fleet orders for oil services, construction, and government vehicles in the Regina area are common. Volume pricing applies at 5+ magnets. Call (306) 954-8688 for fleet pricing and to discuss your specific vehicle types.",
        },
        {
          q: "What's the most popular vehicle magnet size for Regina businesses?",
          a: "The most common sizes are 12×24\" (standard door sign, $45) and 18×24\" (larger door or side panel, $54). For pickup trucks with larger panels, 18×36\" or 24×36\" magnets give better visibility on Regina roads.",
        },
        {
          q: "Can you match the magnets to my existing Regina business branding?",
          a: "Yes — provide your logo file and brand colours. Our designer will match Pantone/HEX values on the Roland UV printer. If you already have coroplast signs or banners from us, we have your artwork on file.",
        },
      ]}
      relatedCities={[
        { name: "Moose Jaw", slug: "signs-moose-jaw-sk" },
        { name: "Prince Albert", slug: "signs-prince-albert-sk" },
        { name: "Yorkton", slug: "signs-yorkton-sk" },
        { name: "Lloydminster", slug: "printing-lloydminster-sk" },
        { name: "Swift Current", slug: "printing-swift-current-sk" },
        { name: "Estevan", slug: "printing-estevan-sk" },
        { name: "Weyburn", slug: "printing-weyburn-sk" },
        { name: "North Battleford", slug: "signs-north-battleford-sk" },
      ]}
    />
  );
}
