import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Vehicle Magnets Yorkton SK | From $45 | True Color" },
  description:
    "Custom vehicle magnets for Yorkton SK businesses. From $45 ($24/sqft) — agriculture, retail, contractors. Printed in Saskatoon, shipped to Yorkton.",
  alternates: { canonical: "/vehicle-magnets-yorkton-sk" },
  openGraph: {
    title: "Vehicle Magnets Yorkton SK | True Color Display Printing",
    description:
      "Custom vehicle magnets from $45 shipped to Yorkton. Agriculture, retail, contractor fleet branding. Roland UV-printed — True Color Display Printing, Saskatoon.",
    url: "https://truecolorprinting.ca/vehicle-magnets-yorkton-sk",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function VehicleMagnetsYorktonPage() {
  return (
    <IndustryPage
      canonicalSlug="vehicle-magnets-yorkton-sk"
      primaryProductSlug="vehicle-magnets"
      title="Vehicle Magnets Yorkton SK"
      subtitle="Removable fleet branding from $45 — printed in Saskatoon, shipped to Yorkton."
      heroImage="/images/products/heroes/construction-hero-1200x500.webp"
      heroAlt="Vehicle magnets for Yorkton SK fleet branding — True Color Display Printing Saskatoon"
      description="True Color Display Printing in Saskatoon prints custom vehicle magnets for Yorkton agricultural contractors, retail businesses, and tradespeople 180 km east. From $45 ($24/sqft) on the Roland UV press. Removable, paint-safe, and weatherproof."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing, based at 216 33rd St W in Saskatoon, prints and ships{" "}
            <Link href="/vehicle-magnets-saskatoon" className="text-[#16C2F3] underline font-medium">
              custom vehicle magnets
            </Link>{" "}
            to Yorkton businesses and agricultural contractors 180 km east. Our magnets are
            printed on 30-mil magnetic stock — full colour, paint-safe, and removable.
            A standard 12×24&quot; door magnet is $45, an 18×24&quot; is $54. Custom sizes
            up to 24×48&quot; available. Weatherproof for eastern Saskatchewan conditions.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Yorkton&apos;s agricultural sector and retail service businesses use vehicle
            magnets as a cost-effective fleet branding option. Brand your truck during
            work hours, remove for personal use. Pair magnets with{" "}
            <Link href="/coroplast-signs-yorkton-sk" className="text-[#16C2F3] underline font-medium">
              coroplast signs
            </Link>{" "}
            for consistent vehicle-to-property branding. Both can ship together to Yorkton
            in one courier order.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: submit your quote at truecolorprinting.ca or call (306) 954-8688.
            We email a proof for approval. Once confirmed, we print and ship to Yorkton
            via courier. Standard turnaround: 3–5 business days. Shipping from Saskatoon
            to Yorkton (180 km east) typically runs $25–$45. Designer service from $35–$50.
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
        "Agricultural, retail, and contractor fleet experience in Yorkton area",
        "Pair with coroplast signs — consistent branding from vehicle to property",
        "Ships to Yorkton — 3–5 business days, shipping typically $25–$45",
        "In-house Roland UV press — no outsourcing, reliable turnaround",
      ]}
      faqs={[
        {
          q: "How do I order vehicle magnets shipped to Yorkton?",
          a: "Order online at truecolorprinting.ca or call (306) 954-8688. Send your logo or brief. We email a proof for approval. Once confirmed, we print in Saskatoon and ship to Yorkton via courier. Standard total: 3–5 business days.",
        },
        {
          q: "How much do vehicle magnets cost delivered to Yorkton?",
          a: "Magnets start at $24/sqft. A 12×24\" is $45. An 18×24\" is $54. Shipping from Saskatoon to Yorkton (180 km east) typically runs $25–$45. Call (306) 954-8688 for a shipping estimate.",
        },
        {
          q: "Do vehicle magnets hold in eastern Saskatchewan winters?",
          a: "Our 30-mil magnetic stock holds on clean, flat steel panels in cold temperatures. Apply on a clean, dry surface. Avoid plastic trim and curved body lines. Remove periodically in deep winter to prevent moisture trapping under the magnet.",
        },
        {
          q: "Can I order magnets for an agricultural fleet around Yorkton?",
          a: "Yes — we print for grain operations, farm equipment dealers, and agri-service businesses in the Yorkton area. Custom sizes for trucks, vans, and equipment support vehicles. Fleet orders (5+ sets) qualify for volume pricing — call (306) 954-8688.",
        },
        {
          q: "What's the right magnet size for a Yorkton pickup truck or van?",
          a: "For standard pickup truck doors, 12×24\" ($45) is the most common. For half-ton trucks with larger door panels, 18×24\" ($54) gives more visibility. For cargo vans and service trucks common in Yorkton, 18×36\" or 24×36\" gives full-panel coverage.",
        },
        {
          q: "Can I order magnets and signs together for one Yorkton shipment?",
          a: "Yes — vehicle magnets and coroplast signs can ship together in one courier order to Yorkton. Bundling reduces per-item shipping cost. Call (306) 954-8688 to confirm your combined order.",
        },
      ]}
      relatedCities={[
        { name: "Regina", slug: "coroplast-signs-regina" },
        { name: "Moose Jaw", slug: "signs-moose-jaw-sk" },
        { name: "Prince Albert", slug: "signs-prince-albert-sk" },
        { name: "Lloydminster", slug: "printing-lloydminster-sk" },
        { name: "Swift Current", slug: "printing-swift-current-sk" },
        { name: "Estevan", slug: "printing-estevan-sk" },
        { name: "Weyburn", slug: "printing-weyburn-sk" },
        { name: "North Battleford", slug: "signs-north-battleford-sk" },
      ]}
    />
  );
}
