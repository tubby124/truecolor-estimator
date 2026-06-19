import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { BackToTop } from "@/components/site/BackToTop";
import { AuthRedirect } from "@/components/site/AuthRedirect";
import { UtmCapture } from "@/components/site/UtmCapture";
import { MetaPixel } from "@/components/site/MetaPixel";
import { REVIEW_COUNT, RATING_VALUE } from "@/lib/reviews";

// Self-hosted Geist + Geist Mono variable WOFF2 files. Switched from
// next/font/google because Railway builds were intermittently failing on
// build-time Google Fonts fetches — three consecutive deploys died with
// "Failed to fetch `Geist` from Google Fonts." Bundling the fonts removes
// the external network dependency at build time entirely.
// Files sourced from github.com/vercel/geist-font (OFL-licensed).
const geistSans = localFont({
  src: "./fonts/Geist-wght.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMono-wght.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

// ─── Render strategy ───────────────────────────────────────────────────────
// force-dynamic + revalidate=0 disables the default 1-year CDN cache
// (`s-maxage=31536000`) that Next.js applies to Server Components. Without
// these, redeployed HTML stays cached for up to a year — Googlebot, Perplexity,
// ChatGPT, and normal users all see stale content for hours/days after every
// deploy. Discovered 2026-05-29 (Phase 52) — coroplast body expansion shipped
// at 21:30 wasn't visible to default-URL requests until a cache-bust query
// forced revalidation.
//
// Stop hook Category H (scripts/hooks/stop-price-validation.mjs) BLOCKS
// session end if either directive disappears. DO NOT REMOVE without owner
// approval — the 1-year cache failure mode would return immediately.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: {
    default: "True Color Printing | Signs, Banners & Cards Saskatoon",
    template: "%s | True Color Display Printing",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "True Color",
  },
  description:
    "Coroplast signs from $25. Vinyl banners from $66. Business cards from $45. In-house designer at 216 33rd St W Saskatoon. See your price now.",
  metadataBase: new URL("https://truecolorprinting.ca"),
  openGraph: {
    title: "True Color Printing | Signs, Banners & Cards Saskatoon",
    description:
      "Instant online pricing for signs, banners, business cards, magnets & flyers. Local Saskatoon print shop with in-house designer. No quote forms — see your price now.",
    url: "https://truecolorprinting.ca",
    siteName: "True Color Display Printing",
    locale: "en_CA",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "True Color Display Printing — Saskatoon Print Shop",
      },
    ],
  },
  keywords: [
    "Saskatoon printing",
    "coroplast signs Saskatoon",
    "vinyl banners Saskatoon",
    "business cards Saskatoon",
    "vehicle magnets Saskatoon",
    "print shop Saskatoon",
    "True Color Display Printing",
  ],
  twitter: {
    card: "summary_large_image",
    title: "True Color Printing | Signs, Banners & Cards Saskatoon",
    description:
      "Coroplast signs from $25. Vinyl banners from $66. Business cards from $45. In-house designer at 216 33rd St W Saskatoon.",
    images: ["https://truecolorprinting.ca/og-image.png"],
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://truecolorprinting.ca/#organization",
  name: "True Color Display Printing",
  legalName: "True Color Display Printing Ltd.",
  alternateName: [
    "True Color Printing",
    "True Color Display Printing",
    "True Color Display Printing Ltd.",
    "TrueColor Printing",
  ],
  url: "https://truecolorprinting.ca",
  logo: {
    "@type": "ImageObject",
    url: "https://truecolorprinting.ca/truecolorlogo.png",
    width: 512,
    height: 512,
  },
  image: "https://truecolorprinting.ca/og-image.png",
  email: "info@true-color.ca",
  telephone: "+13069548688",
  founder: { "@id": "https://truecolorprinting.ca/#albert-yeung" },
  taxID: "731454914RT0001",
  vatID: "731454914RT0001",
  sameAs: [
    "https://www.instagram.com/truecolorprint",
    "https://maps.google.com/?cid=3278649905558780051",
    "https://www.facebook.com/truecolordisplay",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://truecolorprinting.ca/#website",
  name: "True Color Display Printing",
  url: "https://truecolorprinting.ca",
  description:
    "Instant online pricing for signs, banners, and print products in Saskatoon, SK. No quote forms — see your exact price in 30 seconds.",
  publisher: { "@id": "https://truecolorprinting.ca/#organization" },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://truecolorprinting.ca/quote?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "PrintShop"],
  "@id": "https://truecolorprinting.ca/#localbusiness",
  name: "True Color Display Printing",
  legalName: "True Color Display Printing Ltd.",
  alternateName: ["True Color Printing", "TrueColor Printing"],
  parentOrganization: { "@id": "https://truecolorprinting.ca/#organization" },
  founder: { "@id": "https://truecolorprinting.ca/#albert-yeung" },
  logo: "https://truecolorprinting.ca/truecolorlogo.png",
  taxID: "731454914RT0001",
  vatID: "731454914RT0001",
  description:
    "Saskatoon print shop specializing in coroplast signs, vinyl banners, vehicle magnets, business cards, and large format printing. In-house designer. Instant online pricing.",
  url: "https://truecolorprinting.ca",
  telephone: "+13069548688",
  email: "info@true-color.ca",
  address: {
    "@type": "PostalAddress",
    streetAddress: "216 33rd St W",
    addressLocality: "Saskatoon",
    addressRegion: "SK",
    postalCode: "S7L 0V1",
    addressCountry: "CA",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 52.13254,
    longitude: -106.67047,
  },
  hasMap: "https://maps.google.com/?cid=3278649905558780051",
  areaServed: {
    "@type": "GeoCircle",
    geoMidpoint: {
      "@type": "GeoCoordinates",
      latitude: 52.13254,
      longitude: -106.67047,
    },
    geoRadius: "50000",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00:00",
      closes: "17:00:00",
    },
  ],
  priceRange: "$$",
  image: "https://truecolorprinting.ca/truecolorlogo.png",
  paymentAccepted: "Cash, Credit Card, Debit, E-Transfer",
  currenciesAccepted: "CAD",
  // Restored 2026-05-29 — aggregateRating was silently removed by commit
  // 7ab5e48 (the May 25 disaster commit). REVIEW_COUNT + RATING_VALUE come
  // from src/lib/reviews.ts. Stop hook Category G now blocks session end if
  // this block disappears again. DO NOT REMOVE.
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: RATING_VALUE,
    reviewCount: REVIEW_COUNT,
    bestRating: "5",
    worstRating: "1",
  },
  knowsAbout: [
    "Coroplast signs",
    "Vinyl banner printing",
    "Large format printing",
    "Business card printing",
    "Vehicle magnets",
    "Window decals",
    "Vinyl lettering",
    "Foam board printing",
    "Roland UV printing",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Print Products",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Coroplast Signs", url: "https://truecolorprinting.ca/coroplast-signs-saskatoon" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Vinyl Banners", url: "https://truecolorprinting.ca/banner-printing-saskatoon" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Business Cards", url: "https://truecolorprinting.ca/business-cards-saskatoon" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Flyers", url: "https://truecolorprinting.ca/flyer-printing-saskatoon" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Vehicle Magnets", url: "https://truecolorprinting.ca/vehicle-magnets-saskatoon" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "ACP Aluminum Signs", url: "https://truecolorprinting.ca/aluminum-signs-saskatoon" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Foamboard Displays", url: "https://truecolorprinting.ca/foamboard-printing-saskatoon" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Window Decals", url: "https://truecolorprinting.ca/window-decals-saskatoon" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Vinyl Lettering", url: "https://truecolorprinting.ca/vinyl-lettering-saskatoon" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Retractable Banners", url: "https://truecolorprinting.ca/retractable-banners-saskatoon" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Stickers", url: "https://truecolorprinting.ca/sticker-printing-saskatoon" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Postcards", url: "https://truecolorprinting.ca/postcard-printing-saskatoon" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Brochures", url: "https://truecolorprinting.ca/brochure-printing-saskatoon" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Photo Posters", url: "https://truecolorprinting.ca/poster-printing-saskatoon" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Graphic Design", url: "https://truecolorprinting.ca/graphic-design-saskatoon" } },
    ],
  },
  sameAs: [
    "https://www.instagram.com/truecolorprint",
    "https://maps.google.com/?cid=3278649905558780051",
    "https://www.facebook.com/truecolordisplay",
  ],
};

const founderSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://truecolorprinting.ca/#albert-yeung",
  name: "Albert Yeung",
  jobTitle: "Founder",
  worksFor: { "@id": "https://truecolorprinting.ca/#organization" },
  founderOf: { "@id": "https://truecolorprinting.ca/#organization" },
  knowsAbout: [
    "Large format printing",
    "Roland UV printing",
    "Business card printing",
    "Vehicle magnets",
    "Coroplast signs",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-CA">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-[#16C2F3] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:shadow-lg"
        >
          Skip to content
        </a>
        <AuthRedirect />
        <UtmCapture />
        {children}
        <BackToTop />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-6HMQT7MNLL"
          strategy="lazyOnload"
        />
        <Script id="ga4-init" strategy="lazyOnload">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-6HMQT7MNLL');`}
        </Script>
        <MetaPixel />
        {/* Trustindex loader-cert.js removed — was injecting visible
            "Trustmark widget validation failed" error text on every page.
            Reviews widget (ReviewsSection) and Instagram feed (loader-feed.js)
            are independent and unaffected. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(founderSchema) }}
        />
      </body>
    </html>
  );
}
