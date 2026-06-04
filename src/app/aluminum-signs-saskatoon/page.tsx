import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";
import { DesignDirectionGrid } from "@/components/site/DesignDirectionGrid";

const designDirections = [
  {
    title: "ACP Building Applications",
    subtitle:
      "From $13/sqft · 3mm aluminum composite · 10-year outdoor rating · Roland UV print",
    aspect: "4/3" as const,
    maxCols: 3 as const,
    items: [
      {
        src: "/images/industries/sign-company/acp-storefront.webp",
        alt: "ACP aluminum storefront wall sign printed in Saskatoon — True Color Display Printing, Saskatoon SK",
        label: "Storefront Wall Sign",
        caption: "24×36\" — $78",
      },
      {
        src: "/images/industries/sign-company/acp-office-directory.webp",
        alt: "ACP aluminum office directory sign printed in Saskatoon — True Color Display Printing, Saskatoon SK",
        label: "Office Directory",
        caption: "Custom size — from $13/sqft",
      },
      {
        src: "/images/industries/sign-company/acp-hoarding.webp",
        alt: "Construction hoarding ACP panel printed in Saskatoon — True Color Display Printing, Saskatoon SK",
        label: "Construction Hoarding",
        caption: "4×8 ft — $320",
      },
    ],
  },
  {
    title: "Aluminum Sign Examples",
    subtitle:
      "Roland UV printed directly on 3mm ACP panel · vivid colour · no lamination peel",
    aspect: "4/3" as const,
    maxCols: 2 as const,
    items: [
      {
        src: "/images/products/product/acp-sign-brick-wall-800x600.webp",
        alt: "Custom ACP aluminum sign mounted on brick wall in Saskatoon — True Color Display Printing",
        label: "Brick-Wall Mount",
        caption: "Standoff bracket install — quote on request",
      },
      {
        src: "/images/products/product/acp-sign-princess-liquidation-800x600.webp",
        alt: "ACP aluminum signage for Princess Liquidation Savings Center — full-colour Roland UV print, Saskatoon",
        label: "Retail Storefront",
        caption: "Custom design + print + cut",
      },
    ],
  },
];

export const metadata: Metadata = {
  title: { absolute: "Aluminum Signs Saskatoon | ACP Signs from $39" },
  description:
    "Aluminum and ACP signs in Saskatoon from $39 or $13/sqft. 3mm composite panels for storefront, directory, parking and building signs.",
  alternates: { canonical: "/aluminum-signs-saskatoon" },
  openGraph: {
    title: "Aluminum Signs Saskatoon | ACP Signs from $39",
    description:
      "Aluminum and ACP signs in Saskatoon from $39 or $13/sqft. 3mm composite panels for storefront, directory and building signs.",
    url: "https://truecolorprinting.ca/aluminum-signs-saskatoon",
    type: "website",
  },
};

