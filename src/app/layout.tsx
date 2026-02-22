import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
