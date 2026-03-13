import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";
import { DesignDirectionGrid } from "@/components/site/DesignDirectionGrid";

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
    type: "website",
  },
};

const designDirections = [
  {
    title: "Coroplast sign directions",
    subtitle: "From $30 per sign \u00b7 UV-printed, waterproof, stake-ready.",
    aspect: "4/3" as const,
    items: [
      {
        src: "/images/industries/agriculture/sign-farm-gate.webp",
        alt: "Coroplast farm gate sign with ranch name and no trespassing warning \u2014 Saskatchewan prairie setting",
        label: "Farm Gate ID",
        caption: "Ranch name, address, no trespassing \u2014 24\u00d736\u201d standard",
      },
      {
        src: "/images/industries/agriculture/sign-plot-marker.webp",
        alt: "Coroplast crop plot marker sign with variety name and field number \u2014 Saskatchewan field rows",
        label: "Plot Marker",
        caption: "Crop variety, field number, trial ID \u2014 12\u00d718\u201d or 18\u00d724\u201d",
      },
      {
        src: "/images/industries/agriculture/sign-biosecurity.webp",
        alt: "Biosecurity restricted access coroplast sign at Saskatchewan livestock operation entrance",
        label: "Biosecurity / Safety",
        caption: "Restricted access, OHS notice, livestock warnings \u2014 18\u00d712\u201d",
      },
    ],
  },
  {
    title: "Banner directions",
    subtitle: "13oz scrim vinyl from $66 (2\u00d74 ft) \u00b7 grommets included.",
    aspect: "3/1" as const,
    items: [
      {
        src: "/images/industries/agriculture/banner-trade-show.webp",
        alt: "Vinyl trade show banner for Saskatchewan agriculture expo booth backdrop",
        label: "Trade Show Backdrop",
        caption: "Agribition, Ag in Motion, Crop Production Show \u2014 3\u00d78 ft or 4\u00d78 ft",
      },
      {
        src: "/images/industries/agriculture/banner-seasonal-sale.webp",
        alt: "Seasonal farm sale vinyl banner with pricing for Saskatchewan dealer day event",
        label: "Seasonal Sale",
        caption: "Spring seeding, fall harvest, dealer days \u2014 2\u00d76 ft or 3\u00d76 ft",
      },
      {
        src: "/images/industries/agriculture/banner-farm-event.webp",
        alt: "Farm open day event banner welcoming visitors to Saskatchewan acreage",
        label: "Farm Event",
        caption: "Open Farm Days, u-pick, community events \u2014 any custom size",
      },
    ],
  },
  {
    title: "Vehicle magnet directions",
    subtitle: "30mil magnetic vinyl from $45 \u00b7 removable, no paint damage.",
    aspect: "4/3" as const,
    maxCols: 2 as const,
    items: [
      {
        src: "/images/industries/agriculture/magnet-farm-truck.webp",
        alt: "Vehicle magnet on farm truck door with ranch branding and phone number \u2014 Saskatchewan gravel road",
        label: "Farm Truck",
        caption: "Ranch name + phone \u2014 12\u00d724\u201d standard door size",
      },
      {
        src: "/images/industries/agriculture/magnet-equipment-dealer.webp",
        alt: "Vehicle magnet on ag equipment dealer service vehicle with company branding",
        label: "Equipment Dealer",
        caption: "Sales rep, agronomist, seed dealer \u2014 pairs of 12\u00d718\u201d",
      },
    ],
  },
];

