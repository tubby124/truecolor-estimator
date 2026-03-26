import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Perforated Window Vinyl Saskatoon | $8/sqft | True Color" },
  description:
    "Perforated window vinyl (window perf) from $8/sqft in Saskatoon. 70/30 ratio — see-through from inside, full-colour graphic from outside. In-house Roland UV. Same-day rush +$40.",
  alternates: { canonical: "/window-perf-saskatoon" },
  openGraph: {
    title: "Perforated Window Vinyl Saskatoon | True Color Display Printing",
    description:
      "Window perf from $8/sqft in Saskatoon. Brand your storefront windows while preserving interior visibility. Local pickup 216 33rd St W. Same-day rush available.",
    url: "https://truecolorprinting.ca/window-perf-saskatoon",
    type: "website",
  },
};

export default function WindowPerfSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="window-perf-saskatoon"
      primaryProductSlug="window-perf"
      title="Perforated Window Vinyl Saskatoon"
      subtitle="Turn your storefront windows into full-colour billboards — see-through from inside, fully branded from outside."
      heroImage="/images/products/product/perf-vinyl-interior-seethrough-800x600.webp"
      heroAlt="Perforated window vinyl interior view — see-through from inside while showing full-colour graphic outside"
      description="Perforated window vinyl (window perf) from $8/sqft (minimum $40) in Saskatoon. The 70/30 perforation pattern gives you a continuous full-colour graphic visible to people outside, while staff and customers inside retain a clear view of the street. Printed on Roland UV with outdoor-rated inks. Applied like a standard decal, removed cleanly when your campaign ends."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            Perforated window vinyl (window perf) is the product that lets you brand a storefront
            window without blocking interior visibility or natural light. The 70/30 pattern means
            70% of the surface is printed — passersby outside see your full graphic continuously —
            while the 30% open perforation lets people inside see out clearly. Window perf starts
            at <strong>$8/sqft</strong> (minimum $40) and is printed on our in-house Roland UV
            printer at 216 33rd St W, Saskatoon.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Common uses across Saskatoon: restaurant and café windows with seasonal menu graphics,
            fitness studio glass walls, retail franchise storefronts, vehicle rear windows for
            fleet branding, and election campaign vehicles. Window perf applies to smooth exterior
            glass — avoid applying over tinted film or frosted glass. For multi-panel installs
            across wide windows, we recommend professional application ($75 base rate) for clean
            seam alignment. Single panels are straightforward to self-apply on flat glass. For
            interior-only glass signage or smaller decorative graphics, our{" "}
            <Link
              href="/window-decals-saskatoon"
              className="text-[#16C2F3] underline font-medium"
            >
              adhesive vinyl window decals
            </Link>{" "}
            (from $11/sqft) are the better choice.
          </p>
          <p className="text-gray-600 leading-relaxed">
            All window perf is custom-sized to your exact window dimensions — no standard sizes to
            conform to. Standard turnaround is 1–3 business days. Same-day production available
            for a <strong>+$40 flat</strong> rush fee when ordered before 10 AM. Our in-house
            designer can set up your artwork for <strong>$35 flat</strong> with a same-day proof.
            For wall and interior branding beyond glass, see our{" "}
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
      galleryImages={[
        { src: "/images/products/product/perf-vinyl-interior-seethrough-800x600.webp", alt: "Perforated window vinyl interior view — see-through from inside while displaying full graphic outside Saskatoon" },
        { src: "/images/products/product/window-perf-gym-storefront-800x600.webp", alt: "Gym fitness studio storefront window perf — full-colour perforated vinyl Saskatoon" },
        { src: "/images/products/product/perf-vinyl-closeup-texture-800x600.webp", alt: "Close-up texture of perforated window vinyl — 70/30 perf pattern True Color Display Printing" },
        { src: "/images/products/product/window-perf-800x600.webp", alt: "Window perf storefront exterior view — full-colour graphic visible from street Saskatoon" },
      ]}
      products={[
        { name: "Window Perf", from: "from $8/sqft", slug: "window-perf" },
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
        { name: "Vinyl Lettering", from: "from $8.50/sqft", slug: "vinyl-lettering" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
      ]}
      whyPoints={[
        "Brand your windows without blocking visibility — 70% printed coverage, 30% open perforations",
        "From $8/sqft (min $40) — custom-sized to your exact window dimensions",
        "Passersby see your full-colour graphic; staff inside see the street clearly",
        "Printed on Roland UV with outdoor inks — 2–3 years rated Saskatchewan exposure",
        "Applies like a standard decal, removes cleanly when your campaign or lease ends",
        "Same-day turnaround for +$40 flat — order before 10 AM, pick up same day",
        "In-house designer $35 flat with same-day proof — bring your logo and window size",
      ]}
      faqs={[
        {
          q: "How much does perforated window vinyl cost in Saskatoon?",
          a: "Window perf starts at $8/sqft with a $40 minimum order. A 24×48\" (8 sqft) panel is $64. A full 36×72\" storefront panel (18 sqft) is around $126. Pricing scales by square footage — use the estimator at /products/window-perf for exact pricing on your dimensions.",
        },
        {
          q: "Can people see through window perf from outside?",
          a: "No — from outside, people see a solid full-colour graphic. The perforated holes are too small to register at normal viewing distance. From inside, you can see out clearly through the 30% open area. The effect depends on lighting: in daylight, exterior is opaque and interior is see-through. At night with interior lights on, the effect reverses.",
        },
        {
          q: "What is the difference between window perf and a regular window decal?",
          a: "A standard adhesive window decal is fully opaque — you can't see through it at all. Perforated vinyl (window perf) has a micro-hole pattern that lets you see out from inside while displaying a full graphic to people outside. Window decals start at $11/sqft; perf starts at $8/sqft. Choose perf when interior visibility matters — retail floors, restaurants, showrooms.",
        },
        {
          q: "Does window perf work on all glass?",
          a: "Window perf works best on smooth, clean exterior glass. Avoid applying over existing tinted film, frosted glass, or textured glass — the adhesive won't bond evenly and the perf pattern won't lay flat. For vehicle rear windows, confirm the glass is flat (some curved rear windows require a professional installer).",
        },
        {
          q: "How long does window perf last outdoors in Saskatchewan?",
          a: "We print window perf with Roland UV outdoor inks on 6 mil Vision Perf material rated for 2–3 years of outdoor exposure in Saskatchewan conditions. UV degradation and extreme temperature cycling (-40°C winters) are the main factors. Most seasonal or campaign graphics are removed before the end of their rated life.",
        },
        {
          q: "Can you install window perf?",
          a: "We supply the window perf pre-masked for application. Self-application on a flat, single-panel window is straightforward — we include instructions. For multi-panel installs across wide windows or irregular window arrangements, we recommend professional installation at $75 base rate to ensure clean seam alignment.",
        },
      ]}
    />
  );
}
