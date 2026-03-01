"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { CartIcon } from "@/components/site/CartIcon";
import { AccountIcon } from "@/components/site/AccountIcon";
import { StaffQuoteButton } from "@/components/site/StaffQuoteButton";
import { QuoteModal } from "@/components/QuoteModal";
import { User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const PRODUCT_CATEGORIES = [
  {
    label: "Signs & Displays",
    links: [
      { label: "Coroplast Signs", href: "/products/coroplast-signs" },
      { label: "ACP Aluminum Signs", href: "/products/acp-signs" },
      { label: "Vinyl Banners", href: "/products/vinyl-banners" },
      { label: "Foamboard Displays", href: "/products/foamboard-displays" },
      { label: "Retractable Banners", href: "/products/retractable-banners" },
    ],
  },
  {
    label: "Window & Vehicle",
    links: [
      { label: "Window Decals", href: "/products/window-decals" },
      { label: "Perforated Window Vinyl", href: "/products/window-perf" },
      { label: "Vehicle Magnets", href: "/products/vehicle-magnets" },
      { label: "Vinyl Lettering", href: "/products/vinyl-lettering" },
      { label: "Magnet Calendars", href: "/products/magnet-calendars" },
    ],
  },
  {
    label: "Print & Promo",
    links: [
      { label: "Business Cards", href: "/products/business-cards" },
      { label: "Flyers", href: "/products/flyers" },
      { label: "Brochures", href: "/products/brochures" },
      { label: "Postcards", href: "/products/postcards" },
      { label: "Stickers", href: "/products/stickers" },
      { label: "Photo Posters", href: "/products/photo-posters" },
    ],
  },
];

const INDUSTRY_LINKS = [
  { label: "Construction", href: "/construction-signs-saskatoon" },
  { label: "Real Estate", href: "/real-estate-signs-saskatoon" },
  { label: "Agriculture", href: "/agriculture-signs-saskatoon" },
  { label: "Healthcare", href: "/healthcare-printing-saskatoon" },
  { label: "Retail", href: "/retail-signs-saskatoon" },
  { label: "Sports & Events", href: "/sports-banners-saskatoon" },
  { label: "Ramadan & Eid", href: "/ramadan-eid-banners-saskatoon" },
  { label: "St. Patrick's Day", href: "/st-patricks-day-printing-saskatoon" },
  { label: "Graduation Banners", href: "/graduation-banners-saskatoon" },
];

export function SiteNav() {
  const [openMenu, setOpenMenu] = useState<"products" | "industries" | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [mobileAuth, setMobileAuth] = useState<{ email: string; isStaff: boolean } | null>(null);
  const [mobileAuthLoaded, setMobileAuthLoaded] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const productsTriggerRef = useRef<HTMLButtonElement>(null);
  const industriesTriggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

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

  // Focus trap + Escape close for mobile drawer
  useEffect(() => {
    if (!drawerOpen) return;
    const drawer = drawerRef.current;
    if (!drawer) return;

    // Focus the close button on open
    const closeBtn = drawer.querySelector<HTMLElement>('[aria-label="Close menu"]');
    closeBtn?.focus();

    function trapFocus(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = drawer!.querySelectorAll<HTMLElement>(
        'a, button, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", trapFocus);
    return () => document.removeEventListener("keydown", trapFocus);
  }, [drawerOpen]);

  // Keyboard handler for dropdown triggers (ArrowDown opens + focuses first item, Escape closes)
  const handleTriggerKeyDown = useCallback((e: React.KeyboardEvent, menu: "products" | "industries") => {
    if (e.key === "Escape") {
      setOpenMenu(null);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpenMenu(menu);
      // Focus first menu item after render
      setTimeout(() => {
        const first = document.querySelector<HTMLElement>(`[data-menu="${menu}"] a, [data-menu="${menu}"] [role="menuitem"]`);
        first?.focus();
      }, 0);
    }
  }, []);

  // Keyboard handler for open dropdown (ArrowUp/Down to navigate, Escape to close + refocus trigger)
  const handleDropdownKeyDown = useCallback((e: React.KeyboardEvent, menu: "products" | "industries") => {
    const container = e.currentTarget as HTMLElement;
    const items = Array.from(container.querySelectorAll<HTMLElement>("a"));
    const idx = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      e.preventDefault();
      setOpenMenu(null);
      (menu === "products" ? productsTriggerRef : industriesTriggerRef).current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      items[Math.min(idx + 1, items.length - 1)]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[Math.max(idx - 1, 0)]?.focus();
    }
  }, []);

  // Auth state for mobile drawer
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email ?? null;
      setMobileAuth(email ? { email, isStaff: email.toLowerCase() === "info@true-color.ca" } : null);
      setMobileAuthLoaded(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email ?? null;
      setMobileAuth(email ? { email, isStaff: email.toLowerCase() === "info@true-color.ca" } : null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleMobileSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMobileAuth(null);
    setDrawerOpen(false);
  }

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
                ref={productsTriggerRef}
                onClick={() => toggleMenu("products")}
                onKeyDown={(e) => handleTriggerKeyDown(e, "products")}
                aria-haspopup="true"
                aria-expanded={openMenu === "products"}
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
                <div
                  role="menu"
                  data-menu="products"
                  onKeyDown={(e) => handleDropdownKeyDown(e, "products")}
                  className="absolute top-full left-0 mt-1 bg-[#1c1712] border border-white/10 rounded-lg shadow-xl z-50 w-[540px]"
                >
                  <div className="grid grid-cols-3 gap-0 p-3">
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <div key={cat.label}>
                        <p className="px-2 pt-1 pb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                          {cat.label}
                        </p>
                        {cat.links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setOpenMenu(null)}
                            className="block px-2 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Industries dropdown */}
            <div className="relative">
              <button
                ref={industriesTriggerRef}
                onClick={() => toggleMenu("industries")}
                onKeyDown={(e) => handleTriggerKeyDown(e, "industries")}
                aria-haspopup="true"
                aria-expanded={openMenu === "industries"}
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
                <div
                  role="menu"
                  data-menu="industries"
                  onKeyDown={(e) => handleDropdownKeyDown(e, "industries")}
                  className="absolute top-full left-0 mt-1 bg-[#1c1712] border border-white/10 rounded-lg shadow-xl w-56 z-50"
                >
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

            {/* About — plain link */}
            <Link
              href="/about"
              className="text-sm text-gray-300 hover:text-white px-3 py-2 rounded-md transition-colors"
            >
              About
            </Link>

            {/* Our Work — plain link */}
            <Link
              href="/gallery"
              className="text-sm text-gray-300 hover:text-white px-3 py-2 rounded-md transition-colors"
            >
              Our Work
            </Link>
          </nav>

          {/* Right side: phone + icons + CTAs + hamburger */}
          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="tel:+13069548688"
              className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block"
            >
              (306) 954-8688
            </a>
            <AccountIcon />
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
              aria-expanded={drawerOpen}
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
        <div ref={drawerRef} className="fixed inset-0 z-50 bg-[#1c1712] overflow-y-auto">
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

          {/* ── Mobile Auth Block ── */}
          <div className="px-6 py-4 border-b border-white/10">
            {!mobileAuthLoaded ? null : !mobileAuth ? (
              /* Logged out — prominent Sign In CTA */
              <div>
                <Link
                  href="/account"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between w-full bg-[#16C2F3] text-white text-sm font-bold px-4 py-3.5 rounded-md hover:bg-[#0fb0dd] transition-colors min-h-[44px]"
                >
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" strokeWidth={2} />
                    Sign In / Create Account
                  </span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <p className="text-xs text-gray-500 mt-2 px-1">Track your orders &amp; save your info for next time</p>
              </div>
            ) : mobileAuth.isStaff ? (
              /* Staff logged in */
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 bg-amber-400 rounded-full" />
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Staff View</span>
                  <span className="text-xs text-gray-500 truncate">· {mobileAuth.email}</span>
                </div>
                {/* Primary CTA: Make a Quote (estimator) */}
                <Link
                  href="/staff"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between w-full bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold px-4 py-3.5 rounded-md transition-colors min-h-[44px] mb-2"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Make a Quote
                  </span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                {/* Secondary: Staff Portal (orders) + Sign Out */}
                <div className="flex gap-2">
                  <Link
                    href="/staff/orders"
                    onClick={() => setDrawerOpen(false)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/15 text-white text-sm font-medium px-4 py-3 rounded-md transition-colors min-h-[44px]"
                  >
                    Orders
                  </Link>
                  <button
                    onClick={handleMobileSignOut}
                    className="flex items-center justify-center px-4 py-3 border border-gray-600 text-gray-400 hover:text-white hover:border-white text-sm rounded-md transition-colors min-h-[44px]"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              /* Customer logged in */
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-xs text-gray-400">Signed in</span>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/account"
                    onClick={() => setDrawerOpen(false)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/15 text-white text-sm font-medium px-4 py-3 rounded-md transition-colors min-h-[44px]"
                  >
                    My Orders →
                  </Link>
                  <button
                    onClick={handleMobileSignOut}
                    className="flex items-center justify-center px-4 py-3 border border-gray-600 text-gray-400 hover:text-white hover:border-white text-sm rounded-md transition-colors min-h-[44px]"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          <nav aria-label="Mobile navigation" className="px-6 py-6 space-y-8">
            {/* Products section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Products</h3>
              {PRODUCT_CATEGORIES.map((cat) => (
                <div key={cat.label} className="mb-4">
                  <h3 className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1 pl-0.5">
                    {cat.label}
                  </h3>
                  <ul>
                    {cat.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          onClick={() => setDrawerOpen(false)}
                          className="block py-2 pl-2 text-sm text-gray-300 hover:text-white transition-colors border-b border-white/5"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Industries section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Industries</h3>
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
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Services</h3>
              <Link
                href="/services"
                onClick={() => setDrawerOpen(false)}
                className="block py-2.5 text-base text-gray-200 hover:text-white transition-colors border-b border-white/5"
              >
                Design, Installation & More
              </Link>
              <Link
                href="/about"
                onClick={() => setDrawerOpen(false)}
                className="block py-2.5 text-base text-gray-200 hover:text-white transition-colors border-b border-white/5"
              >
                About Our Shop
              </Link>
              <Link
                href="/gallery"
                onClick={() => setDrawerOpen(false)}
                className="block py-2.5 text-base text-gray-200 hover:text-white transition-colors border-b border-white/5"
              >
                Our Work
              </Link>
            </div>

            {/* Phone */}
            <a
              href="tel:+13069548688"
              className="block text-base text-gray-300 hover:text-white transition-colors"
            >
              (306) 954-8688
            </a>

            {/* Customer CTA */}
            <Link
              href="/quote"
              onClick={() => setDrawerOpen(false)}
              className="block w-full text-center bg-[#16C2F3] text-white text-base font-bold px-5 py-3.5 rounded-md hover:bg-[#0fb0dd] transition-colors"
            >
              Get a Price →
            </Link>

            {/* Request a Quote — secondary */}
            <button
              onClick={() => { setDrawerOpen(false); setQuoteOpen(true); }}
              className="block w-full text-center border border-gray-600 text-gray-300 text-base font-medium px-5 py-3.5 rounded-md hover:border-white hover:text-white transition-colors"
            >
              Request a Custom Quote
            </button>
          </nav>
        </div>
      )}

      {/* Quote Request Modal */}
      <QuoteModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </>
  );
}
