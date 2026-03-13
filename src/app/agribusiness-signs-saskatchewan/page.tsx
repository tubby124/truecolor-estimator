import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";
import { DesignDirectionGrid } from "@/components/site/DesignDirectionGrid";

export const metadata: Metadata = {
  title: { absolute: "Agribusiness Signs Saskatchewan | From $60 | True Color" },
  description:
    "Signs for SK agribusiness — equipment dealers, seed retailers, grain co-ops. ACP from $60, retractable stands $219. In-house design $35. Saskatoon pickup.",
  alternates: { canonical: "/agribusiness-signs-saskatchewan" },
  openGraph: {
    title: "Agribusiness Signs Saskatchewan | True Color Display Printing",
    description:
      "ACP building signs, trade show displays, and fleet magnets for Saskatchewan agribusiness. Volume pricing. Local Saskatoon pickup.",
    url: "https://truecolorprinting.ca/agribusiness-signs-saskatchewan",
    type: "website",
  },
};

const designDirections = [
  {
    title: "ACP building sign directions",
    subtitle: "3mm aluminum composite from $13/sqft \u00b7 10+ year lifespan.",
    aspect: "4/3" as const,
    items: [
      {
        src: "/images/industries/agribusiness/sign-dealer-fascia.webp",
        alt: "ACP aluminum fascia sign on Saskatchewan farm equipment dealership exterior",
        label: "Dealer Fascia",
        caption: "Brand panel, hours, phone \u2014 4\u00d78 ft permanent installation",
      },
      {
        src: "/images/industries/agribusiness/sign-warehouse-id.webp",
        alt: "ACP warehouse identification sign for grain elevator or agricultural supply building",
        label: "Warehouse / Elevator ID",
        caption: "Building number, hazard class, co-op branding \u2014 24\u00d736\u201d",
      },
      {
        src: "/images/industries/agribusiness/sign-storefront.webp",
        alt: "ACP storefront sign for agricultural retail supply store in Saskatchewan town",
        label: "Retail Storefront",
        caption: "Seed retailer, feed store, ag supply \u2014 custom dimensions",
      },
    ],
  },
  {
    title: "Trade show display directions",
    subtitle: "Retractable stands from $219 complete \u00b7 vinyl banners from $66.",
    aspect: "3/8" as const,
    maxCols: 2 as const,
    items: [
      {
        src: "/images/industries/agribusiness/retractable-trade-show.webp",
        alt: "Retractable banner stand at Saskatchewan agriculture trade show booth display",
        label: "Trade Show Stand",
        caption: "Ag in Motion, Agribition, Crop Production Show \u2014 33\u00d780\u201d",
      },
      {
        src: "/images/industries/agribusiness/retractable-dealer-showroom.webp",
        alt: "Retractable banner stand in farm equipment dealer showroom promoting new product line",
        label: "Dealer Showroom",
        caption: "New product launch, seasonal promotion \u2014 portable, reusable",
      },
    ],
  },
  {
    title: "Print material directions",
    subtitle: "Flyers from $45/100 \u00b7 business cards from $45/250 \u00b7 postcards from $35/50.",
    aspect: "3/4" as const,
    items: [
      {
        src: "/images/industries/agribusiness/flyer-product-sheet.webp",
        alt: "Product specification flyer for agricultural equipment dealer on 80lb gloss stock",
        label: "Product Spec Sheet",
        caption: "Equipment specs, pricing tables, dealer info \u2014 8.5\u00d711\u201d",
      },
      {
        src: "/images/industries/agribusiness/flyer-seasonal-promo.webp",
        alt: "Spring seeding promotion flyer for Saskatchewan seed retailer with pricing",
        label: "Seasonal Promo",
        caption: "Spring seed sale, fall harvest specials, fertilizer pricing \u2014 double-sided",
      },
      {
        src: "/images/industries/agribusiness/postcard-direct-mail.webp",
        alt: "Direct mail postcard for Saskatchewan agricultural supply company on 14pt gloss",
        label: "Direct Mail Postcard",
        caption: "Customer retention, new product alerts, seasonal campaigns \u2014 4\u00d76\u201d",
      },
    ],
  },
];

