import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Freezer Labels Prince Albert SK | From $5.50/sqft | True Color" },
  description:
    "Freezer-grade adhesive labels for Prince Albert butchers, fisheries, raw pet food. From $5.50/sqft on 3mil vinyl. Printed in Saskatoon, courier to PA.",
  alternates: { canonical: "/freezer-labels-prince-albert-sk" },
  openGraph: {
    title: "Freezer Labels Prince Albert SK | True Color Display Printing",
    description:
      "3mil vinyl + freezer-grade adhesive. Holds at -18°C. Printed in Saskatoon, couriered to Prince Albert. From $5.50/sqft.",
    url: "https://truecolorprinting.ca/freezer-labels-prince-albert-sk",
    images: [{ url: "/images/products/og/freezer-labels-og-1200x630.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function FreezerLabelsPrinceAlbertPage() {
  return (
    <IndustryPage
      canonicalSlug="freezer-labels-prince-albert-sk"
      primaryProductSlug="stickers"
      title="Freezer Labels — Prince Albert SK"
      subtitle="Freezer-grade adhesive labels for PA food businesses, fisheries, butchers. From $5.50/sqft."
      heroImage="/images/products/heroes/freezer-labels-hero-1200x500.webp"
      heroAlt="Freezer adhesive labels printed for Prince Albert SK food businesses by True Color Display Printing"
      description={
        "Freezer-grade adhesive labels printed in Saskatoon, couriered to Prince Albert 140 km north. From $5.50/sqft on 3mil vinyl with permanent freezer-grade adhesive (ARLPMF7008) — holds at -18°C through condensation cycles. Built for Prince Albert butchers, fisheries handling whitefish and pickerel, hunter/trapper operations packaging wild game, raw pet food makers, and northern food businesses where freezer storage is the norm. Saskatoon-to-PA courier is one of our fastest lanes — same-day to next-day for most carriers."
      }
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing prints freezer-grade adhesive labels at our Saskatoon
            shop and couriers to Prince Albert 140 km north. Stock is 3mil white vinyl with
            freezer-grade adhesive (ARLPMF7008) that holds at -18°C through condensation
            cycles. Pricing from <strong>$5.50/sqft</strong> with a $25 order-total minimum at checkout.
            Material spec and full pricing tiers on our{" "}
            <Link href="/freezer-labels-saskatoon" className="text-[#16C2F3] underline font-medium">
              freezer labels Saskatoon page
            </Link>.
          </p>
          <p className="text-gray-600 leading-relaxed">
            PA food businesses we&apos;ve printed freezer labels for: butchers,{" "}
            <strong>northern fisheries</strong> handling whitefish, pickerel, and walleye
            (frozen lake-side and shipped south through PA), hunter/trapper operations
            packaging wild game, and raw pet food makers. The Saskatoon-to-Prince-Albert
            corridor is one of our fastest courier lanes — most carriers run same-day to
            next-day.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: submit at truecolorprinting.ca or call{" "}
            <a href="tel:+13069548688" className="text-[#16C2F3] underline font-medium">
              (306) 954-8688
            </a>. Print 1–3 business days + courier 1 day to PA. Bundle freezer labels with{" "}
            <Link href="/banner-printing-prince-albert-sk" className="text-[#16C2F3] underline font-medium">
              vinyl banners
            </Link>
            {" "}or{" "}
            <Link href="/coroplast-signs-prince-albert-sk" className="text-[#16C2F3] underline font-medium">
              coroplast signs
            </Link>{" "}
            for one shipment north.
          </p>
        </>
      }
      products={[
        { name: "Freezer Labels", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Stickers", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
      ]}
      whyPoints={[
        "3mil vinyl + freezer-grade adhesive (ARLPMF7008) — holds at -18°C through frost cycles",
        "Already shipping this stock to Saskatoon raw pet food makers, butchers, fisheries",
        "Sqft-tier pricing: $5.50/sqft (T1) down to $3.20/sqft (T4 at 100+ sqft)",
        "$25 order-total minimum — no five-digit MOQ from a label converter",
        "Roland UV inks cure to a solid film — print survives freezer-thaw cycles",
        "1–3 business day print + 1 business day courier to Prince Albert",
        "Same-day rush at +$40 flat when ordered before 10 AM",
        "In-house Photoshop designer: $35 flat for label layout",
      ]}
      faqs={[
        {
          q: "How do I order freezer labels shipped to Prince Albert?",
          a: "Submit at truecolorprinting.ca or call (306) 954-8688. We email a proof. Print in Saskatoon, ground courier to PA. Total: 2–4 business days from approval (PA is one of our fastest courier lanes).",
        },
        {
          q: "How much do freezer labels cost shipped to Prince Albert?",
          a: "Sqft-tiered: $5.50/sqft (T1), $5.00/sqft (T2), $4.30/sqft (T3), $3.20/sqft (T4). $25 order minimum. A 10×2\" label at quantity 500 runs about $300. PA courier cost is typically lowest of our SK lanes.",
        },
        {
          q: "Will the adhesive hold in a Prince Albert deep freezer?",
          a: "Yes — 3mil vinyl with freezer-grade ARLPMF7008 adhesive. Rated for -18°C and below. We've shipped this exact stock to PA fisheries and Saskatoon raw pet food makers. Adhesive doesn't shatter at -40°C ambient PA winters.",
        },
        {
          q: "Do you print labels for fisheries in Prince Albert?",
          a: "Yes — fisheries are a common PA freezer label customer. Whitefish, pickerel, walleye packaging in plastic-wrap or vacuum-sealed bags, frozen lake-side and shipped through PA. Standard label includes species, weight, lot, date, and processor name.",
        },
        {
          q: "What's the turnaround for PA freezer label orders?",
          a: "1–3 business days print + 1 business day courier = 2–4 business days total. Same-day rush (+$40 flat) for orders placed before 10 AM cuts the print side same-day.",
        },
        {
          q: "Can you supply roll labels for a PA packaging line?",
          a: "Yes — for automated packaging lines we supply roll labels on a continuous backing roll. Custom-quoted per run because die shape, label gap, and total quantity affect setup. Call (306) 954-8688 with dispenser specs and quantity.",
        },
      ]}
      relatedCities={[
        { name: "Saskatoon", slug: "freezer-labels-saskatoon" },
        { name: "Regina", slug: "freezer-labels-regina" },
        { name: "Moose Jaw", slug: "freezer-labels-moose-jaw-sk" },
      ]}
    />
  );
}
