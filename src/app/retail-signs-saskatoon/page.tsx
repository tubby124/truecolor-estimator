import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Retail Signs Saskatoon | Banners & Decals | True Color" },
  description:
    "Vinyl banners, window decals, coroplast signs, and flyers for Saskatoon retailers. From $8/sqft. Same-day rush available. In-house designer $35 flat.",
  alternates: { canonical: "/retail-signs-saskatoon" },
  openGraph: {
    title: "Retail Signs Saskatoon | True Color Display Printing",
    description:
      "Banners, window decals, coroplast signs, and flyers for Saskatoon boutiques, pharmacies, and gift shops. Same-day rush available. Local pickup.",
    url: "https://truecolorprinting.ca/retail-signs-saskatoon",
    type: "website",
  },
};

export default function RetailSignsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="retail-signs-saskatoon"
      primaryProductSlug="vinyl-banners"
      title="Retail Signs Saskatoon"
      subtitle="Banners, window graphics, and promo print for Saskatoon boutiques, pharmacies, and gift shops — 1–3 business days, local pickup at 216 33rd St W."
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="Retail store signage and banners printed in Saskatoon"
      description="When you need retail signage before the weekend sale, you can't wait on shipping. Saskatoon boutiques, pharmacies, gift shops, and convenience stores get banners, window decals, coroplast signs, and flyers printed in-house at True Color. Vinyl banners from $8.25/sqft with grommets included. Standard turnaround 1–3 business days. Same-day rush +$40 flat. In-house designer $35 flat with same-day proof. Roland UV in-house — consistent colour, no outsourcing."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            When you're running a weekend sale or putting up seasonal signage, you can't wait
            a week for a print order to ship from out of province. Saskatoon boutiques,
            pharmacies, gift shops, and convenience stores get their banners, window graphics,
            and yard signs printed in-house at True Color — ready in 1–3 business days, or
            same day for <strong>+$40 flat</strong>. Vinyl banners start at{" "}
            <strong>$8.25/sqft</strong> with grommets included — a standard 2×4&apos; banner
            runs $66. Coroplast signs for seasonal sales or parking restrictions start at{" "}
            <strong>$8/sqft</strong> (18×24&quot; = $24). No shipping delays, no third-party
            vendor juggling.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Order before 10 AM and same-day rush gets your signs ready by end of business
            for <strong>+$40 flat</strong>. Our in-house designer sets up your artwork for{" "}
            <strong>$35 flat</strong> with a same-day proof — bring your logo, a rough layout
            idea, or just your brand colours and we handle the rest. For storefront window
            promotions, our{" "}
            <Link
              href="/products/window-decals"
              className="text-[#16C2F3] underline font-medium"
            >
              window decals
            </Link>{" "}
            (from $11/sqft) and perforated window vinyl are fully removable with no residue,
            so you can update your storefront every season without repainting.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Beyond signage, we print business cards starting at 250 for $45, flyers at
            100 for $45, and postcards for direct-mail campaigns at 250 for $85. If you need
            branded print across multiple store locations, we run your full order in one
            batch for colour consistency. Pick up locally at 216 33rd St W, Saskatoon — no
            shipping required. For outdoor seasonal banners and promotional displays, see our{" "}
            <Link
              href="/banner-printing-saskatoon"
              className="text-[#16C2F3] underline font-medium"
            >
              vinyl banner printing page
            </Link>{" "}
            for full sizing and pricing options.
          </p>
        </>
      }
      products={[
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
      ]}
      whyPoints={[
        "Your sale banner is ready in 1–3 business days — same day for +$40 flat if ordered before 10 AM",
        "Vinyl banners from $8.25/sqft with grommets included — a 2×4' banner is $66, no add-ons",
        "Coroplast signs from $8/sqft — seasonal sales, parking, A-frame inserts ($24 for 18×24\")",
        "Window decals from $11/sqft — removable without residue, update your storefront every season",
        "Colours stay consistent across every reprint — we run Roland UV in-house, so there's no outsourcing",
        "Bring a logo or a rough idea — our in-house designer builds your artwork for $35 flat, same-day proof",
        "Pick up at 216 33rd St W, Saskatoon — no shipping, no waiting on couriers",
      ]}
      faqs={[
        {
          q: "What's the most cost-effective banner size for a retail promo in Saskatoon?",
          a: "A 2×4' vinyl banner at $66 (with grommets) is the most popular retail promo size — visible from the sidewalk, easy to hang in a window or on a fence. For larger outdoor displays, a 3×6' banner runs $135. All banners include grommets and are printed on our in-house Roland UV printer.",
        },
        {
          q: "Can you do same-day retail signs in Saskatoon?",
          a: "Yes — same-day is available for a +$40 flat rush fee when you order before 10 AM. Call (306) 954-8688 to confirm capacity. Most in-stock materials are eligible. Standard turnaround without rush is 1–3 business days after artwork approval.",
        },
        {
          q: "How much do coroplast parking or sale signs cost?",
          a: "Coroplast signs start at $8/sqft. Common retail sizes: 18×24\" = $24, 24×36\" = $48. For orders of 5 or more identical signs, we apply an 8% volume discount. These are 4mm corrugated plastic — lightweight, UV-resistant, and suitable for outdoor use.",
        },
        {
          q: "Can you match our brand colours across banners, cards, and flyers?",
          a: "Yes. Bring a brand guide, Pantone reference, or a printed sample. Our Roland UV printer reproduces consistent colour across every product. Reorders use your previous job on file — provide your order number and we match it exactly.",
        },
        {
          q: "Do you print flyers and business cards for retailers too?",
          a: "Yes — full-colour flyers start at 100 for $45 and 500 for $135. Business cards are 250 for $45 or 500 for $65 (2-sided). These pair well with a banner or coroplast sign campaign for a consistent in-store and street presence.",
        },
        {
          q: "Do I need to bring print-ready artwork?",
          a: "No — our in-house designer handles layout and artwork preparation for $35 flat with a same-day proof. You can bring a logo file, a rough sketch, or just describe what you need. We use in-house Photoshop and can work from almost any starting point.",
        },
      ]}
    />
  );
}
