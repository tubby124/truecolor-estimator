import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { BackToTop } from "@/components/site/BackToTop";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    "Coroplast signs from $30. Vinyl banners from $66. Business cards from $45. In-house designer at 216 33rd St W Saskatoon. See your price now.",
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
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "True Color Display Printing",
  url: "https://truecolorprinting.ca",
  description:
    "Instant online pricing for signs, banners, and print products in Saskatoon, SK. No quote forms — see your exact price in 30 seconds.",
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
  "@type": "LocalBusiness",
  name: "True Color Display Printing",
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
    postalCode: "S7L 0V5",
    addressCountry: "CA",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 52.1218,
    longitude: -106.6702,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "17:00",
    },
  ],
  priceRange: "$$",
  image: "https://truecolorprinting.ca/truecolorlogo.png",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5.0",
    reviewCount: "29",
    bestRating: "5",
    worstRating: "1",
  },
  sameAs: [
    "https://www.instagram.com/truecolorprint",
    "https://maps.google.com/?cid=3278649905558780051",
    "https://www.facebook.com/truecolordisplay",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-[#16C2F3] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:shadow-lg"
        >
          Skip to content
        </a>
        {children}
        <BackToTop />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-6HMQT7MNLL"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-6HMQT7MNLL');`}
        </Script>
        {/* Trustindex loader-cert.js removed — was injecting visible
            "Trustmark widget validation failed" error text on every page.
            Reviews widget (ReviewsSection) and Instagram feed (loader-feed.js)
            are independent and unaffected. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </body>
    </html>
  );
}
