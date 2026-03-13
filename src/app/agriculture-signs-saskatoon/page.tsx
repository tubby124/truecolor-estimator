import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Agriculture Signs Saskatoon | From $30 | True Color" },
  description:
    "Farm signs, acreage markers & trade show banners for SK agriculture. Coroplast from $30. In-house Roland UV printer. Same-day rush +$40. Saskatoon pickup.",
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
      description="Saskatchewan agriculture businesses use True Color Display Printing for everything from coroplast farm gate signs and acreage markers to trade show banners and truck door magnets. Our in-house Roland UV printer produces weatherproof signage that handles prairie winters, spring mud, and summer sun without fading or peeling. Coroplast signs start at $30 — the standard for field plot markers, for-sale signs, and gate identification across Saskatchewan farmland. Vinyl banners from $66 work for Agribition booths, dealer days, and seasonal promotions. Vehicle magnets from $45 turn farm trucks and equipment sales vehicles into mobile advertising across rural Saskatchewan. Business cards at 250 for $45 keep ag reps, seed dealers, and farm owners professional at every handshake. Flyers from $45 and postcards from $35 handle seed catalogs, seasonal direct mail, and co-op promotions. For permanent signage at farm entrances and rural businesses, ACP aluminum signs from $60 last indefinitely in any weather. Window decals from $45 and vinyl lettering from $40 brand co-op storefronts and dealership windows. Equipment branding stickers start at $95 for 25 die-cut vinyl stickers. Our in-house designer handles layout for $35 flat with same-day proof — bring your farm logo or have us create one. Same-day rush is available for +$40 flat on orders placed before 10 AM. Standard turnaround is 1–3 business days after artwork approval. Local Saskatoon pickup at 216 33rd St W means no shipping delays before the season starts."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            Saskatchewan agriculture businesses use True Color Display Printing for everything from{" "}
            <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              coroplast farm gate signs
            </Link>{" "}
            and acreage markers to trade show banners and truck door magnets. Our in-house Roland UV printer produces weatherproof signage that handles prairie winters, spring mud, and summer sun without fading or peeling. Coroplast signs start at $30 — the standard for field plot markers, for-sale signs, and gate identification across Saskatchewan farmland.
          </p>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              Vinyl banners
            </Link>{" "}
            from $66 work for Agribition booths, dealer days, and seasonal promotions.{" "}
            <Link href="/vehicle-magnets-saskatoon" className="text-[#16C2F3] underline font-medium">
              Vehicle magnets
            </Link>{" "}
            from $45 turn farm trucks and equipment sales vehicles into mobile advertising across rural Saskatchewan.{" "}
            <Link href="/business-cards-saskatoon" className="text-[#16C2F3] underline font-medium">
              Business cards
            </Link>{" "}
            at 250 for $45 keep ag reps, seed dealers, and farm owners professional at every handshake.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            <Link href="/flyer-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              Flyers
            </Link>{" "}
            from $45 and postcards from $35 handle seed catalogs, seasonal direct mail, and co-op promotions. For permanent signage at farm entrances and rural businesses, ACP aluminum signs from $60 last indefinitely in any weather. Window decals from $45 and vinyl lettering from $40 brand co-op storefronts and dealership windows. Equipment branding{" "}
            <Link href="/sticker-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              stickers
            </Link>{" "}
            start at $95 for 25 die-cut vinyl stickers.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Our in-house designer handles layout for $35 flat with same-day proof — bring your farm logo or have us create one. Same-day rush is available for +$40 flat on orders placed before 10 AM. Standard turnaround is 1–3 business days after artwork approval. Local Saskatoon pickup at 216 33rd St W means no shipping delays before the season starts.
          </p>
        </>
      }
      products={[
        { name: "Coroplast Signs", from: "from $30", slug: "coroplast-signs" },
        { name: "Vinyl Banners", from: "from $66", slug: "vinyl-banners" },
        { name: "Vehicle Magnets", from: "from $45", slug: "vehicle-magnets" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Flyers", from: "from $45", slug: "flyers" },
        { name: "ACP Aluminum Signs", from: "from $60", slug: "acp-signs" },
        { name: "Window Decals", from: "from $45", slug: "window-decals" },
        { name: "Stickers", from: "from $95", slug: "stickers" },
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
        {
          q: "Do you print stickers and labels for farm equipment and packaging?",
          a: "Yes — die-cut vinyl stickers printed on our Roland UV printer. 25 stickers from $95, 100 from $160. Waterproof and UV-resistant. Common uses: equipment branding, seed bag labels, and product packaging stickers.",
        },
        {
          q: "Can you print business cards and flyers for ag businesses?",
          a: "Yes — business cards at 250 for $45 on 14pt gloss stock. Flyers from $45 for 100 copies on 80lb gloss, double-sided. Our in-house designer creates the layout for $35 flat with same-day proof. Popular with seed dealers, ag reps, and farm supply stores.",
        },
      ]}
    />
  );
}
