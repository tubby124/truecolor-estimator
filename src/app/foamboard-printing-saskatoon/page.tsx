import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Foam Board Printing Saskatoon | From $45 | True Color" },
  description:
    "Foam board printing in Saskatoon from $45 for 18×24\". Sharp edges, 5mm foam, lightweight indoor display. Offices, retail, events & trade shows. Rush +$40.",
  alternates: {
    canonical: "/foamboard-printing-saskatoon",
  },
  openGraph: {
    title: "Foam Board Printing Saskatoon | True Color Display Printing",
    description:
      "Foam board printing in Saskatoon from $45 for 18×24\". Sharp edges, 5mm foam, lightweight indoor display. Offices, retail, events & trade shows. Rush +$40.",
    url: "https://truecolorprinting.ca/foamboard-printing-saskatoon",
    type: "website",
  },
};

const description =
  "When you need a display that looks polished at close range — at a trade show booth, a retail counter, or an open house — foam board delivers at a fraction of the cost of framed prints or custom fixtures. Foamboard printing in Saskatoon starts at $45 for an 18×24\" board and $65 for a 24×36\" board, printed on 5mm white foam core using our in-house Roland UV printer for full-colour, photo-quality results with sharp edges. Standard turnaround is 1–3 business days. Same-day rush is +$40 flat when ordered before 10 AM. In-house designer handles layout for $35 flat with a same-day proof. Local pickup at 216 33rd St W, Saskatoon.";

