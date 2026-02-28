import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Restaurant Signs Saskatoon | Menu Boards, Banners & More | True Color",
  description:
    "Menu boards, vinyl banners, flyers, and window graphics for Saskatoon restaurants, cafes, and food trucks. Local pickup. Same-day available. In-house designer.",
  alternates: { canonical: "/restaurant-signs-saskatoon" },
  openGraph: {
    title: "Restaurant Signs Saskatoon | True Color Display Printing",
    description:
      "Foam board menus, vinyl banners, and window decals for Saskatoon restaurants. Same-day available. Local pickup at 216 33rd St W.",
    url: "https://truecolorprinting.ca/restaurant-signs-saskatoon",
    type: "website",
  },
};

export default function RestaurantSignsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="restaurant-signs-saskatoon"
      title="Restaurant Signs Saskatoon"
      subtitle="Menu boards, banners, and window graphics. Ready when your restaurant needs them."
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="Restaurant menu boards and signs printed in Saskatoon"
      description="Saskatoon restaurants, cafes, bars, and food trucks use True Color for menu boards, promotional banners, window vinyl, and business cards. Menu prices change — your signage shouldn't cost $200 every time it does. We print fast, match your brand colours, and you pick up locally at 216 33rd St W. No shipping wait. In-house designer handles everything from your logo file to a rough sketch of your layout."
      products={[
        { name: "Foamboard Displays", from: "from $8/sqft", slug: "foamboard-displays" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Flyers & Menus", from: "100 for $45", slug: "flyers" },
        { name: "Business Cards", from: "250 for $40", slug: "business-cards" },
        { name: "Window Decals", from: "from $8/sqft", slug: "window-decals" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
      ]}
      whyPoints={[
        "Foam board menu boards from $45 (18×24\") — no lamination needed for indoor use",
        "Vinyl banners for patio, windows, and promos — from $66",
        "Window decals and perforated vinyl for storefront branding — from $45",
        "Same-day available when ordered before 10 AM — confirmed by phone call",
        "In-house designer handles low-res logos, photo-heavy menus, and seasonal promos",
        "Reprints match your previous order exactly — bring your order number",
      ]}
      faqs={[
        {
          q: "What's the best material for an indoor menu board in Saskatoon?",
          a: "3/16\" foam board is the standard for indoor menus — lightweight, clean edges, easy to hang or stand. 18×24\" is the most common size for wall menus. For permanent installations or high-traffic areas, 3mm aluminum composite (ACP) lasts 10+ years.",
        },
        {
          q: "Can you print my seasonal promo banner same-day?",
          a: "Yes — vinyl banners can be ready same-day for an additional $40 rush fee if ordered before 10 AM. Call (306) 954-8688 to confirm capacity. Standard turnaround is 1–3 business days after artwork approval.",
        },
        {
          q: "Can you match our brand colours exactly?",
          a: "Yes — bring us a brand guide, a Pantone reference, or a printed sample. Our Roland UV printer produces consistent, vivid colour. Reorders match previous jobs when you provide your order number.",
        },
        {
          q: "We have two locations. Can you print for both at once?",
          a: "Yes — we print your full run at once for brand consistency. Just let us know quantities per location. Pickup is centralized at 216 33rd St W, Saskatoon.",
        },
        {
          q: "Do you do retractable banner stands for trade shows and events?",
          a: "Yes — retractable banner stand with full-colour printing starts at $219. Popular for sidewalk signs, trade shows, special events, and grand openings.",
        },
      ]}
    />
  );
}
