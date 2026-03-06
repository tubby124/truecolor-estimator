import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Window Decals Saskatoon | From $11/sqft | True Color" },
  description:
    "Custom window decals from $11/sqft, perforated vinyl from $8/sqft, and vinyl lettering from $8.50/sqft in Saskatoon. In-house Roland UV. Same-day rush +$40.",
  alternates: { canonical: "/window-decals-saskatoon" },
  openGraph: {
    title: "Window Decals Saskatoon | True Color Display Printing",
    description:
      "Window decals, perforated window vinyl, and vinyl lettering for Saskatoon storefronts and offices. From $8/sqft. Local pickup. Same-day rush available.",
    url: "https://truecolorprinting.ca/window-decals-saskatoon",
    type: "website",
  },
};

export default function WindowDecalsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="window-decals-saskatoon"
      primaryProductSlug="window-decals"
      title="Window Decals Saskatoon"
      subtitle="Custom window graphics, perforated vinyl, and lettering for storefronts, offices, and vehicles — no permanent commitment."
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="Custom window decals and perforated vinyl for Saskatoon storefronts"
      description="Saskatoon businesses use True Color Display Printing for custom window decals, perforated window vinyl, and vinyl lettering. Window decals start at $11/sqft (minimum $45) and are printed full-colour on our in-house Roland UV printer. Perforated window vinyl starts at $8/sqft (minimum $40) — see out, brand in, no obstruction to interior visibility. Vinyl lettering from $8.50/sqft for hours, contact info, and logo text. All window graphics are UV-safe, removable without residue, and suitable for storefronts, offices, and vehicles. Standard turnaround is 1–3 business days. Same-day rush +$40 flat. In-house designer $35 flat with same-day proof."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            A blank storefront window is a missed opportunity — every passerby walks past
            without knowing what's inside or what's on sale. Custom window graphics turn
            that glass into your best-performing sign. Window decals start at{" "}
            <strong>$11/sqft</strong> (minimum $45) — full-colour, UV-safe, and fully
            removable without adhesive residue, so you can change the creative every season
            without repainting. We cut and print everything in-house on our Roland UV printer
            in Saskatoon. No shipping. Local pickup at 216 33rd St W.
          </p>
          <p className="text-gray-600 leading-relaxed">
            For windows where interior visibility matters — retail floors, showrooms,
            restaurant windows — our{" "}
            <Link
              href="/products/window-perf"
              className="text-[#16C2F3] underline font-medium"
            >
              perforated window vinyl
            </Link>{" "}
            (window perf) starts at <strong>$8/sqft</strong> (minimum $40). The
            perforated pattern lets you see out while passersby see your full-colour graphic.
            It blocks glare, adds branding, and is removed cleanly when your campaign ends
            or your lease is up. For addresses, hours, taglines, and logo text, our{" "}
            <Link
              href="/products/window-decals"
              className="text-[#16C2F3] underline font-medium"
            >
              vinyl lettering
            </Link>{" "}
            starts at <strong>$8.50/sqft</strong> (minimum $40) — cut-to-shape with no
            background panel, for a clean glass-etched look.
          </p>
          <p className="text-gray-600 leading-relaxed">
            All window graphics are sized to your exact window dimensions — no standard
            sizes to conform to. Need to brand a vehicle window or a glass office partition?
            We handle that too. Same-day production is available for a <strong>+$40 flat</strong>{" "}
            rush fee when ordered before 10 AM. Our in-house designer will prepare your
            artwork for <strong>$35 flat</strong> with a same-day proof, so you can approve
            exactly what goes on your glass before we cut. For wall and interior branding,
            see our{" "}
            <Link
              href="/wall-graphics-saskatoon"
              className="text-[#16C2F3] underline font-medium"
            >
              wall graphics page
            </Link>
            .
          </p>
        </>
      }
      products={[
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
        { name: "Window Perf", from: "from $8/sqft", slug: "window-perf" },
        { name: "Vinyl Lettering", from: "from $8.50/sqft", slug: "vinyl-lettering" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
      ]}
      whyPoints={[
        "Update your storefront every season — decals remove without residue, no repainting needed",
        "Window decals from $11/sqft (min $45) — full-colour, UV-safe, sized to your exact glass",
        "Perforated vinyl from $8/sqft — customers outside see your graphic, staff inside see the street",
        "Vinyl lettering from $8.50/sqft — hours, phone number, or logo text with a clean etched-glass look",
        "We run Roland UV in-house, so colour is consistent and there are no outsourcing surprises",
        "Same-day turnaround for +$40 flat — order before 10 AM, pick up same day",
        "Bring rough measurements — our designer ($35 flat, same-day proof) handles the rest",
      ]}
      faqs={[
        {
          q: "How much do custom window decals cost in Saskatoon?",
          a: "Window decals start at $11/sqft with a minimum order of $45. A standard 12×24\" decal is approximately $22, though the $45 minimum applies to small orders. Larger full-window graphics are priced by square footage. All are printed full-colour on our in-house Roland UV printer.",
        },
        {
          q: "What's the difference between window decals and perforated window vinyl?",
          a: "Window decals are solid vinyl — fully opaque, applied to the outside of your glass for maximum colour impact. Perforated vinyl (window perf) has a micro-hole pattern that lets you see out from inside while displaying your graphic to people outside. Perf starts at $8/sqft (min $40) and works well for retail windows where interior visibility matters.",
        },
        {
          q: "Will window decals damage my glass or leave residue when removed?",
          a: "No — our window decals use a removable adhesive that peels off cleanly from glass without residue, provided surfaces are clean before application. They're popular with tenants and seasonal retailers who can't make permanent modifications. We recommend having a professional installer apply large graphics for a bubble-free finish.",
        },
        {
          q: "Can you print vinyl lettering for my store hours and phone number?",
          a: "Yes — vinyl lettering starts at $8.50/sqft with a minimum of $40. This is cut-to-shape text with no background, giving a clean etched-glass look. Common uses: business hours, address, phone number, tagline, or logo text. We produce it in any colour and size you specify.",
        },
        {
          q: "Can you do same-day window graphics in Saskatoon?",
          a: "Yes — same-day production is available for a +$40 flat rush fee when ordered before 10 AM. Call (306) 954-8688 to confirm material availability. Standard turnaround is 1–3 business days after artwork approval.",
        },
        {
          q: "Do I need to measure my windows before ordering?",
          a: "Rough measurements are enough to get a quote started. Our in-house designer ($35 flat, same-day proof) can work with your window dimensions and adjust the layout to fit. For precise installation on large windows, we recommend professional application — we can advise on local installers.",
        },
      ]}
    />
  );
}
