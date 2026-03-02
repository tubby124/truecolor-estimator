import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Wall Graphics Saskatoon | Custom Vinyl Wall Decals & Lettering | True Color",
  description:
    "Custom wall graphics and vinyl lettering in Saskatoon. Removable wall decals, office murals, retail displays, school spirit walls. Any size up to 60\" wide. In-house printing at 216 33rd St W.",
  alternates: { canonical: "/wall-graphics-saskatoon" },
  openGraph: {
    title: "Wall Graphics Saskatoon | Vinyl Decals & Wall Lettering | True Color",
    description:
      "Custom wall graphics and vinyl lettering printed in Saskatoon. Removable or permanent. Retail, office, school. Same-day available. Local pickup 216 33rd St W.",
    url: "https://truecolorprinting.ca/wall-graphics-saskatoon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function WallGraphicsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="wall-graphics-saskatoon"
      primaryProductSlug="window-decals"
      title="Wall Graphics — Saskatoon"
      subtitle="Transform any wall. Removable vinyl, full-colour prints, any size. In-house printing."
      heroImage="/images/products/product/decal-window-white-text-800x600.webp"
      heroAlt="Custom wall graphics and vinyl lettering in Saskatoon by True Color Display Printing"
      description={
        "Wall graphics are one of the highest-impact, lowest-cost ways to transform a space — and True Color prints them in Saskatoon without the lead times that come from shipping through a national supplier. Businesses, clinics, schools, retail stores, and restaurants use wall graphics to brand their space, display information, create photo walls, and add colour to otherwise blank walls.\n\nWe print wall graphics on removable vinyl stock, which means zero adhesive residue on drywall, painted surfaces, or brick when you take them down. Ideal for seasonal promotions, lease spaces, or anyone who wants the flexibility to update their décor without repainting. For permanent installations — entrance walls, lobby features, exterior signage — we use permanent vinyl or UV-printed rigid stock depending on the substrate.\n\nOur Roland UV printer handles any size up to 60 inches wide, with no practical length limit on rolled vinyl. Larger installs are done in panels with seams aligned to a natural break point in the design. Our in-house designer can build your layout to scale, match your brand colours, and provide a to-scale proof before anything goes to print — so what you approve is exactly what goes on your wall.\n\nVinyl lettering is a separate product for text-only applications — storefront hours, office door names, vehicle text. Cut on our precision plotter, it has a clean, professional finish with no background material visible. Popular for office windows, glass partitions, clinic doors, and construction site hoardings.\n\nSaskatoon businesses in the Midtown area, Broadway corridor, 8th Street commercial strip, and downtown core use True Color for wall graphics because we're local, fast, and do both the design and the print in one building. Standard turnaround is 1–3 business days. Same-day rush is available for +$40 flat.\n\nInstallation service is available — ask when you order. Pickup at 216 33rd St W, Saskatoon."
      }
      products={[
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
        { name: "Vinyl Lettering", from: "custom quote", slug: "vinyl-lettering" },
        { name: "Window Perf", from: "from $8/sqft", slug: "window-perf" },
        { name: "ACP Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Foamboard Displays", from: "from $10/sqft", slug: "foamboard-displays" },
      ]}
      whyPoints={[
        "Removable vinyl — zero adhesive residue on drywall, paint, glass, or brick",
        "Full-colour prints up to 60\" wide — any length, panels aligned for larger installs",
        "Permanent vinyl and rigid substrate options for lobby features and exterior walls",
        "Vinyl lettering for text-only applications — precision plotter, clean edge finish",
        "In-house designer builds layouts to scale with colour-matched brand proof",
        "Installation service available — ask at time of order",
        "Same-day rush for +$40 flat when ordered before 10 AM",
        "Local pickup at 216 33rd St W — no shipping, no wait",
      ]}
      faqs={[
        {
          q: "How much do wall graphics cost in Saskatoon?",
          a: "Removable vinyl wall graphics at True Color start at $11/sqft (minimum $45). A standard 4×8 ft wall graphic runs approximately $250 before design. Exact pricing depends on material, finish, and size — use the quote form on this page or call (306) 954-8688 for a same-day quote.",
        },
        {
          q: "Can wall decals be removed without damaging the wall?",
          a: "Yes — we use removable vinyl adhesive that peels off drywall, painted surfaces, and glass cleanly. No residue, no paint damage. Ideal for rental spaces, seasonal displays, or businesses that update their décor regularly. Permanent vinyl options are also available for lobby features and exterior applications.",
        },
        {
          q: "What surfaces can vinyl wall graphics go on?",
          a: "Painted drywall, glass, brick, metal, MDF, and wood. Textured or rough surfaces may require a different vinyl type — mention your wall surface when ordering and we'll confirm the right material. Removable vinyl works best on smooth, clean paint.",
        },
        {
          q: "What's the difference between wall graphics and wallpaper?",
          a: "Wall graphics are cut or printed vinyl panels applied to a smooth wall — no glue, no soaking, no professional wallpaper hanger needed. They're applied like a large sticker. Much faster to install and remove than wallpaper. Full-colour photo-quality printing is available on vinyl at any custom size.",
        },
        {
          q: "Can you print custom wall graphics in Saskatoon?",
          a: "Yes — True Color prints full-colour custom wall graphics in-house on our Roland UV printer. Any design, any size up to 60\" wide. Our in-house designer can build your layout from a rough concept, match brand colours, and provide a to-scale digital proof before printing.",
        },
        {
          q: "How long do wall graphics last?",
          a: "Indoor removable vinyl lasts 3–5 years under normal conditions. Permanent indoor vinyl lasts 5–7 years. Outdoor vinyl (window graphics, exterior walls) is rated 3–5 years UV-resistant. We print with UV-cured inks that resist fading from overhead lighting and indirect sunlight.",
        },
        {
          q: "Do you install wall graphics?",
          a: "Installation service is available — ask when you place your order. Most customers with DIY experience install smaller graphics themselves. For larger installs (lobby murals, full retail wall wraps), professional installation is recommended. We can connect you with local installers we work with regularly.",
        },
        {
          q: "What file do I need to provide for wall graphics?",
          a: "PDF at 150 dpi minimum at print size. JPG is accepted for photo-based prints. If you don't have a print-ready file, our in-house designer will build the layout from your brief for $35–$50. We also clean up low-resolution logos for large-format use.",
        },
      ]}
    />
  );
}
