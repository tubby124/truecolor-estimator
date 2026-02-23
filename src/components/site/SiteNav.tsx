import Link from "next/link";
import Image from "next/image";
import { CartIcon } from "@/components/site/CartIcon";

export function SiteNav() {
  return (
    <header className="bg-[#1c1712] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/truecolorlogo.webp"
            alt="True Color Display Printing"
            width={140}
            height={40}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>

        {/* Right side: cart + phone + CTA */}
        <div className="flex items-center gap-3 sm:gap-5">
          <a
            href="tel:+13069548688"
            className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block"
          >
            (306) 954-8688
          </a>
          <CartIcon />
          <Link
            href="/quote"
            className="bg-[#16C2F3] text-white text-sm font-bold px-5 py-2.5 rounded-md hover:bg-[#0fb0dd] transition-colors whitespace-nowrap"
          >
            Get a Price →
          </Link>
        </div>
      </div>
    </header>
  );
}
