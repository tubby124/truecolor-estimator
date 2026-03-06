import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Retail Signs Saskatoon | Banners, Decals & Flyers | True Color",
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
      subtitle="Banners, window graphics, and promo print for boutiques, pharmacies, and gift shops — fast turnaround, local pickup."
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="Retail store signage and banners printed in Saskatoon"
      description="Saskatoon retailers use True Color Display Printing for vinyl banners, window decals, coroplast signs, flyers, and business cards. Whether you run a clothing boutique, a pharmacy, a gift shop, or a convenience store, we print what you need for sales, seasonal promos, parking lot signage, and in-store displays. Vinyl banners start at $8.25/sqft with grommets included. Standard turnaround is 1–3 business days. Same-day rush is available for +$40 flat. In-house designer from $35 flat with same-day proof. Roland UV in-house printer ensures consistent, vivid colour that matches your brand every time."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            Saskatoon retailers — boutiques, clothing stores, pharmacies, gift shops, and
            convenience stores — use True Color Display Printing for everything from window
            banners to parking lot signs. Vinyl banners start at{" "}
            <strong>$8.25/sqft</strong> with grommets included, and a standard 2×4&apos; banner
            runs $66. Coroplast signs for seasonal sales or parking restrictions start at{" "}
            <strong>$8/sqft</strong> (18×24&quot; = $24). All print is produced on our
            in-house Roland UV printer in Saskatoon — no shipping delays, no third-party
            vendor juggling.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Running a weekend sale or a last-minute clearance event? Same-day rush is
            available for <strong>+$40 flat</strong> when ordered before 10 AM. Our in-house
            designer sets up your artwork for <strong>$35 flat</strong> with a same-day
            proof — just bring your logo, a rough layout idea, or your brand colours and
            we handle the rest. For storefront window promotions, our{" "}
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
            Beyond signage, we print business cards starting at 250 for $40, flyers at
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
        { name: "Business Cards", from: "250 for $40", slug: "business-cards" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
      ]}
      whyPoints={[
        "Vinyl banners from $8.25/sqft — grommets included, no hidden add-ons",
        "Coroplast signs from $8/sqft — sale events, parking lots, A-frame inserts",
        "Window decals from $11/sqft — removable, full-colour, UV-safe",
        "Same-day rush available (+$40 flat) when ordered before 10 AM by phone",
        "In-house designer $35 flat — handles low-res logos and rough sketches",
        "Roland UV in-house printer — consistent colour across every reprint",
        "Local pickup at 216 33rd St W, Saskatoon — no shipping wait",
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
          a: "Yes — full-colour flyers start at 100 for $45 and 500 for $135. Business cards are 250 for $40 or 500 for $65 (2-sided). These pair well with a banner or coroplast sign campaign for a consistent in-store and street presence.",
        },
        {
          q: "Do I need to bring print-ready artwork?",
          a: "No — our in-house designer handles layout and artwork preparation for $35 flat with a same-day proof. You can bring a logo file, a rough sketch, or just describe what you need. We use in-house Photoshop and can work from almost any starting point.",
        },
      ]}
    />
  );
}
