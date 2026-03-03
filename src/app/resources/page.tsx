import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { fetchFeed, fetchMergedFeeds, formatRelativeDate, type FeedItem } from "@/lib/rss/fetchFeeds";

export const revalidate = 21600; // ISR: rebuild every 6 hours

export const metadata: Metadata = {
  title: "Print & Design Resources | True Color Display Printing Saskatoon",
  // FIX 1: trimmed to 155 chars
  description:
    "Printing news, graphic design, small business tips, Saskatchewan agriculture, restaurant, construction & real estate resources — updated every 6 hours for Saskatoon businesses.",
  alternates: { canonical: "/resources" },
  openGraph: {
    title: "Print & Design Resources | True Color Display Printing",
    description:
      "Industry news for every Saskatoon business type — restaurants, farms, contractors, retailers, realtors, and more. Curated by True Color Display Printing.",
    url: "https://truecolorprinting.ca/resources",
    type: "website",
    // FIX 2: Open Graph image for social sharing
    images: [
      {
        url: "https://truecolorprinting.ca/og-image.png",
        width: 1200,
        height: 630,
        alt: "True Color Display Printing — Print & Design Resources for Saskatoon Businesses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Print & Design Resources | True Color Display Printing",
    description:
      "Industry news for every Saskatoon business type — restaurants, farms, contractors, realtors, and more.",
    images: ["https://truecolorprinting.ca/og-image.png"],
  },
};

// FIX 6: dateModified for freshness signal — revalidates every 6h so always recent
const NOW_ISO = new Date().toISOString();

const pageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://truecolorprinting.ca/resources",
      url: "https://truecolorprinting.ca/resources",
      name: "Print & Design Resources | True Color Display Printing Saskatoon",
      description:
        "Printing, design, small business, agriculture, food, construction, and real estate news for Saskatoon businesses — curated by True Color Display Printing.",
      dateModified: NOW_ISO,
      publisher: {
        "@type": "LocalBusiness",
        name: "True Color Display Printing Ltd.",
        url: "https://truecolorprinting.ca",
        address: {
          "@type": "PostalAddress",
          streetAddress: "216 33rd St W",
          addressLocality: "Saskatoon",
          addressRegion: "SK",
          addressCountry: "CA",
        },
        telephone: "+13069548688",
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
            text: "True Color offers coroplast signs, vinyl banners, ACP aluminum signs, vehicle magnets, business cards, flyers, retractable banners, window decals, and more — plus a full-time in-house graphic designer for custom layouts.",
          },
        },
        {
          "@type": "Question",
          name: "Does True Color print signs for Saskatoon restaurants and food businesses?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes — menu boards, window decals, A-frame signs, vinyl banners, and grand-opening signage for Saskatoon restaurants, cafés, bars, and food trucks. Same-day rush available.",
          },
        },
        {
          "@type": "Question",
          name: "Does True Color print signs for Saskatchewan farms and agribusinesses?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes — coroplast yard signs, ACP aluminum signs, vehicle magnets, and large vinyl banners for SK farms, agribusinesses, co-ops, and equipment dealers. Durable outdoor prairie materials.",
          },
        },
        {
          "@type": "Question",
          name: "Does True Color print real estate signs and open house banners?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes — True Color prints for sale signs, open house banners, directional signs, window graphics, and vehicle magnets for Saskatoon real estate agents and property developers. Fast turnaround for active listings.",
          },
        },
        {
          "@type": "Question",
          name: "How often is this resource page updated?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Every 6 hours automatically, pulling the latest articles from Printing Impressions, Smashing Magazine, Shopify Blog, BDC Canada, CBC Saskatchewan, Global News Saskatoon, CTV Saskatoon, Saskatoon StarPhoenix, The Western Producer, Grainews, Nation's Restaurant News, Eat North, Daily Commercial News, Canadian Contractor, REM Online, and CREA.",
          },
        },
      ],
    },
  ],
};

// FIX 3: Section anchors for jump navigation
const SECTION_ANCHORS = [
  { label: "Print Industry", anchor: "print-industry" },
  { label: "Graphic Design", anchor: "graphic-design" },
  { label: "Small Business", anchor: "small-business" },
  { label: "Saskatoon News", anchor: "saskatoon-news" },
  { label: "Agriculture", anchor: "agriculture" },
  { label: "Food & Restaurant", anchor: "food-restaurant" },
  { label: "Construction", anchor: "construction" },
  { label: "Real Estate", anchor: "real-estate" },
];

