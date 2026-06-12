import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: { absolute: "Printing Prices Saskatoon | 2026 Cost Guide | True Color" },
  description:
    "Real 2026 Saskatoon printing prices: coroplast from $8/sqft, banners from $66, 250 business cards $45, flyers $45/100. Full cost guide, no quote forms.",
  alternates: { canonical: "/printing-prices-saskatoon" },
  openGraph: {
    title: "Printing Prices Saskatoon | 2026 Cost Guide | True Color",
    description:
      "Real 2026 Saskatoon printing prices: coroplast from $8/sqft, banners from $66, 250 business cards $45, flyers $45/100. Full cost guide, no quote forms.",
    url: "https://truecolorprinting.ca/printing-prices-saskatoon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "article",
  },
};

const WIDE_FORMAT_ROWS = [
  { product: "Coroplast Signs (4mm)", rate: "$8.00/sqft", example: '18×24" = $24', slug: "/coroplast-signs-saskatoon" },
  { product: "Vinyl Banners (13oz)", rate: "$8.25/sqft", example: "2×4 ft = $66", slug: "/banner-printing-saskatoon" },
  { product: "ACP Aluminum Signs (3mm)", rate: "$13.00/sqft", example: '18×24" = $39', slug: "/aluminum-signs-saskatoon" },
  { product: "Foamboard Displays", rate: "$10.00/sqft", example: '18×24" = $45', slug: "/foamboard-printing-saskatoon" },
  { product: "Window Decals", rate: "$11.00/sqft", example: "Small decals hit the $25 order min", slug: "/window-decals-saskatoon" },
  { product: "Window Perf (see-through)", rate: "$8.00/sqft", example: "Small jobs hit the $25 order min", slug: "/window-perf-saskatoon" },
  { product: "Vehicle Magnets (30mil)", rate: "$24.00/sqft", example: "Small magnets hit the $25 order min", slug: "/vehicle-magnets-saskatoon" },
  { product: "Vinyl Lettering (cut)", rate: "$8.50/sqft", example: "Small sets hit the $25 order min", slug: "/vinyl-lettering-saskatoon" },
  { product: "Wall Graphics (removable)", rate: "$11.00/sqft", example: "No wall damage on removal", slug: "/wall-graphics-saskatoon" },
];

const LOT_PRICE_ROWS = [
  { product: "Business Cards", price: "$45", detail: '250 double-sided, 14pt gloss (single-sided $40). 500 = $65, 1000 = $110', slug: "/business-cards-saskatoon" },
  { product: "Flyers", price: "$45", detail: "100 full-letter double-sided on 80lb gloss", slug: "/flyer-printing-saskatoon" },
  { product: "Stickers", price: "$25", detail: '25 custom-cut 2×2" stickers, any shape', slug: "/sticker-printing-saskatoon" },
  { product: "Postcards", price: "$35", detail: '50 double-sided 3×4" on 14pt gloss', slug: "/postcard-printing-saskatoon" },
  { product: "Brochures", price: "$70", detail: "100 tri-fold on 100lb gloss, scored and folded", slug: "/brochure-printing-saskatoon" },
  { product: "Photo Posters", price: "$15", detail: '12×18" on 220gsm matte photo paper', slug: "/photo-poster-printing-saskatoon" },
  { product: "Retractable Banners", price: "$219", detail: "Economy stand with print, hardware included", slug: "/retractable-banners-saskatoon" },
];

