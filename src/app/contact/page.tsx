import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ContactForm } from "@/components/contact/ContactForm";
import { REVIEW_COUNT } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Contact True Color — Print Shop Saskatoon SK",
  description:
    "Visit True Color Display Printing, Saskatoon SK — 216 33rd St W. Mon–Fri 9 AM–5 PM. Signs, banners, cards from $30. Same-day rush +$40. In-house Roland UV.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact True Color — Print Shop Saskatoon SK",
    description:
      "Drop by our Saskatoon shop at 216 33rd St W or send a message. In-house Roland UV printer. Same-day rush +$40. Signs, banners, business cards from $30.",
    url: "https://truecolorprinting.ca/contact",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://truecolorprinting.ca/#localbusiness",
  name: "True Color Display Printing",
  url: "https://truecolorprinting.ca",
  telephone: "+13069548688",
  email: "info@true-color.ca",
  image: "https://truecolorprinting.ca/images/about/shop-exterior.webp",
  priceRange: "$$",
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
    latitude: 52.13254,
    longitude: -106.67047,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "17:00",
    },
  ],
  sameAs: [
    "https://maps.google.com/?cid=3278649905558780051",
    "https://www.instagram.com/truecolorprint",
    "https://www.facebook.com/truecolordisplay",
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://truecolorprinting.ca" },
    { "@type": "ListItem", position: 2, name: "Contact", item: "https://truecolorprinting.ca/contact" },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Where is True Color Display Printing located?",
      acceptedAnswer: { "@type": "Answer", text: "216 33rd St W, Saskatoon, SK S7L 0V5. Walk in Monday through Friday, 9 AM to 5 PM." },
    },
    {
      "@type": "Question",
      name: "Do you offer same-day printing in Saskatoon?",
      acceptedAnswer: { "@type": "Answer", text: "Yes. Orders placed before 10 AM qualify for same-day turnaround at a flat +$40 rush fee. Call (306) 954-8688 to confirm availability." },
    },
    {
      "@type": "Question",
      name: "Can I drop off artwork in person?",
      acceptedAnswer: { "@type": "Answer", text: "Yes. Bring a USB, a printout, or nothing at all. In-house designer can build artwork from a sketch for $35 flat with a same-day proof." },
    },
    {
      "@type": "Question",
      name: "Is there a shipping option?",
      acceptedAnswer: { "@type": "Answer", text: "All orders are local pickup only at 216 33rd St W, Saskatoon. No shipping means no courier delays or damaged prints in transit." },
    },
    {
      "@type": "Question",
      name: "How do I get a price?",
      acceptedAnswer: { "@type": "Answer", text: "Use the instant price calculator at truecolorprinting.ca/quote — no forms, no phone calls. See your exact price for any product in 30 seconds." },
    },
  ],
};

const MAPS_URL = "https://maps.google.com/?q=216+33rd+St+W+Saskatoon+SK+S7L+0V5";

