import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { fetchFeed, fetchMergedFeeds, formatRelativeDate, type FeedItem } from "@/lib/rss/fetchFeeds";

export const revalidate = 21600; // ISR: rebuild every 6 hours

export const metadata: Metadata = {
  title: "Print & Design Resources | True Color Display Printing Saskatoon",
  description:
    "Printing news, graphic design tips, Saskatchewan agriculture, Saskatoon food & restaurant news, construction updates, and local business resources — curated for Saskatoon businesses and updated daily.",
  alternates: { canonical: "/resources" },
  openGraph: {
    title: "Print & Design Resources | True Color Display Printing",
    description:
      "Curated industry news for Saskatoon businesses — printing, design, agriculture, food & restaurant, construction, and local Saskatchewan news.",
    url: "https://truecolorprinting.ca/resources",
    type: "website",
  },
};

const pageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://truecolorprinting.ca/resources",
      url: "https://truecolorprinting.ca/resources",
      name: "Print & Design Resources | True Color Display Printing Saskatoon",
      description:
        "Printing news, graphic design, Saskatchewan agriculture, Saskatoon food & restaurant, construction, and local business resources — curated by True Color Display Printing.",
      publisher: {
        "@type": "LocalBusiness",
        name: "True Color Display Printing Ltd.",
        url: "https://truecolorprinting.ca",
      },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://truecolorprinting.ca" },
          { "@type": "ListItem", position: 2, name: "Resources", item: "https://truecolorprinting.ca/resources" },
        ],
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What printing services does True Color Display Printing offer in Saskatoon?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "True Color offers a full range of printing services including coroplast signs, vinyl banners, ACP aluminum signs, vehicle magnets, business cards, flyers, retractable banners, window decals, and more. We also have a full-time in-house graphic designer for custom layouts and branding.",
          },
        },
        {
          "@type": "Question",
          name: "How often is this resource page updated?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The resource feeds on this page are refreshed automatically every 6 hours, pulling the latest articles from industry publications, Saskatchewan agriculture, Saskatoon food & restaurant news, construction updates, and local business sources.",
          },
        },
        {
          "@type": "Question",
          name: "Can True Color help design my print materials?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes — True Color has a full-time in-house Photoshop designer who can build layouts from scratch, modify existing files, and turn around same-day proofs. Standard design is a flat $35 fee. This is a major differentiator from print-only shops.",
          },
        },
        {
          "@type": "Question",
          name: "Does True Color print signs for Saskatoon restaurants and food businesses?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Absolutely. True Color prints menu boards, window decals, A-frame signs, vinyl banners, promotional flyers, and grand opening signage for Saskatoon restaurants, cafés, bars, and food businesses. Same-day rush available for urgent orders.",
          },
        },
        {
          "@type": "Question",
          name: "Does True Color print signs for Saskatchewan farms and agribusinesses?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes — True Color provides coroplast yard signs, ACP aluminum signs, vehicle magnets, and large vinyl banners for Saskatchewan farms, agribusinesses, co-ops, and equipment dealers. Durable materials built for outdoor prairie conditions.",
          },
        },
      ],
    },
  ],
};

interface FeedSection {
  title: string;
  intro: string;
  ctaText: string;
  ctaHref: string;
  items: FeedItem[];
  emptyMessage: string;
}

function ArticleCard({ item }: { item: FeedItem }) {
  const relDate = formatRelativeDate(item.date);
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col border border-gray-100 rounded-xl p-5 hover:border-[#16C2F3]/40 hover:shadow-md transition-all bg-white"
    >
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="inline-block bg-[#16C2F3]/10 text-[#16C2F3] text-[11px] font-semibold px-2.5 py-0.5 rounded-full truncate max-w-[160px]">
          {item.source}
        </span>
        {relDate && (
          <span className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0">{relDate}</span>
        )}
      </div>
      <h3 className="text-sm font-semibold text-[#1c1712] leading-snug group-hover:text-[#16C2F3] transition-colors line-clamp-3 mb-2">
        {item.title}
      </h3>
      {item.excerpt && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1">{item.excerpt}</p>
      )}
      <span className="mt-3 text-xs font-semibold text-[#16C2F3] group-hover:underline">
        Read article →
      </span>
    </a>
  );
}