export default function AluminumSignsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="aluminum-signs-saskatoon"
      primaryProductSlug="acp-signs"
      title="Aluminum Signs Saskatoon"
      subtitle="ACP from $13/sqft. 10+ year outdoor lifespan. Professional and permanent."
      heroImage="/images/products/product/acp-sign-princess-liquidation-800x600.webp"
      heroAlt="Custom-printed 3mm ACP aluminum sign for Princess Liquidation Savings Center — full-colour Roland UV print, produced in Saskatoon by True Color Display Printing"
      description="True Color Display Printing produces 3mm aluminum composite (ACP) signs for Saskatoon businesses that need something that lasts. ACP is the go-to material for building directories, commercial real estate signs, permanent site signs, and branded exterior signage. Unlike coroplast, ACP does not bend, warp, fade, or flex. Roland UV ink is printed directly to the panel surface — sharp edges, vivid colour, no lamination needed. Prices start at $13/sqft with volume discounts at 5+ signs (3% off) and 10+ signs (5% off). Order online and get an exact price in 30 seconds."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing produces 3mm aluminum composite (ACP) signs for Saskatoon
            businesses that need something that lasts. ACP is the professional standard for building
            directories, commercial exterior signs, and permanent site identification —
            the kind of sign that&apos;s still looking sharp in 10 years. Unlike coroplast,
            ACP does not bend, warp, or flex. Roland UV ink is printed directly to the panel surface
            — sharp edges, vivid colour, no lamination needed. Prices start at $13/sqft with volume
            discounts at 5+ signs (3% off) and 10+ signs (5% off).
          </p>
          <p className="text-gray-600 leading-relaxed">
            ACP is the go-to material for{" "}
            <Link href="/real-estate-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              real estate and commercial property signs
            </Link>
            ,{" "}
            <Link href="/construction-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              permanent job site identification
            </Link>
            , building suite directories, and any outdoor sign that needs to survive Saskatchewan
            seasons indefinitely. For temporary or budget-conscious applications, our{" "}
            <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              coroplast signs
            </Link>{" "}
            start at $8/sqft and offer a 2–3 year outdoor lifespan. Pickup at 216 33rd St W,
            Saskatoon — same-day rush available (+$40 flat).
          </p>
          <p className="text-gray-600 leading-relaxed">
            What ACP aluminum actually is, and why it lasts: 3mm aluminum composite panel —
            two thin aluminum skins bonded to a polyethylene core. The result is a rigid,
            flat, lightweight panel that won&apos;t warp, rust, or flex in the wind. We print
            directly onto the painted aluminum surface with our in-house Roland UV press;
            the ink is UV-cured at the moment of contact and bonds chemically to the painted
            coating. No lamination layer, no peeling, no chalky fade. The combination of
            aluminum substrate + UV-cured ink produces a sign rated for 10+ years of
            Saskatchewan outdoor service — through freeze-thaw cycles, prairie sun, and
            wind. Indoor lifespans are essentially unlimited.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Saskatoon-specific commercial demand patterns: storefront signs (24×36″ = $78,
            mounted with standoff brackets on a fascia or stucco wall) are the most common
            order, especially for retail along 8th Street, Broadway, and 33rd Street West.
            Office directory boards (custom sizes, often 18×24″ or 24×36″ at $39–$78) for
            multi-tenant commercial buildings — strata corporations and property managers
            order these in batches. Parking lot regulation signs (12×18″ = $19.50 raw, hits
            the $25 cart min as a single piece) mounted on existing posts. Construction
            hoarding panels (4×8 ft = $320) — large building developments where the sign
            stays up for the duration of a multi-year project. Volume discounts kick in at
            5+ signs (3% off), 10+ (5%), 25+ (8%) — the smaller discounts compared to
            coroplast reflect ACP&apos;s narrower margin structure.
          </p>
          <p className="text-gray-600 leading-relaxed">
            When to choose ACP over coroplast: any application where the sign needs to look
            sharp for more than 2–3 years. Permanent storefront identification, building
            entrance signs, parking lot regulations, building directories, any sign that&apos;s
            going on a wall with standoff brackets. ACP is the right call when removability
            is not a feature you need — once installed, it&apos;s staying. The $30 premium for
            a 24×36″ ACP over a coroplast equivalent ($78 vs $48) buys you 5–7× the outdoor
            lifespan, which works out to roughly $4/year amortized — cheaper than the
            replacement labour of swapping a coroplast sign in year 3. For temporary
            seasonal or campaign signage where signs come down within the lifecycle of a
            single event, coroplast remains the right substrate.
          </p>
          <DesignDirectionGrid sections={designDirections} />
        </>
      }
      products={[
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
      ]}
      whyPoints={[
        "3mm aluminum composite — rigid, flat, and weatherproof for 10+ years outdoors",
        "Prices from $13/sqft — volume discounts at 5+ signs (3% off) and 10+ signs (5% off)",
        "Roland UV print directly on panel — no lamination peeling, no fade",
        "Single-sided and double-sided available — ideal for freestanding sign frames",
        "Professional finish for building directories, real estate, and construction sites",
        "Same-day rush (+$40 flat) when ordered before 10 AM — call to confirm",
      ]}
      faqs={[
        {
          q: "How much do aluminum signs cost in Saskatoon?",
          a: "ACP aluminum composite signs are $13/sqft at True Color. An 18×24\" sign (3 sqft) is $39. A 24×36\" sign (6 sqft) is $78. $25 order-total minimum applies at checkout. Volume discounts kick in at 5+ signs (3% off) and 10+ signs (5% off). Get your exact price at /acp-signs-saskatoon.",
        },
        {
          q: "What is ACP aluminum composite?",
          a: "ACP (aluminum composite panel) is a 3mm rigid panel made of two thin aluminum sheets bonded to a polyethylene core. It's flat, lightweight, and extremely rigid — the standard material for commercial building signs, directory boards, and permanent outdoor signage.",
        },
        {
          q: "How long do aluminum signs last outdoors in Saskatchewan?",
          a: "10+ years under normal Saskatchewan conditions. ACP does not rust, warp, or flex. Roland UV ink is UV-resistant and waterproof. The panels handle freeze-thaw cycles and high UV exposure without fading or delaminating.",
        },
        {
          q: "What's the difference between ACP and coroplast for outdoor signs?",
          a: "Coroplast is corrugated plastic — lightweight and affordable for temporary signs (1–3 years outdoors). ACP is rigid aluminum composite — permanent, flat, and professional-looking for 10+ years. Use coroplast for seasonal and campaign signs; use ACP for building signs, directories, and permanent installations.",
        },
        {
          q: "Can I get double-sided aluminum signs?",
          a: "Yes — double-sided ACP is available for freestanding sign frames and post-mounted installations. Price is approximately 50% more than single-sided. Call (306) 954-8688 for a custom quote on mounted or framed installations.",
        },
        {
          q: "What file format do I need for aluminum signs?",
          a: "PDF or JPG at 150 dpi minimum. Vector files (AI, EPS) are preferred for logos and text-heavy designs. Our in-house designer can clean up or recreate artwork — usually $35–$50 depending on complexity.",
        },
        {
          q: "What's the difference between 1-sided and 2-sided ACP aluminum signs?",
          a: "1-sided ACP is printed full-colour on one face only — the back is bare aluminum, suited for wall-mounted signs where only one side is visible. 2-sided ACP prints both faces (each at +$6/sqft over the 1-sided tier) — used for freestanding signs, post-mounted directories, and any application where both sides need to be read. A 24×36″ panel is $78 single-sided or $114 double-sided. ACP doesn't warp or bend, so both finishes look sharp for 10+ years outdoors.",
        },
        {
          q: "How do I mount ACP aluminum signs to a building?",
          a: "Most ACP signs mount with standoff brackets (4 corners, drilled through the panel) or industrial VHB tape for smaller indoor panels. For brick or concrete exteriors, masonry anchors with stainless brackets. We don't install — you'll work with a local sign installer or your facilities team. ACP is rigid and won't crack at the bracket points, so installation is straightforward. Tell us your mount method when ordering so we can position the file correctly.",
        },
      ]}
    />
  );
}
