import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { fetchFeed, formatRelativeDate, type FeedItem } from "@/lib/rss/fetchFeeds";

export const revalidate = 21600; // ISR: rebuild every 6 hours

export const metadata: Metadata = {
  title: "Print & Design Resources | True Color Display Printing Saskatoon",
  description:
    "Curated printing industry news, graphic design tips, marketing ideas, and Saskatchewan business resources — updated daily for Saskatoon businesses.",
  alternates: { canonical: "/resources" },
  openGraph: {
    title: "Print & Design Resources | True Color Display Printing",
    description:
      "Stay current with printing industry news, design trends, and Saskatoon business insights. Curated by True Color Display Printing.",
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
        "Curated printing industry news, graphic design tips, and Saskatchewan business resources for Saskatoon businesses.",
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
            text: "The resource feeds on this page are refreshed automatically every 6 hours, pulling the latest articles from industry publications and Saskatchewan business news sources.",
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
  const [industryItems, designItems, marketingItems, localItems] = await Promise.all([
    fetchFeed("https://www.printingimpressions.com/feed/", 3),
    fetchFeed("https://www.creativebloq.com/feeds/all", 3),
    fetchFeed("https://smallbiztrends.com/feed", 3),
    fetchFeed("https://www.cbc.ca/cmlink/rss-canada-saskatchewan", 3),
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
      title: "Saskatchewan Business News",
      intro:
        "Keeping a pulse on the local economy helps True Color and our clients anticipate busy seasons, new business openings, and community events that drive demand for printed signage. From Saskatoon construction to agriculture to retail — it's all interconnected.",
      ctaText: "About our Saskatoon shop →",
      ctaHref: "/about",
      items: localItems,
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
            We believe informed clients make better decisions. That&apos;s why we curate the latest
            news from the printing industry, the graphic design world, small business marketing, and
            the Saskatchewan business community — all in one place. Updated every 6 hours.
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

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="max-w-6xl mx-auto px-6 py-3">
        <ol className="flex items-center gap-2 text-xs text-gray-400">
          <li>
            <Link href="/" className="hover:text-[#16C2F3] transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li className="text-gray-600 font-medium">Resources</li>
        </ol>
      </nav>

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
                ACP aluminum signs, vehicle magnets, business cards, flyers, retractable banners,
                window decals, and more. We also have a{" "}
                <Link href="/graphic-design-saskatoon" className="text-[#16C2F3] hover:underline">
                  full-time in-house graphic designer
                </Link>{" "}
                for custom layouts and branding.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#1c1712] mb-1">
                How often is this resource page updated?
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                The feeds on this page are refreshed automatically every 6 hours, pulling the latest
                articles from industry publications and Saskatchewan business news sources.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#1c1712] mb-1">
                Can True Color help design my print materials?
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Yes — we have a full-time in-house Photoshop designer who builds layouts from scratch,
                modifies existing files, and delivers same-day proofs. Standard design is a flat $35
                fee. This is a major differentiator from print-only shops.{" "}
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
            Get an instant price on banners, signs, business cards, and more. Local pickup at 216 33rd
            St W, Saskatoon. Same-day rush available.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/quote"
              className="bg-[#16C2F3] text-white font-bold px-6 py-3 rounded-md hover:bg-[#0fb0dd] transition-colors text-sm"
            >
              Get an Instant Price →
            </Link>
            <Link
              href="/banner-printing-saskatoon"
              className="border border-white/30 text-white font-medium px-6 py-3 rounded-md hover:border-white transition-colors text-sm"
            >
              Banner Printing
            </Link>
            <Link
              href="/coroplast-signs-saskatoon"
              className="border border-white/30 text-white font-medium px-6 py-3 rounded-md hover:border-white transition-colors text-sm"
            >
              Coroplast Signs
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