function FeedBlock({ section }: { section: FeedSection }) {
  return (
    <section className="mb-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1c1712]">{section.title}</h2>
          <p className="mt-2 text-sm text-gray-600 max-w-2xl leading-relaxed">{section.intro}</p>
        </div>
        <Link
          href={section.ctaHref}
          className="flex-shrink-0 inline-flex items-center gap-1 bg-[#1c1712] text-white text-sm font-bold px-4 py-2.5 rounded-md hover:bg-[#2e2318] transition-colors whitespace-nowrap"
        >
          {section.ctaText}
        </Link>
      </div>
      {section.items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {section.items.map((item, i) => (
            <ArticleCard key={i} item={item} />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-gray-200 rounded-xl px-6 py-8 text-center text-sm text-gray-400">
          {section.emptyMessage}
        </div>
      )}
    </section>
  );
}

export default async function ResourcesPage() {
  const [
    industryItems,
    designItems,
    marketingItems,
    localItems,
    agItems,
    foodItems,
    constructionItems,
  ] = await Promise.all([
    // Original 4
    fetchFeed("https://www.printingimpressions.com/feed/", 3),
    fetchFeed("https://www.creativebloq.com/feeds/all", 3),
    fetchFeed("https://smallbiztrends.com/feed", 3),
    fetchMergedFeeds([
      "https://www.cbc.ca/cmlink/rss-canada-saskatchewan",
      "https://globalnews.ca/saskatoon/feed/",
    ], 3),
    // New: Saskatchewan Agriculture
    fetchMergedFeeds([
      "https://www.producer.com/feed/",
      "https://www.grainews.ca/feed/",
    ], 3),
    // New: Saskatoon Food & Restaurant
    fetchMergedFeeds([
      "https://www.nrn.com/rss",
      "https://eatnorth.com/feed",
      "https://globalnews.ca/saskatoon/feed/",
    ], 3),
    // New: Construction & Development
    fetchMergedFeeds([
      "https://www.dailycommercialnews.com/rss",
      "https://www.constructioncanada.net/feed/",
    ], 3),
  ]);

  const sections: FeedSection[] = [
    {
      title: "Printing Industry News",
      intro:
        "The print industry evolves constantly — from new substrates and eco-friendly inks to emerging large-format technologies. Staying current with these trends helps Saskatoon businesses make smarter decisions about their signage, marketing print, and branded displays.",
      ctaText: "Get an instant price →",
      ctaHref: "/",
      items: industryItems,
      emptyMessage: "Checking for new articles — check back soon.",
    },
    {
      title: "Graphic Design Insights",
      intro:
        "Great print starts with great design. These resources cover typography, colour theory, layout best practices, and visual branding — the same principles our in-house designer applies every day to build custom signage, banners, and promotional materials for local clients.",
      ctaText: "Meet our in-house designer →",
      ctaHref: "/graphic-design-saskatoon",
      items: designItems,
      emptyMessage: "Checking for new articles — check back soon.",
    },
    {
      title: "Marketing & Signage Tips",
      intro:
        "Whether you're planning a grand opening, a trade show booth, or a seasonal promotion, effective printed marketing materials are still one of the highest-ROI channels for local businesses. These resources help you plan campaigns that drive real foot traffic and brand awareness in Saskatchewan.",
      ctaText: "View all sign solutions →",
      ctaHref: "/sign-company-saskatoon",
      items: marketingItems,
      emptyMessage: "Checking for new articles — check back soon.",
    },
    {
      title: "Saskatoon & Saskatchewan News",
      intro:
        "Local news from CBC Saskatchewan and Global News Saskatoon. From new business openings to city development projects and community events — what's happening in Saskatoon directly shapes demand for printed signage, promotional materials, and branded displays.",
      ctaText: "About our Saskatoon shop →",
      ctaHref: "/about",
      items: localItems,
      emptyMessage: "Checking for new articles — check back soon.",
    },
    {
      title: "Saskatchewan Agriculture & Farming",
      intro:
        "Saskatchewan is Canada's agricultural heartland. From grain prices and harvest reports to farm equipment and agribusiness news — we follow The Western Producer and Grainews closely because our farmers are some of our best customers. Need yard signs, ACP signs, or vehicle magnets for your operation?",
      ctaText: "Farm & ag signage →",
      ctaHref: "/agribusiness-signs-saskatchewan",
      items: agItems,
      emptyMessage: "Checking for new articles — check back soon.",
    },
    {
      title: "Saskatoon Food & Restaurant Scene",
      intro:
        "Saskatoon's food scene is growing fast — new restaurants, ghost kitchens, food trucks, and cafés opening every season. Whether you need window decals, menu boards, A-frame signs, or grand-opening banners, True Color has served Saskatoon's hospitality industry for years. Pick up signage same day.",
      ctaText: "Restaurant signs & menus →",
      ctaHref: "/restaurant-signs-saskatoon",
      items: foodItems,
      emptyMessage: "Checking for new articles — check back soon.",
    },
    {
      title: "Construction & Development News",
      intro:
        "New builds, commercial developments, and residential projects across Saskatchewan and the prairies. Construction companies rely on yard signs, site signage, vehicle magnets, and safety banners — and True Color delivers fast turnaround for job sites across the city and province.",
      ctaText: "Construction site signage →",
      ctaHref: "/construction-signs-saskatoon",
      items: constructionItems,
      emptyMessage: "Checking for new articles — check back soon.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />

      <SiteNav />

      {/* Hero */}
      <section className="bg-[#1c1712] text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#16C2F3] text-sm font-semibold uppercase tracking-widest mb-3">
            Curated Resources
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
            Print &amp; Design Resources for Saskatoon Businesses
          </h1>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Printing news, design tips, Saskatchewan agriculture, local restaurant updates,
            construction industry news, and Saskatoon business coverage — all in one place.
            Updated every 6 hours, automatically.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/quote"
              className="bg-[#16C2F3] text-white font-bold px-6 py-3 rounded-md hover:bg-[#0fb0dd] transition-colors text-sm"
            >
              Get an Instant Price →
            </Link>
            <Link
              href="/graphic-design-saskatoon"
              className="border border-white/30 text-white font-medium px-6 py-3 rounded-md hover:border-white transition-colors text-sm"
            >
              Meet Our Designer
            </Link>
          </div>
        </div>
      </section>

      {/* Quick-jump nav */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-3 overflow-x-auto">
          <ol className="flex items-center gap-2 text-xs text-gray-400 mb-0 whitespace-nowrap">
            <li>
              <Link href="/" className="hover:text-[#16C2F3] transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li className="text-gray-600 font-medium">Resources</li>
          </ol>
        </div>
      </div>

      {/* Feed sections */}
      <main id="main-content" className="max-w-6xl mx-auto px-6 py-10">
        {sections.map((section) => (
          <FeedBlock key={section.title} section={section} />
        ))}

        {/* FAQ */}
        <section className="border-t border-gray-100 pt-14">
          <h2 className="text-2xl font-bold text-[#1c1712] mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="font-semibold text-[#1c1712] mb-1">
                What printing services does True Color offer in Saskatoon?
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                True Color offers a full range of printing including coroplast signs, vinyl banners,
                ACP aluminum signs, vehicle magnets, business cards, flyers, retractable banners, and
                window decals. We also have a{" "}
                <Link href="/graphic-design-saskatoon" className="text-[#16C2F3] hover:underline">
                  full-time in-house graphic designer
                </Link>{" "}
                for custom layouts and branding.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#1c1712] mb-1">
                Does True Color print signs for Saskatoon restaurants and food businesses?
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Yes — we print menu boards, window decals, A-frame signs, vinyl banners, and
                grand-opening signage for Saskatoon restaurants, cafés, bars, and food trucks.
                Same-day rush available.{" "}
                <Link href="/restaurant-signs-saskatoon" className="text-[#16C2F3] hover:underline">
                  See restaurant sign options →
                </Link>
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#1c1712] mb-1">
                Does True Color print signs for Saskatchewan farms and agribusinesses?
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Absolutely — coroplast yard signs, ACP aluminum signs, vehicle magnets, and large
                vinyl banners for SK farms, agribusinesses, co-ops, and equipment dealers. Durable
                materials built for outdoor prairie conditions.{" "}
                <Link href="/agribusiness-signs-saskatchewan" className="text-[#16C2F3] hover:underline">
                  See ag & farm signage →
                </Link>
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#1c1712] mb-1">
                How often is this resource page updated?
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Every 6 hours automatically — pulling the latest from printing industry publications,
                CBC Saskatchewan, Global News Saskatoon, The Western Producer, Nation&apos;s
                Restaurant News, Eat North, and construction trade media.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#1c1712] mb-1">
                Can True Color help design my print materials?
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Yes — full-time in-house Photoshop designer, same-day proofs, flat $35 standard
                design fee.{" "}
                <Link href="/graphic-design-saskatoon" className="text-[#16C2F3] hover:underline">
                  Learn more about our design service →
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA strip */}
        <section className="mt-16 bg-[#1c1712] rounded-2xl px-8 py-10 text-center text-white">
          <h2 className="text-xl font-bold mb-2">Ready to print for your Saskatoon business?</h2>
          <p className="text-gray-300 text-sm mb-6 max-w-xl mx-auto">
            Signs, banners, business cards, and more. Local pickup at 216 33rd St W, Saskatoon.
            Same-day rush available.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/quote"
              className="bg-[#16C2F3] text-white font-bold px-6 py-3 rounded-md hover:bg-[#0fb0dd] transition-colors text-sm"
            >
              Get an Instant Price →
            </Link>
            <Link
              href="/restaurant-signs-saskatoon"
              className="border border-white/30 text-white font-medium px-5 py-3 rounded-md hover:border-white transition-colors text-sm"
            >
              Restaurant Signs
            </Link>
            <Link
              href="/agribusiness-signs-saskatchewan"
              className="border border-white/30 text-white font-medium px-5 py-3 rounded-md hover:border-white transition-colors text-sm"
            >
              Farm & Ag Signs
            </Link>
            <Link
              href="/construction-signs-saskatoon"
              className="border border-white/30 text-white font-medium px-5 py-3 rounded-md hover:border-white transition-colors text-sm"
            >
              Construction Signs
            </Link>
            <Link
              href="/banner-printing-saskatoon"
              className="border border-white/30 text-white font-medium px-5 py-3 rounded-md hover:border-white transition-colors text-sm"
            >
              Banners
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
