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
    A potential client decides whether to walk into your salon in about three seconds —
    before they read your reviews, before they check your Instagram. That decision happens
    at your storefront window. Window decals from $11/sqft (minimum $45) are the single
    most impactful print piece for a Saskatoon hair salon, nail salon, spa, or barber shop:
    a well-designed window communicates your price range, your aesthetic, and your services
    before anyone opens the door. Colour accuracy matters here — our Roland UV in-house
    printer reproduces your exact brand palette, whether that is a specific dusty rose,
    champagne gold, or deep plum. Send your Pantone reference or brand guide and our
    in-house designer matches it for $35 flat with a same-day proof. Foamboard service
    menu displays from $8/sqft replace the laminated handout sheet at reception or each
    station — an 18×24" board runs $45, a 24×36" runs $65. Grand opening vinyl banners
    start at $66 for a 2×4 ft and pull walk-by traffic during your first weeks open.
    Referral business cards — 250 for $40, 500 for $65 — keep your existing clients
    doing your marketing for you. We print same-day for +$40 flat on orders placed before
    10 AM. Walk in or call (306) 954-8688.{" "}
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
      subtitle="Your storefront window decides in 3 seconds — window vinyl, service menus, and referral cards printed with exact colour accuracy."
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="Window decals and foamboard service menus for Saskatoon hair salons and spas printed by True Color Display Printing"
      description="A potential client decides whether to walk into your salon before they ever read your reviews. That decision happens at your storefront window. Window decals from $11/sqft are the most impactful print piece for Saskatoon hair salons, nail salons, spas, and barber shops — our Roland UV in-house printer reproduces your exact brand palette, whether dusty rose, champagne gold, or deep plum. In-house designer $35 flat, same-day proof. Foamboard service menus from $8/sqft, referral cards 250 for $40, grand opening banners from $66. Rush +$40 flat."
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
        "Window decals from $11/sqft — clients read your prices and services from the sidewalk before they open the door",
        "Exact colour matching: Roland UV in-house reproduces your specific dusty rose, champagne gold, or deep plum — no colour drift from an outside supplier",
        "Foamboard service menus from $8/sqft — an 18×24\" board at reception replaces the laminated handout and looks the part",
        "Referral business cards 250 for $40 — your lowest cost-per-acquisition tool when a happy client hands one to a friend",
        "Grand opening vinyl banners from $66 — attract walk-by traffic during the weeks that set your client base",
        "In-house Photoshop designer — $35 flat, same-day proof, brand-accurate results without an outside agency",
        "We print same-day for +$40 flat — order before 10 AM, pick up at 216 33rd St W, Saskatoon",
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
          a: "Foamboard displays are rigid, lightweight boards (typically 3/16\" or 1/2\" thick) mounted on the wall or set in a floor stand. Most salons mount them behind the front desk to show service categories and prices, and at individual stations to list add-on services. An 18×24\" board runs approximately $45 and a 24×36\" board runs approximately $65.",
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
