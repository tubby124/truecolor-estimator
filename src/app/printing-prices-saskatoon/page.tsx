import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";

const PRICED_WORK = [
  { src: "/images/gallery/gallery-coroplast-aw-bogo-promo.webp", alt: "A&W promo sign on coroplast printed in Saskatoon", label: "Coroplast promo sign", price: "from $8/sqft", href: "/coroplast-signs-saskatoon" },
  { src: "/images/gallery/gallery-banner-bbq-junction.webp", alt: "BBQ Junction wide vinyl banner printed in Saskatoon", label: "Vinyl banner", price: "from $66", href: "/banner-printing-saskatoon" },
  { src: "/images/gallery/gallery-business-cards-exp-premium-black.webp", alt: "Premium black eXp Realty business cards printed in Saskatoon", label: "250 business cards", price: "from $45", href: "/business-cards-saskatoon" },
  { src: "/images/gallery/gallery-flyer-madina-spice.webp", alt: "Madina Spice grocery flyers printed in Saskatoon", label: "100 flyers", price: "from $45", href: "/flyer-printing-saskatoon" },
  { src: "/images/gallery/gallery-retractable-express-photography.webp", alt: "Express Photography retractable banner printed in Saskatoon", label: "Retractable banner", price: "from $219", href: "/retractable-banners-saskatoon" },
  { src: "/images/gallery/gallery-acp-coop-humboldt-platinum.webp", alt: "Co-op Humboldt ACP sponsor sign printed in Saskatoon", label: "ACP aluminum sign", price: "from $13/sqft", href: "/aluminum-signs-saskatoon" },
] as const;

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
  { product: "Window Decals", rate: "$11.00/sqft", example: "Small decals top up to the $25 minimum", slug: "/window-decals-saskatoon" },
  { product: "Window Perf (see-through)", rate: "$8.00/sqft", example: "Small jobs top up to the $25 minimum", slug: "/window-perf-saskatoon" },
  { product: "Vehicle Magnets (30mil)", rate: "$24.00/sqft", example: "Small magnets top up to the $25 minimum", slug: "/vehicle-magnets-saskatoon" },
  { product: "Vinyl Lettering (cut)", rate: "$8.50/sqft", example: "Small sets top up to the $25 minimum", slug: "/vinyl-lettering-saskatoon" },
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
    a: "At True Color, signs and banners are priced by the square foot, starting at $8/sqft for coroplast signs and $8.25/sqft for vinyl banners. Cards, flyers and stickers are sold as a batch for one flat price: 250 double-sided business cards are $45, 100 full-letter flyers are $45, and 25 custom stickers are $25. Every price on this page comes from the same system that runs our online estimator — what you see is what you pay, pre-tax.",
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
    a: "Same-day rush is a flat +$40 on any order — place it before 10 AM and call (306) 954-8688 to confirm capacity. GST and Saskatchewan PST apply.",
  },
  {
    q: "How much does design work cost?",
    a: "Our in-house Photoshop designer charges $35 flat for standard layouts (business cards, flyers, single-panel banners) including two revision rounds and a same-day proof on briefs submitted before 10 AM. Full original logo design is $50, and logo recreation or vectorization from a low-res file is also $50.",
  },
  {
    q: "Are taxes included in these prices?",
    a: "All listed prices are pre-tax. GST (5%) and Saskatchewan PST (6%) are added at checkout to the full charge, including design and rush services bundled with printed-material orders.",
  },
  {
    q: "Why is True Color cheaper than Staples or FedEx Office?",
    a: "Everything prints in-house in Saskatoon on our own Roland TrueVIS VG2 eco-solvent printer/cutter and Konica Minolta digital press — no outsourcing, no shipping, no national-chain overhead. For most large-format and sign products our prices beat Staples and FedEx Office, and you get a local designer and same-day rush they can't match.",
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
              Everything prints in-house on our Roland TrueVIS VG2 eco-solvent printer/cutter and
              Konica Minolta digital press at 216 33rd St W, Saskatoon.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/products"
                className="inline-block bg-[#16C2F3] hover:bg-[#0fb0dd] text-white font-semibold px-7 py-3.5 rounded-lg transition-colors"
              >
                Get My Exact Price →
              </Link>
              <a
                href="tel:+13069548688"
                className="inline-block border border-white/30 hover:border-white/60 hover:bg-white/10 text-white font-semibold px-7 py-3.5 rounded-lg transition-colors"
              >
                Call (306) 954-8688
              </a>
            </div>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-6 py-14">
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-[#1c1712] mb-3">
              Signs, Banners &amp; Decals — Priced by the Square Foot
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6 max-w-2xl">
              These are the rates for a standard-size job. Bigger pieces get a lower rate
              automatically — coroplast drops to $7.50/sqft once a sign passes 12 square feet, and
              $7.25/sqft past 32 square feet. Order more than one and it drops again: 5 or more
              coroplast signs save 8%, 10 or more save 17%, 25 or more save 23%.
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
              Cards, Flyers &amp; Stickers — One Flat Price per Batch
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6 max-w-2xl">
              These are sold as a set quantity for a set price, not by the square foot. The bigger
              the batch, the less each piece costs — that discount is already built into the prices
              below, so there is nothing extra to work out.
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
                <strong>How big it is.</strong>{" "}
                Signs, banners and decals are priced by the square foot. A 24×36&quot; coroplast
                sign is 6 square feet, so $48. Drop it to 18×24&quot; and you are at 3 square feet
                — $24.
              </li>
              <li>
                <strong>One side or two.</strong>{" "}
                Printing both sides of a coroplast sign is $14/sqft instead of $8. It is two full
                print runs plus the work of lining them up back to back.
              </li>
              <li>
                <strong>How many you order.</strong>{" "}
                Order 5 or more coroplast signs and you save 8%, 10 or more saves 17%, 25 or more
                saves 23%. Banners, aluminum signs and decals each have their own discount steps,
                and the estimator applies them for you. Business cards, flyers and stickers already
                have the volume break built into every quantity you see above.
              </li>
              <li>
                <strong>Whether your artwork is ready to print.</strong>{" "}
                Send a print-ready file and there is no design charge at all. If you want us to
                build it, our in-house designer is $35 flat for a standard layout with a same-day
                proof, and $50 either for an original logo or to rebuild one from a
                low-resolution file. See{" "}
                <Link href="/graphic-design-saskatoon" className="text-[#16C2F3] underline font-medium">
                  graphic design pricing
                </Link>
                .
              </li>
              <li>
                <strong>How fast you need it.</strong>{" "}
                Standard turnaround is 1–3 business days after you approve the artwork. Same-day
                rush is +$40 flat if you order before 10 AM — see{" "}
                <Link href="/same-day-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
                  same-day printing
                </Link>
                .
              </li>
              <li>
                <strong>The $25 order-total minimum at checkout.</strong>{" "}
                That is the only minimum we have — there are no per-product minimums. If you order
                one small sign or decal that comes to less than $25, it tops up to $25.
              </li>
              <li>
                <strong>Tax.</strong>{" "}
                GST 5% and PST 6% are added at checkout on the full charge, including design and
                rush when they are part of a printed order.
              </li>
            </ul>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold text-[#1c1712] mb-3">What These Prices Actually Buy</h2>
            <p className="text-gray-600 leading-relaxed mb-6 max-w-2xl">
              Real jobs, real clients, printed in-house at 216 33rd St W — matched to the rates above.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {PRICED_WORK.map((item) => (
                <Link key={item.src} href={item.href} className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:border-[#16C2F3]">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image src={item.src} alt={item.alt} fill loading="lazy" className="object-cover transition group-hover:scale-[1.02]" sizes="(max-width: 768px) 50vw, 33vw" />
                  </div>
                  <div className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
                    <span className="font-semibold text-[#1c1712]">{item.label}</span>
                    <span className="font-mono text-[#16C2F3]">{item.price}</span>
                  </div>
                </Link>
              ))}
            </div>
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
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/products"
                className="inline-block bg-[#16C2F3] hover:bg-[#0fb0dd] text-white font-semibold px-8 py-4 rounded-lg transition-colors"
              >
                Open the Price Estimator →
              </Link>
              <a
                href="tel:+13069548688"
                className="inline-block border border-white/30 hover:border-white/60 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-lg transition-colors"
              >
                Or call (306) 954-8688
              </a>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
