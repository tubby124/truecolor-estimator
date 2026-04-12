import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Trades & Construction Signs Saskatoon | Job Site Signage | True Color" },
  description:
    "Job site signs, vehicle magnets, and fleet branding for Saskatoon trades and contractors. Coroplast from $8/sqft, magnets from $45. In-house printing, fast turnaround. True Color.",
  alternates: { canonical: "/trades-signs-saskatoon" },
  openGraph: {
    title: "Trades & Construction Signs Saskatoon | True Color Display Printing",
    description:
      "Job site signs, vehicle magnets, and fleet branding for Saskatoon trades and contractors. Coroplast from $8/sqft. In-house printing.",
    url: "https://truecolorprinting.ca/trades-signs-saskatoon",
    type: "website",
  },
};

const descriptionNode = (
  <>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      Saskatoon contractors, trades, and agribusiness operators rely on True Color for job
      site signage, fleet branding, and marketing materials that hold up through Saskatchewan
      work conditions.{" "}
      <Link href="/construction-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
        Construction signs
      </Link>{" "}
      for active job sites — contractor identification, safety notices, and project branding.{" "}
      <Link href="/trade-contractor-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
        Trade contractor signs
      </Link>{" "}
      for electricians, plumbers, HVAC techs, and general contractors who need consistent
      branding across multiple active sites.{" "}
      <Link href="/vehicle-magnets-saskatoon" className="text-[#16C2F3] underline font-medium">
        Vehicle magnets
      </Link>{" "}
      from $45 turn every truck in your fleet into a moving billboard — removable when
      you&apos;re off the clock, repositionable between vehicles.
    </p>

    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
        Coroplast signs
      </Link>{" "}
      at $8/sqft are the trades standard for job site identification — lightweight, staked
      into the ground or zip-tied to fencing, and cheap enough to leave on-site without
      worrying about damage. ACP aluminum signs at $13/sqft are the better call for permanent
      shop signage or any exterior panel that needs to last years. For seasonal campaigns
      and fleet advertising, vinyl banners from $8.25/sqft are fast to produce and easy
      to store between uses.
    </p>

    <p className="text-gray-600 text-lg leading-relaxed mb-10">
      Agriculture and rural Saskatchewan businesses are covered too.{" "}
      <Link href="/agribusiness-signs-saskatchewan" className="text-[#16C2F3] underline font-medium">
        Agribusiness signs across Saskatchewan
      </Link>{" "}
      and{" "}
      <Link href="/agriculture-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
        agriculture signs in Saskatoon
      </Link>{" "}
      for operations that need seasonal field signage, equipment identification, and dealer
      branding. Business cards for estimators and site supervisors are 250 for $45, ready
      in 24–48 hours. Call{" "}
      <a href="tel:3069548688" className="text-[#16C2F3] underline font-medium">
        (306) 954-8688
      </a>{" "}
      for fleet pricing on 5+ vehicle magnet sets. Local pickup at 216 33rd St W, Saskatoon.
    </p>
  </>
);

export default function TradesSignsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="trades-signs-saskatoon"
      primaryProductSlug="coroplast-signs"
      title="Trades & Construction Signs Saskatoon"
      subtitle="Job site signage, vehicle magnets, and fleet branding for contractors and trades."
      heroImage="/images/products/heroes/construction-hero-1200x500.webp"
      heroAlt="Trades and construction signs for Saskatoon contractors printed by True Color Display Printing"
      description="Job site signs, vehicle magnets, and fleet branding for Saskatoon trades, contractors, and agribusiness operators. Coroplast signs from $8/sqft. Vehicle magnets from $45. ACP aluminum signs from $13/sqft. Vinyl banners from $8.25/sqft. Business cards 250 for $45. Fleet pricing available for 5+ vehicle magnet sets. In-house printing at 216 33rd St W, Saskatoon."
      descriptionNode={descriptionNode}
      products={[
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Vehicle Magnets", from: "from $45", slug: "vehicle-magnets" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
      ]}
      whyPoints={[
        "Coroplast job site signs from $8/sqft — staked or zip-tied, disposable after the build",
        "Vehicle magnets from $45 — removable fleet branding, repositionable between trucks",
        "ACP aluminum shop signs from $13/sqft — permanent, weather-resistant, 10+ year lifespan",
        "Vinyl banners from $8.25/sqft — grand opening, seasonal campaigns, equipment displays",
        "Business cards 250 for $45 — estimators and site supers ready in 24–48 hours",
        "Fleet pricing available for 5+ vehicle magnet sets — call (306) 954-8688",
      ]}
      faqs={[
        {
          q: "What signage do Saskatoon contractors typically need for an active job site?",
          a: "The standard job site kit includes: coroplast identification signs at $8/sqft (a 24×18 inch sign is $16 before the $45 minimum), vehicle magnets on company trucks ($45–$75 per magnet set depending on size), and safety or permit notices. For larger or higher-visibility sites, ACP aluminum panels at $13/sqft provide a more professional and permanent look.",
        },
        {
          q: "Are vehicle magnets good for trades trucks in Saskatoon?",
          a: "Yes — vehicle magnets are the trades standard because they're removable for personal use and repositionable between fleet vehicles. A standard 12×24 inch magnet set is $45. Larger 18×24 inch sets are $65. They're printed on 30mil magnetic material — strong enough to stay on at highway speeds in Saskatchewan wind. Fleet pricing applies on sets of 5 or more.",
        },
        {
          q: "What's the best job site sign for a Saskatoon construction project?",
          a: "Coroplast at $8/sqft is the cost-effective standard — a 24×24 inch contractor sign is $24 before the $45 minimum. It stakes into the ground easily and is cheap enough to leave on-site without worry. For longer projects or higher-traffic locations, 3mm ACP aluminum at $13/sqft is more professional and weather-resistant.",
        },
        {
          q: "Do you print agriculture signs for rural Saskatchewan operations?",
          a: "Yes — we print for agribusiness operators across Saskatchewan, not just Saskatoon. Coroplast field signs, ACP aluminum equipment identification panels, vinyl banners for dealer events, and vehicle magnets for farm trucks are all available. Call (306) 954-8688 for rural delivery options or to arrange a larger volume order.",
        },
        {
          q: "How do I brand my whole trades fleet consistently in Saskatoon?",
          a: "A consistent fleet branding package typically includes vehicle magnets (one set per truck), coroplast job site signs (5–10 per active site), and business cards for estimators and project managers. We keep your logo and brand files on record so every reorder matches exactly. Fleet pricing is available on vehicle magnet orders of 5+ sets.",
        },
        {
          q: "Do you print seasonal signage for ag equipment dealers and farm supply stores?",
          a: "Yes — seeding season and harvest season are peak periods for ag dealer signage. Vinyl banners for equipment displays ($8.25/sqft), coroplast signs for lot pricing and promotions ($8/sqft), and ACP aluminum exterior panels ($13/sqft) for permanent dealer identification are all available. We recommend ordering 2–3 weeks before the season starts to allow for design time.",
        },
      ]}
      relatedCities={[
        { name: "Regina", slug: "coroplast-signs-regina" },
        { name: "Moose Jaw", slug: "signs-moose-jaw-sk" },
        { name: "Prince Albert", slug: "signs-prince-albert-sk" },
        { name: "Yorkton", slug: "signs-yorkton-sk" },
      ]}
    />
  );
}
