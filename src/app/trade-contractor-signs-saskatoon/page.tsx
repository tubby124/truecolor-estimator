import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Trade Contractor Signs Saskatoon | True Color",
  description:
    "Vehicle magnets from $45, yard signs from $24, ACP aluminum job-site signs from $39. Saskatoon plumbers, electricians & contractors. Rush +$40. Roland UV printed.",
  alternates: {
    canonical: "https://truecolorprinting.ca/trade-contractor-signs-saskatoon",
  },
};

const description =
  "True Color Display Printing makes vehicle magnets, coroplast yard signs, ACP aluminum signs, and vinyl banners for Saskatoon plumbers, electricians, HVAC contractors, roofers, and general contractors. Vehicle magnets start at $45 (minimum) on 30mil thick magnetic material — custom rectangle, stack and remove cleanly between jobs. Coroplast yard signs are $24 each at 18×24\" on our in-house Roland UV printer. ACP aluminum job-site signs start at $39 for 18×24\" and $66 for 24×36\". Rush production is +$40 flat when ordered before 10 AM. Our in-house designer handles layout for $35 flat with a same-day proof. Standard turnaround is 1–3 business days.";

export default function TradeContractorSignsSaskatoon() {
  return (
    <IndustryPage
      title="Trade Contractor Signs Saskatoon"
      subtitle="Vehicle magnets, yard signs, ACP aluminum & job-site banners for Saskatoon trades"
      heroImage="/images/products/heroes/construction-hero-1200x500.webp"
      heroAlt="Trade contractor vehicle magnets and job-site signs printed in Saskatoon"
      description={description}
      descriptionNode={
        <>
          <p>
            True Color Display Printing makes signage for Saskatoon plumbers, electricians, HVAC
            contractors, roofers, and general contractors. Our in-house Roland UV printer handles
            everything from truck magnets to job-site banners without outsourcing delays.{" "}
            <Link
              href="/products/vehicle-magnets"
              className="text-[#16C2F3] underline font-medium"
            >
              Vehicle magnets
            </Link>{" "}
            start at $45 minimum on 30mil thick magnetic material — printed in full colour with
            sharp edges. They stack cleanly between jobs and pull off without damaging your vehicle
            wrap or paint. Order a set for every truck in your fleet and brand every service call.
          </p>
          <p>
            Coroplast yard signs are the fastest way to advertise at every job site.{" "}
            <Link
              href="/products/coroplast-signs"
              className="text-[#16C2F3] underline font-medium"
            >
              Coroplast signs
            </Link>{" "}
            start at $8/sqft — an 18×24&Prime; sign is $24 each, with an 8% bulk discount when you
            order 5 or more. Need permanent job-site signage?{" "}
            <Link
              href="/aluminum-signs-saskatoon"
              className="text-[#16C2F3] underline font-medium"
            >
              ACP aluminum signs
            </Link>{" "}
            start at $13/sqft — an 18×24&Prime; panel is $39 and a 24×36&Prime; panel is $66.
            Aluminum composite holds up through Saskatchewan winters and looks professional mounted
            on any job-site hoarding.
          </p>
          <p>
            Vinyl banners start at $8.25/sqft with grommets always included — a 2×4&prime; banner
            is $66 and a 3×6&prime; is $135. Use them on chain-link fencing, site hoardings, and
            scaffolding. Business cards for your crew start at $40 for 250. Rush production is
            +$40 flat, order before 10 AM. Our in-house designer creates your layout for $35 flat
            with a same-day proof. See our{" "}
            <Link
              href="/construction-signs-saskatoon"
              className="text-[#16C2F3] underline font-medium"
            >
              construction signs page
            </Link>{" "}
            for more job-site print options, or call{" "}
            <a href="tel:+13069548688" className="text-[#16C2F3] underline font-medium">
              (306) 954-8688
            </a>
            .
          </p>
        </>
      }
      products={[
        {
          name: "Vehicle Magnets",
          from: "From $45 — 30mil thick, custom size",
          slug: "vehicle-magnets",
        },
        {
          name: "Coroplast Yard Signs",
          from: "From $8/sqft — 18×24\" = $24",
          slug: "coroplast-signs",
        },
        {
          name: "ACP Aluminum Signs",
          from: "From $13/sqft — 18×24\" = $39",
          slug: "acp-signs",
        },
        {
          name: "Vinyl Banners",
          from: "From $8.25/sqft — grommets incl.",
          slug: "vinyl-banners",
        },
        {
          name: "Business Cards",
          from: "250 for $40 | 500 for $65",
          slug: "business-cards",
        },
      ]}
      whyPoints={[
        "Vehicle magnets on 30mil thick material — stack cleanly, remove without damage",
        "Roland UV in-house printer — weather-resistant colour on all coroplast and ACP signs",
        "Coroplast yard signs from $24 each — 8% bulk discount at 5+ units",
        "ACP aluminum from $39 for 18×24\" — permanent, professional job-site quality",
        "Same-day rush for +$40 flat — order before 10 AM, pick up same day",
        "In-house designer for $35 flat, same-day proof — no artwork files required",
        "1–3 business day standard turnaround | Local pickup at 216 33rd St W, Saskatoon",
      ]}
      faqs={[
        {
          q: "How much do vehicle magnets cost for a contractor's truck in Saskatoon?",
          a: "Vehicle magnets start at a $45 minimum. Pricing is based on size at $24/sqft on 30mil thick magnetic material. They are printed in full colour on our Roland UV printer, stack flat between jobs, and peel off without damaging paint or wraps. Rush production is +$40 for same-day turnaround.",
        },
        {
          q: "What is the cost of coroplast yard signs for a trade contractor?",
          a: "Coroplast signs start at $8/sqft. An 18×24\" sign is $24 each and a 24×36\" sign is $48. Orders of 5 or more signs receive an 8% bulk discount. These are printed in-house on our Roland UV for weather-resistant colour that holds up through Saskatchewan winters.",
        },
        {
          q: "Do you make ACP aluminum job-site signs for contractors?",
          a: "Yes. ACP aluminum composite signs start at $13/sqft. An 18×24\" panel is $39 and a 24×36\" panel is $66. Aluminum composite is rigid, weather-resistant, and looks professional on site hoardings, building exteriors, and gate posts. Great for permanent signage versus temporary coroplast.",
        },
        {
          q: "Can I get a vinyl banner for my job-site fencing or hoarding?",
          a: "Yes. Vinyl banners start at $8.25/sqft with grommets always included — no extra charge. A 2×4' banner is $66 and a 3×6' banner is $135. They attach directly to chain-link fencing and scaffolding. Rush same-day production is +$40 flat when ordered before 10 AM.",
        },
        {
          q: "How fast can you print signs for a trade contractor?",
          a: "Standard turnaround is 1–3 business days from artwork approval. Same-day rush production is available for +$40 flat — order before 10 AM and pick up by end of business day. Everything is printed in-house on our Roland UV so there are no third-party delays.",
        },
        {
          q: "Do I need to provide my own artwork for contractor signs?",
          a: "No. Our in-house designer creates your layout for $35 flat and delivers a proof same day. Provide your logo, phone number, trade, and any colours or references — we handle the rest. Revisions are included until you approve the design.",
        },
        {
          q: "Do you print business cards for contractors and their crew?",
          a: "Yes. Business cards are 250 for $40 or 500 for $65 (2-sided). Our designer can set up a trade-branded template for $35 flat so all cards in your crew stay consistent. Rush production is +$40 for same-day turnaround.",
        },
        {
          q: "How many magnets do I need per truck and how do I order?",
          a: "Most contractors order 2 magnets per truck (driver side + passenger side). Visit our vehicle magnets product page for an instant price, or call (306) 954-8688. Our in-house designer will confirm sizing and layout before printing.",
        },
      ]}
      canonicalSlug="trade-contractor-signs-saskatoon"
      primaryProductSlug="vehicle-magnets"
    />
  );
}