const descriptionNode = (
  <>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      Saskatchewan agribusiness companies \u2014 equipment dealers, seed retailers, fertilizer
      suppliers, grain elevators, and agricultural co-ops \u2014 rely on True Color Display
      Printing in Saskatoon for signage that matches the scale of their operations.{" "}
      <Link href="/aluminum-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
        ACP aluminum building signs
      </Link>{" "}
      from $60 ($13/sqft) deliver a professional storefront that lasts 10+ years through
      Saskatchewan weather. Multi-location dealers ordering matching signage for branches in
      Humboldt, Kindersley, and Weyburn get consistent colour and branding from our in-house
      Roland UV printer.
    </p>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      Trade show season drives the biggest orders \u2014{" "}
      <Link href="/retractable-banners-saskatoon" className="text-[#16C2F3] underline font-medium">
        retractable banner stands
      </Link>{" "}
      from $219 (stand + full-colour print included) for Ag in Motion, Canadian Western
      Agribition, and the Crop Production Show.{" "}
      <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
        Vinyl banners
      </Link>{" "}
      from $66 for booth backdrops and outdoor fencing. Ag in Motion in Langham is 15 minutes
      from our shop \u2014 same-day rush (+$40 flat, order before 10 AM) means last-minute booth
      signage is not a problem.
    </p>
    <p className="text-gray-600 leading-relaxed mb-6">
      Between shows, seed retailers and fertilizer suppliers need seasonal{" "}
      <Link href="/flyer-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
        product flyers
      </Link>{" "}
      updated every spring \u2014 100 double-sided on 80lb gloss for $45.{" "}
      <Link href="/business-cards-saskatoon" className="text-[#16C2F3] underline font-medium">
        Business cards
      </Link>{" "}
      at 250 for $45 on 14pt gloss keep your sales reps and agronomists professional at every
      farm visit. Postcards from $35 for 50 handle direct mail campaigns to your customer base.{" "}
      <Link href="/vehicle-magnets-saskatoon" className="text-[#16C2F3] underline font-medium">
        Vehicle magnets
      </Link>{" "}
      from $45 brand delivery trucks and field rep vehicles across the province.
    </p>
    <p className="text-gray-600 leading-relaxed mb-10">
      Our in-house designer builds print-ready layouts from your brand guide, a rough sketch, or
      just a description for $35 flat with same-day proof. No outside designer, no delays.
      Standard turnaround is 1\u20133 business days after artwork approval. Local pickup at 216
      33rd St W, Saskatoon. Running a farm or ranch? See{" "}
      <Link href="/agriculture-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
        agriculture signs for farms and ranches
      </Link>.
    </p>

    <DesignDirectionGrid sections={designDirections} />
  </>
);

