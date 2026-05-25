import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Commercial Signs Saskatoon | Retail & Business | True Color" },
  description:
    "Commercial signs for Saskatoon retailers, dealerships, salons, gyms, and breweries. Coroplast, ACP, banners, and window decals printed in-house.",
  alternates: { canonical: "/commercial-signs-saskatoon" },
  openGraph: {
    title: "Commercial Signs Saskatoon | True Color Display Printing",
    description:
      "Commercial signage for Saskatoon retailers, car dealerships, salons, gyms, and breweries. ACP aluminum from $13/sqft. In-house printing.",
    url: "https://truecolorprinting.ca/commercial-signs-saskatoon",
    type: "website",
  },
};

const descriptionNode = (
  <>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      Saskatoon businesses rely on True Color for signage that drives foot traffic, reinforces
      brand identity, and holds up to Saskatchewan weather.{" "}
      <Link href="/retail-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
        Retail signs
      </Link>{" "}
      for storefronts and seasonal promotions.{" "}
      <Link href="/car-dealership-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
        Car dealership signs
      </Link>{" "}
      for lot pricing, banners, and window graphics.{" "}
      <Link href="/salon-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
        Salon and spa signs
      </Link>{" "}
      for exterior panels, window decals, and loyalty card printing.{" "}
      <Link href="/gym-fitness-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
        Gym and fitness signs
      </Link>{" "}
      for wall graphics, schedule banners, and membership displays. We print everything
      in-house on our Roland UV printer — consistent colour, fast turnaround, no middleman markup.
    </p>

    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      Food and beverage businesses are well served here too.{" "}
      <Link href="/brewery-saskatoon" className="text-[#16C2F3] underline font-medium">
        Brewery signs
      </Link>{" "}
      for taproom branding, tap handles, and event promotions.{" "}
      <Link href="/restaurant-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
        Restaurant signs
      </Link>{" "}
      for menu boards, specials banners, and grand openings. Whether you need a single
      exterior{" "}
      <Link href="/aluminum-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
        ACP aluminum panel
      </Link>{" "}
      at $13/sqft or a full run of{" "}
      <Link href="/window-decals-saskatoon" className="text-[#16C2F3] underline font-medium">
        window decals
      </Link>{" "}
      for a multi-location rollout, we quote the same day and print in 1–3 business days. Local
      pickup at 216 33rd St W — no shipping delays.
    </p>

    <p className="text-gray-600 text-lg leading-relaxed mb-10">
      Commercial signage budgets vary widely. A coroplast sidewalk sign runs $8/sqft (24×18 is
      $16, tops up to the $25 order-total minimum at checkout). A 3×8 ft vinyl banner for a grand opening is $180.{" "}
      <Link href="/aluminum-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
        ACP aluminum exterior signs
      </Link>{" "}
      start at $13/sqft — a common 24×48 storefront panel is $104. Business cards for new
      staff are 250 for $45, ready in 24–48 hours. Call{" "}
      <a href="tel:3069548688" className="text-[#16C2F3] underline font-medium">
        (306) 954-8688
      </a>{" "}
      for a same-day quote.
    </p>
  </>
);

export default function CommercialSignsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="commercial-signs-saskatoon"
      primaryProductSlug="acp-signs"
      title="Commercial Signs Saskatoon"
      subtitle="Signage for retailers, dealerships, salons, gyms, and breweries — printed in-house, ready in days."
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="Commercial signs and business signage printed in Saskatoon by True Color Display Printing"
      description="Commercial signage for Saskatoon retailers, car dealerships, salons, gyms, breweries, and restaurants. ACP aluminum exterior signs from $13/sqft. Window decals from $11/sqft. Coroplast signs from $8/sqft. Vinyl banners from $8.25/sqft. Business cards 250 for $45. Retractable banners from $219. All printed in-house at 216 33rd St W, Saskatoon — 1–3 business day turnaround, same-day rush available for +$40 flat."
      descriptionNode={descriptionNode}
      products={[
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
      ]}
      whyPoints={[
        "ACP aluminum exterior signs from $13/sqft — weather-resistant, 10+ year lifespan",
        "Window decals from $11/sqft — removable without residue, ideal for promotions",
        "Coroplast signs from $8/sqft — affordable sidewalk and temporary signage",
        "Vinyl banners from $8.25/sqft — grand openings, seasonal sales, event backdrops",
        "Business cards 250 for $45 — 14pt gloss, ready in 24–48 hours",
        "Same-day rush (+$40 flat) available on orders placed before 10 AM",
      ]}
      faqs={[
        {
          q: "What types of commercial signs do Saskatoon businesses most commonly order?",
          a: "The most requested items are: ACP aluminum exterior panels for permanent storefronts ($13/sqft), vinyl banners for grand openings and seasonal promotions ($8.25/sqft), window decals for branding and hours ($11/sqft), coroplast signs for sidewalk and temporary use ($8/sqft), and retractable banner stands for trade shows and in-store displays ($219 complete).",
        },
        {
          q: "What's the best sign material for a Saskatoon storefront exterior?",
          a: "3mm aluminum composite (ACP) is the standard for exterior storefront panels — rigid, UV-stable, and lasting 10+ years without fading or warping in Saskatchewan winters. A 24×48 inch exterior panel is $104. For temporary or seasonal use, coroplast at $8/sqft is cost-effective. Vinyl banners ($8.25/sqft) work well for grand openings and short-run promotions.",
        },
        {
          q: "How much does commercial signage cost for a small Saskatoon retail business?",
          a: "A typical package for a new retail location runs $300–$700: one 24×48 ACP exterior sign ($104), a set of window decals (small sets hit the $25 order-total minimum), 250 business cards ($45), and a 3×8 ft vinyl banner for the opening ($180). Same-day rush adds $40 flat. Volume pricing is available for multi-location rollouts — call (306) 954-8688.",
        },
        {
          q: "Can you match my brand colours exactly?",
          a: "Yes — provide your hex codes, Pantone references, or brand guide. Our Roland UV printer produces consistent, accurate colour. Bring an existing printed piece and we'll match it. In-house design is $35 flat with same-day proof if you need a layout built from scratch.",
        },
        {
          q: "Do you offer window decals that can be removed without damaging the glass?",
          a: "Yes — our window decals are printed on removable vinyl that peels off cleanly without residue. They're ideal for promotional pricing, seasonal campaigns, and business hours. Window decals start at $11/sqft with a $25 order-total minimum at checkout.",
        },
        {
          q: "How fast can you print commercial signs in Saskatoon?",
          a: "Standard turnaround is 1–3 business days after artwork approval. Same-day rush printing is available for +$40 flat on orders placed before 10 AM — call (306) 954-8688 to confirm capacity. Local pickup at 216 33rd St W.",
        },
      ]}
      relatedCities={[
        { name: "Regina", slug: "coroplast-signs-regina" },
        { name: "Moose Jaw", slug: "signs-moose-jaw-sk" },
        { name: "Prince Albert", slug: "signs-prince-albert-sk" },
        { name: "Yorkton", slug: "signs-yorkton-sk" },
      ]}
    />
  );
}
