import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "About | Saskatoon Print Shop — Real Equipment, Local Pickup",
  description:
    "Meet the team behind True Color Display Printing. In-house Roland TrueVIS and Konica Minolta equipment. Local Saskatoon print shop at 216 33rd St W.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About True Color | Saskatoon Print Shop",
    description:
      "Meet the team behind True Color Display Printing. Roland TrueVIS UV printer, Konica Minolta press, in-house designer. Local Saskatoon shop at 216 33rd St W.",
    url: "https://truecolorprinting.ca/about",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://truecolorprinting.ca/#organization",
  name: "True Color Display Printing",
  url: "https://truecolorprinting.ca",
  logo: "https://truecolorprinting.ca/truecolorlogo.png",
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
  sameAs: [
    "https://www.instagram.com/truecolorprint",
    "https://maps.google.com/?cid=3278649905558780051",
    "https://www.facebook.com/truecolordisplay",
  ],
  description:
    "Saskatoon-based print shop operating Roland TrueVIS and Konica Minolta production equipment in-house. Coroplast signs, vinyl banners, vehicle magnets, business cards, and large format printing. Local pickup at 216 33rd St W.",
  foundingYear: "2019",
  foundingLocation: {
    "@type": "Place",
    address: {
      "@type": "PostalAddress",
      streetAddress: "1629 Ontario Ave",
      addressLocality: "Saskatoon",
      addressRegion: "SK",
      addressCountry: "CA",
    },
  },
  areaServed: [
    { "@type": "City", name: "Saskatoon" },
    { "@type": "AdministrativeArea", name: "Saskatchewan" },
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Print Products and Signage",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Coroplast Signs" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Vinyl Banners" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Business Cards" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "ACP Aluminum Signs" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Vehicle Magnets" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Flyers" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Brochures" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Window Decals" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Retractable Banners" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Graphic Design" } },
    ],
  },
};

const EQUIPMENT = [
  {
    img: "/images/about/printer-roland-truvis.webp",
    name: "Roland TrueVIS VG2",
    alt: "Roland TrueVIS VG2 wide-format UV printer — True Color Display Printing Saskatoon",
    desc: "Wide-format inkjet: coroplast signs, vinyl banners, vehicle magnets, window decals — up to 54\" wide.",
  },
  {
    img: "/images/about/printer-konica-minolta.webp",
    name: "Konica Minolta Press",
    alt: "Konica Minolta digital production press for flyers and business cards — True Color Saskatoon",
    desc: "Digital production press: flyers, business cards, booklets, posters — sharp colour at high volume.",
  },
  {
    img: "/images/about/lamination-machine.webp",
    name: "Roll Laminator",
    alt: "In-house roll laminator for gloss and matte finish — True Color Display Printing Saskatoon",
    desc: "Gloss or matte finish, UV protection — applied in-house so your prints stay sharp and durable.",
  },
];

const WHY_LOCAL = [
  {
    title: "Same-Day Available",
    desc: "In by noon, ready by 5 PM on most orders. Rush turnaround adds $40 flat — no surprise fees.",
  },
  {
    title: "One Shop, Everything",
    desc: "Signs, banners, cards, decals — designed and printed here. No vendor juggling, no dropped balls.",
  },
  {
    title: "Real Humans, Real Help",
    desc: "Bring a sketch, a low-res logo, or nothing at all. Our in-house designer handles the rest.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <SiteNav />

      {/* ── PAGE HEADER ── */}
      <section className="bg-[#1c1712] px-6 py-14 md:py-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#16C2F3] font-bold uppercase tracking-widest text-sm mb-4">
            216 33rd St W · Saskatoon, SK
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-5">
            Real equipment.<br />Real people.<br />
            <span className="text-[#16C2F3]">Printed here.</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl leading-relaxed">
            True Color Display Printing is a Saskatoon print shop at 216 33rd St W
            specializing in large-format printing, signs, banners, vehicle magnets, and business
            cards for local businesses and organizations across Saskatchewan. We own our presses,
            employ our own designer, and do every order in-house — no outsourcing, no shipping
            middlemen, just faster turnaround and real accountability.
          </p>
          <p className="text-gray-400 text-base max-w-2xl leading-relaxed mt-4">
            Founded in Saskatoon in 2019, True Color has grown from a single-location shop on
            Ontario Ave to its current home at 216 33rd St W. The shop runs a Roland TrueVIS VG2
            wide-format UV printer and a Konica Minolta digital production press — both owned and
            operated in-house by our team every day.
          </p>
        </div>
      </section>

      {/* ── EQUIPMENT ── */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-[#1c1712] mb-2">Our Production Equipment</h2>
        <p className="text-gray-500 mb-10 text-lg">
          Everything we sell is printed on equipment we own and operate in our shop.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {EQUIPMENT.map((item) => (
            <div key={item.name} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative h-48 bg-gray-50">
                <Image
                  src={item.img}
                  alt={item.alt ?? item.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-[#1c1712] text-base mb-1">{item.name}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}

          {/* 4th card — Design Services (no photo) */}
          <div className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative h-48 bg-[#f4efe9] flex items-center justify-center">
              <svg className="w-16 h-16 text-[#16C2F3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-[#1c1712] text-base mb-1">In-House Design</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Sketch to print-ready. We prepare files, upscale logos, and lay out your artwork — no separate design agency needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY LOCAL ── */}
      <section className="bg-[#f4efe9] px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1c1712] mb-10">Why Local?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {WHY_LOCAL.map((item) => (
              <div key={item.title}>
                <h3 className="font-bold text-[#1c1712] text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVING SASKATCHEWAN ── */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-[#1c1712] mb-3">Serving Saskatchewan Province-Wide</h2>
        <p className="text-gray-500 mb-8 text-lg max-w-2xl">
          Based in Saskatoon, we print and ship to businesses across Saskatchewan.
          Customer pays shipping — we handle everything else.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { city: "Regina — Banners", href: "/banner-printing-regina" },
            { city: "Regina — Signs", href: "/coroplast-signs-regina" },
            { city: "Prince Albert", href: "/signs-prince-albert-sk" },
            { city: "Lloydminster", href: "/printing-lloydminster-sk" },
            { city: "Moose Jaw", href: "/signs-moose-jaw-sk" },
            { city: "Swift Current", href: "/printing-swift-current-sk" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium text-[#1c1712] hover:border-[#16C2F3] hover:text-[#16C2F3] transition-colors text-center"
            >
              {item.city}
            </Link>
          ))}
        </div>
      </section>

      {/* ── CTA BAR ── */}
      <section className="bg-[#16C2F3] px-6 py-12">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-white">
          <p className="text-xl font-bold text-center sm:text-left">
            Ready to order? Get your exact price in 30 seconds.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/quote"
              className="bg-white text-[#16C2F3] font-bold px-6 py-3 rounded-md hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              Get a Quote →
            </Link>
            <a
              href="tel:+13069548688"
              className="border border-white/60 text-white font-semibold px-6 py-3 rounded-md hover:border-white transition-colors whitespace-nowrap"
            >
              Call (306) 954-8688
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
