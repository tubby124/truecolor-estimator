"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { CartIcon } from "@/components/site/CartIcon";
import { AccountIcon } from "@/components/site/AccountIcon";
import { StaffQuoteButton } from "@/components/site/StaffQuoteButton";

const PRODUCT_LINKS = [
  { label: "Coroplast Signs", href: "/products/coroplast-signs" },
  { label: "Vinyl Banners", href: "/products/vinyl-banners" },
  { label: "Vehicle Magnets", href: "/products/vehicle-magnets" },
  { label: "Business Cards", href: "/products/business-cards" },
  { label: "Flyers & Brochures", href: "/products/flyers" },
  { label: "Aluminum Composite Signs", href: "/products/acp-signs" },
  { label: "Foamboard Displays", href: "/products/foamboard-displays" },
  { label: "Retractable Banners", href: "/products/retractable-banners" },
];

const INDUSTRY_LINKS = [
  { label: "Construction", href: "/construction-signs-saskatoon" },
  { label: "Real Estate", href: "/real-estate-signs-saskatoon" },
  { label: "Agriculture", href: "/agriculture-signs-saskatoon" },
  { label: "Healthcare", href: "/healthcare-printing-saskatoon" },
  { label: "Retail", href: "/retail-signs-saskatoon" },
  { label: "Sports & Events", href: "/sports-banners-saskatoon" },
];

export function SiteNav() {
  const [openMenu, setOpenMenu] = useState<"products" | "industries" | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  function toggleMenu(menu: "products" | "industries") {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  }

  return (
    <>
      <header className="bg-[#1c1712] sticky top-0 z-50">
        <div ref={navRef} className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

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

          {/* Desktop nav: dropdowns */}
          <nav className="hidden sm:flex items-center gap-1">
            {/* Products dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleMenu("products")}
                className="flex items-center gap-1 text-sm text-gray-300 hover:text-white px-3 py-2 rounded-md transition-colors"
              >
                Products
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${openMenu === "products" ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openMenu === "products" && (
                <div className="absolute top-full left-0 mt-1 bg-[#1c1712] border border-white/10 rounded-lg shadow-xl w-56 z-50">
                  {PRODUCT_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpenMenu(null)}
                      className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Industries dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleMenu("industries")}
                className="flex items-center gap-1 text-sm text-gray-300 hover:text-white px-3 py-2 rounded-md transition-colors"
              >
                Industries
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${openMenu === "industries" ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openMenu === "industries" && (
                <div className="absolute top-full left-0 mt-1 bg-[#1c1712] border border-white/10 rounded-lg shadow-xl w-56 z-50">
                  {INDUSTRY_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpenMenu(null)}
                      className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Services — plain link */}
            <Link
              href="/services"
              className="text-sm text-gray-300 hover:text-white px-3 py-2 rounded-md transition-colors"
            >
              Services
            </Link>
          </nav>

          {/* Right side: phone + My Orders + Cart + CTA + hamburger */}
          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="tel:+13069548688"
              className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block"
            >
              (306) 954-8688
            </a>
            <span className="hidden sm:block">
              <AccountIcon />
            </span>
            <CartIcon />
            <span className="hidden sm:block">
              <StaffQuoteButton />
            </span>
            <Link
              href="/quote"
              className="bg-[#16C2F3] text-white text-sm font-bold px-5 py-2.5 rounded-md hover:bg-[#0fb0dd] transition-colors whitespace-nowrap hidden sm:block"
            >
              Get a Price →
            </Link>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="sm:hidden p-1 text-white"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-[#1c1712] overflow-y-auto">
          {/* Close button */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <Link href="/" onClick={() => setDrawerOpen(false)}>
              <Image
                src="/truecolorlogo.webp"
                alt="True Color Display Printing"
                width={120}
                height={34}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <button
              onClick={() => setDrawerOpen(false)}
              className="text-white p-1"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-6 space-y-8">
            {/* Products section */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Products</p>
              <ul className="space-y-1">
                {PRODUCT_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setDrawerOpen(false)}
                      className="block py-2.5 text-base text-gray-200 hover:text-white transition-colors border-b border-white/5"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Industries section */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Industries</p>
              <ul className="space-y-1">
                {INDUSTRY_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setDrawerOpen(false)}
                      className="block py-2.5 text-base text-gray-200 hover:text-white transition-colors border-b border-white/5"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Services</p>
              <Link
                href="/services"
                onClick={() => setDrawerOpen(false)}
                className="block py-2.5 text-base text-gray-200 hover:text-white transition-colors border-b border-white/5"
              >
                Design, Installation & More
              </Link>
            </div>

            {/* Phone */}
            <a
              href="tel:+13069548688"
              className="block text-base text-gray-300 hover:text-white transition-colors"
            >
              (306) 954-8688
            </a>

            {/* My Account */}
            <Link
              href="/account"
              onClick={() => setDrawerOpen(false)}
              className="block text-base text-gray-300 hover:text-white transition-colors"
            >
              My Account / Orders
            </Link>

            {/* Staff CTA — only visible for info@true-color.ca */}
            <div onClick={() => setDrawerOpen(false)}>
              <StaffQuoteButton />
            </div>

            {/* Customer CTA */}
            <Link
              href="/quote"
              onClick={() => setDrawerOpen(false)}
              className="block w-full text-center bg-[#16C2F3] text-white text-base font-bold px-5 py-3.5 rounded-md hover:bg-[#0fb0dd] transition-colors"
            >
              Get a Price →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
