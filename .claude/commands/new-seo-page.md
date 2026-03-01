---
name: new-seo-page
description: Scaffold a new SEO-optimized landing page for truecolorprinting.ca. Use when building any of the 6 priority pages (/coroplast-signs-saskatoon, /same-day-printing-saskatoon, /agribusiness-signs-saskatchewan, /healthcare-signs-saskatoon, /banner-printing-saskatoon, /business-cards-saskatoon) or any new landing page. Generates a complete Next.js page.tsx with correct metadata, schema, FAQ, pricing table, and CTA structure. Never build a landing page without running this first.
metadata:
  version: 1.0.0
---

# New SEO Page Scaffold — True Color Display Printing

> Generates a complete, ranking-ready Next.js page for truecolorprinting.ca. Every element is pre-spec'd. Zero guessing.

---

## Step 1: Identify the Page

Ask for (or infer from context):
- **Slug:** e.g. `coroplast-signs-saskatoon`
- **Primary keyword:** e.g. "coroplast signs Saskatoon"
- **Copy source:** check which research file has the copy

**Priority pages — copy sources:**
| Slug | Copy source |
|---|---|
| `coroplast-signs-saskatoon` | `research/content/seo_keywords.md` L304 + `SEO_DOMINATION_PLAN_20260228.md` Section 7 |
| `same-day-printing-saskatoon` | `research/content/seo_keywords.md` L224 |
| `agribusiness-signs-saskatchewan` | `research/content/website_copy.md` L249 — FULL COPY READY |
| `healthcare-signs-saskatoon` | `research/content/website_copy.md` L403 — FULL COPY READY |
| `banner-printing-saskatoon` | `research/content/seo_keywords.md` L278 |
| `business-cards-saskatoon` | `research/content/seo_keywords.md` L252 |

Read the copy source file before generating page content.

---

## Step 2: Generate the Page

Create `src/app/[slug]/page.tsx` using the template below. Fill in all `[PLACEHOLDER]` fields with real content from the copy source files.

