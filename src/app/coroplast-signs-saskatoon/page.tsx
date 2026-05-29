import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";
import { DesignDirectionGrid } from "@/components/site/DesignDirectionGrid";

export const metadata: Metadata = {
  title: { absolute: "Coroplast Yard Signs Saskatoon | $8/sqft Real Estate Signs" },
  description:
    "Coroplast yard signs in Saskatoon from $8/sqft — 18×24″ for $24, 4×8 ft for $232. Same-day rush +$40, H-stakes $2.50. Local pickup at 216 33rd St W.",
  alternates: { canonical: "/coroplast-signs-saskatoon" },
  openGraph: {
    title: "Coroplast Signs Saskatoon | True Color Display Printing",
    description:
      "Coroplast yard signs from $8/sqft. Job site, real estate, and election signs. Same-day available. Saskatoon local pickup.",
    url: "https://truecolorprinting.ca/coroplast-signs-saskatoon",
    type: "website",
  },
};

const designDirections = [
  {
    title: "Real Estate & Yard Signs",
    subtitle:
      "18×24\" $24 · 24×36\" $48 · H-stakes $2.50 ea — 4mm flute coroplast ($25 order-total min at checkout)",
    aspect: "3/4" as const,
    maxCols: 3 as const,
    items: [
      {
        src: "/images/industries/coroplast/sign-real-estate.webp",
        alt: "Real estate listing coroplast yard sign printed in Saskatoon — True Color Display Printing, Saskatoon SK",
        label: "Real Estate Listing",
        caption: "18×24\" — $24 raw",
      },
      {
        src: "/images/industries/coroplast/sign-election.webp",
        alt: "Election campaign coroplast sign printed in Saskatoon — True Color Display Printing, Saskatoon SK",
        label: "Election / Campaign",
        caption: "24×36\" — $48",
      },
      {
        src: "/images/industries/coroplast/sign-event-directional.webp",
        alt: "Event directional coroplast sign printed in Saskatoon — True Color Display Printing, Saskatoon SK",
        label: "Event Directional",
        caption: "18×24\" — $24 raw",
      },
    ],
  },
  {
    title: "Job Site & Construction Signs",
    subtitle:
      "4×8 ft from $232 · custom sizes · Roland UV print — weatherproof 2–3 years",
    aspect: "4/3" as const,
    maxCols: 3 as const,
    items: [
      {
        src: "/images/industries/coroplast/sign-job-site.webp",
        alt: "Construction job site coroplast sign printed in Saskatoon — True Color Display Printing, Saskatoon SK",
        label: "Construction Job Site",
        caption: "4×8 ft — $232",
      },
      {
        src: "/images/industries/coroplast/sign-contractor.webp",
        alt: "Contractor company coroplast sign printed in Saskatoon — True Color Display Printing, Saskatoon SK",
        label: "Contractor Company Sign",
        caption: "24×48\" — $90",
      },
      {
        src: "/images/industries/coroplast/sign-hoarding.webp",
        alt: "Construction hoarding coroplast panel printed in Saskatoon — True Color Display Printing, Saskatoon SK",
        label: "Hoarding Panel",
        caption: "4×8 ft — $232",
      },
    ],
  },
];

