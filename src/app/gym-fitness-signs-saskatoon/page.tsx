import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Gym & Fitness Signs Saskatoon | Banners | True Color" },
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
    Opening week at a Saskatoon gym is your highest-visibility moment — and the signage needs
    to match. A grand opening vinyl banner — 2×4 ft from $66, 3×6 ft from $135, grommets
    included — is the single highest-ROI print piece a new fitness studio can hang. Colours
    that stay vivid: our Roland UV printer handles bold, saturated gym palettes — neon greens,
    deep blacks, high-contrast reds — printed in-house so there are no outsourcing delays and
    no quality surprises on your brand palette. Outdoor durability runs 3–5 years without
    fading. Retractable banners from $219 pull their weight at reception desks, membership
    drives, and community fitness expos. Foamboard class schedule boards keep your lobby sharp
    without the cost of a permanent wall installation — swap them out each quarter for $10/sqft.
    Window decals turn your storefront glass into a second billboard: price lists, class times,
    brand accent panels — all from $11/sqft. Need artwork? Our in-house Photoshop designer
    handles it for $35 flat with a same-day proof — no outside agency, no back-and-forth
    delays. We print your order same-day for +$40 flat when you place it before 10 AM. Walk in
    at 216 33rd St W, Saskatoon.{" "}
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
      subtitle="Make opening week count — grand opening banners from $66, class boards, and membership signage printed in-house and ready to hang."
      heroImage="/images/products/heroes/sports-hero-1200x500.webp"
      heroAlt="Vinyl banners and window decals for Saskatoon gyms and fitness studios printed by True Color Display Printing"
      description="Opening week at a Saskatoon gym is your highest-visibility moment — and the signage needs to match. Grand opening vinyl banners start at $66 for 2×4 ft with grommets included. Colours stay vivid with our in-house Roland UV printer — bold gym palettes in neon greens, deep blacks, and high-contrast reds that hold outdoors for 3–5 years. Retractable banners from $219, foamboard class schedule boards from $10/sqft, and window decals from $11/sqft complete the kit. In-house designer $35 flat, same-day proof. Rush +$40."
      descriptionNode={descriptionNode}
      products={[
        { name: "Vinyl Banners", from: "2×4 ft from $66", slug: "vinyl-banners" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Foamboard Displays", from: "from $10/sqft", slug: "foamboard-displays" },
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
      ]}
      whyPoints={[
        "Grand opening banners from $66 — 2×4 ft with grommets, ready to hang in 1–3 business days",
        "Colours that hold: Roland UV in-house means neon gym palettes printed without outsourcing — no quality surprises on your brand colours",
        "Retractable banners from $219 — membership packages sell better with a visual at reception than a brochure on a shelf",
        "Quarter-swap class schedule boards from $10/sqft — update your lobby display without touching the wall",
        "Window decals from $11/sqft — your storefront glass does double duty as branded street-facing advertising",
        "In-house Photoshop designer — $35 flat, same-day proof, your artwork matched without an outside agency",
        "We print your order same-day for +$40 flat — place it before 10 AM, pick it up at 216 33rd St W, Saskatoon",
      ]}
      faqs={[
        {
          q: "How much does a grand opening banner cost for a new gym?",
          a: "A 2×4 ft vinyl banner costs $66 and a 3×6 ft banner costs $135, grommets included. Larger custom sizes are priced from $8.25/sqft. We recommend a minimum of 3×6 ft for street-facing visibility. Same-day rush is +$40 flat if ordered before 10 AM.",
        },
        {
          q: "What signage does a new CrossFit box or martial arts studio typically need?",
          a: "Most new fitness studios order a combination of: one outdoor grand opening banner (3×6 ft, $135), one or two retractable banners for reception ($219–$349), window decals for the storefront glass ($11/sqft, min $45), and a foamboard class schedule board for the lobby (from $10/sqft). Our designer bundles the artwork across all pieces for $35 flat.",
        },
        {
          q: "Can you match my gym's brand colours exactly?",
          a: "Yes — our Roland UV printer reproduces Pantone-accurate colours. Send your brand guide or existing logo files and our in-house designer matches them. If you have a reference printed piece, bring it in and we colour-match on the press. Design fee is $35 flat per project.",
        },
        {
          q: "How do retractable banners work for a fitness studio lobby?",
          a: "A retractable banner stands on its own base and rolls up for storage — no tools, no wall damage. Economy model starts at $219 and includes the stand and carry bag. Deluxe is $299 and Premium is $349. Common gym uses: membership packages at reception, class schedule promos, sponsor displays, and fitness expo booths.",
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