export default function AgribusinessSignsSaskatchewanPage() {
  return (
    <IndustryPage
      canonicalSlug="agribusiness-signs-saskatchewan"
      primaryProductSlug="acp-signs"
      title="Agribusiness Signs Saskatchewan"
      subtitle="ACP building signs, trade show displays, and fleet branding for equipment dealers, seed retailers, and ag suppliers."
      heroImage="/images/products/heroes/agriculture-hero-1200x500.webp"
      heroAlt="Agribusiness signs for Saskatchewan equipment dealers and agricultural suppliers"
      description="Saskatchewan agribusiness companies — equipment dealers, seed retailers, fertilizer suppliers, grain elevators, and agricultural co-ops — rely on True Color Display Printing in Saskatoon for signage that matches the scale of their operations. ACP aluminum building signs from $60 ($13/sqft) deliver a professional storefront that lasts 10+ years through Saskatchewan weather. Multi-location dealers ordering matching signage for branches in Humboldt, Kindersley, and Weyburn get consistent colour and branding from our in-house Roland UV printer. Trade show season drives the biggest orders — retractable banner stands from $219 (stand + full-colour print included) for Ag in Motion, Canadian Western Agribition, and the Crop Production Show. Vinyl banners from $66 for booth backdrops and outdoor fencing. Ag in Motion in Langham is 15 minutes from our shop — same-day rush (+$40 flat, order before 10 AM) means last-minute booth signage is not a problem. Between shows, seed retailers and fertilizer suppliers need seasonal product flyers updated every spring — 100 double-sided on 80lb gloss for $45. Business cards at 250 for $45 on 14pt gloss keep your sales reps and agronomists professional at every farm visit. Postcards from $35 for 50 handle direct mail campaigns to your customer base. Vehicle magnets from $45 brand delivery trucks and field rep vehicles across the province. Our in-house designer builds print-ready layouts from your brand guide or rough sketch for $35 flat with same-day proof. Standard turnaround is 1–3 business days after artwork approval. Local pickup at 216 33rd St W, Saskatoon."
      descriptionNode={descriptionNode}
      products={[
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Flyers", from: "from $45", slug: "flyers" },
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
      ]}
      whyPoints={[
        "ACP aluminum from $13/sqft — permanent dealer fascia and building ID that lasts 10+ years",
        "Retractable stands from $219 — complete booth display for Agribition, Ag in Motion, Crop Production Show",
        "Multi-location consistency — same Roland UV printer means matched colour across every branch",
        "Seasonal flyer reprints from $45/100 — spring seed pricing, fall harvest specials, updated every year",
        "In-house designer ($35 flat, same-day proof) — no print-ready files needed",
        "Same-day rush +$40 flat — Ag in Motion is 15 minutes from our shop",
      ]}
      faqs={[
        {
          q: "What signage do farm equipment dealers need?",
          a: "The standard setup includes: ACP aluminum building signs for the exterior ($13/sqft, $60 minimum — a 4\u00d78 ft dealer fascia is $320), coroplast lot signs for inventory ($8/sqft, from $30), retractable banner stands for the showroom ($219 each), vehicle magnets for the sales fleet ($24/sqft, from $45), and business cards for staff (250 for $45).",
        },
        {
          q: "How much does a retractable banner stand cost in Saskatoon?",
          a: "Retractable banner stands at True Color start at $219 for the economy model — that includes the stand and the full-colour 33\u00d780\u201d printed graphic. Deluxe ($299) and premium ($349) stands are also available. Popular for Ag in Motion, Agribition, and dealer showrooms.",
        },
        {
          q: "What is the difference between coroplast and aluminum composite signs?",
          a: "Coroplast ($8/sqft, $30 minimum) is corrugated plastic — lightweight, waterproof, and lasts 2\u20133 years outdoors. Best for seasonal and temporary signage. ACP aluminum ($13/sqft, $60 minimum) is rigid metal composite — weather-proof, fade-resistant, and lasts 10+ years. Best for permanent building signs, dealer fascia, and elevator IDs.",
        },
        {
          q: "Do you print signs for Canadian Western Agribition exhibitors?",
          a: "Yes — full booth kits including retractable stands ($219+), vinyl backdrop banners ($180 for 3\u00d78 ft), business cards (250 for $45), and product flyers (100 for $45). Order at least 5 business days before the event. Same-day rush +$40 available if needed.",
        },
        {
          q: "Can you print vehicle magnets for a fleet of delivery trucks?",
          a: "Yes — 30mil magnetic vinyl from $24/sqft ($45 minimum per pair). Standard truck door size is 12\u00d724\u201d. Removable between seasons with no paint damage. Bulk pricing available for fleet orders — 5+ magnets = 5% off, 10+ = 10% off.",
        },
        {
          q: "How much do ACP aluminum building signs cost?",
          a: "ACP starts at $13/sqft with a $60 minimum. A 24\u00d736\u201d building directory panel is $66. A 4\u00d78 ft dealer fascia is $320. ACP is the professional standard for permanent outdoor signage — rigid, weather-resistant, and lasting 10+ years in Saskatchewan conditions.",
        },
        {
          q: "How fast can I get trade show displays printed in Saskatoon?",
          a: "Standard turnaround is 1\u20133 business days after artwork approval. Same-day rush is available for +$40 flat if ordered before 10 AM — call (306) 954-8688 to confirm capacity. Ag in Motion in Langham is 15 minutes from our shop.",
        },
        {
          q: "Do you offer design help for agribusiness signage?",
          a: "Yes — our in-house Photoshop designer creates print-ready layouts from your brand guide, a logo file, or a rough sketch. Minor edits and standard layouts are $35 flat with same-day proof. Full design from scratch is $50. Logo creation is $75. All artwork files are yours to keep.",
        },
      ]}
    />
  );
}
