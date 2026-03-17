import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: { absolute: "Printing Services Saskatoon | Design & Install | True Color" },
  description:
    "Full-service print shop in Saskatoon. Signs from $30, banners from $66, cards from $45. In-house Roland UV, designer $35, rush +$40. 216 33rd St W.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Printing Services Saskatoon | Design & Install | True Color",
    description:
      "Full-service print shop in Saskatoon. Signs from $30, banners from $66, cards from $45. In-house Roland UV, designer $35, rush +$40. 216 33rd St W.",
    url: "https://truecolorprinting.ca/services",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

interface ServiceCardProps {
  icon: string;
  heading: string;
  description: string;
  details: string[];
  cta: string;
  ctaHref: string;
  detailsNote?: string;
}

function ServiceCard({
  icon,
  heading,
  description,
  details,
  cta,
  ctaHref,
  detailsNote,
}: ServiceCardProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h2 className="text-xl font-bold text-[#1c1712] mb-3">{heading}</h2>
      <p className="text-gray-600 mb-5 leading-relaxed">{description}</p>
      {details.length > 0 && (
        <ul className="space-y-2 mb-5">
          {details.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-[#8CC63E] font-bold mt-0.5">&#10003;</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
      {detailsNote && (
        <p className="text-sm text-gray-500 italic mb-5">{detailsNote}</p>
      )}
      <a
        href={ctaHref}
        className="inline-block bg-[#16C2F3] hover:bg-[#0fb0dd] text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors"
      >
        {cta}
      </a>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <SiteNav />

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-[#1c1712] mb-3">Printing Services in Saskatoon</h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
            True Color Display Printing is a full-service print shop at{" "}
            <a href="https://maps.google.com/?q=216+33rd+St+W+Saskatoon+SK+S7L+0V5" target="_blank" rel="noopener noreferrer" className="text-[#16C2F3] hover:underline">216 33rd St W, Saskatoon</a>.
            We print signs, banners, business cards, flyers, decals, and large-format displays on our in-house Roland UV printer.
            Coroplast signs from $30. Vinyl banners from $66. Business cards from $45 for 250. In-house designer for $35 flat with a same-day proof. Same-day rush production for +$40 flat on orders before 10 AM. Standard turnaround is 1&ndash;3 business days.
          </p>
        </div>

        {/* Service cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <ServiceCard
            icon="&#x1F527;"
            heading="Installation &amp; Application"
            description="We install vinyl decals, window graphics, and vehicle wraps in Saskatoon. Flat rate $75 for most installations in the city."
            details={[
              "Storefront window decals and vinyl lettering",
              "Vehicle door graphics and magnets",
              "Wall graphics and lobby features",
            ]}
            detailsNote="$75 flat rate for most Saskatoon installations. Complex or large-format jobs quoted individually."
            cta="Get a quote"
            ctaHref="/quote?product=installation"
          />

          <ServiceCard
            icon="&#x1FAA9;"
            heading="Window Decals &amp; Vinyl"
            description="Printed decals from $11/sqft. Perforated window film from $8/sqft. Cut vinyl lettering from $8.50/sqft."
            details={[
              "Full-colour printed window decals",
              "Perforated see-through window film",
              "Removable wall graphics",
              "Cut vinyl lettering for storefronts",
            ]}
            detailsNote="All vinyl products printed in-house on our Roland UV. See individual product pages for exact pricing."
            cta="See vinyl products"
            ctaHref="/window-decals-saskatoon"
          />

          <ServiceCard
            icon="&#x1F3A8;"
            heading="Graphic Design"
            description="No file? No problem. Our in-house designer handles artwork from rough sketches to print-ready layouts."
            details={[
              "Logo tweak / minor edits \u2014 $20\u2013$35",
              "Print layout (flyer, banner, card) \u2014 $35\u2013$50",
              "Original logo design from scratch \u2014 $50\u2013$75",
            ]}
            detailsNote="Same-day proof included. Revisions until you sign off."
            cta="Design services"
            ctaHref="/graphic-design-saskatoon"
          />
        </div>

        {/* Print Products */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-[#1c1712] mb-2">Print Products</h2>
          <p className="text-gray-500 mb-6">16 products, all priced live. Click any product to see your exact price.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              { label: "Coroplast Signs", price: "from $30", href: "/coroplast-signs-saskatoon" },
              { label: "Vinyl Banners", price: "from $66", href: "/banner-printing-saskatoon" },
              { label: "Business Cards", price: "from $45", href: "/business-cards-saskatoon" },
              { label: "Flyers", price: "from $45", href: "/flyer-printing-saskatoon" },
              { label: "ACP Aluminum Signs", price: "from $60", href: "/aluminum-signs-saskatoon" },
              { label: "Foamboard Displays", price: "from $45", href: "/foamboard-printing-saskatoon" },
              { label: "Window Decals", price: "from $45", href: "/window-decals-saskatoon" },
              { label: "Wall Graphics", price: "from $11/sqft", href: "/wall-graphics-saskatoon" },
              { label: "Vinyl Lettering", price: "from $40", href: "/vinyl-lettering-saskatoon" },
              { label: "Vehicle Magnets", price: "from $45", href: "/vehicle-magnets-saskatoon" },
              { label: "Retractable Banners", price: "from $219", href: "/retractable-banners-saskatoon" },
              { label: "Postcards", price: "from $35", href: "/postcard-printing-saskatoon" },
              { label: "Stickers", price: "from $25", href: "/sticker-printing-saskatoon" },
              { label: "Brochures", price: "from $70", href: "/brochure-printing-saskatoon" },
              { label: "Photo Posters", price: "from $15", href: "/photo-poster-printing-saskatoon" },
              { label: "Custom Magnets", price: "from $45", href: "/custom-magnets-saskatoon" },
            ].map(({ label, price, href }) => (
              <Link
                key={href}
                href={href}
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1c1712] hover:border-[#16C2F3] hover:text-[#16C2F3] transition-colors"
              >
                <span className="font-medium block">{label}</span>
                <span className="text-xs text-gray-500">{price}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Service pages */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-[#1c1712] mb-2">Services by Type</h2>
          <p className="text-gray-500 mb-6">Dedicated pages with pricing, FAQs, and product details for each service.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              { label: "Graphic Design", href: "/graphic-design-saskatoon" },
              { label: "Same-Day Printing", href: "/same-day-printing-saskatoon" },
              { label: "Large Format Printing", href: "/large-format-printing-saskatoon" },
              { label: "Sign Company", href: "/sign-company-saskatoon" },
              { label: "Trade Show Displays", href: "/trade-show-displays-saskatoon" },
              { label: "Poster Printing", href: "/poster-printing-saskatoon" },
              { label: "Event Signs", href: "/event-signs-saskatoon" },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-[#1c1712] hover:border-[#16C2F3] hover:text-[#16C2F3] transition-colors text-center"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Industry pages */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-[#1c1712] mb-2">Printing for Your Industry</h2>
          <p className="text-gray-500 mb-6">See what Saskatoon businesses in your industry are printing.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              { label: "Restaurants", href: "/restaurant-signs-saskatoon" },
              { label: "Real Estate", href: "/real-estate-signs-saskatoon" },
              { label: "Construction", href: "/construction-signs-saskatoon" },
              { label: "Healthcare", href: "/healthcare-signs-saskatoon" },
              { label: "Retail Stores", href: "/retail-signs-saskatoon" },
              { label: "Schools", href: "/school-signs-saskatoon" },
              { label: "Salons & Spas", href: "/salon-signs-saskatoon" },
              { label: "Dental Offices", href: "/dental-office-signs-saskatoon" },
              { label: "Gyms & Fitness", href: "/gym-fitness-signs-saskatoon" },
              { label: "Churches", href: "/church-banners-saskatoon" },
              { label: "Non-Profits", href: "/non-profit-signs-saskatoon" },
              { label: "Car Dealerships", href: "/car-dealership-signs-saskatoon" },
              { label: "Hotels", href: "/hotel-signs-saskatoon" },
              { label: "Law Offices", href: "/law-office-signs-saskatoon" },
              { label: "Pharmacies", href: "/pharmacy-signs-saskatoon" },
              { label: "Agriculture", href: "/agriculture-signs-saskatoon" },
              { label: "Trade Contractors", href: "/trade-contractor-signs-saskatoon" },
              { label: "Property Management", href: "/property-management-signs-saskatoon" },
              { label: "Daycares", href: "/daycare-signs-saskatoon" },
              { label: "Chiropractors", href: "/chiropractor-signs-saskatoon" },
              { label: "Breweries", href: "/brewery-saskatoon" },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-[#1c1712] hover:border-[#16C2F3] hover:text-[#16C2F3] transition-colors text-center"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Why True Color */}
        <div className="mb-16 bg-white border border-gray-100 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-[#1c1712] mb-4">Why Saskatoon Businesses Choose True Color</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            {[
              "In-house Roland UV printer \u2014 no outsourcing, no shipping delays",
              "16 products priced live online \u2014 see your exact price in 30 seconds",
              "In-house designer for $35 flat with same-day proof",
              "Same-day rush production for +$40 flat (order before 10 AM)",
              "Standard turnaround 1\u20133 business days from artwork approval",
              "Local pickup at 216 33rd St W, Saskatoon \u2014 Mon\u2013Fri 9 AM\u20135 PM",
              "Installation service available \u2014 $75 flat rate for most Saskatoon jobs",
              "4.9-star Google rating \u2014 read our reviews",
            ].map((point) => (
              <div key={point} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#8CC63E] font-bold mt-0.5 shrink-0">&#10003;</span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA strip */}
        <div className="bg-[#1c1712] rounded-2xl px-8 py-10 text-center">
          <p className="text-white text-lg font-medium mb-2">
            Not sure what you need?
          </p>
          <p className="text-gray-300 text-base">
            Call us at{" "}
            <a
              href="tel:+13069548688"
              className="text-[#16C2F3] font-semibold hover:underline"
            >
              (306) 954-8688
            </a>{" "}
            or come in &mdash; 216 33rd St W, Mon&ndash;Fri 9 AM&ndash;5 PM.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
