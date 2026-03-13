import Image from "next/image";
import Link from "next/link";

export function LocalShopSection() {
  return (
    <div className="bg-[#1c1712] w-full py-12 md:py-16">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid md:grid-cols-[3fr_2fr] gap-8 items-center">

          {/* Left: Storefront photo — contained box, no overlay */}
          <div className="relative rounded-xl overflow-hidden h-72 md:h-80">
            <Image
              src="/images/about/shop-exterior.webp"
              alt="True Color Display Printing storefront at 216 33rd St W, Saskatoon"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 60vw"
              priority
            />
          </div>

          {/* Right: Text + CTAs */}
          <div className="text-white">
            <p className="text-[#16C2F3] font-bold uppercase tracking-widest text-sm mb-4">
              Saskatoon, SK
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-5">
              We Print It Here.<br />
              <span className="text-[#16C2F3]">In Saskatoon.</span>
            </h2>
            <p className="text-gray-300 text-base leading-relaxed mb-3">
              In-house production. Faster turnaround, real accountability — no middlemen, no shipping delays.
            </p>
            <p className="text-gray-400 text-sm mb-8">
              216 33rd St W · Mon–Fri 9 AM–5 PM
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/products"
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
      </div>
    </div>
  );
}