```tsx
import type { Metadata } from "next";
import Link from "next/link";

// ─── SEO METADATA ────────────────────────────────────────────────────────────
// title: 50-60 chars | starts with primary keyword | ends with brand
// description: 150-160 chars | keyword + price + location + CTA
export const metadata: Metadata = {
  title: "[PRIMARY KEYWORD] | [PRICE CALLOUT] | True Color Printing Saskatoon",
  description: "[150-160 char description with keyword, real price, location, and CTA. Example: Custom coroplast signs in Saskatoon from $28.80. Order online, get an instant price, pick up same day. No quote required. Local Saskatoon print shop.]",
  alternates: {
    canonical: "https://truecolorprinting.ca/[slug]",
  },
  openGraph: {
    title: "[PRIMARY KEYWORD] | True Color Printing Saskatoon",
    description: "[Same as meta description or slightly reworded]",
    url: "https://truecolorprinting.ca/[slug]",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_CA",
    type: "website",
  },
};

// ─── SCHEMA JSON-LD ──────────────────────────────────────────────────────────
// THREE schema types required on every landing page:
// 1. Service — with real price from CSV
// 2. FAQPage — minimum 3 questions from the 50-question master list
// 3. BreadcrumbList — home → this page

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "[Service name — e.g. Coroplast Sign Printing in Saskatoon]",
  serviceType: "Print Service",
  provider: {
    "@type": "LocalBusiness",
    name: "True Color Display Printing",
    url: "https://truecolorprinting.ca",
    telephone: "+13069548688",
    address: {
      "@type": "PostalAddress",
      streetAddress: "216 33rd St W",
      addressLocality: "Saskatoon",
      addressRegion: "SK",
      postalCode: "S7L 0V2",
      addressCountry: "CA",
    },
  },
  areaServed: {
    "@type": "City",
    name: "Saskatoon",
  },
  description: "[1-2 sentence description of the service]",
  offers: {
    "@type": "Offer",
    priceCurrency: "CAD",
    price: "[STARTING PRICE FROM CSV — e.g. 28.80]",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      priceCurrency: "CAD",
      unitText: "[per square foot / per sign / per 250 cards]",
    },
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "[Question 1 — from the 50-question master list in competitor_content_audit.md]",
      acceptedAnswer: {
        "@type": "Answer",
        text: "[Direct answer. Include a price, a spec, or a process step. Link to the estimator where relevant.]",
      },
    },
    {
      "@type": "Question",
      name: "[Question 2]",
      acceptedAnswer: {
        "@type": "Answer",
        text: "[Answer 2]",
      },
    },
    {
      "@type": "Question",
      name: "[Question 3]",
      acceptedAnswer: {
        "@type": "Answer",
        text: "[Answer 3]",
      },
    },
    // Add 2-5 more for stronger FAQPage signal
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://truecolorprinting.ca",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "[Page title — e.g. Coroplast Signs Saskatoon]",
      item: "https://truecolorprinting.ca/[slug]",
    },
  ],
};

// ─── PAGE COMPONENT ──────────────────────────────────────────────────────────
export default function [PageName]Page() {
  return (
    <>
      {/* Schema injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main className="max-w-4xl mx-auto px-4 py-12">

        {/* ── SECTION 1: Hero ───────────────────────────────────────────── */}
        {/* H1: contains primary keyword. ONE per page. */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          [Primary Keyword — e.g. Coroplast Signs Saskatoon]
        </h1>
        {/* Sub-headline: price + differentiator in first 100 words */}
        <p className="text-xl text-gray-600 mb-6">
          [One sentence with price callout and differentiator. E.g.: 18×24" from $28.80 — order online, approve your proof, pick up same day.]
        </p>
        {/* Primary CTA — above the fold always */}
        <Link
          href="/products/[product-slug]"
          className="inline-block bg-red-600 text-white font-semibold px-8 py-4 rounded-lg text-lg hover:bg-red-700 transition-colors"
        >
          Get an instant price →
        </Link>

        {/* ── SECTION 2: What is [Product]? ─────────────────────────────── */}
        {/* Answer the #1 question competitors refuse to answer */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-4">What is [product] and why use it?</h2>
          <p>[Educational paragraph. No jargon without explanation. Max 20 words per sentence.]</p>
          <p>[Second paragraph if needed — material specs, durability, Saskatchewan weather claim if relevant.]</p>
        </section>

        {/* ── SECTION 3: Pricing Table ──────────────────────────────────── */}
        {/* NEVER omit pricing. This is the #1 differentiator vs all competitors. */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-4">[Product] Pricing in Saskatoon</h2>
          <p className="text-gray-600 mb-6">All prices in CAD. GST extra. No setup fees. No minimum order.</p>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-3 text-left">Size</th>
                <th className="border border-gray-200 px-4 py-3 text-left">Price</th>
                <th className="border border-gray-200 px-4 py-3 text-left">Bulk discount</th>
              </tr>
            </thead>
            <tbody>
              {/* Populate from CSV prices — NEVER hardcode without verifying CSV */}
              <tr>
                <td className="border border-gray-200 px-4 py-3">[Size 1]</td>
                <td className="border border-gray-200 px-4 py-3 font-semibold">[Price from CSV]</td>
                <td className="border border-gray-200 px-4 py-3 text-green-700">[Discount tier if applicable]</td>
              </tr>
            </tbody>
          </table>
          <p className="text-sm text-gray-500 mt-3">
            Exact pricing varies by size. <Link href="/products/[slug]" className="text-red-600 underline">Use the live estimator</Link> for your exact quote.
          </p>
        </section>

        {/* ── SECTION 4: How It Works ───────────────────────────────────── */}
        {/* Answer "what happens after I order?" — competitors leave this blank */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">How to Order [Product] in Saskatoon</h2>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <span className="font-bold text-red-600 text-lg">1.</span>
              <div>
                <strong>Get an instant price online</strong>
                <p className="text-gray-600">Select your size and quantity. The price updates in real time. No quote request needed.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="font-bold text-red-600 text-lg">2.</span>
              <div>
                <strong>Upload your artwork</strong>
                <p className="text-gray-600">PDF, AI, or high-res JPG/PNG. Not sure about your file? Upload it — we&apos;ll let you know.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="font-bold text-red-600 text-lg">3.</span>
              <div>
                <strong>Approve your proof</strong>
                <p className="text-gray-600">We email you a proof before printing. Nothing goes to press until you say go.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="font-bold text-red-600 text-lg">4.</span>
              <div>
                <strong>Pick up at 216 33rd St W, Saskatoon</strong>
                <p className="text-gray-600">Standard: 1–2 business days. Rush (same-day): +$40. Order by 10am, pick up by 4pm.</p>
              </div>
            </li>
          </ol>
        </section>

        {/* ── SECTION 5: Industry/Use Case Content ─────────────────────── */}
        {/* From research/content/website_copy.md or seo_keywords.md */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-4">[Who uses this product / common use cases]</h2>
          <p>[Content from research file. Minimum 200 words. Include industry-specific terms and scenarios.]</p>
        </section>

        {/* ── SECTION 6: Why True Color ─────────────────────────────────── */}
        <section className="mt-16 bg-gray-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4">Why Saskatoon Businesses Choose True Color</h2>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span><strong>Real prices online</strong> — no quote, no phone call. See the price before you commit.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span><strong>Same-day available</strong> — $40 rush fee. Order by 10am, pick up by 4pm.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span><strong>Proof before printing</strong> — you approve it. We don&apos;t print until you say go.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span><strong>Local Saskatoon</strong> — 216 33rd St W. In-house production. Real accountability.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span><strong>In-house designer</strong> — need help with your file? We can fix it or build from scratch.</span>
            </li>
          </ul>
        </section>

        {/* ── SECTION 7: FAQ ────────────────────────────────────────────── */}
        {/* Must match faqSchema above exactly. Min 3 Q&As. Target 5-7. */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {/* Repeat this block for each FAQ. Must match faqSchema. */}
            <div>
              <h3 className="text-lg font-semibold mb-2">[FAQ Question 1]</h3>
              <p className="text-gray-600">[Answer 1 — must exactly match faqSchema acceptedAnswer text]</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">[FAQ Question 2]</h3>
              <p className="text-gray-600">[Answer 2]</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">[FAQ Question 3]</h3>
              <p className="text-gray-600">[Answer 3]</p>
            </div>
          </div>
        </section>

        {/* ── SECTION 8: Final CTA ──────────────────────────────────────── */}
        <section className="mt-16 text-center bg-red-600 rounded-xl p-10 text-white">
          <h2 className="text-3xl font-bold mb-3">Ready to order?</h2>
          <p className="text-red-100 mb-6 text-lg">See your exact price in seconds. No account required.</p>
          <Link
            href="/products/[product-slug]"
            className="inline-block bg-white text-red-600 font-bold px-10 py-4 rounded-lg text-lg hover:bg-red-50 transition-colors"
          >
            Get an instant price →
          </Link>
          <p className="text-red-200 text-sm mt-4">Local Saskatoon pickup · Same-day available · Proof before printing</p>
        </section>

        {/* ── SECTION 9: Related pages (internal links) ─────────────────── */}
        {/* REQUIRED: minimum 2 internal links to product pages */}
        <section className="mt-16">
          <h2 className="text-xl font-bold mb-4">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Replace with relevant product links */}
            <Link href="/products/coroplast-signs" className="border rounded-lg p-4 hover:border-red-300 transition-colors">
              <div className="font-semibold">Coroplast Signs</div>
              <div className="text-sm text-gray-500">From $28.80</div>
            </Link>
            <Link href="/products/vinyl-banners" className="border rounded-lg p-4 hover:border-red-300 transition-colors">
              <div className="font-semibold">Vinyl Banners</div>
              <div className="text-sm text-gray-500">From $45.00</div>
            </Link>
            <Link href="/products/vehicle-magnets" className="border rounded-lg p-4 hover:border-red-300 transition-colors">
              <div className="font-semibold">Vehicle Magnets</div>
              <div className="text-sm text-gray-500">From $24.00</div>
            </Link>
          </div>
        </section>

      </main>
    </>
  );
}
```