const descriptionNode = (
  <>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      Saskatchewan agriculture businesses use True Color Display Printing for everything from{" "}
      <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
        coroplast farm gate signs
      </Link>{" "}
      and acreage markers to trade show banners and truck door magnets. Our in-house Roland UV
      printer produces weatherproof signage that handles prairie winters, spring mud, and summer
      sun without fading or peeling. Coroplast signs start at $30 — the standard for field plot
      markers, for-sale signs, and gate identification across Saskatchewan farmland.
    </p>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
        Vinyl banners
      </Link>{" "}
      from $66 work for Agribition booths, dealer days, and seasonal promotions.{" "}
      <Link href="/vehicle-magnets-saskatoon" className="text-[#16C2F3] underline font-medium">
        Vehicle magnets
      </Link>{" "}
      from $45 turn farm trucks and equipment sales vehicles into mobile advertising across rural
      Saskatchewan.{" "}
      <Link href="/business-cards-saskatoon" className="text-[#16C2F3] underline font-medium">
        Business cards
      </Link>{" "}
      at 250 for $45 keep ag reps, seed dealers, and farm owners professional at every handshake.
    </p>
    <p className="text-gray-600 leading-relaxed mb-6">
      Saskatchewan farms with employees are required to post OHS safety notices under the
      Saskatchewan Employment Act — biosecurity signs at livestock operation entrances, restricted
      access warnings, and cattle crossing hazard signs are standard orders at True Color.{" "}
      <Link href="/flyer-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
        Flyers
      </Link>{" "}
      from $45 and postcards from $35 handle seed catalogs, seasonal direct mail, and co-op
      promotions. Equipment branding{" "}
      <Link href="/sticker-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
        stickers
      </Link>{" "}
      start from $25 for 25 die-cut vinyl stickers (2\u00d72\u201d) or from $60 (4\u00d74\u201d).
    </p>
    <p className="text-gray-600 leading-relaxed mb-10">
      Our in-house designer handles layout for $35 flat with same-day proof — bring your farm logo
      or have us create one. Same-day rush is available for +$40 flat on orders placed before 10
      AM. Standard turnaround is 1\u20133 business days after artwork approval. Local Saskatoon
      pickup at 216 33rd St W means no shipping delays before the season starts. See also:{" "}
      <Link href="/agribusiness-signs-saskatchewan" className="text-[#16C2F3] underline font-medium">
        agribusiness signs for dealers and suppliers
      </Link>.
    </p>

    <DesignDirectionGrid sections={designDirections} />
  </>
);

