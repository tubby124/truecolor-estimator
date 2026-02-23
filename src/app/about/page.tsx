import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "About Us | True Color Display Printing Saskatoon",
  description:
    "Meet the team behind True Color Display Printing. In-house Roland TrueVIS and Konica Minolta equipment. Local Saskatoon print shop at 216 33rd St W.",
  alternates: { canonical: "/about" },
};

const EQUIPMENT = [
  {
    img: "/images/about/printer-roland-truvis.webp",
    name: "Roland TrueVIS VG2",
    desc: "Wide-format inkjet: coroplast signs, vinyl banners, vehicle magnets, window decals — up to 54\" wide.",
  },
  {
    img: "/images/about/printer-konica-minolta.webp",
    name: "Konica Minolta Press",
    desc: "Digital production press: flyers, business cards, booklets, posters — sharp colour at high volume.",
  },
  {
    img: "/images/about/lamination-machine.webp",
    name: "Roll Laminator",
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
      <SiteNav />

      {/* ── HERO — two-column split ── */}
      <section className="grid md:grid-cols-[55%_45%] min-h-[400px] md:min-h-[520px]">
        {/* Left — shop photo */}
        <div className="relative min-h-[280px] md:min-h-0 overflow-hidden">
          <Image
            src="/images/about/shop-exterior.webp"
            alt="True Color Display Printing storefront at 216 33rd St W, Saskatoon"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Subtle shadow on right edge only on desktop */}
          <div className="absolute inset-0 bg-[#1c1712]/20 md:bg-transparent" />
        </div>

        {/* Right — headline + CTAs */}
        <div className="bg-[#1c1712] flex items-center px-8 md:px-12 py-12 md:py-16">
          <div className="text-white max-w-sm">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-5">
              We Print It Here.<br />
              <span className="text-[#16C2F3]">In Saskatoon.</span>
            </h1>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              In-house production means faster turnaround, real accountability,
              and results you can hold in your hands — no middlemen, no shipping delays.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/quote"
                className="bg-[#16C2F3] text-white font-bold px-6 py-3 rounded-md hover:bg-[#0fb0dd] transition-colors"
              >
                Get a Price →
              </Link>
              <a
                href="tel:+13069548688"
                className="border border-white/40 text-gray-300 font-semibold px-6 py-3 rounded-md hover:border-white hover:text-white transition-colors"
              >
                (306) 954-8688
              </a>
            </div>
          </div>
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
                  alt={item.name}
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
