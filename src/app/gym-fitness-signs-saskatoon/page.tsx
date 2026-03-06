import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Gym & Fitness Signs Saskatoon | Banners, Decals & More | True Color",
  description:
    "Grand opening banners from $66, retractable banners from $219, and window decals from $11/sqft for Saskatoon gyms and fitness studios. Local pickup at 216 33rd St W.",
  alternates: { canonical: "/gym-fitness-signs-saskatoon" },
  openGraph: {
    title: "Gym & Fitness Signs Saskatoon | True Color Display Printing",
    description:
      "Grand opening banners, class schedule boards, and membership drive signage for Saskatoon gyms, CrossFit boxes, and yoga studios. Rush +$40. Local pickup.",
    url: "https://truecolorprinting.ca/gym-fitness-signs-saskatoon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

const descriptionNode = (
  <>
    Saskatoon gyms, CrossFit boxes, yoga studios, martial arts schools, and personal
    training studios count on True Color for signage that pulls members in and keeps the
    energy high inside. A grand opening vinyl banner — 2×4 ft from $66, 3×6 ft from $135,
    grommets included — is the single highest-ROI print piece a new fitness studio can hang.
    Our Roland UV printer handles bold, saturated gym palettes: neon greens, deep blacks,
    high-contrast reds. Colours stay vibrant outdoors for 3–5 years without fading. Retractable
    banners from $219 work hard at reception desks, membership drives, and community fitness
    expos. Foamboard class schedule boards keep your lobby looking professional without the
    cost of a permanent wall installation — swap them out each quarter. Window decals let your
    storefront glass double as a billboard: price lists, class times, brand accent panels all
    from $11/sqft. Need artwork? Our in-house Photoshop designer handles it for $35 flat with
    a same-day proof — no outside agency required. Same-day rush is available for +$40 flat
    when you order before 10 AM. We are located at 216 33rd St W, Saskatoon — walk-in welcome.{" "}
    See{" "}
    <Link
      href="/products/vinyl-banners"
      className="text-[#16C2F3] underline font-medium"
    >
      vinyl banner pricing
    </Link>{" "}
    or browse our full{" "}
    <Link
      href="/sports-signs-saskatoon"
      className="text-[#16C2F3] underline font-medium"
    >
      sports and recreation signage options
    </Link>
    .
  </>
);

export default function GymFitnessSignsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="gym-fitness-signs-saskatoon"
      primaryProductSlug="vinyl-banners"
      title="Gym & Fitness Signs Saskatoon"
      subtitle="Grand opening banners, class schedule boards, and membership drive signage — printed in-house, picked up locally."
      heroImage="/images/products/heroes/sports-hero-1200x500.webp"
      heroAlt="Vinyl banners and window decals for Saskatoon gyms and fitness studios printed by True Color Display Printing"
      description="Saskatoon gyms, CrossFit boxes, yoga studios, martial arts schools, and personal training studios count on True Color for signage that pulls members in. A grand opening vinyl banner starts at $66 for a 2×4 ft, grommets included. Our Roland UV printer handles bold gym palettes — neon greens, deep blacks, high-contrast reds — that stay vibrant outdoors for 3–5 years. Retractable banners from $219, foamboard class schedule boards, and window decals from $11/sqft round out a complete gym signage kit. In-house designer $35 flat, same-day proof. Rush +$40."
      descriptionNode={descriptionNode}
      products={[
        { name: "Vinyl Banners", from: "2×4 ft from $66", slug: "vinyl-banners" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Foamboard Displays", from: "from $8/sqft", slug: "foamboard-displays" },
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
      ]}
      whyPoints={[
        "Grand opening banners from $66 — 2×4 ft with grommets, ready in 1–3 business days",
        "Roland UV in-house printer produces neon, high-contrast gym palettes that hold colour outdoors for 3–5 years",
        "Retractable banners from $219 — perfect for reception desks, membership drives, and fitness expos",
        "Class schedule foamboard boards from $8/sqft — swap them each quarter without permanent wall damage",
        "Window decals from $11/sqft turn storefront glass into branded real estate visible from the street",
        "In-house Photoshop designer — $35 flat, same-day proof, no outside agency required",
        "Same-day rush +$40 flat — order before 10 AM, pick up at 216 33rd St W, Saskatoon",
      ]}
      faqs={[
        {
          q: "How much does a grand opening banner cost for a new gym?",
          a: "A 2×4 ft vinyl banner costs $66 and a 3×6 ft banner costs $135, grommets included. Larger custom sizes are priced from $8.25/sqft. We recommend a minimum of 3×6 ft for street-facing visibility. Same-day rush is +$40 flat if ordered before 10 AM.",
        },
        {
          q: "What signage does a new CrossFit box or martial arts studio typically need?",
          a: "Most new fitness studios order a combination of: one outdoor grand opening banner (3×6 ft, $135), one or two retractable banners for reception ($219–$349), window decals for the storefront glass ($11/sqft, min $45), and a foamboard class schedule board for the lobby (from $8/sqft). Our designer bundles the artwork across all pieces for $35 flat.",
        },
        {
          q: "Can you match my gym's brand colours exactly?",
          a: "Yes — our Roland UV printer reproduces Pantone-accurate colours. Send your brand guide or existing logo files and our in-house designer matches them. If you have a reference printed piece, bring it in and we colour-match on the press. Design fee is $35 flat per project.",
        },
        {
          q: "How do retractable banners work for a fitness studio lobby?",
          a: "A retractable banner (also called a pull-up or roll-up banner) stands on its own base and rolls up for storage. Economy model starts at $219 and includes the stand and carry bag. Deluxe is $299 and Premium is $349. Common uses in gyms: membership packages at reception, class schedule promos, sponsor displays, and fitness expo booths.",
        },
        {
          q: "How long do outdoor vinyl banners last in Saskatchewan weather?",
          a: "Our vinyl banners are printed on 13 oz scrim vinyl using UV-resistant inks on our Roland UV printer. In Saskatchewan's climate — including winter cold and summer UV — they typically last 3–5 years with normal outdoor use. Grommets are standard on all four corners for secure hanging.",
        },
        {
          q: "Can I get a membership drive flyer printed at the same time as my banner?",
          a: "Yes — we handle everything in one order. Flyers start at 100 for $45 or 500 for $135. We keep your brand files on record so reorders are fast. Same-day rush is available for +$40 flat if ordered before 10 AM.",
        },
        {
          q: "Do you do window lettering and vinyl cutouts for gym storefronts?",
          a: "Yes — vinyl lettering starts from $8.50/sqft (minimum $40) and window decals start from $11/sqft (minimum $45). Common uses for gyms: logo on glass doors, class schedule window panels, and promotional colour accent blocks. Our Roland UV printer also produces full-colour decals if your artwork includes photos or gradients.",
        },
      ]}
    />
  );
}