interface FeedSection {
  title: string;
  anchor: string;
  intro: string;
  ctaText: string;
  ctaHref: string;
  items: FeedItem[];
  emptyMessage: string;
}

// FIX 4: aria-label on article card for screen reader accessibility
function ArticleCard({ item }: { item: FeedItem }) {
  const relDate = formatRelativeDate(item.date);
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Read: ${item.title} (opens in new tab)`}
      className="group flex flex-col border border-gray-100 rounded-xl p-5 hover:border-[#16C2F3]/40 hover:shadow-md transition-all bg-white"
    >
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="inline-block bg-[#16C2F3]/10 text-[#16C2F3] text-[11px] font-semibold px-2.5 py-0.5 rounded-full truncate max-w-[160px]">
          {item.source}
        </span>
        {relDate && (
          <span className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0" aria-hidden="true">{relDate}</span>
        )}
      </div>
      <h3 className="text-sm font-semibold text-[#1c1712] leading-snug group-hover:text-[#16C2F3] transition-colors line-clamp-3 mb-2">
        {item.title}
      </h3>
      {item.excerpt && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1">{item.excerpt}</p>
      )}
      <span className="mt-3 text-xs font-semibold text-[#16C2F3] group-hover:underline" aria-hidden="true">
        Read article →
      </span>
    </a>
  );
}

function FeedBlock({ section }: { section: FeedSection }) {
  return (
    // FIX 3: id attribute enables anchor linking from jump nav
    <section id={section.anchor} className="mb-16 scroll-mt-20">
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
    realEstateItems,
  ] = await Promise.all([
    fetchFeed("https://www.printingimpressions.com/feed/", 3),
    // Smashing Magazine (DA 88) — one of the highest-authority design sites on the internet
    fetchMergedFeeds([
      "https://www.smashingmagazine.com/feed/",
      "https://www.creativebloq.com/feeds/all",
    ], 3),
    // Shopify Blog (DA 90+) targets small business owners directly
    fetchMergedFeeds([
      "https://www.shopify.com/blog/rss.xml",
      "https://www.bdc.ca/en/articles-tools/entrepreneur-toolkit/rss",
      "https://smallbiztrends.com/feed",
    ], 3),
    // 4 Saskatoon/SK local sources — strongest possible local signal for Google
    fetchMergedFeeds([
      "https://www.cbc.ca/cmlink/rss-canada-saskatchewan",
      "https://globalnews.ca/saskatoon/feed/",
      "https://saskatoon.ctvnews.ca/rss/ctv-news-saskatoon-1.3029857",
      "https://thestarphoenix.com/feed/",
    ], 3),
    // Saskatchewan ag: 3 sources
    fetchMergedFeeds([
      "https://www.producer.com/feed/",
      "https://www.grainews.ca/feed/",
      "https://www.agweb.com/rss.xml",
    ], 3),
    // Food & restaurant: QSR Magazine covers fast casual (Tim Hortons, etc.) — very Canadian
    fetchMergedFeeds([
      "https://www.nrn.com/rss",
      "https://www.qsrmagazine.com/rss.xml",
      "https://eatnorth.com/feed",
    ], 3),
    // Construction: Canadian Contractor is Canada-specific, very targeted
    fetchMergedFeeds([
      "https://www.dailycommercialnews.com/rss",
      "https://www.canadiancontractor.ca/feed/",
      "https://www.constructioncanada.net/feed/",
    ], 3),
    // Real Estate: REM is the top Canadian real estate agent trade publication
    fetchMergedFeeds([
      "https://realestatemagazine.ca/feed/",
      "https://www.crea.ca/feed/",
    ], 3),
  ]);

  const sections: FeedSection[] = [
    {
      title: "Printing Industry News",
      anchor: "print-industry",
      intro:
        "The print industry evolves constantly — new substrates, eco-friendly inks, large-format technologies. Staying current helps Saskatoon businesses make smarter decisions about their signage, marketing print, and branded displays.",
      ctaText: "Get an instant price →",
      ctaHref: "/",
      items: industryItems,
      emptyMessage: "Checking for new articles — check back soon.",
    },
    {
      title: "Graphic Design Insights",
      anchor: "graphic-design",
      intro:
        "Smashing Magazine (one of the most-read design publications on the internet) and Creative Bloq cover typography, colour theory, layout, and visual branding. The same principles our in-house designer applies every day to build custom signage and print for local Saskatoon clients.",
      ctaText: "Meet our in-house designer →",
      ctaHref: "/graphic-design-saskatoon",
      items: designItems,
      emptyMessage: "Checking for new articles — check back soon.",
    },
    {
      title: "Small Business & Marketing Tips",
      anchor: "small-business",
      intro:
        "Shopify Blog, BDC Canada, and Small Biz Trends publish the best small business growth content on the internet — and True Color's customers are small business owners. Whether you're planning a grand opening, a seasonal promotion, or a brand refresh, printed signage is still one of the highest-ROI marketing channels for local Saskatchewan businesses.",
      ctaText: "View all sign solutions →",
      ctaHref: "/sign-company-saskatoon",
      items: marketingItems,
      emptyMessage: "Checking for new articles — check back soon.",
    },
    {
      title: "Saskatoon & Saskatchewan News",
      anchor: "saskatoon-news",
      intro:
        "CBC Saskatchewan, Global News Saskatoon, CTV Saskatoon, and the Saskatoon StarPhoenix — the four most-read local news sources in the city and province. New business openings, city development projects, and community events all create demand for printed signage, promotional materials, and branded displays.",
      ctaText: "About our Saskatoon shop →",
      ctaHref: "/about",
      items: localItems,
      emptyMessage: "Checking for new articles — check back soon.",
    },
    {
      title: "Saskatchewan Agriculture & Farming",
      anchor: "agriculture",
      intro:
        "Saskatchewan is Canada's agricultural heartland. The Western Producer, Grainews, and AgWeb cover grain prices, harvest reports, farm equipment, and agribusiness news. Farms and ag operations across the province rely on True Color for yard signs, gate signs, vehicle magnets, and large outdoor banners built to handle prairie weather.",
      ctaText: "Farm & ag signage →",
      ctaHref: "/agribusiness-signs-saskatchewan",
      items: agItems,
      emptyMessage: "Checking for new articles — check back soon.",
    },
    {
      title: "Saskatoon Food & Restaurant Scene",
      anchor: "food-restaurant",
      intro:
        "Nation's Restaurant News, QSR Magazine, and Eat North cover the food industry from independent restaurants to national chains — and Canada's food scene is growing fast. Saskatoon restaurants, cafés, bars, food trucks, and ghost kitchens trust True Color for menu boards, window decals, A-frame signs, and grand-opening banners. Same-day rush available.",
      ctaText: "Restaurant signs & menus →",
      ctaHref: "/restaurant-signs-saskatoon",
      items: foodItems,
      emptyMessage: "Checking for new articles — check back soon.",
    },
    {
      title: "Construction & Development News",
      anchor: "construction",
      intro:
        "Daily Commercial News, Canadian Contractor, and Construction Canada cover the projects, contracts, and business news driving Saskatchewan's construction industry. Job sites, commercial developments, and residential builders rely on yard signs, site signage, safety banners, and vehicle magnets — and True Color delivers fast turnaround across Saskatoon and the province.",
      ctaText: "Construction site signage →",
      ctaHref: "/construction-signs-saskatoon",
      items: constructionItems,
      emptyMessage: "Checking for new articles — check back soon.",
    },
    {
      title: "Real Estate & Property News",
      anchor: "real-estate",
      intro:
        "REM Online and CREA cover Canada's real estate market — transactions, agent best practices, market trends, and property news. Saskatoon real estate agents and developers need sign packages for every listing: for sale signs, open house banners, directional signs, window graphics, and vehicle magnets. True Color is the local shop that keeps up with a busy market.",
      ctaText: "Real estate signs →",
      ctaHref: "/real-estate-signs-saskatoon",
      items: realEstateItems,
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
            Printing news, graphic design, small business tips, Saskatchewan agriculture, local
            restaurant updates, construction, real estate, and Saskatoon city news — 15 sources,
            updated every 6 hours, all in one place.
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

      {/* FIX 3: Horizontal jump nav — breadcrumb + section anchors in one strip */}
      <div className="bg-gray-50 border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6">
          {/* Breadcrumb row */}
          <div className="py-2 border-b border-gray-200/60">
            <ol className="flex items-center gap-2 text-xs text-gray-400">
              <li>
                <Link href="/" className="hover:text-[#16C2F3] transition-colors">Home</Link>
              </li>
              <li aria-hidden="true">›</li>
              <li className="text-gray-600 font-medium">Resources</li>
            </ol>
          </div>
          {/* Quick-jump anchors — horizontally scrollable on mobile */}
          <nav aria-label="Jump to section" className="overflow-x-auto scrollbar-none">
            <ul className="flex items-center gap-1 py-2 whitespace-nowrap">
              {SECTION_ANCHORS.map((s) => (
                <li key={s.anchor}>
                  <a
                    href={`#${s.anchor}`}
                    className="inline-block text-xs font-medium text-gray-500 hover:text-[#16C2F3] px-3 py-1.5 rounded-full hover:bg-[#16C2F3]/10 transition-all"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Feed sections */}
      <main id="main-content" className="max-w-6xl mx-auto px-6 py-10">
        {sections.slice(0, 4).map((section) => (
          <FeedBlock key={section.title} section={section} />
        ))}

        {/* FIX 5: Mid-page CTA — catches mid-scroll converters */}
        <div className="mb-16 bg-[#16C2F3]/8 border border-[#16C2F3]/20 rounded-2xl px-8 py-7 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-[#1c1712] text-base">Need signage for your Saskatoon business?</p>
            <p className="text-sm text-gray-600 mt-0.5">
              Local print shop at 216 33rd St W — same-day rush available.
            </p>
          </div>
          <Link
            href="/quote"
            className="flex-shrink-0 bg-[#16C2F3] text-white font-bold px-6 py-3 rounded-md hover:bg-[#0fb0dd] transition-colors text-sm whitespace-nowrap"
          >
            Get an Instant Price →
          </Link>
        </div>

        {sections.slice(4).map((section) => (
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
                Coroplast signs, vinyl banners, ACP aluminum signs, vehicle magnets, business cards,
                flyers, retractable banners, window decals, and more — plus a{" "}
                <Link href="/graphic-design-saskatoon" className="text-[#16C2F3] hover:underline">
                  full-time in-house graphic designer
                </Link>{" "}
                for custom layouts.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#1c1712] mb-1">
                Does True Color print signs for Saskatoon restaurants?
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Yes — menu boards, window decals, A-frame signs, vinyl banners, and grand-opening
                signage. Same-day rush available.{" "}
                <Link href="/restaurant-signs-saskatoon" className="text-[#16C2F3] hover:underline">
                  See restaurant sign options →
                </Link>
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#1c1712] mb-1">
                Does True Color print real estate signs and open house banners?
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Yes — for sale signs, open house banners, directional signs, window graphics, and
                vehicle magnets for Saskatoon agents and developers.{" "}
                <Link href="/real-estate-signs-saskatoon" className="text-[#16C2F3] hover:underline">
                  See real estate sign options →
                </Link>
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#1c1712] mb-1">
                Does True Color print signs for Saskatchewan farms and agribusinesses?
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Yes — coroplast yard signs, ACP aluminum signs, vehicle magnets, and large vinyl
                banners built for outdoor prairie conditions.{" "}
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
                Every 6 hours automatically — pulling from 15 sources including Smashing Magazine,
                Shopify Blog, BDC Canada, CBC Saskatchewan, Global News Saskatoon, CTV Saskatoon,
                the Saskatoon StarPhoenix, The Western Producer, Grainews, AgWeb, Nation&apos;s
                Restaurant News, QSR Magazine, Eat North, Daily Commercial News, Canadian Contractor,
                REM Online, and CREA.
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
              href="/real-estate-signs-saskatoon"
              className="border border-white/30 text-white font-medium px-5 py-3 rounded-md hover:border-white transition-colors text-sm"
            >
              Real Estate Signs
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
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
