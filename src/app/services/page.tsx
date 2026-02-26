import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: { absolute: "Services | True Color Display Printing Saskatoon" },
  description:
    "Print, design, and installation services from True Color Display Printing. In-house graphic design, window decal application, vehicle graphic installation. Saskatoon, SK.",
  alternates: { canonical: "/services" },
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
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#1c1712] mb-3">Services</h1>
          <p className="text-lg text-gray-500">
            Print is what we do — but we can help with more.
          </p>
        </div>

        {/* Service cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <ServiceCard
            icon="&#x1F527;"
            heading="Installation &amp; Application"
            description="Need us to put it up? We install vinyl decals, window graphics, and vehicle wraps in Saskatoon. Flat rate $75 for most installations in the city."
            details={[
              "Storefront window decals",
              "Vinyl lettering",
              "Vehicle graphic application",
            ]}
            detailsNote="$75 flat rate for most Saskatoon installations. Complex or large-format jobs quoted individually."
            cta="Get a quote →"
            ctaHref="/quote-request?product=installation"
          />

          <ServiceCard
            icon="&#x1FAA9;"
            heading="Window Decals &amp; Vinyl"
            description="From see-through window film to storefront lettering — we carry the materials to get it done right."
            details={[
              "Perforated see-through window film",
              "Clear removable vinyl decals",
              "Matte vinyl",
              "Cut vinyl lettering for storefronts",
            ]}
            detailsNote="Pricing varies by size, material, and complexity — request an exact quote below."
            cta="Ask for a quote →"
            ctaHref="/quote-request?product=window-decals"
          />

          <ServiceCard
            icon="&#x1F3A8;"
            heading="Graphic Design Services"
            description="Don&apos;t have a logo or layout? Our in-house designer handles everything from quick edits to full original logo creation."
            details={[
              "Logo tweak / minor edits — $20\u2013$35",
              "Print layout (flyer, banner, card) — $35\u2013$50",
              "Original logo design from scratch — $50\u2013$75",
            ]}
            cta="Book a design consultation →"
            ctaHref="/quote-request?product=graphic-design"
          />
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
