import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Agriculture Signs Saskatchewan | Farm Signs & Banners | True Color",
  description:
    "Farm gate signs, acreage markers, and trade show banners for Saskatchewan ag businesses. Coroplast from $30. Vehicle magnets from $45. Saskatoon local pickup.",
  alternates: { canonical: "/agriculture-signs-saskatoon" },
};

export default function AgriculturePage() {
  return (
    <IndustryPage
      title="Agriculture Signs Saskatchewan"
      subtitle="From farm gates to trade shows — printed in Saskatoon."
      heroImage="/images/products/heroes/agriculture-hero-1200x500.webp"
      heroAlt="Saskatchewan farm and agriculture signs"
      description="Saskatchewan agriculture businesses use True Color for everything from acreage markers and gate signs to trade show banners and business cards. We understand prairie conditions — our products are built to handle Saskatchewan weather year-round."
      products={[
        { name: "Coroplast Signs", from: "from $30", slug: "coroplast-signs" },
        { name: "Vinyl Banners", from: "from $45", slug: "vinyl-banners" },
        { name: "Vehicle Magnets", from: "from $45", slug: "vehicle-magnets" },
      ]}
      whyPoints={[
        "Outdoor-rated coroplast and ACP signs that handle prairie winters",
        "Trade show banners and retractable stands for Agribition and dealer shows",
        "Truck door magnets for ag equipment and sales vehicles",
        "In-house designer — bring your logo or have us create one",
        "Local Saskatoon pickup — no Toronto shipping delay before the season starts",
      ]}
      faqs={[
        {
          q: "Can coroplast signs survive a Saskatchewan winter outdoors?",
          a: "Yes — coroplast is waterproof, UV-resistant, and rated for outdoor use. Typical outdoor lifespan is 2–3 years. For permanent signage, aluminum composite (ACP) lasts indefinitely.",
        },
        {
          q: "Do you print trade show booth banners and retractable stands?",
          a: "Yes — vinyl banners in any size and retractable banner stands from $219 (stand + printed banner included).",
        },
        {
          q: "Can you print vehicle magnets for farm trucks?",
          a: "Yes — 30mil magnets for any steel vehicle. 8×12\" up to 24×36\" and custom sizes.",
        },
      ]}
    />
  );
}
