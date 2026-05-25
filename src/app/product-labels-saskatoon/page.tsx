import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Product Labels Saskatoon | From $5.50/sqft | True Color" },
  description:
    "Custom product and food labels printed in Saskatoon from $5.50/sqft. 3mil vinyl, full-colour Roland UV, gloss or matte. 1–3 business day turnaround.",
  alternates: { canonical: "/product-labels-saskatoon" },
  openGraph: {
    title: "Product Labels Saskatoon | From $5.50/sqft | True Color",
    description:
      "Custom product and food labels printed in Saskatoon from $5.50/sqft. 3mil vinyl, full-colour Roland UV. Pickup at 216 33rd St W.",
    url: "https://truecolorprinting.ca/product-labels-saskatoon",
    images: [{ url: "/images/products/og/product-labels-og-1200x630.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function ProductLabelsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="product-labels-saskatoon"
      primaryProductSlug="vinyl-banners"
      title="Product Labels — Saskatoon"
      subtitle="Product and food labels printed in Saskatoon. From $5.50/sqft. Roland UV, full-colour, in-house."
      heroImage="/images/products/heroes/product-labels-hero-1200x500.webp"
      heroAlt="Custom product and food labels printed in Saskatoon by True Color"
      description={
        "True Color prints custom product labels in Saskatoon from $5.50/sqft on 3mil white vinyl with full-colour UV ink. Whether you sell jam at the Saskatoon Farmers' Market, brew kombucha out of a Riversdale kitchen, bottle hot sauce on the prairies, or run a supplement line out of a Saskatchewan warehouse, you need labels that look retail-shelf-ready without the four-week lead time and minimum-order pain of online label companies. We print 50 labels or 5,000, same press, same price-per-sqft, picked up at 216 33rd St W or shipped flat-rate across Saskatchewan.\n\nThe material is ARLPMF7008 — a 3mil pressure-sensitive white vinyl built for cold storage, fridge condensation, freezer bags, and outdoor product handling. That matters in Saskatchewan: a sticker designed for room-temperature retail will curl, peel, or fade when it spends six months going in and out of a –20°C freezer or sitting on a sun-soaked display table at a summer farmers' market in July. Our vinyl + UV ink combo handles both. Available in gloss (high-contrast, food-safe sheen, what most jar and bottle brands use) or matte (premium, soft-touch, the standard for craft beverage and supplement labels).\n\nStandard sizes we print every week: 2×3\" (small jars, lip balms, tins), 3×4\" (jam jars, hot sauce bottles, candle wraps), 4×6\" (growler bottles, supplement containers, deli takeout containers, kraft bag fronts). Any custom dimension works — send us the bottle or container spec and we cut to fit. A 3×4\" label run of 500 pieces works out to about $217 — that's $0.43/label, full-colour, kiss-cut on a backing sheet, ready to peel and apply by hand. Compare that to ordering online: 7–14 day shipping, $80+ in courier fees if you're rural, and minimum runs that lock you into 1,000+ pieces before you've validated the SKU.\n\nEvery label is printed on our in-house Roland UV printer — no outsourcing to Toronto, no broker mark-ups, no proof-by-email-for-three-days delays. Standard turnaround is 1–3 business days after artwork approval. Same-day rush is +$40 flat — order before 10 AM and your labels are ready by close. Need design help? Our in-house Photoshop designer builds print-ready label layouts at $35 flat with same-day proof: legal-required font sizes for ingredients, nutrition facts blocks formatted to CFIA spec, barcode placement, bilingual EN/FR text — whatever your product needs.\n\nWe print labels for Saskatchewan-made artisan food brands, prairie craft beverage producers, supplement and wellness lines, soap and skincare makers, candle studios, honey and maple syrup producers, and a long list of small SKUs you'll see on shelves around Saskatoon and across the province. If you're moving from kitchen-table production into your first retail SKU, talk to us before you order a thousand of anything. We'll print 100 to test the shelf, then run the rest when you know the design is locked. Pair labels with matching <a href=\"/business-cards-saskatoon\">business cards</a> or a <a href=\"/sticker-printing-saskatoon\">sticker run</a> from the same shop in the same week."
      }
      products={[
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Stickers", from: "from $5/sqft", slug: "stickers" },
        { name: "Business Cards", from: "from $45 / 250", slug: "business-cards" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
      ]}
      whyPoints={[
        "$5.50/sqft on small runs (under 12 sqft) — drops to $3.20/sqft above 100 sqft",
        "3mil ARLPMF7008 white vinyl — cold-storage, freezer, and outdoor-product safe",
        "Roland UV ink — won't fade after six months on a sunlit shelf",
        "Gloss or matte finish — gloss for jars/bottles, matte for premium beverage and supplements",
        "Any size: 2×3, 3×4, 4×6, or custom-cut to your container spec",
        "1–3 business day standard turnaround, +$40 flat same-day rush before 10 AM",
        "$25 order-total minimum at checkout — print 50 labels to test the shelf before committing to 1,000",
        "In-house designer at $35 flat for ingredients lists, nutrition blocks, barcodes, EN/FR",
      ]}
      faqs={[
        {
          q: "How much do product labels cost in Saskatoon?",
          a: "Our pricing is tiered by total square footage: $5.50/sqft for orders under 12 sqft, $5.00/sqft from 12 to 32 sqft, $4.30/sqft from 32 to 100 sqft, and $3.20/sqft above 100 sqft. A $25 order-total minimum applies at checkout. A typical 3×4\" label run of 500 pieces is about $217 — roughly $0.43 per label, full-colour, ready to apply.",
        },
        {
          q: "What material do you use for product and food labels?",
          a: "3mil ARLPMF7008 pressure-sensitive white vinyl with full-colour UV ink. It's built for cold storage, freezer use, condensation from refrigerated product, and outdoor handling at farmers' markets. Available in gloss (most common for jars, bottles, and food brands) or matte (premium feel, common for craft beverage and supplements). Both finishes cost the same: $5.50/sqft starting tier.",
        },
        {
          q: "What sizes can you print?",
          a: "Standard sizes we run every week: 2×3\" (small jars, lip balms, tins), 3×4\" (jam jars, hot sauce, candle wraps), and 4×6\" (growlers, supplement bottles, deli containers, kraft bag fronts). Any custom dimension works — send the container spec and we cut to fit. A 4×6\" label costs about $0.92 each at 500 qty; a 2×3\" costs about $0.23 each at 500 qty.",
        },
        {
          q: "Can you print small runs to test a new SKU?",
          a: "Yes — that's one of the biggest reasons Saskatchewan food and beverage brands use us. A $25 order-total minimum applies at checkout. There's no setup fee on top, no plate charge, no large minimum-quantity penalty. Print 50 to validate the shelf design, come back next week for the production run when the artwork is locked.",
        },
        {
          q: "How fast can I get product labels in Saskatoon?",
          a: "Standard turnaround is 1–3 business days after artwork approval. Same-day rush is +$40 flat — submit your file before 10 AM and your labels are ready for pickup the same day at 216 33rd St W. No surcharge per label, just one $40 flat fee on the order.",
        },
        {
          q: "Will the labels survive freezer and fridge storage?",
          a: "Yes — the 3mil vinyl + UV ink combo is designed for cold-storage SKUs. We print labels for Saskatchewan frozen meals, ice cream and frozen dessert brands, freezer-aisle baking products, and refrigerated drinks. The vinyl doesn't curl at –20°C and the UV ink doesn't crack or fade when the product cycles between cold storage and room temperature.",
        },
        {
          q: "Can you help design my label?",
          a: "Yes — our in-house Photoshop designer builds print-ready label layouts at $35 flat with same-day proof. That covers ingredient list formatting, CFIA nutrition facts blocks, barcode placement, bilingual English/French text, allergen warnings, and net weight callouts. If your label needs full custom artwork (illustrated logo, hand-drawn elements), we quote that separately — usually $75 to $150 depending on complexity.",
        },
        {
          q: "Where do I pick up my product labels?",
          a: "Pickup is at 216 33rd St W, Saskatoon, SK S7L 0V5 — our print shop on 33rd Street West. Call (306) 954-8688 or email info@true-color.ca to confirm your order is ready. We also ship flat-rate across Saskatchewan for rural producers who can't make it into Saskatoon — typical shipping is $15–$25 anywhere in the province.",
        },
      ]}
    />
  );
}