---

## Step 3: Update Sitemap

After creating the page, add it to `src/app/sitemap.ts`. Find the relevant array and add:

```typescript
{
  url: `${baseUrl}/[slug]`,
  lastModified: new Date(),
  changeFrequency: "monthly" as const,
  priority: 0.8,
},
```

---

## Step 4: Run the SEO Checklist

Verify against CLAUDE.md SEO Standards before committing:

```
□ title: 50-60 chars, starts with keyword
□ description: 150-160 chars, has price + location
□ H1: one, contains keyword
□ Pricing table: real CSV prices (verify against data/tables/)
□ CTA above fold: links to /products/[slug]
□ Service schema: areaServed Saskatoon, real price
□ FAQPage schema: min 3 questions, matches on-page FAQ exactly
□ BreadcrumbList schema: home → page
□ noindex: NOT added (this is an SEO page — should be indexed)
□ Sitemap: added to src/app/sitemap.ts
□ Internal links: ≥2 product page links in Related Products
□ Word count: ≥1,200 for Tier 1 pages
□ Voice: no jargon, prices named, active sentences, no "contact for pricing"
```

---

## Step 5: Commit

```bash
git add src/app/[slug]/ src/app/sitemap.ts
git commit -m "feat(seo): add /[slug] landing page — [primary keyword]"
git push
```

Railway auto-deploys in ~2 min. Verify the page at `https://truecolorprinting.ca/[slug]`.

---

## Content Rules (Quick Reference)

**Voice:** Direct. No jargon. Name prices. Active voice.
**Copy sources:** Always read research files — never write content from memory.
**Prices:** Always from `data/tables/*.csv`. Cross-reference before publishing.
**FAQ questions:** Pull from `research/content/competitor_content_audit.md` — 50 questions ready.
**Full page copy:** `research/content/website_copy.md` has complete copy for /agribusiness and /healthcare.