export default function AgricultureSignsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="agriculture-signs-saskatoon"
      primaryProductSlug="coroplast-signs"
      title="Agriculture Signs Saskatoon"
      subtitle="Farm gate signs, plot markers, trade show banners, and truck magnets — printed in Saskatoon on our Roland UV."
      heroImage="/images/products/heroes/agriculture-hero-1200x500.webp"
      heroAlt="Saskatchewan farm and agriculture signs printed by True Color Display Printing in Saskatoon"
      description="Saskatchewan agriculture businesses use True Color Display Printing for everything from coroplast farm gate signs and acreage markers to trade show banners and truck door magnets. Our in-house Roland UV printer produces weatherproof signage that handles prairie winters, spring mud, and summer sun without fading or peeling. Coroplast signs start at $30 — the standard for field plot markers, for-sale signs, and gate identification across Saskatchewan farmland. Vinyl banners from $66 work for Agribition booths, dealer days, and seasonal promotions. Vehicle magnets from $45 turn farm trucks and equipment sales vehicles into mobile advertising across rural Saskatchewan. Business cards at 250 for $45 keep ag reps, seed dealers, and farm owners professional at every handshake. Saskatchewan farms with employees are required to post OHS safety notices under the Saskatchewan Employment Act — biosecurity signs at livestock operation entrances, restricted access warnings, and cattle crossing hazard signs are standard orders at True Color. Flyers from $45 and postcards from $35 handle seed catalogs, seasonal direct mail, and co-op promotions. Equipment branding stickers start from $25 for 25 die-cut vinyl stickers. Our in-house designer handles layout for $35 flat with same-day proof — bring your farm logo or have us create one. Same-day rush is available for +$40 flat on orders placed before 10 AM. Standard turnaround is 1–3 business days after artwork approval. Local Saskatoon pickup at 216 33rd St W means no shipping delays before the season starts."
      descriptionNode={descriptionNode}
      products={[
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Flyers", from: "from $45", slug: "flyers" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
      ]}
      whyPoints={[
        "Coroplast from $8/sqft — waterproof, UV-printed, survives Saskatchewan freeze-thaw cycles",
        "Trade show banners and retractable stands for Agribition, Ag in Motion, and Crop Production Show",
        "Truck door magnets from $24/sqft — removable, no paint damage, sticks to steel at highway speed",
        "Biosecurity and OHS safety signs — compliance signage for livestock operations and farm yards",
        "In-house designer ($35 flat, same-day proof) — bring a logo or rough sketch",
        "Same-day rush +$40 flat when ordered before 10 AM — call (306) 954-8688 to confirm",
      ]}
      faqs={[
        {
          q: "How much do farm gate signs cost in Saskatchewan?",
          a: "Coroplast farm gate signs at True Color start at $8/sqft with a $30 minimum. A standard 18\u00d724\u201d gate sign is $24 (you pay the $30 minimum). A 24\u00d736\u201d sign is $48. For permanent farm entrance signs, ACP aluminum starts at $13/sqft ($60 minimum) and lasts 10+ years. Volume: 5+ signs = 8% off, 10+ signs = 17% off coroplast.",
        },
        {
          q: "What is the most durable sign material for Saskatchewan winters?",
          a: "ACP (aluminum composite panel) at $13/sqft is the most durable — rated 10+ years through prairie freeze-thaw, UV, and wind. Coroplast at $8/sqft lasts 2\u20133 seasons outdoors and is the best value for temporary or seasonal signs. Both are UV-printed in-house on our Roland printer.",
        },
        {
          q: "Can I get same-day farm signs printed in Saskatoon?",
          a: "Yes \u2014 same-day rush is available for +$40 flat on orders placed before 10 AM. Call (306) 954-8688 to confirm capacity. Standard turnaround is 1\u20133 business days after artwork approval.",
        },
        {
          q: "Do you print plot markers and field boundary signs?",
          a: "Yes \u2014 coroplast signs are the standard for field and plot markers. UV-printed with your field number, crop type, or variety name. Typically 12\u00d718\u201d ($30 minimum) or 18\u00d724\u201d ($24). Waterproof and stake-ready. Bulk pricing: 10+ markers = 17% off, 25+ = 23% off.",
        },
        {
          q: "What printed materials do I need for Ag in Motion or Agribition?",
          a: "A typical trade show kit includes: retractable banner stand ($219, stand + print included), vinyl backdrop banner ($180 for 3\u00d78 ft), business cards (250 for $45), and product flyers (100 for $45). Order 5+ business days before your event. Same-day rush +$40 available if needed.",
        },
        {
          q: "Do I need OHS safety signs on my Saskatchewan farm?",
          a: "Saskatchewan farms with employees are required to post safety notices under the Saskatchewan Employment Act. Common OHS signs include: restricted access, biosecurity protocol, chemical storage, and livestock hazard warnings. Coroplast is the standard material \u2014 waterproof, UV-resistant, from $30.",
        },
        {
          q: "Are vehicle magnets good for farm trucks?",
          a: "Yes \u2014 30mil magnetic vinyl magnets from $24/sqft ($45 minimum) stick securely to any steel vehicle. Standard farm truck door size is 12\u00d724\u201d. Removable between seasons with no paint damage. Popular with seed dealers, equipment reps, and ag consultants.",
        },
        {
          q: "Can I get banners and signs designed if I don\u2019t have a logo?",
          a: "Yes \u2014 our in-house Photoshop designer handles layouts from a rough sketch, description, or brand guide for $35 flat. Logo creation is $75. Most proofs come back same day. Design and print happen in the same building \u2014 no files moving between vendors.",
        },
      ]}
    />
  );
}
