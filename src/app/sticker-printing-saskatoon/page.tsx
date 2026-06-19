import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";
import { DesignDirectionGrid } from "@/components/site/DesignDirectionGrid";

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
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

const designDirections = [
  {
    title: "Sticker Design Directions",
    subtitle:
      "100 for $160 · 250 for $325 · 500 for $475 — die-cut vinyl, Roland UV print, waterproof",
    aspect: "4/3" as const,
    maxCols: 3 as const,
    items: [
      {
        src: "/images/products/product/sticker-diecut-truecolor-logo-800x600.webp",
        alt: "Custom die-cut vinyl logo sticker printed in Saskatoon — True Color Display Printing",
        label: "Logo Die-Cut",
        caption: "100 for $160 — brand identity stickers",
      },
      {
        src: "/images/products/product/sticker-custom-sheet-800x600.webp",
        alt: "Custom sticker sheet printed in Saskatoon for product packaging — True Color Display Printing",
        label: "Product / Packaging Stickers",
        caption: "250 for $325 — labels for jars, bottles, boxes",
      },
      {
        src: "/images/products/product/sticker-laptop-waterbottle-800x600.webp",
        alt: "Vinyl stickers on laptop and water bottle printed in Saskatoon — True Color Display Printing",
        label: "Laptop / Bottle / Vehicle",
        caption: "500 for $475 — promo giveaways + branding",
      },
    ],
  },
  {
    title: "Sizes & Shapes",
    subtitle: "4×4\" default die-cut · custom shapes available · from $25 (25× 2×2\")",
    aspect: "4/3" as const,
    maxCols: 2 as const,
    items: [
      {
        src: "/images/products/product/sticker-diecut-truecolor-logo-800x600.webp",
        alt: "4 inch die-cut vinyl sticker printed in Saskatoon — True Color Display Printing",
        label: "4×4\" Die-Cut (Default)",
        caption: "Most popular — 100 for $160",
      },
      {
        src: "/images/products/product/sticker-custom-sheet-800x600.webp",
        alt: "Custom shape vinyl sticker printed in Saskatoon — True Color Display Printing",
        label: "Custom Shape",
        caption: "Logo outlines, ovals, rounded — quote on request",
      },
    ],
  },
];

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
            and smear at die-cut lines. Ours don&apos;t. We print die-cut vinyl stickers in Saskatoon
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
              href="/window-decals-saskatoon"
              className="text-[#16C2F3] underline font-medium"
            >
              window decals
            </Link>{" "}
            (from $11/sqft) and{" "}
            <Link
              href="/business-cards-saskatoon"
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
          <p className="text-gray-600 leading-relaxed">
            <strong>What does &quot;custom stickers near me&quot; mean at True Color in Saskatoon?</strong> It means die-cut vinyl stickers printed in-house at 216 33rd St W on a Roland UV press — 100 stickers for $160, 250 for $325, 500 for $475 on the default 4×4&quot; size. Every order is true die-cut: contour-cut around your custom shape (not just kiss-cut on a sheet), printed on durable waterproof vinyl, with no edge cracking through Saskatchewan winters. Looking for <strong>custom labels near me</strong> for jars, candles, cosmetics, growler tags, or freezer-rated packaging across Saskatchewan? Same Roland UV process, same pricing tier — the die-cut path is built around your label outline and proofed same-day before any vinyl gets cut. Same-day rush is +$40 flat (order before 10 AM); standard turnaround is 1–3 business days. In-house designer $35 flat with same-day proof.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Looking for <strong>die cut stickers near me</strong> in Saskatoon? Every sticker
            we print is true die-cut — kiss-cut sheets, contour-cut around your logo, or
            individual shaped stickers separated to your spec. The die-cut path is built
            from your vector file (or our designer creates one for $35 flat). We don&apos;t
            outsource — files cut here, on the same Roland UV that printed them, so the
            registration is exact and the edges are clean. Looking for{" "}
            <strong>die cut labels near me</strong> for product packaging? Same process,
            same pricing — 250 product labels for $325 is the most common run for a
            Saskatchewan small-business product launch.
          </p>
          <p className="text-gray-600 leading-relaxed">
            For packaging-heavy orders, we separate sticker jobs by use: promo stickers for
            giveaways, die-cut product labels for jars and bottles, and larger vinyl decals for
            windows or equipment. If your label needs exact sizing, bring the container
            dimensions and we build the cut line around the finished piece. For label systems
            across several SKUs, see our{" "}
            <Link
              href="/product-labels-saskatoon"
              className="text-[#16C2F3] underline font-medium"
            >
              product labels
            </Link>{" "}
            page.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Not sure whether to order individual die-cut stickers or a sticker sheet? Individual
            die-cut stickers work best for handouts, retail inserts, laptop stickers, water-bottle
            promos, and product-label runs where each label needs to peel cleanly on its own.
            Sticker sheets are better when you want several small designs grouped together for
            events, maker markets, or sample packs. The same price grid applies to the finished
            size: a 4×4&quot; default run is <strong>100 for $160</strong>,{" "}
            <strong>250 for $325</strong>, and <strong>500 for $475</strong>; small 2×2&quot;
            runs start at <strong>25 for $25</strong>. We can place multiple designs on one
            sheet if the margins and cut spacing are clean enough, or build that file for{" "}
            <strong>$35 flat</strong> with a same-day proof.
          </p>
          <DesignDirectionGrid sections={designDirections} />
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
          q: "Where can I get custom stickers near me in Saskatoon?",
          a: "True Color Display Printing at 216 33rd St W, Saskatoon — full-colour custom stickers from 100 for $160, 250 for $325, 500 for $475 on waterproof die-cut vinyl. Every order is printed in-house on our Roland UV press, so the colour you see in the proof is the colour you pick up. Same-day rush available for +$40 flat when ordered before 10 AM.",
        },
        {
          q: "Where can I get custom labels near me in Saskatchewan?",
          a: "We print custom die-cut labels in Saskatoon for Saskatchewan small businesses — candle jars, cosmetics, food packaging, growlers, freezer products, beauty bottles. Standard run is 100 labels for $160 or 250 for $325 on waterproof Roland UV vinyl. Bring the container dimensions and our in-house designer ($35 flat) builds the cut line around the finished piece — same-day proof, 1–3 business day production.",
        },
        {
          q: "Where can I get die cut stickers near me in Saskatoon?",
          a: "True Color at 216 33rd St W, Saskatoon prints true die-cut stickers — cut along your logo or custom shape on the same Roland UV that printed them, no outsourcing. Standard pricing is 100 for $160, 250 for $325, 500 for $475 with the 4×4\" default size. Custom shapes and sizes quoted on request, same-day rush available for +$40 flat.",
        },
        {
          q: "Do you make custom die cut stickers near me for laptops, water bottles, and vehicles?",
          a: "Yes — die-cut vinyl stickers from $160 / 100 hold up on laptops, water bottles, helmets, vehicle panels, and outdoor signage. Our Roland UV ink is scratch-resistant and waterproof, no edge cracking through Saskatchewan winters. For larger vehicle branding, see our vehicle magnets from $24/sqft and window decals from $11/sqft — all printed in the same Saskatoon shop.",
        },
        {
          q: "Do you make custom die cut labels near me for product packaging in Saskatchewan?",
          a: "Yes — die-cut labels for jars, bottles, growler tags, freezer products, and cosmetic packaging are one of our most-ordered sticker types. Pricing matches standard stickers: 100 labels for $160, 250 for $325, 500 for $475. Bring your label dimensions and our in-house designer ($35 flat) prepares the file with a same-day proof — pickup at 216 33rd St W in 1–3 business days.",
        },
        {
          q: "What's the difference between die-cut and kiss-cut stickers?",
          a: "Die-cut stickers are cut all the way through both the vinyl and the backing — each sticker comes out as a separate piece in your custom shape. Kiss-cut stickers cut only the vinyl, leaving the backing intact so multiple stickers stay on one sheet. True Color prints true die-cut as standard — every sticker contour-cut around your shape. Pricing is the same either way: 100 for $160, 250 for $325.",
        },
        {
          q: "Are sticker sheets cheaper than individual die-cut stickers?",
          a: "Sticker sheets can be cheaper when several small designs fit inside one finished sheet, but individual die-cut stickers are better for handouts, product packaging, and retail inserts. We price by finished size and quantity: 2×2\" starts at 25 for $25, while the common 4×4\" run is 100 for $160 or 250 for $325. If your sheet needs multiple cut paths, our designer can set it up for $35 flat with a same-day proof.",
        },
        {
          q: "How much do custom die-cut stickers cost in Saskatoon?",
          a: "Standard die-cut vinyl stickers are 100 for $160, 250 for $325, and 500 for $475 on the default 4×4\" size. Smaller 2×2\" start from $45 / 100 and larger 8×8\" run $640 / 100. The 4×4\" per-unit drops from $1.60 at 100 to $0.65 at 1,000. Full price grid lives on the instant calculator at /products/stickers.",
        },
        {
          q: "Are your stickers waterproof and rated for Saskatchewan winters?",
          a: "Yes — Roland UV-cured ink on durable vinyl is waterproof, scratch-resistant, and tested through Saskatchewan freeze-thaw cycles without cracking, fading, or peeling at die-cut edges. Suitable for outdoor signage, vehicle panels, water bottles, dishwashers (top-rack), and freezer packaging. Add a matte or gloss laminate on request for extra abrasion resistance.",
        },
        {
          q: "What's the minimum sticker order at True Color?",
          a: "25 stickers is our minimum, starting at $25 for 25× 2×2\" die-cut or $60 for 25× 4×4\". Most customers find 100 at $160 the best entry point — per-unit cost drops to $1.60 vs $2.40 at the 25-piece minimum. A $25 order-total minimum applies at checkout on the very smallest carts.",
        },
        {
          q: "Can you print stickers in custom shapes — circles, ovals, logo outlines?",
          a: "Yes — die-cut means contour-cut to any shape: circles, ovals, rounded rectangles, custom logo outlines, growler tags, candle-jar wraps, any vector silhouette. If you have an Illustrator or PDF file with the cut path, we use it as-is. No file? Our in-house designer prepares the die-cut path for $35 flat with a same-day proof.",
        },
        {
          q: "Can I put multiple designs on one custom sticker sheet?",
          a: "Yes — you can combine multiple small stickers on one sheet if each design has enough spacing for clean cutting. The job still follows the sticker size grid, so a 4×4\" finished sheet starts at 25 for $60, 100 for $160, and 250 for $325. Send the artwork as a PDF or AI file with cut paths, or have our Saskatoon designer build the sheet for $35 flat.",
        },
        {
          q: "Can I get same-day stickers in Saskatoon?",
          a: "Yes — same-day production for +$40 flat when ordered before 10 AM. Call (306) 954-8688 to confirm material capacity for your quantity. Most same-day orders are ready for pickup by 4–5 PM at 216 33rd St W. Standard turnaround without rush is 1–3 business days after artwork approval.",
        },
        {
          q: "What file format do I need for custom die-cut stickers?",
          a: "We accept PDF, AI, EPS (vector preferred), or PNG/JPG at 300 dpi minimum at the print size. Vector files let us pull a clean die-cut path directly from your shape. If your file is a low-res phone photo or Word doc, our in-house designer rebuilds it print-ready for $35 flat with a same-day proof — no surprise charges.",
        },
        {
          q: "Do complex sticker shapes cost more than circles or rectangles?",
          a: "Most logo outlines, circles, ovals, and rounded rectangles use the normal die-cut price grid: 100 4×4\" stickers for $160, 250 for $325, or 500 for $475. Very detailed edges, interior cutouts, or many designs on one sheet may need a quick file-prep review before we quote. If the cut path needs rebuilding, design setup is $35 flat with a same-day proof.",
        },
        {
          q: "How much do custom stickers near me cost compared to ordering online from Saskatoon?",
          a: "Custom die-cut vinyl stickers at True Color in Saskatoon run 100 for $160, 250 for $325, and 500 for $475 on the standard 4×4\" size — in line with national online print services, but with no shipping fees, same-day pickup at 216 33rd St W, and a local in-house designer ($35 flat) who prepares your die-cut path and sends a proof before cutting begins. Small sticker runs start at 25 for $25 (2×2\" size). A $25 order-total minimum applies at checkout on the very smallest carts.",
        },
        {
          q: "Can I get custom labels near me the same day in Saskatoon?",
          a: "Yes — same-day custom label production is available for a +$40 flat rush fee when you order before 10 AM. Call (306) 954-8688 to confirm availability for your label quantity and size. Standard runs — 100 labels for $160 or 250 for $325 — are typically ready for pickup at 216 33rd St W, Saskatoon by 4–5 PM on rush orders. Standard turnaround without rush is 1–3 business days after artwork approval. Our in-house designer ($35 flat) can prepare your label artwork the same morning if you don't have a print-ready file.",
        },
      ]}
    />
  );
}