export default function CoroplastSignsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="coroplast-signs-saskatoon"
      primaryProductSlug="coroplast-signs"
      title="Coroplast Signs Saskatoon"
      subtitle="From $8/sqft. Same-day available. Pick up at 216 33rd St W."
      heroImage="/images/products/product/coroplast-yard-sign-800x600.webp"
      heroAlt="Coroplast yard signs printed in Saskatoon by True Color Display Printing"
      description="True Color Display Printing is Saskatoon's go-to shop for coroplast signs. Whether you need 1 yard sign or 500 job site signs, we print in-house on our Roland UV printer and have them ready in 1–3 business days — same day for rush orders placed before 10 AM. Prices start at $8/sqft with volume discounts at 5+ signs (8% off) and 10+ signs (17% off). H-stakes at $2.50 each."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing is Saskatoon&apos;s go-to shop for coroplast signs.
            Whether you need 1 yard sign or 500 job site signs, we print in-house on our Roland UV
            printer and have them ready in 1–3 business days — same day for rush orders placed before
            10 AM. Prices start at $8/sqft with volume discounts at 5+ signs (8% off) and 10+ signs
            (17% off). H-stakes at $2.50 each. All printing done at 216 33rd St W, Saskatoon —
            no national chain shipping wait.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Coroplast is the backbone of dozens of use cases across Saskatoon and Saskatchewan. Popular applications:{" "}
            <Link href="/construction-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              job site and contractor signs
            </Link>
            ,{" "}
            <Link href="/real-estate-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              real estate yard signs
            </Link>
            ,{" "}
            <Link href="/election-signs" className="text-[#16C2F3] underline font-medium">
              election campaign signs
            </Link>
            , and seasonal yard signs for promotions and events. Double-sided coroplast is available
            for corner lots. Any custom size up to 4×8 ft — use the pricing calculator on the
            product page to get your exact price in 30 seconds.
          </p>
          <p className="text-gray-600 leading-relaxed">
            What coroplast actually is, and why it works in Saskatchewan: 4mm corrugated polypropylene
            fluted board — two skins separated by an internal flute structure that gives the sheet
            rigidity without weight. We print directly to the surface on our in-house Roland UV
            press, where the ink is UV-cured the instant it lands on the substrate. No lamination
            layer to bubble or peel. The Roland UV process produces a scratch-resistant, waterproof,
            freeze-rated print that handles Saskatchewan winters without cracking at the flute edges
            and survives a prairie summer of direct sun without fading. Standard 2–3 year outdoor
            lifespan with proper installation; longer if stored indoors between deployments.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Saskatoon-specific demand patterns we see most: real estate listing season (March
            through September) drives weekly orders of 18×24″ yard signs at $24 each — most agents
            keep a stock of 5–10 signs at a time, hitting the 5+ bulk tier (8% off). Election cycles
            (provincial spring, municipal fall) trigger 200–500 sign campaigns where the 25+ tier
            (23% off) makes the per-sign cost drop below $20. Construction hoardings — 4×8 ft
            panels at $232 each — go up for the duration of a project, where coroplast&apos;s
            2–3 year life span matches the build timeline exactly. Job site safety and trade
            company signage, event directional signs for venues like SaskTel Centre or Prairieland
            Park, and corner-lot political campaigns all run on the same substrate at the same
            tier rates.
          </p>
          <p className="text-gray-600 leading-relaxed">
            When to choose coroplast vs ACP aluminum: coroplast wins on cost ($8/sqft vs $13/sqft)
            and on temporary applications where signs come down within 1–3 years — real estate,
            events, election campaigns, seasonal promos, construction projects. ACP wins on
            permanence and finish — building entrance signs, parking lot regulations, multi-year
            commercial leasing campaigns, anything mounted to a wall with standoff brackets that
            needs to still look sharp in a decade. For a 24×36″ sign, coroplast is $48 and ACP is
            $78 — a $30 premium for ~7× the outdoor lifespan. We print both substrates in-house on
            the same Roland UV press; the choice is about how long the sign needs to stay up, not
            about quality.
          </p>
          <DesignDirectionGrid sections={designDirections} />
        </>
      }
      products={[
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
      ]}
      whyPoints={[
        "Prices from $8/sqft — volume discount at 5+ signs (8% off) and 10+ signs (17% off)",
        "H-stakes at $2.50 each — bundled with any coroplast order",
        "Roland UV print — weatherproof, UV-resistant, 2–3 year outdoor lifespan",
        "Double-sided coroplast available for corner lots and high-traffic placement",
        "In-house designer at 216 33rd St W — bring a sketch, a low-res logo, or a Word doc",
        "Same-day rush available (+$40 flat) when ordered before 10 AM — call to confirm",
      ]}
      faqs={[
        {
          q: "How much does a coroplast sign cost in Saskatoon?",
          a: "Coroplast signs at True Color are $8/sqft single-sided. An 18×24\" sign is $24, a 24×36\" sign is $48. A $25 order-total minimum applies at checkout. Volume discounts apply at 5+ signs (8% off) and 10+ signs (17% off). H-stakes are $2.50 each.",
        },
        {
          q: "How long do coroplast yard signs last outdoors?",
          a: "2–3 years in Saskatchewan conditions. Our Roland UV ink is UV-resistant and waterproof. Signs survive freeze-thaw cycles, high winds, and rain without peeling or fading.",
        },
        {
          q: "Can I get same-day coroplast signs in Saskatoon?",
          a: "Yes — same-day rush is available for an additional $40 flat fee. Order before 10 AM and call us at (306) 954-8688 to confirm capacity. Standard turnaround is 1–3 business days after artwork approval.",
        },
        {
          q: "What sizes do you print?",
          a: "Any custom size up to 4×8 ft. Most popular sizes: 18×24\", 24×36\", 24×48\", and 4×8 ft. Use the pricing calculator at /products/coroplast-signs to get your exact price in 30 seconds.",
        },
        {
          q: "Do you print double-sided coroplast signs?",
          a: "Yes — double-sided coroplast is approximately 50% more than single-sided. Great for corner lots, election signs, and high-traffic intersections where both sides get seen.",
        },
        {
          q: "What file format do you need?",
          a: "PDF or JPG at 150 dpi minimum. If you only have a Word doc or phone photo, our in-house designer can prep it for print — $35 flat, same-day proof.",
        },
        {
          q: "Do realtors use True Color for listing signs?",
          a: "Yes — real estate agents are our most frequent repeat customers. A standard 18×24\" single-sided coroplast yard sign is $24 raw (single signs top up to the $25 order-total minimum at checkout). H-stakes are $2.50 each. Many realtors order 5–10 at a time for active listing season (5+ saves 8%, 10+ saves 17%). Same-day rush (+$40) means you can order the morning of a listing launch and pick up by 4 PM.",
        },
        {
          q: "Is there a minimum order for coroplast signs?",
          a: "Yes — a $25 order-total minimum applies at checkout. A single 18×24\" sign is $24, which gets topped up by a $1 small-order setup fee → you pay $25. To skip the surcharge, order 2 signs ($48) or step up to a 24×36\" sign ($48). Use the pricing calculator to see your exact total.",
        },
      ]}
    />
  );
}
