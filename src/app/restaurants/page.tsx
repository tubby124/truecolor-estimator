import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Menu Boards & Restaurant Signs Saskatoon | True Color",
  description:
    "Foam board menus, vinyl banners, posters, and business cards for Saskatoon restaurants. Local pickup. No minimums on reprints. Fast turnaround.",
  alternates: { canonical: "/restaurants" },
};

export default function RestaurantsPage() {
  return (
    <IndustryPage
      title="Menu Boards & Restaurant Signage"
      subtitle="Send the file Friday. Pick it up Saturday. Done."
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="Restaurant menu boards and banners Saskatoon"
      description="Saskatoon restaurants, cafes, and food trucks use True Color for menu boards, promo banners, window graphics, and business cards. Menu changes shouldn't cost $200 each time. We print fast, match your brand, and you pick up locally — no shipping wait."
      products={[
        { name: "Foam Board Menus", from: "from $45", slug: "foam-board-signs" },
        { name: "Vinyl Banners", from: "from $66", slug: "vinyl-banners" },
        { name: "Flyers & Menus", from: "from $45", slug: "flyers" },
        { name: "Business Cards", from: "from $40", slug: "business-cards" },
      ]}
      whyPoints={[
        "Foam board menu boards from $45 (18×24\") — no lamination needed indoors",
        "Vinyl banners for patio, windows, and promos — from $66",
        "Same-day available when ordered before 10 AM — confirmed by phone",
        "In-house designer handles low-res logos and photo-heavy layouts",
        "Reprints match your previous order exactly — bring your order number",
      ]}
      faqs={[
        {
          q: "What's the best material for an indoor menu board?",
          a: "3/16\" foam board is the standard for indoor menus — lightweight, clean edges, easy to hang. 18×24\" is the most common size. ACP aluminum is available for permanent installations.",
        },
        {
          q: "Can you print my seasonal promo banner same-day?",
          a: "Yes — vinyl banners can be ready same-day for an additional $40 rush fee if ordered before 10 AM. Standard turnaround is 1–3 business days.",
        },
        {
          q: "I need consistent branding across two locations. Can you match?",
          a: "Yes — bring us one sample or your brand file and we'll color-match across all your prints. We store your files so reorders are quick.",
        },
        {
          q: "Do you do retractable banner stands?",
          a: "Yes — retractable banner stand with printing starts at $219. Great for sidewalk signs, trade shows, and seasonal displays.",
        },
      ]}
    />
  );
}