const FAQS = [
  {
    q: "How much does printing cost in Saskatoon?",
    a: "At True Color, wide-format printing starts at $8/sqft for coroplast signs and $8.25/sqft for vinyl banners. Paper products are lot-priced: 250 double-sided business cards are $45, 100 full-letter flyers are $45, and 25 custom stickers are $25. Every price on this page comes from the same engine that powers our online estimator — what you see is what you pay, pre-tax.",
  },
  {
    q: "How much does a 18×24 yard sign cost in Saskatoon?",
    a: 'A single 18×24" coroplast sign is $24 at $8/sqft. Orders under $25 top up to the $25 order-total minimum at checkout, so one sign costs $25 all-in pre-tax. Order 5+ signs and you save 8%, 10+ saves 17%, 25+ saves 23% — a 25-sign election or real estate run drops the per-sign price significantly.',
  },
  {
    q: "How much does a vinyl banner cost in Saskatoon?",
    a: "Vinyl banners are $8.25/sqft on 13oz scrim vinyl, hemmed and grommeted as standard. The smallest common size, 2×4 ft, is $66. Any custom size prices automatically in our online estimator — no quote forms.",
  },
  {
    q: "How much do 250 business cards cost?",
    a: "250 double-sided business cards on 14pt gloss stock are $45 ($40 single-sided). 500 cards are $65 and 1,000 cards are $110, printed in-house on our Konica Minolta digital press at 216 33rd St W, Saskatoon.",
  },
  {
    q: "Is there a minimum order?",
    a: "Yes — a single $25 order-total minimum at checkout. There are no per-product minimums. If your cart is under $25, a transparent small-order setup fee tops it up to $25. Anything over $25 has no surcharge at all.",
  },
  {
    q: "How much is same-day rush printing?",
    a: "Same-day rush is a flat +$40 on any order — place it before 10 AM and call (306) 954-8688 to confirm capacity. Rush is PST-exempt, so you pay GST only on the rush fee.",
  },
  {
    q: "How much does design work cost?",
    a: "Our in-house Photoshop designer charges $35 flat for standard layouts (business cards, flyers, single-panel banners) including two revision rounds and a same-day proof on briefs submitted before 10 AM. Full original logo design is $50 and logo recreation or vectorization from a low-res file is $75.",
  },
  {
    q: "Are taxes included in these prices?",
    a: "All listed prices are pre-tax. GST (5%) and Saskatchewan PST (6%) are added at checkout only. PST is not charged on rush fees or design fees.",
  },
  {
    q: "Why is True Color cheaper than Staples or FedEx Office?",
    a: "Everything prints in-house in Saskatoon on our own Roland UV flatbed and Konica Minolta digital press — no outsourcing, no shipping, no national-chain overhead. For most large-format and sign products our prices beat Staples and FedEx Office, and you get a local designer and same-day rush they can't match.",
  },
];

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Printing Prices in Saskatoon — 2026 Cost Guide",
  description:
    "Complete 2026 price guide for printing in Saskatoon: signs, banners, business cards, flyers, stickers, decals and more, with real prices from True Color Display Printing.",
  datePublished: "2026-06-12",
  dateModified: "2026-06-12",
  author: { "@type": "Organization", name: "True Color Display Printing Ltd.", url: "https://truecolorprinting.ca" },
  publisher: { "@id": "https://truecolorprinting.ca/#organization" },
  mainEntityOfPage: "https://truecolorprinting.ca/printing-prices-saskatoon",
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://truecolorprinting.ca" },
    { "@type": "ListItem", position: 2, name: "Printing Prices Saskatoon", item: "https://truecolorprinting.ca/printing-prices-saskatoon" },
  ],
};

export default function PrintingPricesSaskatoonPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <SiteNav />
      <main id="main-content" className="bg-[#f8f8f8]">
        <section className="bg-[#1c1712] text-white">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <p className="text-[#8CC63E] font-semibold text-sm uppercase tracking-wide mb-3">
              2026 Cost Guide — updated June 2026
            </p>
            <h1 className="text-3xl md:text-5xl font-bold mb-5">
              Printing Prices in Saskatoon — What Things Actually Cost
            </h1>
            <p className="text-gray-300 text-lg leading-relaxed max-w-2xl">
              Most Saskatoon print shops make you fill out a quote form and wait. This page lists our
              real 2026 prices — coroplast signs from $8/sqft, vinyl banners from $66, 250 business
              cards for $45 — pulled from the same pricing engine that runs our online estimator.
              Everything prints in-house on our Roland UV flatbed and Konica Minolta digital press at
              216 33rd St W, Saskatoon.
            </p>
            <Link
              href="/products"
              className="inline-block mt-7 bg-[#16C2F3] hover:bg-[#0fb0dd] text-white font-semibold px-7 py-3.5 rounded-lg transition-colors"
            >
              Get My Exact Price →
            </Link>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-6 py-14">
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-[#1c1712] mb-3">
              Wide-Format Printing Prices (per square foot)
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6 max-w-2xl">
              Signs, banners, decals and magnets price by the square foot. Rates below are tier-1;
              larger jobs step down automatically (coroplast drops to $7.50/sqft over 12 sqft and
              $7.25/sqft over 32 sqft). Quantity discounts on coroplast: 5+ signs save 8%, 10+ save
              17%, 25+ save 23%.
            </p>
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Product</th>
                    <th className="px-5 py-3 font-semibold">Rate</th>
                    <th className="px-5 py-3 font-semibold">Example</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {WIDE_FORMAT_ROWS.map((row) => (
                    <tr key={row.product}>
                      <td className="px-5 py-3">
                        <Link href={row.slug} className="text-[#16C2F3] underline font-medium">
                          {row.product}
                        </Link>
                      </td>
                      <td className="px-5 py-3 font-mono">{row.rate}</td>
                      <td className="px-5 py-3">{row.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold text-[#1c1712] mb-3">
              Paper &amp; Print Product Prices (flat lot pricing)
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6 max-w-2xl">
              Cards, flyers, stickers and similar products are priced per lot — the tiered quantity
              prices are the bulk discount.
            </p>
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Product</th>
                    <th className="px-5 py-3 font-semibold">From</th>
                    <th className="px-5 py-3 font-semibold">What you get</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {LOT_PRICE_ROWS.map((row) => (
                    <tr key={row.product}>
                      <td className="px-5 py-3">
                        <Link href={row.slug} className="text-[#16C2F3] underline font-medium">
                          {row.product}
                        </Link>
                      </td>
                      <td className="px-5 py-3 font-mono">{row.price}</td>
                      <td className="px-5 py-3">{row.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-14 max-w-2xl">
            <h2 className="text-2xl font-bold text-[#1c1712] mb-4">What Changes the Price</h2>
            <ul className="space-y-3 text-gray-700 leading-relaxed">
              <li>
                <strong>Size.</strong> Wide-format products price by square foot, so a 24×36&quot;
                coroplast sign (6 sqft) is $48 while an 18×24&quot; (3 sqft) is $24.
              </li>
              <li>
                <strong>Sides.</strong> Double-sided coroplast runs $14/sqft tier-1 instead of $8 —
                it is two full prints plus alignment.
              </li>
              <li>
                <strong>Quantity.</strong> Coroplast orders of 5+ save 8%, 10+ save 17%, 25+ save
                23%. Lot-priced products (cards, flyers, stickers) build the discount into each
                quantity tier.
              </li>
              <li>
                <strong>Design.</strong> Print-ready file = no design fee. Our in-house designer is
                $35 flat for standard layouts with a same-day proof, $50 for original logo design,
                $75 for logo recreation from a low-res file. See{" "}
                <Link href="/graphic-design-saskatoon" className="text-[#16C2F3] underline font-medium">
                  graphic design pricing
                </Link>
                .
              </li>
              <li>
                <strong>Rush.</strong> Same-day rush is +$40 flat on any order placed before 10 AM —
                see{" "}
                <Link href="/same-day-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
                  same-day printing
                </Link>
                .
              </li>
              <li>
                <strong>Order minimum.</strong> One rule: a $25 order-total minimum at checkout.
                There are no per-product minimums.
              </li>
              <li>
                <strong>Taxes.</strong> GST 5% + PST 6% are added at checkout only. Rush and design
                fees are PST-exempt.
              </li>
            </ul>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold text-[#1c1712] mb-5">
              Printing Price FAQs — Saskatoon 2026
            </h2>
            <div className="space-y-3 max-w-3xl">
              {FAQS.map((f) => (
                <details key={f.q} className="bg-white border border-gray-200 rounded-xl p-5 group">
                  <summary className="font-semibold text-[#1c1712] cursor-pointer list-none flex justify-between items-center">
                    {f.q}
                    <span className="text-[#16C2F3] group-open:rotate-45 transition-transform text-xl leading-none">
                      +
                    </span>
                  </summary>
                  <p className="text-gray-600 leading-relaxed mt-3">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="bg-[#1c1712] text-white rounded-2xl p-10 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Stop guessing — see your exact price in 30 seconds
            </h2>
            <p className="text-gray-300 mb-6 max-w-xl mx-auto">
              Pick a product, enter your size and quantity, and the estimator shows the same price
              we charge in-store. No quote forms, no callbacks.
            </p>
            <Link
              href="/products"
              className="inline-block bg-[#16C2F3] hover:bg-[#0fb0dd] text-white font-semibold px-8 py-4 rounded-lg transition-colors"
            >
              Open the Price Estimator →
            </Link>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
