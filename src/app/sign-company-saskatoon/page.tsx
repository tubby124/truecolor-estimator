import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";
import { DesignDirectionGrid } from "@/components/site/DesignDirectionGrid";

export const metadata: Metadata = {
  title: { absolute: "Sign Company Saskatoon | Coroplast & ACP | True Color" },
  description:
    "Saskatoon sign company — coroplast from $8/sqft, ACP aluminum from $13/sqft, vinyl lettering, vehicle magnets. Same-day rush +$40. Print at 216 33rd St W.",
  alternates: { canonical: "/sign-company-saskatoon" },
  openGraph: {
    title: "Sign Company Saskatoon | Coroplast, ACP & Vinyl | True Color",
    description:
      "Full-service sign company in Saskatoon. Coroplast from $8/sqft, ACP from $13/sqft, same-day rush available. Local pickup 216 33rd St W.",
    url: "https://truecolorprinting.ca/sign-company-saskatoon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

const designDirections = [
  {
    title: "Coroplast Sign Applications",
    subtitle:
      "From $8/sqft · $25 order minimum · 4mm flute coroplast · Roland UV in-house",
    aspect: "3/4" as const,
    maxCols: 3 as const,
    items: [
      {
        src: "/images/industries/sign-company/sign-yard-real-estate.webp",
        alt: "Real estate yard sign printed on coroplast in Saskatoon — True Color Display Printing, Saskatoon SK",
        label: "Real Estate Yard Sign",
        caption: "18×24\" — $24 raw",
      },
      {
        src: "/images/industries/sign-company/sign-job-site.webp",
        alt: "Construction job site coroplast sign printed in Saskatoon — True Color Display Printing, Saskatoon SK",
        label: "Job Site Sign",
        caption: "4×8 ft — $232",
      },
      {
        src: "/images/industries/sign-company/sign-event-directional.webp",
        alt: "Event directional coroplast sign printed in Saskatoon — True Color Display Printing, Saskatoon SK",
        label: "Event Directional",
        caption: "24×36\" — $48",
      },
    ],
  },
  {
    title: "ACP Aluminum Applications",
    subtitle:
      "From $13/sqft · 3mm aluminum composite · permanent outdoor-rated · standoff-ready",
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
];

export default function SignCompanySaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="sign-company-saskatoon"
      primaryProductSlug="coroplast-signs"
      title="Sign Company — Saskatoon"
      subtitle="Coroplast, ACP aluminum, vinyl lettering, vehicle magnets. Printed in-house. Same-day available."
      heroImage="/images/products/heroes/construction-hero-1200x500.webp"
      heroAlt="Coroplast and aluminum signs printed in Saskatoon by True Color Display Printing"
      description={
        "A sign company prints, cuts, and finishes custom signs from submitted artwork or designs them in-house. True Color Display Printing is a Saskatoon sign company at 216 33rd St W specializing in coroplast signs from $8/sqft, ACP aluminum signs from $13/sqft, vinyl banners from $8.25/sqft, vehicle magnets, window decals, and vinyl lettering — all printed on an in-house Roland UV printer with 1–3 business day turnaround.\n\nSign material comparison: coroplast (4mm corrugated plastic) costs $8/sqft and suits temporary outdoor use rated 2–3 years; ACP aluminum composite (3mm rigid panel) costs $13/sqft and suits permanent storefront and exterior signage rated 7–10 years; vinyl banners cost $8.25/sqft and suit event, fence, and flexible-hang applications. Same-day rush is available on all sign products for +$40 flat.\n\nTrue Color Display Printing is Saskatoon's in-house sign company — everything from temporary coroplast yard signs to permanent ACP aluminum panels is designed, printed, and cut under one roof at 216 33rd St W. No outsourcing to a national supplier, no waiting a week for your order to ship from Vancouver. Most sign orders are ready in 1–3 business days.\n\nCoroplast (corrugated plastic) is the go-to material for temporary outdoor signs in Saskatchewan. At 4mm thickness, it's lightweight, UV-resistant, and reusable season after season. Yard signs, job site signs, election signs, real estate listings, and event directional signs are all common coroplast applications. Standard sizes start at 18×24\" ($30) and go up to 4×8 ft sheets ($232). H-wire stakes are $2.50 each for ground mounting.\n\nFor permanent business signage, ACP (aluminum composite panel) is the professional choice. 3mm aluminum composite with a polyethylene core — rigid, weather-resistant, and clean-looking mounted on standoffs. ACP panels work for storefront signs, office directories, building exterior signs, and construction hoarding panels. Starting at $13/sqft single-sided — a 24×36\" panel is $78 (orders under $25 are topped up to a $25 small-order minimum at checkout).\n\nVinyl lettering and cut graphics handle text-only applications: window lettering, equipment labels, vehicle door text, and office door identification. Precision plotter-cut, no background material, clean edge finish. Vehicle magnets from $24/sqft — door magnets that turn any truck or van into a mobile billboard for your business, with no paint damage.\n\nEvery sign order includes an in-house design review. Our designer checks your file for print-readiness, corrects colour profiles, and flags issues before the job goes to press. If you need a layout built from scratch, that's a $35 flat fee. Same-day rush is available on all sign products for +$40 flat when ordered before 10 AM.\n\nSaskatoon businesses, contractors, event organizers, and government offices choose True Color because the turnaround is fast, the quality is consistent, and you're dealing with one shop — not a broker who ships your job somewhere else."
      }
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            True Color Display Printing is a full-service sign company in Saskatoon at 216 33rd St W —
            printing{" "}
            <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              coroplast signs from $8/sqft
            </Link>
            ,{" "}
            <Link href="/aluminum-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              ACP aluminum signs from $13/sqft
            </Link>
            ,{" "}
            <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              vinyl banners from $8.25/sqft
            </Link>
            , and{" "}
            <Link href="/vehicle-magnets-saskatoon" className="text-[#16C2F3] underline font-medium">
              vehicle magnets
            </Link>{" "}
            — all on an in-house Roland UV printer with 1–3 business day turnaround. Same-day rush
            for +$40 flat on orders placed before 10 AM.
          </p>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            Coroplast (4mm corrugated plastic) suits temporary outdoor signs — real estate listings,
            job site identification, election campaigns, and event directionals. Starting at $8/sqft with
            H-stakes at $2.50 each. ACP aluminum composite (3mm rigid panel) is the permanent choice
            for storefront signs, office directories, and building exteriors — rated 7–10 years
            outdoors, starting at $13/sqft. Our{" "}
            <Link href="/graphic-design-saskatoon" className="text-[#16C2F3] underline font-medium">
              in-house designer
            </Link>{" "}
            handles layouts for $35 flat with a same-day proof — no separate design vendor needed.
          </p>
          <DesignDirectionGrid sections={designDirections} />
        </>
      }
      products={[
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Vinyl Lettering", from: "from $8.50/sqft", slug: "vinyl-lettering" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
      ]}
      whyPoints={[
        "Coroplast yard signs from $8/sqft — 18×24\" for $24 raw, 4×8 ft for $232, H-stakes $2.50 ea",
        "ACP aluminum signs from $13/sqft — 24×36\" for $78, permanent outdoor-rated substrate",
        "Vehicle magnets from $24/sqft — removable, no paint damage, full-colour UV print",
        "Vinyl lettering for windows, vehicles, and equipment — precision plotter, clean edge finish",
        "In-house Roland UV printer — same building as your designer, no outsourcing",
        "Same-day rush for +$40 flat on all sign products when ordered before 10 AM",
        "In-house designer handles layouts from scratch — $35 flat, proof same day",
        "Local pickup at 216 33rd St W, Saskatoon — no shipping, no waiting",
      ]}
      faqs={[
        {
          q: "How much do coroplast signs cost in Saskatoon?",
          a: "Coroplast signs at True Color start at $8/sqft single-sided. Common sizes: 18×24\" = $24 raw, 24×36\" = $48, 4×4 ft = $120, 4×8 ft = $232. Volume pricing: 8% off at 5+ signs, 17% off at 10+ signs, 23% off at 25+ signs. H-wire ground stakes are $2.50 each.",
        },
        {
          q: "What's the difference between coroplast and ACP aluminum signs?",
          a: "Coroplast is corrugated plastic — lightweight, inexpensive, and great for temporary signs (real estate, events, job sites, elections). It lasts 2–3 years outdoors. ACP (aluminum composite panel) is a rigid 3mm aluminum panel — permanent, professional-looking, and suited for storefront signage, office directories, and long-term outdoor use. ACP starts at $13/sqft vs $8/sqft for coroplast.",
        },
        {
          q: "How long do coroplast signs last outdoors in Saskatchewan?",
          a: "Properly stored, coroplast signs last 2–3 seasons of outdoor use. Saskatchewan UV exposure will fade unlaminated prints over time — if you need longer life outdoors, ACP aluminum is the better choice. Coroplast is ideal for seasonal signs, events, and short-term campaigns where cost matters.",
        },
        {
          q: "Can I get signs made same day in Saskatoon?",
          a: "Yes — same-day rush printing is available for +$40 flat on orders placed before 10 AM. Call (306) 954-8688 to confirm capacity for your quantity. Most same-day orders are ready for pickup by 4–5 PM.",
        },
        {
          q: "Do you offer graphic design for signs?",
          a: "Yes — our in-house designer handles sign layouts for a flat fee of $35. That covers the initial proof and two revision rounds. If you have existing artwork, we'll review your file for free and flag any issues before printing. Logo creation and more complex sign packages are quoted individually.",
        },
        {
          q: "What size are standard yard signs?",
          a: "The most common yard sign size in Saskatoon is 18×24\" — it's the standard for real estate, election campaigns, and job site signs. 24×36\" is popular for higher-visibility placements and commercial properties. 4×8 ft sheets are used for large job site hoardings and building identification.",
        },
        {
          q: "How much do ACP aluminum signs cost in Saskatoon?",
          a: "ACP signs at True Color are $13/sqft single-sided. Common sizes: 12×18\" = $19.50 (bumps to $25 small-order minimum), 24×36\" = $78, 4×4 ft = $176, 4×8 ft = $320. ACP is the material of choice for permanent storefront signs, office building directories, and any application where rigid, weather-resistant signage is required.",
        },
        {
          q: "Where can I get a sign made in Saskatoon?",
          a: "True Color Display Printing is at 216 33rd St W, Saskatoon, SK S7L 0V1 — west side of the city near Circle Drive. We print coroplast, ACP, vinyl banners, vehicle magnets, and window decals in-house with a standard 1–3 business day turnaround. Same-day rush available. Call (306) 954-8688.",
        },
      ]}
    />
  );
}