export default function FoamboardPrintingSaskatoon() {
  return (
    <IndustryPage
      title="Foam Board Printing Saskatoon"
      subtitle="Display boards from $45 that look polished at close range — trade shows, retail, open houses, and offices in Saskatchewan"
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="Foam board display prints for retail and events in Saskatoon"
      description={description}
      descriptionNode={
        <>
          <p>
            When you need a display that looks polished at close range — at a trade show booth,
            a retail counter, or an open house — foam board delivers at a fraction of the cost
            of framed prints or custom fixtures. Foamboard printing in Saskatoon starts at{" "}
            <strong>$45 for an 18×24&Prime; board</strong> and{" "}
            <strong>$65 for a 24×36&Prime; board</strong>, printed on 5mm white foam core using
            our in-house Roland UV printer. Full colour, photo-quality output prints directly
            onto the foam surface — crisp text and sharp images that hold detail when someone
            is standing two feet away.
          </p>
          <p>
            Foamboard works anywhere you need a rigid indoor panel without permanent wall
            commitment: menu boards, office directories, trade show display panels, real estate
            open house signs, school hallway displays, event programmes, and restaurant specials
            boards. Panels mount with adhesive strips, foam tape, or a simple wall bracket — no
            framing, no installation crew.{" "}
            <Link
              href="/trade-show-displays-saskatoon"
              className="text-[#16C2F3] underline font-medium"
            >
              Trade show display packages
            </Link>{" "}
            frequently pair foamboard panels with{" "}
            <Link
              href="/products/retractable-banners"
              className="text-[#16C2F3] underline font-medium"
            >
              retractable banners
            </Link>{" "}
            (from $219) for a complete booth setup without renting display hardware.
          </p>
          <p>
            Restaurants and retailers swap foamboard menu boards and promotional panels
            seasonally without touching a wall. Need a custom size?{" "}
            <Link
              href="/products/foamboard-displays"
              className="text-[#16C2F3] underline font-medium"
            >
              See the full foamboard estimator
            </Link>{" "}
            for dimensions and quantities. Same-day rush is +$40 flat, order before 10 AM. Our
            in-house designer creates your layout for $35 flat with a same-day proof — no files
            required. Standard turnaround is 1–3 business days. Local pickup at 216 33rd St W,
            Saskatoon — call{" "}
            <a href="tel:+13069548688" className="text-[#16C2F3] underline font-medium">
              (306) 954-8688
            </a>
            .
          </p>
        </>
      }
      products={[
        {
          name: "Foamboard Displays",
          from: "From $45 — 18×24\" | $65 for 24×36\"",
          slug: "foamboard-displays",
        },
        {
          name: "Retractable Banners",
          from: "From $219 Economy | $299 Deluxe",
          slug: "retractable-banners",
        },
        {
          name: "Vinyl Banners",
          from: "From $8.25/sqft — grommets incl.",
          slug: "vinyl-banners",
        },
        {
          name: "Coroplast Signs",
          from: "From $8/sqft — 18×24\" = $24",
          slug: "coroplast-signs",
        },
        {
          name: "Flyers",
          from: "From $45 for 100 copies",
          slug: "flyers",
        },
      ]}
      whyPoints={[
        "Polished at close range: Roland UV prints full-colour, photo-quality directly onto foam — no laminate, no visual degradation",
        "5mm white foam core — rigid enough to wall-mount flat, light enough to carry to a trade show without checking luggage",
        "18×24\" starts at $45 | 24×36\" starts at $65 — no minimum order, no setup fees",
        "We print same-day for +$40 flat — order before 10 AM, pick up same day in Saskatoon",
        "In-house designer for $35 flat, same-day proof — show up with a logo and a list of points, leave with a file-ready layout",
        "Mounts with adhesive strips, foam tape, or a standard wall bracket — no framing, no installation crew",
        "1–3 business day standard turnaround | Local pickup at 216 33rd St W, Saskatoon",
      ]}
      faqs={[
        {
          q: "How much does foam board printing cost in Saskatoon?",
          a: "Foam board printing starts at $45 for an 18×24\" board and $65 for a 24×36\" board. Pricing scales with size — use our online estimator for custom dimensions. Rush same-day production is +$40 flat when ordered before 10 AM.",
        },
        {
          q: "What thickness of foam board do you print on?",
          a: "We print on 5mm white foam core. It is rigid enough to stand upright in a display frame or mount flat on a wall with adhesive strips, while light enough to carry and reposition easily. The Roland UV prints directly onto the surface — no laminate required.",
        },
        {
          q: "Can I use foam board for a restaurant menu board or retail promotional display?",
          a: "Yes. Foamboard menu boards and promotional panels are a popular choice for restaurants and retail stores. They mount easily with adhesive strips or foam tape, swap out between seasons, and produce sharp text and vivid images at close viewing distance. An 18×24\" board is $45 and a 24×36\" board is $65.",
        },
        {
          q: "Do you print foam board panels for trade show booths?",
          a: "Yes. Foamboard panels are commonly used alongside retractable banners (from $219) for trade show booths. Panels can be custom-sized, printed with product photos, pricing, or brand graphics, and mounted on standard display frames. See our trade show displays page for complete booth options.",
        },
        {
          q: "Can foam board be used for real estate open house signs?",
          a: "Yes. Real estate agents use foamboard for open house directional boards, feature sheets mounted on easels, and interior property-highlight panels. An 18×24\" board is $45. They are lightweight, easy to carry, and look polished at close range indoors. For outdoor signs, coroplast (also from $8/sqft) is the better choice.",
        },
        {
          q: "How do I mount a foam board print to a wall?",
          a: "The most common methods are foam double-sided tape, removable adhesive strips (like Command strips), or small L-bracket wall mounts. The 5mm board is lightweight so most adhesive mounting products work well. We can also score and notch boards for easel back-mounting on request.",
        },
        {
          q: "How fast can you produce foam board prints in Saskatoon?",
          a: "Standard turnaround is 1–3 business days from artwork approval. Same-day rush production is available for +$40 flat — order before 10 AM and pick up by end of business day. Everything is printed in-house on our Roland UV so there are no outsourcing delays.",
        },
        {
          q: "Do I need to provide print-ready artwork for foam board printing?",
          a: "No. Our in-house designer creates your layout for $35 flat with a same-day proof. Provide your logo, text, and any images or references — we handle the design and send a proof for approval before printing. Revisions are included until you sign off.",
        },
      ]}
      canonicalSlug="foamboard-printing-saskatoon"
      primaryProductSlug="foamboard-displays"
    />
  );
}
