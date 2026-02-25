import Image from "next/image";
import Link from "next/link";

export function LocalShopSection() {
  return (
    <section className="grid md:grid-cols-[55%_45%] min-h-[360px] md:min-h-[460px]">
      {/* Left — real storefront photo */}
      <div className="relative min-h-[240px] md:min-h-0 overflow-hidden">
        <Image
          src="/images/about/shop-exterior.webp"
          alt="True Color Display Printing storefront at 216 33rd St W, Saskatoon"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-[#1c1712]/15 md:bg-transparent" />
      </div>

      {/* Right — headline + CTAs */}
      <div className="bg-[#1c1712] flex items-center px-8 md:px-12 py-10 md:py-14">
        <div className="text-white max-w-sm">
          <p className="text-[#16C2F3] font-bold uppercase tracking-widest text-sm mb-4">
            Saskatoon, SK
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-5">
            We Print It Here.<br />
            <span className="text-[#16C2F3]">In Saskatoon.</span>
          </h2>
          <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-8">
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
  );
}
