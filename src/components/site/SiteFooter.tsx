import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="bg-[#1c1712] text-gray-400 mt-16">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Col 1: Brand */}
          <div>
            <Image
              src="/truecolorlogo.webp"
              alt="True Color Display Printing"
              width={140}
              height={40}
              className="h-8 w-auto object-contain mb-4"
            />
            <p className="text-sm leading-relaxed">
              Saskatoon&apos;s print shop for signs, banners, magnets, cards, and flyers.
              Transparent pricing. In-house designer. Local pickup.
            </p>
          </div>

          {/* Col 2: Contact + address */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Find Us</h3>
            <div className="space-y-2 text-sm">
              <a
                href="https://maps.google.com/?q=216+33rd+St+W+Saskatoon+SK+S7L+0N6"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-white transition-colors"
              >
                216 33rd St W (upstairs)<br />
                Saskatoon, SK S7L 0N6
              </a>
              <a href="tel:+13069548688" className="block hover:text-white transition-colors">
                (306) 954-8688
              </a>
              <a href="mailto:info@true-color.ca" className="block hover:text-white transition-colors">
                info@true-color.ca
              </a>
            </div>
          </div>

          {/* Col 3: Links */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <Link href="/quote" className="block hover:text-white transition-colors">
                Get a Price
              </Link>
              <Link href="/privacy" className="block hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="block hover:text-white transition-colors">
                Terms of Service
              </Link>
              <a
                href="https://g.page/r/CZH6HlbNejQAEAE/review"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-white transition-colors"
              >
                ⭐ Leave a Google Review
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-xs text-gray-600 flex flex-col sm:flex-row justify-between gap-2">
          <p>© 2026 True Color Display Printing Ltd. All prices in CAD + GST.</p>
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
