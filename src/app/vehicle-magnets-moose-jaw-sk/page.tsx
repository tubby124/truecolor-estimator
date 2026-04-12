import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Vehicle Magnets Moose Jaw SK | From $45 | True Color" },
  description:
    "Custom vehicle magnets for Moose Jaw SK businesses. From $45 ($24/sqft) — service businesses, contractors, fleet branding. Printed in Saskatoon, shipped to Moose Jaw.",
  alternates: { canonical: "/vehicle-magnets-moose-jaw-sk" },
  openGraph: {
    title: "Vehicle Magnets Moose Jaw SK | True Color Display Printing",
    description:
      "Custom vehicle magnets from $45 shipped to Moose Jaw. Service businesses, contractors, fleet branding. Roland UV-printed — True Color Display Printing, Saskatoon.",
    url: "https://truecolorprinting.ca/vehicle-magnets-moose-jaw-sk",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function VehicleMagnetsMooseJawPage() {
  return (
    <IndustryPage
      canonicalSlug="vehicle-magnets-moose-jaw-sk"
      primaryProductSlug="vehicle-magnets"
      title="Vehicle Magnets Moose Jaw SK"
      subtitle="Removable fleet branding from $45 — printed in Saskatoon, shipped to Moose Jaw."
      heroImage="/images/products/heroes/construction-hero-1200x500.webp"
      heroAlt="Vehicle magnets for Moose Jaw SK service businesses — True Color Display Printing Saskatoon"
      description="True Color Display Printing in Saskatoon prints custom vehicle magnets for Moose Jaw service businesses, contractors, and tradespeople 75 km southwest. From $45 ($24/sqft) on our Roland UV press. Removable, paint-safe, and weatherproof for Saskatchewan conditions."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing, based at 216 33rd St W in Saskatoon, prints and ships{" "}
            <Link href="/vehicle-magnets-saskatoon" className="text-[#16C2F3] underline font-medium">
              custom vehicle magnets
            </Link>{" "}
            to Moose Jaw service businesses and contractors 75 km away. Our magnets are
            printed on 30-mil magnetic stock on the Roland UV press — full colour, paint-safe,
            and removable. A standard 12×24&quot; door magnet is $45. An 18×24&quot; magnet
            is $54. Custom sizes up to 24×48&quot; available.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Moose Jaw&apos;s service sector — plumbers, electricians, HVAC, landscapers — uses
            vehicle magnets as a cost-effective alternative to vinyl wraps. Brand your
            truck during work hours, remove it on personal time. Pair magnets with{" "}
            <Link href="/coroplast-signs-moose-jaw-sk" className="text-[#16C2F3] underline font-medium">
              coroplast yard signs
            </Link>{" "}
            to create consistent branding from vehicle to job site. Both can ship together
            in one order to Moose Jaw.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: submit your quote at truecolorprinting.ca or call (306) 954-8688.
            We email a proof for approval. Once confirmed, we print and ship to Moose Jaw
            via courier. Standard turnaround: 3–5 business days. Shipping from Saskatoon
            to Moose Jaw typically runs $20–$35. No file? Designer service from $35–$50.
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
        "Service businesses, contractors, and tradespeople in Moose Jaw served",
        "Pair with coroplast signs — consistent branding from vehicle to job site",
        "Ships to Moose Jaw — 3–5 business days, typical shipping $20–$35",
        "In-house Roland UV press — no outsourcing, faster turnaround",
      ]}
      faqs={[
        {
          q: "How do I order vehicle magnets shipped to Moose Jaw?",
          a: "Order online at truecolorprinting.ca or call (306) 954-8688. Send your logo or brief. We email a proof for approval. Once confirmed, we print in Saskatoon and ship to Moose Jaw via courier. Standard total: 3–5 business days.",
        },
        {
          q: "How much do vehicle magnets cost delivered to Moose Jaw?",
          a: "Magnets start at $24/sqft. A 12×24\" magnet is $45. An 18×24\" is $54. Shipping from Saskatoon to Moose Jaw (75 km) typically runs $20–$35. Call (306) 954-8688 for a shipping estimate.",
        },
        {
          q: "Will vehicle magnets hold in Moose Jaw winter temperatures?",
          a: "Our 30-mil magnetic stock holds on clean, flat steel panels in cold temperatures. Apply on a clean, dry surface. Avoid plastic trim, curved body lines, and rivets. Remove periodically in deep winter to prevent moisture trapping under the magnet.",
        },
        {
          q: "Can I order magnets and coroplast signs for my Moose Jaw business in one order?",
          a: "Yes — vehicle magnets and coroplast signs can ship together in one courier order to Moose Jaw. Bundling reduces per-item shipping cost. Call (306) 954-8688 to confirm your combined order.",
        },
        {
          q: "What sizes work best for Moose Jaw service truck doors?",
          a: "The 12×24\" size fits most standard truck doors. For half-ton and 3/4-ton trucks with larger door panels, 18×24\" is more visible. Pairs of door magnets (left + right) are the most common order for Moose Jaw service businesses.",
        },
        {
          q: "Do you do magnetic signs for Moose Jaw contractors who use personal vehicles?",
          a: "Yes — removable magnets are ideal for contractors who use personal trucks for business. Brand the vehicle during work hours, remove when off duty. We regularly print for electricians, plumbers, and HVAC technicians in the Moose Jaw area.",
        },
      ]}
      relatedCities={[
        { name: "Regina", slug: "coroplast-signs-regina" },
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
