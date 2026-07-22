import Image from "next/image";
import Link from "next/link";
import { Phone, ShoppingBag } from "lucide-react";
import { PaidPhoneLink } from "@/components/paid/PaidProductLink";

export default function WhyTrueColorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex min-h-18 max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            aria-label="True Color Display Printing home"
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16C2F3] focus-visible:ring-offset-2"
          >
            <Image
              src="/truecolorlogo.webp"
              alt="True Color Display Printing"
              width={154}
              height={48}
              priority
              className="h-auto w-[132px] sm:w-[154px]"
              style={{ height: "auto" }}
            />
          </Link>
          <nav aria-label="Paid order shortcuts" className="flex items-center gap-2 sm:gap-3">
            <PaidPhoneLink
              placement="paid_header"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-bold text-[#1c1712] transition hover:border-[#16C2F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16C2F3] sm:px-4"
            >
              <Phone size={17} aria-hidden="true" />
              <span className="hidden sm:inline">(306) 954-8688</span>
              <span className="sm:hidden">Call</span>
            </PaidPhoneLink>
            <Link
              href="/cart"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1c1712] px-3 text-sm font-bold text-white transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16C2F3] focus-visible:ring-offset-2 sm:px-4"
            >
              <ShoppingBag size={17} aria-hidden="true" /> Cart
            </Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-gray-200 bg-[#f5f3ef] px-4 py-7 text-sm text-gray-600 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <strong className="text-[#1c1712]">True Color Display Printing</strong><br />
            216 33rd St W (upstairs), Saskatoon, SK S7L 0V1
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <PaidPhoneLink placement="paid_footer" className="font-bold text-[#1c1712] hover:text-[#087c9d]">(306) 954-8688</PaidPhoneLink>
            <Link href="/privacy" className="hover:text-[#087c9d]">Privacy</Link>
            <Link href="/terms" className="hover:text-[#087c9d]">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
