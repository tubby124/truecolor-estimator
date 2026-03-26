import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: { absolute: "Vehicle Decals Saskatoon | Die-Cut Vinyl | True Color" },
  description:
    "Custom die-cut vehicle decals in Saskatoon — full-colour vinyl for door panels, rear windows, and side graphics. From $75 print. Installation quoted separately.",
  alternates: { canonical: "/vehicle-decals-saskatoon" },
  openGraph: {
    title: "Vehicle Decals Saskatoon | Die-Cut Vinyl Printed & Installed | True Color",
    description:
      "Die-cut vehicle decals from $75. Full-colour Roland UV print. Door panels, rear windows, side graphics. Installation quoted separately. Saskatoon.",
    url: "https://truecolorprinting.ca/vehicle-decals-saskatoon",
    type: "website",
  },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Vehicle Decals Saskatoon",
  serviceType: "Vehicle Vinyl Decal Printing and Installation",
  url: "https://truecolorprinting.ca/vehicle-decals-saskatoon",
  provider: {
    "@type": "LocalBusiness",
    name: "True Color Display Printing",
    url: "https://truecolorprinting.ca",
    address: {
      "@type": "PostalAddress",
      streetAddress: "216 33rd St W",
      addressLocality: "Saskatoon",
      addressRegion: "SK",
      postalCode: "S7L 0V5",
      addressCountry: "CA",
    },
    telephone: "+1-306-700-0272",
  },
  description:
    "Custom die-cut vehicle decals printed on Roland UV wide-format press. Full-colour vinyl for door panels, rear windows, and side graphics. From $14/sqft, minimum $75. Installation quoted separately.",
  offers: {
    "@type": "Offer",
    price: "75",
    priceCurrency: "CAD",
    description: "Die-cut vehicle vinyl — from $14/sqft, minimum $75 print-only",
  },
};

const SIZES = [
  { name: "Small decal (up to 5.4 sqft)", sqft: "min", print: "$75", note: "Business logos, small graphics" },
  { name: "Door panel (29×16.5\")", sqft: "3.3 sqft", print: "$75*", note: "Standard car/SUV door" },
  { name: "Large door panel (36×24\")", sqft: "6 sqft", print: "$84", note: "Van or truck door" },
  { name: "Rear window (32.5×11\")", sqft: "2.5 sqft", print: "$75*", note: "Car/SUV back glass" },
  { name: "Rear window large (48×18\")", sqft: "6 sqft", print: "$84", note: "Truck or van rear" },
  { name: "Full side panel (72×24\")", sqft: "12 sqft", print: "$168", note: "Van/truck side graphic" },
];

