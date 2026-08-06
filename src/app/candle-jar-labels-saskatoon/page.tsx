import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Candle & Jar Labels Saskatoon | From $25 | True Color" },
  description:
    "Candle jar and preserves labels printed in Saskatoon. 25 labels from $25, 100 for $55 on 3 mil vinyl. Wraparounds, round die-cut tops, 1–3 days.",
  alternates: { canonical: "/candle-jar-labels-saskatoon" },
  openGraph: {
    title: "Candle & Jar Labels Saskatoon | From $25 | True Color",
    description:
      "Custom labels for candles, jam, honey, and preserves. 25 from $25, 100 for $55 on 3 mil vinyl. Wraparounds, die-cut tops. Pickup 216 33rd St W, Saskatoon.",
    url: "https://truecolorprinting.ca/candle-jar-labels-saskatoon",
    images: [{ url: "/images/products/og/candle-jar-labels-og-1200x630.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function CandleJarLabelsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="candle-jar-labels-saskatoon"
      primaryProductSlug="candle-jar-labels"
      title="Candle & Jar Labels — Saskatoon"
      subtitle="Candle and jar labels. 25 from $25. Waterproof 3 mil vinyl, Saskatoon."
      heroImage="/images/products/heroes/candle-jar-labels-hero-1200x500.webp"
      heroAlt="Candle and mason jar labels printed in Saskatoon by True Color"
      description={
        "Custom labels for candle makers, jam and preserves producers, honey sellers, and mason jar brands across Saskatoon and Saskatchewan. 25 labels start at $25, and you can price your exact size and quantity online before ordering. A 2.5×3.5\" jar label runs $55 for 100 and $122.50 for 250; a 2.25\" round lid top is the same $25 for 25 and $55 for 100. A full 2.5×8\" mason jar wraparound is $1.11 each at any quantity — $27.75 for 25, $111 for 100 — because at that size it prices by area rather than by the small-label quantity ladder.\n\nLabels are printed on 3 mil white vinyl with a permanent adhesive, run in-house on our Roland TrueVIS VG2 eco-solvent printer/cutter and gloss laminated. The face holds up to the warm exterior of a lit candle jar — it does not bubble or peel at typical candle-jar surface temperatures. That means the outside of an 8oz or 12oz vessel during a normal burn, not direct contact with melted wax. For jam, jelly, honey, and preserves, the labels survive cold storage, the dishwasher splash zone, and the back-of-the-truck trip to a Saskatoon farmers' market in February.\n\nCommon formats: 2.5×8\" wraparound mason jar labels, round die-cut tops (typically 2.25\" or 2.75\" diameter to fit standard lids), rectangle labels for tin candles and bath product jars, and small ingredient labels for the back of bottles. We contour-cut, so any shape works — square corners, rounded corners, ovals, or fully custom die lines.\n\nTurnaround is 1–3 business days after artwork approval. If you need labels for a weekend market and you are cutting it close, same-day rush is +$40 flat as long as you order before 10 AM and the design is print-ready. Our in-house designer can lay out wraparounds, build round die-cut artwork, or clean up your existing label file for $35 flat with a same-day proof.\n\nEverything is printed in-house at 216 33rd St W, Saskatoon. Call (306) 954-8688 or email info@true-color.ca, or price it yourself on the product page linked below."
      }
      descriptionNode={
        <>
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            Custom labels for candle makers, jam and preserves producers, honey sellers, and mason jar brands across Saskatoon and Saskatchewan. <strong>25 labels start at $25</strong>, and you can price your exact size and quantity online before ordering. A 2.5×3.5&quot; jar label runs <strong>$55 for 100</strong> and $122.50 for 250; a 2.25&quot; round lid top is the same $25 for 25 and $55 for 100. A full 2.5×8&quot; mason jar wraparound is <strong>$1.11 each</strong> at any quantity — $27.75 for 25, $111 for 100 — because at that size it prices by area rather than by the small-label quantity ladder.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            Labels are printed on <strong>3 mil white vinyl</strong> with a permanent adhesive, run in-house on our <strong>Roland TrueVIS VG2 eco-solvent printer/cutter</strong> and gloss laminated. The face holds up to the warm exterior of a lit candle jar — it doesn&apos;t bubble or peel at typical candle-jar surface temperatures. That means the outside of an 8oz or 12oz vessel during a normal burn, not direct contact with melted wax. For jam, jelly, honey, and preserves, the labels survive cold storage, the dishwasher splash zone, and the back-of-the-truck trip to a Saskatoon farmers&apos; market in February.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            Common formats: <strong>2.5×8&quot; wraparound mason jar labels</strong>, round die-cut tops (typically 2.25&quot; or 2.75&quot; diameter to fit standard lids), rectangle labels for tin candles and bath product jars, and small ingredient labels for the back of bottles. We contour-cut, so any shape works — square corners, rounded corners, ovals, or fully custom die lines. Turnaround is <strong>1–3 business days after artwork approval</strong>. Same-day rush is <strong>+$40 flat</strong> if you order before 10 AM with print-ready artwork.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Need design help? Our in-house designer lays out wraparounds, builds round die-cut artwork, and cleans up your label files for <strong>$35 flat</strong> with a same-day proof. For larger sticker runs or contour-cut graphics, see our <a href="/sticker-printing-saskatoon" className="text-[#e63020] underline hover:no-underline">sticker printing</a> page. For storefront window displays at your booth or shop, check our <a href="/window-decals-saskatoon" className="text-[#e63020] underline hover:no-underline">window decals</a>. Pickup at 216 33rd St W, Saskatoon — call <a href="tel:+13069548688" className="text-[#e63020] underline hover:no-underline">(306) 954-8688</a> or email info@true-color.ca.
          </p>
        </>
      }
      products={[
        { name: "Candle & Jar Labels", from: "from $25 / 25", slug: "candle-jar-labels" },
        { name: "Cosmetic Labels", from: "from $25 / 25", slug: "cosmetic-labels" },
        { name: "Product Labels", from: "from $25 / 25", slug: "product-labels" },
        { name: "Stickers", from: "from $25 / 25", slug: "stickers" },
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
        { name: "Business Cards", from: "from $45 / 250", slug: "business-cards" },
      ]}
      whyPoints={[
        "25 labels from $25 — price your exact size and quantity online",
        "2.5×3.5\" jar label: $55 for 100, $122.50 for 250",
        "2.5×8\" mason jar wraparound: $1.11 each at any quantity",
        "3 mil white vinyl with permanent adhesive — holds at candle-jar surface temperatures",
        "Printed in-house on a Roland TrueVIS VG2 eco-solvent printer/cutter",
        "Contour-cut to any shape: wraparounds, round die-cut tops, rectangles, custom die lines",
        "Round die-cut tops at 2.25\" or 2.75\" to fit standard preserves lids",
        "1–3 business days after artwork approval — same-day rush +$40 flat",
      ]}
      faqs={[
        {
          q: "How much do candle and jar labels cost in Saskatoon?",
          a: "25 labels start at $25. A 2.5×3.5\" jar label is $55 for 100 and $122.50 for 250. A 2.25\" round lid top is $25 for 25 and $55 for 100. A full 2.5×8\" mason jar wraparound is $1.11 each at any quantity — $27.75 for 25, $111 for 100 — because a label that size prices by area rather than by the small-label quantity ladder. Configure your exact size and quantity on the product page to see the price before ordering.",
        },
        {
          q: "Will the labels survive a lit candle?",
          a: "Yes — the 3 mil vinyl face holds up to the warm exterior of an 8oz or 12oz candle vessel during a normal burn. It will not bubble or peel at typical candle-jar surface temperatures. The label is not designed for direct contact with melted wax inside the jar — apply it to the outside glass only. Same-day rush still applies if you need a re-run for a weekend market: +$40 flat.",
        },
        {
          q: "What's the standard mason jar wraparound size?",
          a: "2.5×8\" for a 500ml regular-mouth mason jar — that covers about three-quarters of the way around so there is a small visible seam. For wide-mouth 500ml jars, 2.5×9.5\" works better. At 2.5×8\" the price is $1.11 each at any quantity. We can lay out the wraparound for $35 flat if you don't have a print-ready file, with a same-day proof before printing.",
        },
        {
          q: "Can you cut round labels for the tops of preserves jars?",
          a: "Yes — round die-cut tops are standard. 2.25\" diameter fits regular-mouth 500ml mason lids; 2.75\" fits wide-mouth lids. Both price the same as any small label: $25 for 25, $55 for 100. There is no extra die-cut setup fee. Mix wraparounds and tops on the same order and they print together.",
        },
        {
          q: "Are these dishwasher and freezer safe?",
          a: "The vinyl and laminate combination handles cold storage and the dishwasher splash zone without lifting. Top-rack dishwasher cycles are fine; repeated bottom-rack washes will eventually degrade any vinyl label. For freezer storage of jam, honey, and preserves there is no issue — the adhesive holds at sub-zero temperatures, provided you applied the label at room temperature first.",
        },
        {
          q: "How fast can you get labels printed?",
          a: "Turnaround is 1–3 business days after artwork approval, printed in-house. If you have a farmers' market or craft fair this weekend and you are cutting it close, same-day rush is +$40 flat — order before 10 AM with a print-ready file and pick up by end of day at 216 33rd St W, Saskatoon.",
        },
        {
          q: "I don't have a design — can you make one?",
          a: "Yes. Our in-house designer lays out candle and jar labels for $35 flat — that covers initial layout, the wraparound or die-cut template, and two rounds of revisions. Same-day proof if you submit your brief before 10 AM. Bring a description, a reference photo, your logo file, or even a phone photo of a competitor's label you like.",
        },
        {
          q: "Where do I pick up labels in Saskatoon?",
          a: "True Color Display Printing — 216 33rd St W, Saskatoon SK S7L 0V1. Call (306) 954-8688 or email info@true-color.ca. Everything prints in-house, no outsourcing. Local pickup is free; we can also ship across Saskatchewan. Design is $35 flat and same-day rush is +$40 flat.",
        },
      ]}
    />
  );
}
