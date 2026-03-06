import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Salon Signs Saskatoon | Window Decals, Foamboard & Cards | True Color",
  description:
    "Window decals from $11/sqft, service menu foamboards, and referral cards from $40 for Saskatoon hair salons, nail salons, and spas. Pickup at 216 33rd St W.",
  alternates: { canonical: "/salon-signs-saskatoon" },
  openGraph: {
    title: "Salon Signs Saskatoon | True Color Display Printing",
    description:
      "Window vinyl, foamboard service menus, referral cards, and grand opening banners for Saskatoon salons, spas, and barber shops. In-house designer $35. Rush +$40.",
    url: "https://truecolorprinting.ca/salon-signs-saskatoon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

const descriptionNode = (
  <>
    Saskatoon hair salons, nail salons, barber shops, spas, and esthetics studios rely on
    True Color for window vinyl, service menus, and referral cards that reflect the quality of
    their brand. Window decals are the single most important print piece for a salon: a
    well-designed storefront window communicates your price range, your aesthetic, and your
    services before a potential client ever opens the door. We print window decals from
    $11/sqft (minimum $45) using our Roland UV in-house printer, which produces rich, accurate
    colour — critical when your brand palette is a specific dusty rose, champagne gold, or
    deep plum. Colour matching is exact: send your Pantone reference or brand guide and our
    in-house designer matches it for $35 flat with a same-day proof. Foamboard service menu
    displays start from $8/sqft and are the most popular interior print piece for salons —
    mounted behind the front desk or at each station, they eliminate the need to hand clients
    a laminated sheet. Grand opening vinyl banners start at $66 for a 2×4 ft and are ideal for
    attracting walk-by traffic during your first weeks. Referral business cards — 250 for $40,
    500 for $65 — keep your clients marketing your studio for you. Same-day rush is available
    for +$40 flat when you order before 10 AM. Walk in or call (306) 954-8688.{" "}
    See{" "}
    <Link
      href="/products/window-decals"
      className="text-[#16C2F3] underline font-medium"
    >
      window decal pricing and sizes
    </Link>{" "}
    or explore our full{" "}
    <Link
      href="/retail-signs-saskatoon"
      className="text-[#16C2F3] underline font-medium"
    >
      retail and storefront signage options
    </Link>
    .
  </>
);

export default function SalonSignsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="salon-signs-saskatoon"
      primaryProductSlug="window-decals"
      title="Salon Signs Saskatoon"
      subtitle="Window vinyl, service menus, and referral cards that match your brand — printed in-house with exact colour accuracy."
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="Window decals and foamboard service menus for Saskatoon hair salons and spas printed by True Color Display Printing"
      description="Saskatoon hair salons, nail salons, barber shops, spas, and esthetics studios rely on True Color for window vinyl, service menus, and referral cards that reflect their brand quality. Window decals from $11/sqft are the most impactful storefront piece — our Roland UV printer reproduces exact brand colours, critical when your palette is a specific dusty rose, champagne gold, or deep plum. In-house designer $35 flat, same-day proof. Foamboard service menus from $8/sqft, referral cards 250 for $40, grand opening banners from $66. Rush +$40 flat."
      descriptionNode={descriptionNode}
      products={[
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
        { name: "Foamboard Displays", from: "from $8/sqft", slug: "foamboard-displays" },
        { name: "Vinyl Banners", from: "2×4 ft from $66", slug: "vinyl-banners" },
        { name: "Business Cards", from: "250 for $40", slug: "business-cards" },
        { name: "Stickers", from: "100 for $160", slug: "stickers" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
      ]}
      whyPoints={[
        "Window decals from $11/sqft — storefront branding, price lists, and colour accent panels with exact brand colour matching",
        "Roland UV in-house printer reproduces Pantone-accurate salon palettes — dusty rose, champagne gold, deep plum, true black",
        "Foamboard service menus from $8/sqft — mount behind the front desk or at each station, no laminated handout needed",
        "Referral business cards 250 for $40 — your best-performing client acquisition tool per dollar spent",
        "Grand opening vinyl banners from $66 — attract walk-by traffic during your first weeks in a new location",
        "In-house Photoshop designer — $35 flat, same-day proof, brand-accurate results without an outside agency",
        "Same-day rush +$40 flat — order before 10 AM, pick up at 216 33rd St W, Saskatoon",
      ]}
      faqs={[
        {
          q: "How much does window vinyl cost for a salon storefront in Saskatoon?",
          a: "Window decals are priced from $11/sqft with a minimum of $45. A typical salon door panel (roughly 24×36 inches = 6 sqft) runs approximately $66–$75 depending on coverage. A larger display window with price list, logo, and accent panels might range from $120–$200 depending on square footage. Our in-house designer can lay out the full window for $35 flat.",
        },
        {
          q: "Can you match our salon's brand colours exactly on printed materials?",
          a: "Yes — our Roland UV printer reproduces Pantone-accurate colour. Send us your brand guide, a hex code, or a Pantone chip and our in-house designer matches it. If you have existing printed materials from another supplier, bring a sample and we colour-match on the press. Design fee is $35 flat per project.",
        },
        {
          q: "What is the most popular signage order for a new salon opening?",
          a: "The most common new-salon package includes: one grand opening vinyl banner (2×4 ft at $66 or 3×6 ft at $135), window decals for the storefront glass (from $11/sqft), a foamboard service menu for behind the desk (from $8/sqft), and 250–500 referral business cards ($40–$65). Our designer bundles all artwork for $35 flat.",
        },
        {
          q: "How do foamboard service menus work inside a salon?",
          a: "Foamboard displays are rigid, lightweight boards (typically 3/16\" or 1/2\" thick) mounted on the wall or set in a floor stand. Most salons use them behind the front desk to display service categories and prices, and at individual stations to list add-on services. Starts from $8/sqft — an 18×24\" board runs approximately $45 and a 24×36\" board approximately $65.",
        },
        {
          q: "Can you print branded stickers for our retail product line?",
          a: "Yes — die-cut stickers are a popular product branding tool for salons selling retail lines. 4×4\" die-cut stickers are priced at 100 for $160, 250 for $325, or 500 for $475. Custom shapes and sizes available — send us your artwork or have our designer create labels for $35 flat.",
        },
        {
          q: "How quickly can you turn around salon signage for a grand opening?",
          a: "Standard turnaround is 1–3 business days from artwork approval. Same-day rush is available for +$40 flat if you order before 10 AM — call (306) 954-8688 to confirm availability. If you have a firm opening date, order at least 3–5 business days in advance to allow time for proofing and revisions.",
        },
        {
          q: "Do you do seasonal promotional banners for salons — Valentine's Day, back to school, holiday gift cards?",
          a: "Yes — seasonal banners are a common repeat order. Vinyl banners start at $66 for a 2×4 ft and $135 for a 3×6 ft, grommets included. If you reorder the same design with updated dates or messaging, reorders are fast because we keep your brand files on record. Rush +$40 flat for same-day.",
        },
      ]}
    />
  );
}
