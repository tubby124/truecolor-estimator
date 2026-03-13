import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Sticker Printing Saskatoon | Die-Cut Vinyl | True Color" },
  description:
    "Die-cut vinyl sticker printing in Saskatoon. 100 for $160, 250 for $325, 500 for $475. Full-colour UV, waterproof, custom sizes. Local pickup. Rush +$40.",
  alternates: { canonical: "/sticker-printing-saskatoon" },
  openGraph: {
    title: "Sticker Printing Saskatoon | True Color Display Printing",
    description:
      "Custom die-cut vinyl stickers for Saskatoon businesses. 100 for $160, 250 for $325. Waterproof, UV print, same-day rush available. Local pickup.",
    url: "https://truecolorprinting.ca/sticker-printing-saskatoon",
    type: "website",
  },
};

export default function StickerPrintingSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="sticker-printing-saskatoon"
      primaryProductSlug="stickers"
      title="Sticker Printing Saskatoon"
      subtitle="Die-cut vinyl stickers for product labels, promo giveaways, packaging, and vehicle branding — printed in-house, picked up locally."
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="Custom die-cut vinyl stickers printed in Saskatoon"
      description="Custom die-cut vinyl stickers for Saskatoon businesses — product labels, packaging branding, promo giveaways, and vehicle decals. Printed full-colour on our in-house Roland UV printer on durable waterproof vinyl. Standard size is 4x4 inch die-cut. Custom sizes available. Pricing: 100 stickers = $160, 250 = $325, 500 = $475. Same-day rush +$40 flat, order before 10 AM. In-house designer $35 flat with same-day proof. Standard turnaround 1–3 business days after artwork approval. Local pickup at 216 33rd St W, Saskatoon."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            Cheap stickers crack at the edges in Saskatchewan winters, fade on water bottles,
            and smear at die-cut lines. Ours don't. We print die-cut vinyl stickers in Saskatoon
            on our in-house Roland UV printer — waterproof, scratch-resistant, and colour-accurate
            whether they end up on a jar, a truck panel, or a laptop. Standard pricing:{" "}
            <strong>100 stickers = $160</strong>, <strong>250 = $325</strong>,{" "}
            <strong>500 = $475</strong>. Default size is 4×4&quot; die-cut. Custom shapes and
            sizes are available — quote on request.
          </p>
          <p className="text-gray-600 leading-relaxed">
            The Roland UV process produces vivid, scratch-resistant colour that holds up
            outdoors, in refrigerators, on water bottles, and on vehicle panels. No ink
            bleeding at die-cut edges. No cracking in Saskatchewan winters. If you need
            stickers as part of a broader branding package — business cards, packaging
            inserts, window decals — we handle all of it in one shop. Our{" "}
            <Link
              href="/products/window-decals"
              className="text-[#16C2F3] underline font-medium"
            >
              window decals
            </Link>{" "}
            (from $11/sqft) and{" "}
            <Link
              href="/products/business-cards"
              className="text-[#16C2F3] underline font-medium"
            >
              business cards
            </Link>{" "}
            (250 for $45) pair well with a sticker order for a consistent brand kit.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Need stickers fast? Same-day production is available for a{" "}
            <strong>+$40 flat</strong> rush fee when ordered before 10 AM — call
            (306) 954-8688 to confirm. Our in-house designer prepares your artwork for{" "}
            <strong>$35 flat</strong> with a same-day digital proof. You approve the shape
            and layout before we cut a single sticker. Standard turnaround without rush is
            1–3 business days. All orders are ready for local pickup at 216 33rd St W,
            Saskatoon — no shipping delays.
          </p>
        </>
      }
      products={[
        { name: "Stickers (Die-Cut)", from: "100 for $160", slug: "stickers" },
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Vinyl Lettering", from: "from $8.50/sqft", slug: "vinyl-lettering" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
      ]}
      whyPoints={[
        "Colours hold up in SK winters, on water bottles, and on vehicle panels — Roland UV-cured ink won't crack or fade",
        "Die-cut to any shape — circles, logo outlines, ovals — not locked to rectangles or kiss-cut sheets",
        "100 stickers from $160 | 250 from $325 | 500 from $475 — pricing that actually makes sense for a product run",
        "Custom sizes beyond the 4×4\" default — send us your dimensions and we quote it",
        "You see a digital proof before we cut a single sticker — no surprises at pickup",
        "Same-day turnaround for +$40 flat — order before 10 AM, pick up same day",
        "In-house designer $35 flat — bring a logo or a rough idea, we build the die-cut path",
      ]}
      faqs={[
        {
          q: "How much does sticker printing cost in Saskatoon?",
          a: "Die-cut vinyl stickers are priced at 100 for $160, 250 for $325, and 500 for $475. Default size is 4×4\". Custom sizes and shapes are available — contact us for a quote. All stickers are full-colour UV print on waterproof vinyl.",
        },
        {
          q: "What's the minimum sticker order at True Color?",
          a: "The minimum order is 25 stickers — starting from $25 (2×2\" die-cut) or $60 (4×4\" die-cut). Most customers find 100 at $160 to be the best entry point — the per-unit cost drops significantly and you have enough for a launch campaign or product run.",
        },
        {
          q: "Are your stickers waterproof and durable outdoors?",
          a: "Yes — we print on durable waterproof vinyl using our in-house Roland UV printer. The UV-cured ink is scratch-resistant and holds up in outdoor conditions, including Saskatchewan winters. Die-cut edges are clean with no ink bleeding. Suitable for vehicles, outdoor equipment, water bottles, and packaging.",
        },
        {
          q: "Can you print stickers in a custom shape — not just square?",
          a: "Yes — die-cut means we cut to any shape you provide. Common shapes include circles, ovals, rounded rectangles, and custom logo outlines. Our in-house designer ($35 flat) can prepare your die-cut path if you don't have a vector file ready.",
        },
        {
          q: "Can I get stickers same-day in Saskatoon?",
          a: "Yes — same-day production is available for a +$40 flat rush fee when ordered before 10 AM. Call (306) 954-8688 to confirm material and capacity. Standard turnaround without rush is 1–3 business days after artwork approval.",
        },
        {
          q: "Do you do product labels for packaging in Saskatoon?",
          a: "Yes — our die-cut vinyl stickers work well as product labels for jars, bottles, boxes, and bags. For food packaging, verify with your product's requirements (our stickers are not food-safe certified). We print in any shape and size with full-colour Roland UV output. 250 labels for $325 is a common run for small product launches.",
        },
      ]}
    />
  );
}
