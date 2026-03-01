import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Agriculture Signs Saskatchewan | Farm Signs & Banners | True Color",
  description:
    "Farm gate signs, acreage markers, and trade show banners for Saskatchewan ag businesses. Coroplast from $30. Vehicle magnets from $45. Saskatoon local pickup.",
  alternates: { canonical: "/agriculture-signs-saskatoon" },
  openGraph: {
    title: "Agriculture Signs Saskatchewan | True Color Display Printing",
    description:
      "Farm gate signs, plot markers, trade show banners, and truck magnets for Saskatchewan ag businesses. Coroplast from $30. Local Saskatoon pickup.",
    url: "https://truecolorprinting.ca/agriculture-signs-saskatoon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function AgriculturePage() {
  return (
    <IndustryPage
      canonicalSlug="agriculture-signs-saskatoon"
      primaryProductSlug="coroplast-signs"
      title="Agriculture Signs Saskatchewan"
      subtitle="From farm gates to trade shows — printed in Saskatoon."
      heroImage="/images/products/heroes/agriculture-hero-1200x500.webp"
      heroAlt="Saskatchewan farm and agriculture signs"
      description="Saskatchewan agriculture businesses use True Color for everything from acreage markers and gate signs to trade show banners and business cards. We understand prairie conditions — our products are built to handle Saskatchewan weather year-round."
      products={[
        { name: "Coroplast Signs", from: "from $30", slug: "coroplast-signs" },
        { name: "Vinyl Banners", from: "from $66", slug: "vinyl-banners" },
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
        {
          q: "Do you do plot markers or field boundary signs?",
          a: "Yes — coroplast signs are the standard for field and plot markers. UV-printed with your field number, crop type, or variety name. Typically 12×18\" or 18×24\". Waterproof and stake-ready. Call with your quantities for bulk pricing.",
        },
        {
          q: "Can I get banners for Agribition or Canadian Western Agribition?",
          a: "Yes — trade show vinyl banners and retractable banner stands are ready in 1–3 business days. Popular sizes: 3×6 ft backdrop banners, 24×80\" retractable stands. Bring your logo and we design the layout in-house.",
        },
        {
          q: "What's your turnaround before the seeding season rush?",
          a: "Standard is 1–3 business days after artwork approval. If you need signs before the season starts, order early — March and April get busy. Same-day rush is available for +$40 flat on most orders placed before 10 AM.",
        },
      ]}
    />
  );
}
