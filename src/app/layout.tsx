import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
    default: "True Color Display Printing | Saskatoon Signs, Banners & Cards",
    template: "%s | True Color Display Printing",
  },
  description:
    "Coroplast signs from $30. Vinyl banners from $45. Business cards from $40. In-house designer, local Saskatoon pickup at 216 33rd St W. See your exact price online — no quote forms.",
  metadataBase: new URL("https://truecolorprinting.ca"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "True Color Display Printing | Saskatoon",
    description:
      "Instant online pricing for signs, banners, business cards, magnets & flyers. Local Saskatoon print shop with in-house designer. No quote forms — see your price now.",
    url: "https://truecolorprinting.ca",
    siteName: "True Color Display Printing",
    locale: "en_CA",
    type: "website",
    images: [
      {
        // TODO: replace with a proper 1200×630 OG image once designed
        url: "/truecolorlogo.png",
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
  sameAs: ["https://www.instagram.com/truecolorprint"],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </body>
    </html>
  );
}
