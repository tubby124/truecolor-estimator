import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Candle & Jar Labels Saskatoon | from $5.50/sqft | True Color" },
  description:
    "Candle jar, mason jar, and preserves labels printed in Saskatoon. 3mil vinyl, full-colour Roland UV print from $5.50/sqft. Wraparounds, round die-cuts, 1–3 day turnaround.",
  alternates: { canonical: "/candle-jar-labels-saskatoon" },
  openGraph: {
    title: "Candle & Jar Labels Saskatoon | from $5.50/sqft | True Color",
    description:
      "Custom labels for candles, jam, honey, and preserves. 3mil vinyl, full-colour Roland UV print from $5.50/sqft. Wraparounds, die-cut tops. Pickup 216 33rd St W, Saskatoon.",
    url: "https://truecolorprinting.ca/candle-jar-labels-saskatoon",
    images: [{ url: "/images/products/og/candle-jar-labels-og-1200x630.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function CandleJarLabelsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="candle-jar-labels-saskatoon"
      primaryProductSlug="vinyl-banners"
      title="Candle & Jar Labels — Saskatoon"
      subtitle="Candle and jar labels. From $5.50/sqft. Roland UV print, full-colour, Saskatoon."
      heroImage="/images/products/heroes/candle-jar-labels-hero-1200x500.webp"
      heroAlt="Candle and mason jar labels printed in Saskatoon by True Color"
      description={
        "Custom labels for candle makers, jam and preserves producers, honey sellers, and mason jar brands across Saskatoon and Saskatchewan. Pricing starts at $5.50/sqft on 3mil vinyl with full-colour UV print, with a $30 minimum order. Most small candle and jar labels run well under a square foot each, so a typical run of 50–200 labels fits inside the first or second sqft tier. Volume drops the rate fast: 12.01–32 sqft is $5.00/sqft, 32.01–100 sqft is $4.30/sqft, and 100+ sqft drops to $3.20/sqft — useful when you're stocking up for the holiday market season.\n\nLabels are printed on 3mil white vinyl with a permanent adhesive and full-colour Roland UV ink. The matte vinyl face holds up to the warm exterior of a lit candle jar — it doesn't bubble or peel at typical candle-jar surface temperatures (we are talking about the outside of an 8oz or 12oz vessel during a normal burn, not direct contact with melted wax). For jam, jelly, honey, and preserves, the labels survive cold storage, the dishwasher splash zone, and the back-of-the-truck trip to a Saskatoon farmers' market in February.\n\nCommon formats: 2.5×8\" wraparound mason jar labels, round die-cut tops (typically 2.25\" or 2.75\" diameter to fit standard lids), rectangle labels for tin candles and bath product jars, and small ingredient labels for the back of bottles. We cut on a contour cutter so any shape works — square corners, rounded corners, ovals, or fully custom die lines.\n\nTurnaround is 1–3 business days after artwork approval. If you need labels for a weekend market and you're cutting it close, same-day rush is +$40 flat as long as you order before 10 AM and the design is print-ready. Our in-house designer can lay out wraparounds, build round die-cut artwork, or clean up your existing label file for $35 flat with a same-day proof.\n\nEverything is printed in-house on a Roland UV printer at 216 33rd St W, Saskatoon. Call (306) 954-8688 or email info@true-color.ca to get a quote, or use the estimator linked below for instant pricing."
      }
      descriptionNode={
        <>
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            Custom labels for candle makers, jam and preserves producers, honey sellers, and mason jar brands across Saskatoon and Saskatchewan. Pricing starts at <strong>$5.50/sqft</strong> on 3mil vinyl with full-colour UV print, with a <strong>$30 minimum order</strong>. Most small candle and jar labels run well under a square foot each, so a typical run of 50–200 labels fits inside the first or second sqft tier. Volume drops the rate fast: 12.01–32 sqft is $5.00/sqft, 32.01–100 sqft is $4.30/sqft, and 100+ sqft drops to $3.20/sqft — useful when you&apos;re stocking up for the holiday market season.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            Labels are printed on <strong>3mil white vinyl</strong> with a permanent adhesive and full-colour Roland UV ink. The matte vinyl face holds up to the warm exterior of a lit candle jar — it doesn&apos;t bubble or peel at typical candle-jar surface temperatures (we&apos;re talking about the outside of an 8oz or 12oz vessel during a normal burn, not direct contact with melted wax). For jam, jelly, honey, and preserves, the labels survive cold storage, the dishwasher splash zone, and the back-of-the-truck trip to a Saskatoon farmers&apos; market in February.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            Common formats: <strong>2.5×8&quot; wraparound mason jar labels</strong>, round die-cut tops (typically 2.25&quot; or 2.75&quot; diameter to fit standard lids), rectangle labels for tin candles and bath product jars, and small ingredient labels for the back of bottles. We cut on a contour cutter so any shape works — square corners, rounded corners, ovals, or fully custom die lines. Turnaround is <strong>1–3 business days after artwork approval</strong>, printed on our <strong>in-house Roland UV printer</strong>. Same-day rush is <strong>+$40 flat</strong> if you order before 10 AM with print-ready artwork.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Need design help? Our in-house designer lays out wraparounds, builds round die-cut artwork, and cleans up your label files for <strong>$35 flat</strong> with a same-day proof. For larger sticker runs or contour-cut graphics, see our <a href="/sticker-printing-saskatoon" className="text-[#e63020] underline hover:no-underline">sticker printing</a> page. For storefront window displays at your booth or shop, check our <a href="/window-decals-saskatoon" className="text-[#e63020] underline hover:no-underline">window decals</a>. Pickup at 216 33rd St W, Saskatoon — call <a href="tel:+13069548688" className="text-[#e63020] underline hover:no-underline">(306) 954-8688</a> or email info@true-color.ca.
          </p>
        </>
      }
      products={[
        { name: "Candle & Jar Labels", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Stickers", from: "from $5.50/sqft", slug: "stickers" },
        { name: "Vinyl Lettering", from: "from $40", slug: "vinyl-lettering" },
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
        { name: "Business Cards", from: "from $45 / 250", slug: "business-cards" },
        { name: "Postcards", from: "from $58 / 250", slug: "postcards" },
      ]}
      whyPoints={[
        "Sqft-tier pricing — $5.50/sqft tier 1 (0–12 sqft), drops to $3.20/sqft at 100+ sqft",
        "3mil white vinyl with permanent adhesive — matte face holds at candle-jar surface temperatures",
        "Full-colour Roland UV ink — gradients, photos, metallics-style art, all in one pass",
        "Contour-cut to any shape: wraparounds, round die-cut tops, rectangles, custom die lines",
        "Standard mason jar wraparound size: 2.5×8\" — fits 500ml standard jars",
        "Round die-cut tops cut at 2.25\" or 2.75\" to fit standard preserves lids",
        "Turnaround: 1–3 business days after artwork approval — same-day rush +$40 flat",
        "In-house designer for wraparound + die-line layout: $35 flat, same-day proof",
      ]}
      faqs={[
        {
          q: "How much do candle and jar labels cost in Saskatoon?",
          a: "Pricing is by total square footage: $5.50/sqft for 0–12 sqft, $5.00/sqft for 12.01–32 sqft, $4.30/sqft for 32.01–100 sqft, and $3.20/sqft above 100 sqft. Minimum order is $30. A typical run of 100 candle labels at 2.5×3.5\" each works out to roughly 6 sqft — so about $33 in label stock, then divide by your label count for unit cost.",
        },
        {
          q: "Will the labels survive a lit candle?",
          a: "Yes — the matte 3mil vinyl face holds up to the warm exterior of an 8oz or 12oz candle vessel during a normal burn. It will not bubble or peel at typical candle-jar surface temperatures. The label is not designed for direct contact with melted wax inside the jar — apply it to the outside glass only. Same-day rush still applies if you need a re-run for a weekend market: +$40 flat.",
        },
        {
          q: "What's the standard mason jar wraparound size?",
          a: "2.5×8\" for a 500ml regular-mouth mason jar — that covers about three-quarters of the way around so there's a small visible seam. For wide-mouth 500ml jars, 2.5×9.5\" works better. We can lay out the wraparound for $35 flat if you don't have a print-ready file, with a same-day proof before printing.",
        },
        {
          q: "Can you cut round labels for the tops of preserves jars?",
          a: "Yes — round die-cut tops are standard. 2.25\" diameter fits regular-mouth 500ml mason lids; 2.75\" fits wide-mouth lids. We contour-cut on the same Roland UV pass, so there's no extra die-cut setup fee beyond the $30 minimum. Mix wraparounds and tops on the same order to consolidate into a higher sqft tier and drop your rate.",
        },
        {
          q: "Are these dishwasher and freezer safe?",
          a: "The vinyl + UV ink combination handles cold storage and the dishwasher splash zone without lifting. Top-rack dishwasher cycles are fine; bottom-rack repeated washes will eventually degrade any vinyl label. For freezer storage of jam, honey, and preserves — no issue, the adhesive holds at sub-zero temperatures. Quote starts at $30 minimum regardless of run size.",
        },
        {
          q: "How fast can you get labels printed?",
          a: "Turnaround is 1–3 business days after artwork approval on our in-house Roland UV printer. If you have a farmers' market or craft fair this weekend and you're cutting it close, same-day rush is +$40 flat — order before 10 AM with a print-ready file and pick up by end of day at 216 33rd St W, Saskatoon.",
        },
        {
          q: "I don't have a design — can you make one?",
          a: "Yes. Our in-house designer lays out candle and jar labels in Photoshop for $35 flat — that covers initial layout, the wraparound or die-cut template, and two rounds of revisions. Same-day proof if you submit your brief before 10 AM. Bring a description, a reference photo, your logo file, or even a phone photo of a competitor's label you like.",
        },
        {
          q: "Where do I pick up labels in Saskatoon?",
          a: "True Color Display Printing — 216 33rd St W, Saskatoon, SK. Call (306) 954-8688 or email info@true-color.ca. We print everything in-house on a Roland UV printer, no outsourcing. Local pickup is free; we can also ship across Saskatchewan. Minimum order is $30, design is $35 flat, same-day rush is +$40 flat.",
        },
      ]}
    />
  );
}