const FAQS = [
  {
    q: "Where is True Color Display Printing located?",
    a: "We're at 216 33rd St W, Saskatoon, SK S7L 0V5. It's a full in-house print shop — walk in Monday through Friday, 9 AM to 5 PM.",
  },
  {
    q: "Do you offer same-day printing in Saskatoon?",
    a: "Yes. Orders placed before 10 AM qualify for same-day turnaround at a flat +$40 rush fee. Call us at (306) 954-8688 to confirm production capacity before ordering.",
  },
  {
    q: "Can I drop off artwork in person?",
    a: "Absolutely. Bring a USB, a printout, or walk in with nothing at all. Our in-house designer can build artwork from a sketch for $35 flat with a same-day proof.",
  },
  {
    q: "Is there a shipping option?",
    a: "All orders are local pickup only at 216 33rd St W, Saskatoon. No shipping means no courier delays, no damaged prints in transit, and faster turnaround.",
  },
  {
    q: "How do I get a price?",
    a: "Use the instant price calculator at truecolorprinting.ca/quote — no forms, no phone calls. See your exact price for any product, size, and quantity in 30 seconds.",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <SiteNav />

      {/* ── HERO: Store Photo + Address (dark section) ── */}
      <section className="bg-[#1c1712] w-full px-6 pt-14 pb-10 md:pt-20 md:pb-14">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[3fr_2fr] gap-10 items-center">

            {/* Store photo */}
            <div className="relative rounded-2xl overflow-hidden h-72 md:h-96 shadow-2xl">
              <Image
                src="/images/about/shop-exterior.webp"
                alt="True Color Display Printing storefront at 216 33rd St W, Saskatoon SK — in-house Roland UV print shop"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 60vw"
                priority
              />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#1c1712]/60 to-transparent" aria-hidden="true" />
            </div>

            {/* Address + CTAs */}
            <div className="text-white">
              <p className="text-[#16C2F3] font-bold uppercase tracking-widest text-sm mb-4">
                Saskatoon, SK
              </p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-5">
                We&rsquo;re Here.<br />
                <span className="text-[#16C2F3]">Come See Us.</span>
              </h1>
              <address className="not-italic text-gray-300 text-base leading-relaxed mb-2">
                216 33rd St W<br />
                Saskatoon, SK S7L 0V5
              </address>
              <p className="text-gray-400 text-sm mb-8">
                Mon–Fri &nbsp;9 AM – 5 PM &nbsp;&middot;&nbsp; Local pickup only
              </p>

              <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Get directions to True Color Display Printing on Google Maps"
                  className="inline-flex items-center justify-center gap-2 bg-[#16C2F3] text-white font-bold px-6 py-3 rounded-md hover:bg-[#0fb0dd] transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  Get Directions
                </a>
                <a
                  href="tel:+13069548688"
                  className="inline-flex items-center justify-center gap-2 border border-white/30 text-gray-300 font-semibold px-6 py-3 rounded-md hover:border-white hover:text-white transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  (306) 954-8688
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INFO CARDS ── */}
      <section className="px-6 py-12 max-w-6xl mx-auto" aria-label="Contact information">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-[#16C2F3] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[#16C2F3] font-bold text-xs uppercase tracking-widest">Hours</span>
            </div>
            <p className="text-[#1c1712] font-semibold text-sm mb-1">Monday – Friday</p>
            <p className="text-gray-600 text-sm">9 AM – 5 PM</p>
            <p className="text-gray-400 text-xs mt-2">Closed weekends &amp; stat holidays</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-[#16C2F3] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <span className="text-[#16C2F3] font-bold text-xs uppercase tracking-widest">Call or Email</span>
            </div>
            <a href="tel:+13069548688" className="block text-[#1c1712] font-semibold text-sm hover:text-[#16C2F3] transition-colors mb-1">
              (306) 954-8688
            </a>
            <a href="mailto:info@true-color.ca" className="block text-gray-600 text-sm hover:text-[#16C2F3] transition-colors">
              info@true-color.ca
            </a>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-[#16C2F3] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span className="text-[#16C2F3] font-bold text-xs uppercase tracking-widest">Location</span>
            </div>
            <address className="not-italic">
              <p className="text-[#1c1712] font-semibold text-sm mb-1">216 33rd St W</p>
              <p className="text-gray-600 text-sm">Saskatoon, SK S7L 0V5</p>
            </address>
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-[#16C2F3] text-xs font-semibold hover:underline cursor-pointer"
            >
              Open in Google Maps →
            </a>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="bg-[#f4efe9] px-6 py-6" aria-label="Trust signals">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-x-8 gap-y-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-[#1c1712] font-bold text-sm">5.0</span>
            <span className="text-gray-600 text-sm">on Google · {REVIEW_COUNT} reviews</span>
          </div>
          <div className="h-4 w-px bg-gray-300 hidden sm:block" aria-hidden="true" />
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#16C2F3] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
            </svg>
            <span className="text-gray-600 text-sm">Serving Saskatoon since 2019</span>
          </div>
          <div className="h-4 w-px bg-gray-300 hidden sm:block" aria-hidden="true" />
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#16C2F3] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-600 text-sm">In-house Roland UV — no outsourcing</span>
          </div>
          <div className="h-4 w-px bg-gray-300 hidden sm:block" aria-hidden="true" />
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#16C2F3] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span className="text-gray-600 text-sm">Local pickup · 216 33rd St W</span>
          </div>
        </div>
      </section>

      {/* ── STORE PHOTO + FORM ── */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-start">

          {/* Left: Store photo + address details */}
          <div>
            <div className="relative rounded-2xl overflow-hidden h-64 shadow-lg mb-6">
              <Image
                src="/images/about/shop-exterior.webp"
                alt="True Color Display Printing at 216 33rd St W, Saskatoon — walk in Monday to Friday"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#16C2F3]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-[#16C2F3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[#1c1712] font-semibold text-sm">216 33rd St W (upstairs)</p>
                  <p className="text-gray-500 text-sm">Saskatoon, SK S7L 0V5</p>
                  <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="text-[#16C2F3] text-xs font-semibold hover:underline mt-1 inline-block cursor-pointer">
                    Get directions →
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#16C2F3]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-[#16C2F3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[#1c1712] font-semibold text-sm">Monday – Friday, 9 AM – 5 PM</p>
                  <p className="text-gray-500 text-sm">Closed weekends &amp; stat holidays</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#16C2F3]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-[#16C2F3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                </div>
                <div>
                  <a href="tel:+13069548688" className="text-[#1c1712] font-semibold text-sm hover:text-[#16C2F3] transition-colors">(306) 954-8688</a>
                  <p className="text-gray-500 text-sm">
                    <a href="mailto:info@true-color.ca" className="hover:text-[#16C2F3] transition-colors">info@true-color.ca</a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Contact / Quote Form */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-7">
            <h2 className="text-[#1c1712] font-bold text-xl mb-1">Send a Message</h2>
            <p className="text-gray-500 text-sm mb-6">
              Tell us what you need — signs, banners, cards, or anything else.
              We reply within 1 business day.
            </p>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* ── WHAT HAPPENS WHEN YOU VISIT ── */}
      <section className="bg-[#f4efe9] px-6 py-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-[#1c1712] font-bold text-2xl mb-4">What to Expect In Store</h2>
            <p className="text-gray-600 text-base leading-relaxed mb-4">
              True Color is a walk-in print shop at 216 33rd St W in Saskatoon, SK.
              We run an in-house Roland TrueVIS UV printer and Konica Minolta production press —
              both on-site, operated daily by our own team. No outsourcing. No middlemen.
              Every order we print, we print here.
            </p>
            <p className="text-gray-600 text-base leading-relaxed mb-4">
              Bring a print-ready PDF, a rough sketch, or nothing at all. Our in-house designer
              can produce a same-day proof for $35 flat. Most standard orders are ready within
              1–3 business days. Need it faster? Same-day rush is +$40 flat — order before 10 AM
              and call to confirm capacity.
            </p>
            <p className="text-gray-600 text-base leading-relaxed">
              We print <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] hover:underline font-medium">coroplast signs from $30</Link>,{" "}
              <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] hover:underline font-medium">vinyl banners from $66</Link>,{" "}
              <Link href="/business-cards-saskatoon" className="text-[#16C2F3] hover:underline font-medium">business cards from $45</Link>,{" "}
              ACP aluminum signs, vehicle magnets, window decals, flyers, and more.
              All products are available for local pickup only — no shipping means no delays.
            </p>
          </div>
          <div>
            <h2 className="text-[#1c1712] font-bold text-2xl mb-4">Same-Day Rush Available</h2>
            <div className="bg-white border border-[#16C2F3]/20 rounded-xl p-6 mb-4 shadow-sm">
              <p className="text-[#16C2F3] font-bold text-xs uppercase tracking-widest mb-3">Saskatoon Same-Day Printing</p>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Order before 10 AM, pick up by 5 PM. The rush fee is +$40 flat on any product —
                no per-item surcharge, no hidden fees. Call us at (306) 954-8688 to confirm
                availability before placing your order.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="tel:+13069548688"
                  className="inline-flex items-center gap-1.5 bg-[#16C2F3] text-white text-sm font-bold px-5 py-2.5 rounded-md hover:bg-[#0fb0dd] transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  Call to Confirm
                </a>
                <Link
                  href="/same-day-printing-saskatoon"
                  className="border border-gray-200 text-gray-600 text-sm font-semibold px-5 py-2.5 rounded-md hover:border-[#16C2F3] hover:text-[#16C2F3] transition-colors"
                >
                  Rush Details →
                </Link>
              </div>
            </div>
            <p className="text-gray-500 text-sm">
              Not in a rush?{" "}
              <Link href="/products" className="text-[#16C2F3] hover:underline font-medium">
                Get an instant price online
              </Link>{" "}
              — no forms, no phone calls, results in 30 seconds.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQs ── */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-[#1c1712] font-bold text-2xl mb-8">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-6">
              <h3 className="text-[#1c1712] font-semibold text-base mb-2">{faq.q}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICE CTA BAR ── */}
      <section className="bg-[#16C2F3] px-6 py-12">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-white">
          <p className="text-xl font-bold text-center sm:text-left">
            Know what you need? Get your exact price in 30 seconds.
          </p>
          <Link
            href="/products"
            className="bg-white text-[#16C2F3] font-bold px-8 py-3 rounded-md hover:bg-gray-100 transition-colors whitespace-nowrap shrink-0"
          >
            Get a Price →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