export default function VehicleDecalsSaskatoonPage() {
  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <SiteNav />

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-14">

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mb-16">
          <div>
            <p className="text-[#16C2F3] font-semibold text-sm uppercase tracking-wide mb-2">Vehicle Decals Saskatoon</p>
            <h1 className="text-4xl font-bold text-[#1c1712] mb-4 leading-tight">
              Die-Cut Vehicle Decals — Printed & Installed
            </h1>
            <p className="text-gray-600 text-lg mb-6">
              Full-colour die-cut vinyl for door panels, rear windows, and side graphics. Printed on our Roland UV wide-format press.{" "}
              <strong>From $14/sqft, minimum $75.</strong> Installation quoted separately.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/quote-request"
                className="bg-[#16C2F3] text-white font-bold px-7 py-3.5 rounded-lg hover:bg-[#0fb0dd] transition-colors text-center"
              >
                Get a Quote →
              </Link>
              <Link
                href="/gallery"
                className="border border-gray-300 text-gray-700 font-semibold px-7 py-3.5 rounded-lg hover:border-[#16C2F3] hover:text-[#16C2F3] transition-colors text-center"
              >
                See Our Work →
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
            <Image
              src="/images/gallery/gallery-vehicle-decal-riverbend-side.webp"
              alt="Die-cut vehicle door decal installed by True Color Display Printing Saskatoon — RiverBend Auto Glass"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Pricing table */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-[#1c1712] mb-2">Print Pricing</h2>
          <p className="text-gray-500 text-sm mb-6">
            Print-only — you apply it yourself, or add installation as a separate line item.
            <br />
            <span className="text-xs">* Minimum $75 applies. $14/sqft above minimum.</span>
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-semibold text-[#1c1712]">Size</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-[#1c1712]">Area</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-[#1c1712]">Print Price</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-[#1c1712] hidden sm:table-cell">Common Use</th>
                </tr>
              </thead>
              <tbody>
                {SIZES.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-[#1c1712]">{row.name}</td>
                    <td className="px-5 py-3.5 text-gray-500">{row.sqft}</td>
                    <td className="px-5 py-3.5 font-bold text-[#16C2F3]">{row.print}</td>
                    <td className="px-5 py-3.5 text-gray-400 hidden sm:table-cell">{row.note}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td colSpan={4} className="px-5 py-3.5 text-xs text-gray-400">
                    Custom size? Use the formula: (width × height in inches) ÷ 144 = sqft × $14. Minimum $75.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Installation pricing */}
        <section className="mb-16 bg-[#f9fafb] rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-[#1c1712] mb-2">Installation — Quoted Separately</h2>
          <p className="text-gray-600 text-sm mb-6 max-w-2xl">
            Vehicle decal installation is not included in print pricing. It&apos;s a skilled labour job — die-cut
            vinyl needs weeding, transfer tape, precise wet or dry application, and squeegee work. We rent a
            dedicated installation bay and quote each job based on piece count and complexity.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <p className="font-bold text-[#1c1712] text-lg mb-1">From $75</p>
              <p className="text-sm text-gray-500 font-medium mb-1">Simple Install</p>
              <p className="text-xs text-gray-400">1–2 small pieces, clean flat surface, customer brings vehicle to our bay</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[#16C2F3]">
              <p className="font-bold text-[#1c1712] text-lg mb-1">From $150</p>
              <p className="text-sm text-[#16C2F3] font-medium mb-1">Standard Fleet Job</p>
              <p className="text-xs text-gray-400">3–5 pieces (e.g. 2 doors + rear window), 1 vehicle, ~2 hrs</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <p className="font-bold text-[#1c1712] text-lg mb-1">Custom Quote</p>
              <p className="text-sm text-gray-500 font-medium mb-1">Multi-Vehicle / Large</p>
              <p className="text-xs text-gray-400">Fleet branding, full side panels, 2+ vehicles — contact us</p>
            </div>
          </div>
          <Link
            href="/quote-request"
            className="inline-flex items-center gap-2 bg-[#1c1712] text-white font-bold px-7 py-3.5 rounded-lg hover:bg-[#2d2418] transition-colors"
          >
            Request Install Quote →
          </Link>
        </section>

        {/* Why True Color */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-[#1c1712] mb-6">Why True Color for Vehicle Decals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "Die-cut to exact shape — no white rectangle border, clean professional look",
              "Roland TrueVIS UV print — vivid colours, UV-resistant, built for Saskatchewan outdoors",
              "Oracal cast vinyl — 5–7 year outdoor durability, clean removal when needed",
              "Transfer tape included — ready to apply straight out of the bag",
              "In-house installation bay — we apply it right, no bubbles, no lifting edges",
              "Works on cars, trucks, vans, trailers, and heavy equipment",
              "Same-day rush available (+$40) for print orders placed before 10 AM",
              "Fleet pricing available — 3+ vehicles, ask for a package rate",
            ].map((pt) => (
              <div key={pt} className="flex items-start gap-3">
                <Check className="text-[#16C2F3] mt-0.5 shrink-0" size={16} />
                <p className="text-sm text-gray-700">{pt}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Gallery strip */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-[#1c1712] mb-6">Recent Work — RiverBend Auto Glass</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { src: "/images/gallery/gallery-vehicle-decal-riverbend-door.webp", alt: "Door panel decal — RiverBend Auto Glass" },
              { src: "/images/gallery/gallery-vehicle-decal-riverbend-side.webp", alt: "Full door vinyl — RiverBend Auto Glass SUV" },
              { src: "/images/gallery/gallery-vehicle-decal-riverbend-rear-window.webp", alt: "Rear window decal — RiverBend Auto Glass Toyota RAV4" },
            ].map((img) => (
              <div key={img.src} className="relative aspect-[4/3] rounded-xl overflow-hidden">
                <Image src={img.src} alt={img.alt} fill className="object-cover" />
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-3">
            2 door panels + rear window decal — printed and installed by True Color for RiverBend Auto Glass, Saskatoon.
          </p>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-[#1c1712] mb-6">FAQ</h2>
          <div className="space-y-4 max-w-3xl">
            {[
              {
                q: "How much does a vehicle decal cost in Saskatoon?",
                a: "Print-only starts at $75 (minimum job charge). Above that, it's $14/sqft. A standard door panel (29×16.5\") is 3.3 sqft — $75 minimum applies. A full van side panel (72×24\") is 12 sqft — $168. Installation is quoted separately starting at $75 for a simple job.",
              },
              {
                q: "Why is installation quoted separately?",
                a: "Die-cut vinyl installation is skilled labour — weeding, transfer tape, wet or dry application, squeegee, and peel. It's done in our dedicated bay. The time and complexity varies by job size, number of pieces, and vehicle surface. We quote it accurately rather than bundling a flat fee that under- or over-charges you.",
              },
              {
                q: "What's the difference between a die-cut decal and a regular sticker?",
                a: "A die-cut decal is cut to the exact contour of your design — no background rectangle. It looks like the graphic is painted on the vehicle. A regular sticker has a square or rectangular background. Die-cut takes longer to produce (weeding removes the waste vinyl) and more skill to apply, but the result looks far more professional.",
              },
              {
                q: "How long do vehicle decals last?",
                a: "Oracal cast vinyl printed on our Roland UV press typically lasts 5–7 years on exterior vehicle surfaces. Saskatchewan UV and cold don't noticeably degrade well-applied cast vinyl. Removal is possible without paint damage if done with heat and patience.",
              },
              {
                q: "Can I apply the decal myself?",
                a: "Yes — we include transfer tape and can add wet-application fluid on request. Small decals are manageable DIY. Door panels and rear windows are trickier — bubbles and misalignment are common mistakes. If your vehicle is your brand, professional installation is worth the extra cost.",
              },
              {
                q: "Do you do full vehicle wraps?",
                a: "We print the vinyl panels for full wraps. For certified wrap installation (which requires a stretch-wrap specialist), we can refer you to a local installer. Partial wraps, door panels, rear windows, and side graphics we handle in-house.",
              },
            ].map(({ q, a }) => (
              <details key={q} className="group border border-gray-100 rounded-xl">
                <summary className="cursor-pointer px-6 py-4 font-semibold text-[#1c1712] text-sm flex items-center justify-between">
                  {q}
                  <span className="text-gray-400 group-open:rotate-45 transition-transform text-lg">+</span>
                </summary>
                <p className="px-6 pb-5 text-sm text-gray-600 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="bg-[#1c1712] rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Ready to Brand Your Vehicle?</h2>
          <p className="text-gray-300 mb-6 max-w-md mx-auto text-sm">
            Send us your artwork and vehicle details — we&apos;ll quote print and install separately so you know exactly what you&apos;re paying for.
          </p>
          <Link
            href="/quote-request"
            className="inline-block bg-[#16C2F3] text-white font-bold px-9 py-4 rounded-lg hover:bg-[#0fb0dd] transition-colors"
          >
            Request a Quote →
          </Link>
        </div>

      </main>
      <SiteFooter />
    </div>
  );
}
