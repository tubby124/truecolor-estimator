import Link from "next/link";
import Image from "next/image";
import { REVIEW_COUNT } from "@/lib/reviews";

export function SiteFooter() {
  return (
    <footer className="bg-[#1c1712] text-gray-400 mt-16">
      {/* Pre-footer CTA band */}
      <div className="border-b border-white/10 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white font-bold text-xl">Ready to print? See your exact price now.</p>
          <Link
            href="/quote"
            className="bg-[#16C2F3] text-white font-bold px-7 py-3.5 rounded-full hover:bg-[#0fb0dd] transition-colors whitespace-nowrap shrink-0"
          >
            Get a Price →
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Col 1: Brand */}
          <div>
            <Link href="/">
              <Image
                src="/truecolorlogo.webp"
                alt="True Color Display Printing"
                width={140}
                height={40}
                className="h-8 w-auto object-contain mb-4"
              />
            </Link>
            <p className="text-sm leading-relaxed">
              Saskatoon&apos;s print shop for signs, banners, magnets, cards, and flyers.
              Transparent pricing. In-house designer. Local pickup.
            </p>
            <p className="text-xs text-gray-600 mt-4">5.0 ★ on Google · {REVIEW_COUNT} reviews</p>
          </div>

          {/* Col 2: Contact + address */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Find Us</h3>
            <div className="space-y-2 text-sm">
              <a
                href="https://maps.google.com/?q=216+33rd+St+W+Saskatoon+SK+S7L+0V5"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-white transition-colors"
              >
                216 33rd St W (upstairs)<br />
                Saskatoon, SK S7L 0V5
              </a>
              <p className="text-gray-400">Mon–Fri 9 AM – 5 PM</p>
              <a href="tel:+13069548688" className="block hover:text-white transition-colors">
                (306) 954-8688
              </a>
              <a
                href="https://www.instagram.com/truecolorprint"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-white transition-colors"
              >
                Instagram @truecolorprint
              </a>
              <a href="mailto:info@true-color.ca" className="block hover:text-white transition-colors">
                info@true-color.ca
              </a>
            </div>
          </div>

          {/* Col 3: Links */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Quick Links</h3>
            <div className="grid grid-cols-2 gap-x-4 text-sm">
              <div className="space-y-2">
                <Link href="/quote" className="block hover:text-white transition-colors">
                  Get a Price
                </Link>
                <Link href="/graphic-design-saskatoon" className="block hover:text-white transition-colors">
                  Graphic Design
                </Link>
                <Link href="/sign-company-saskatoon" className="block hover:text-white transition-colors">
                  Sign Company
                </Link>
                <Link href="/coroplast-signs-saskatoon" className="block hover:text-white transition-colors">
                  Coroplast Signs
                </Link>
                <Link href="/same-day-printing-saskatoon" className="block hover:text-white transition-colors">
                  Same-Day Printing
                </Link>
                <Link href="/banner-printing-saskatoon" className="block hover:text-white transition-colors">
                  Vinyl Banners
                </Link>
                <Link href="/business-cards-saskatoon" className="block hover:text-white transition-colors">
                  Business Cards
                </Link>
                <Link href="/large-format-printing-saskatoon" className="block hover:text-white transition-colors">
                  Large Format
                </Link>
                <Link href="/flyer-printing-saskatoon" className="block hover:text-white transition-colors">
                  Flyer Printing
                </Link>
                <Link href="/brochure-printing-saskatoon" className="block hover:text-white transition-colors">
                  Brochure Printing
                </Link>
                <Link href="/products/rack-cards" className="block hover:text-white transition-colors">
                  Rack Cards
                </Link>
              </div>
              <div className="space-y-2">
                <Link href="/trade-show-displays-saskatoon" className="block hover:text-white transition-colors">
                  Trade Shows
                </Link>
                <Link href="/retractable-banners-saskatoon" className="block hover:text-white transition-colors">
                  Retractable Banners
                </Link>
                <Link href="/vehicle-magnets-saskatoon" className="block hover:text-white transition-colors">
                  Vehicle Magnets
                </Link>
                <Link href="/event-signs-saskatoon" className="block hover:text-white transition-colors">
                  Event Signs
                </Link>
                <Link href="/construction-signs-saskatoon" className="block hover:text-white transition-colors">
                  Construction Signs
                </Link>
                <Link href="/healthcare-signs-saskatoon" className="block hover:text-white transition-colors">
                  Healthcare Signs
                </Link>
                <Link href="/dental-office-signs-saskatoon" className="block hover:text-white transition-colors">
                  Dental Office Signs
                </Link>
                <Link href="/election-signs" className="block hover:text-white transition-colors">
                  Election Signs
                </Link>
                <Link href="/graduation-banners-saskatoon" className="block hover:text-white transition-colors">
                  Graduation Banners
                </Link>
                <Link href="/real-estate-signs-saskatoon" className="block hover:text-white transition-colors">
                  Real Estate Signs
                </Link>
                <Link href="/agriculture-signs-saskatoon" className="block hover:text-white transition-colors">
                  Agriculture Signs
                </Link>
                <Link href="/gallery" className="block hover:text-white transition-colors">
                  Our Work
                </Link>
                <Link href="/about" className="block hover:text-white transition-colors">
                  About Us
                </Link>
                <a
                  href="https://g.page/r/CZH6HlbNejQAEAE/review"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:text-white transition-colors"
                >
                  ★ Leave a Review
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Saskatchewan cities */}
        <div className="mt-10 pt-8 border-t border-white/5">
          <p className="text-xs text-gray-600 mb-3 uppercase tracking-wider">Also serving Saskatchewan</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/banner-printing-regina" className="hover:text-white transition-colors">Regina</Link>
            <Link href="/signs-prince-albert-sk" className="hover:text-white transition-colors">Prince Albert</Link>
            <Link href="/printing-lloydminster-sk" className="hover:text-white transition-colors">Lloydminster</Link>
            <Link href="/signs-moose-jaw-sk" className="hover:text-white transition-colors">Moose Jaw</Link>
            <Link href="/printing-swift-current-sk" className="hover:text-white transition-colors">Swift Current</Link>
            <Link href="/coroplast-signs-regina" className="hover:text-white transition-colors">Regina Signs</Link>
            <Link href="/signs-north-battleford-sk" className="hover:text-white transition-colors">North Battleford</Link>
            <Link href="/signs-yorkton-sk" className="hover:text-white transition-colors">Yorkton</Link>
            <Link href="/printing-estevan-sk" className="hover:text-white transition-colors">Estevan</Link>
            <Link href="/printing-weyburn-sk" className="hover:text-white transition-colors">Weyburn</Link>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-xs text-gray-600 flex flex-col sm:flex-row justify-between gap-2">
          <p>© 2026 True Color Display Printing Ltd. All prices in CAD · GST added at checkout.</p>
          <p>
            <Link href="/privacy" className="hover:text-gray-400 transition-colors">Privacy</Link>
            {" · "}
            <Link href="/terms" className="hover:text-gray-400 transition-colors">Terms</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
