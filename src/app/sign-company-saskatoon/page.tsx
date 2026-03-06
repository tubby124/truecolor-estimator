import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Sign Company Saskatoon | Coroplast & ACP | True Color" },
  description:
    "Saskatoon sign company — coroplast from $8/sqft, ACP aluminum from $13/sqft, vinyl lettering, vehicle magnets. Same-day rush +$40. In-house print at 216 33rd St W.",
  alternates: { canonical: "/sign-company-saskatoon" },
  openGraph: {
    title: "Sign Company Saskatoon | Coroplast, ACP & Vinyl | True Color",
    description:
      "Full-service sign company in Saskatoon. Coroplast from $8/sqft, ACP from $13/sqft, same-day rush available. Local pickup 216 33rd St W.",
    url: "https://truecolorprinting.ca/sign-company-saskatoon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function SignCompanySaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="sign-company-saskatoon"
      primaryProductSlug="coroplast-signs"
      title="Sign Company — Saskatoon"
      subtitle="Coroplast, ACP aluminum, vinyl lettering, vehicle magnets. Printed in-house. Same-day available."
      heroImage="/images/products/heroes/construction-hero-1200x500.webp"
      heroAlt="Coroplast and aluminum signs printed in Saskatoon by True Color Display Printing"
      description={
        "A sign company prints, cuts, and finishes custom signs from submitted artwork or designs them in-house. True Color Display Printing is a Saskatoon sign company at 216 33rd St W specializing in coroplast signs from $8/sqft, ACP aluminum signs from $13/sqft, vinyl banners from $8.25/sqft, vehicle magnets, window decals, and vinyl lettering — all printed on an in-house Roland UV printer with 1–3 business day turnaround.\n\nSign material comparison: coroplast (4mm corrugated plastic) costs $8/sqft and suits temporary outdoor use rated 2–3 years; ACP aluminum composite (3mm rigid panel) costs $13/sqft and suits permanent storefront and exterior signage rated 7–10 years; vinyl banners cost $8.25/sqft and suit event, fence, and flexible-hang applications. Same-day rush is available on all sign products for +$40 flat.\n\nTrue Color Display Printing is Saskatoon's in-house sign company — everything from temporary coroplast yard signs to permanent ACP aluminum panels is designed, printed, and cut under one roof at 216 33rd St W. No outsourcing to a national supplier, no waiting a week for your order to ship from Vancouver. Most sign orders are ready in 1–3 business days.\n\nCoroplast (corrugated plastic) is the go-to material for temporary outdoor signs in Saskatchewan. At 4mm thickness, it's lightweight, UV-resistant, and reusable season after season. Yard signs, job site signs, election signs, real estate listings, and event directional signs are all common coroplast applications. Standard sizes start at 18×24\" ($30) and go up to 4×8 ft sheets ($232). H-wire stakes are $2.50 each for ground mounting.\n\nFor permanent business signage, ACP (aluminum composite panel) is the professional choice. 3mm aluminum composite with a polyethylene core — rigid, weather-resistant, and clean-looking mounted on standoffs. ACP panels work for storefront signs, office directories, building exterior signs, and construction hoarding panels. Starting at $13/sqft single-sided — a 24×36\" panel is $66.\n\nVinyl lettering and cut graphics handle text-only applications: window lettering, equipment labels, vehicle door text, and office door identification. Precision plotter-cut, no background material, clean edge finish. Vehicle magnets from $18/sqft — door magnets that turn any truck or van into a mobile billboard for your business, with no paint damage.\n\nEvery sign order includes an in-house design review. Our designer checks your file for print-readiness, corrects colour profiles, and flags issues before the job goes to press. If you need a layout built from scratch, that's a $35 flat fee. Same-day rush is available on all sign products for +$40 flat when ordered before 10 AM.\n\nSaskatoon businesses, contractors, event organizers, and government offices choose True Color because the turnaround is fast, the quality is consistent, and you're dealing with one shop — not a broker who ships your job somewhere else."
      }
      products={[
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Vinyl Lettering", from: "custom quote", slug: "vinyl-lettering" },
        { name: "Vehicle Magnets", from: "from $18/sqft", slug: "vehicle-magnets" },
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
        { name: "Vinyl Banners", from: "from $90", slug: "vinyl-banners" },
      ]}
      whyPoints={[
        "Coroplast yard signs from $8/sqft — 18×24\" for $30, 4×8 ft for $232, H-stakes $2.50 ea",
        "ACP aluminum signs from $13/sqft — 24×36\" for $66, permanent outdoor-rated substrate",
        "Vehicle magnets from $18/sqft — removable, no paint damage, full-colour UV print",
        "Vinyl lettering for windows, vehicles, and equipment — precision plotter, clean edge finish",
        "In-house Roland UV printer — same building as your designer, no outsourcing",
        "Same-day rush for +$40 flat on all sign products when ordered before 10 AM",
        "In-house designer handles layouts from scratch — $35 flat, proof same day",
        "Local pickup at 216 33rd St W, Saskatoon — no shipping, no waiting",
      ]}
      faqs={[
        {
          q: "How much do coroplast signs cost in Saskatoon?",
          a: "Coroplast signs at True Color start at $8/sqft single-sided. Common sizes: 18×24\" = $30, 24×36\" = $58, 4×4 ft = $116, 4×8 ft = $232. Volume pricing: $7.50/sqft at 10+ sqft, $7.25/sqft at 25+ sqft. H-wire ground stakes are $2.50 each.",
        },
        {
          q: "What's the difference between coroplast and ACP aluminum signs?",
          a: "Coroplast is corrugated plastic — lightweight, inexpensive, and great for temporary signs (real estate, events, job sites, elections). It lasts 2–3 years outdoors. ACP (aluminum composite panel) is a rigid 3mm aluminum panel — permanent, professional-looking, and suited for storefront signage, office directories, and long-term outdoor use. ACP starts at $13/sqft vs $8/sqft for coroplast.",
        },
        {
          q: "How long do coroplast signs last outdoors in Saskatchewan?",
          a: "Properly stored, coroplast signs last 2–3 seasons of outdoor use. Saskatchewan UV exposure will fade unlaminated prints over time — if you need longer life outdoors, ACP aluminum is the better choice. Coroplast is ideal for seasonal signs, events, and short-term campaigns where cost matters.",
        },
        {
          q: "Can I get signs made same day in Saskatoon?",
          a: "Yes — same-day rush printing is available for +$40 flat on orders placed before 10 AM. Call (306) 954-8688 to confirm capacity for your quantity. Most same-day orders are ready for pickup by 4–5 PM.",
        },
        {
          q: "Do you offer graphic design for signs?",
          a: "Yes — our in-house designer handles sign layouts for a flat fee of $35. That covers the initial proof and two revision rounds. If you have existing artwork, we'll review your file for free and flag any issues before printing. Logo creation and more complex sign packages are quoted individually.",
        },
        {
          q: "What size are standard yard signs?",
          a: "The most common yard sign size in Saskatoon is 18×24\" — it's the standard for real estate, election campaigns, and job site signs. 24×36\" is popular for higher-visibility placements and commercial properties. 4×8 ft sheets are used for large job site hoardings and building identification.",
        },
        {
          q: "How much do ACP aluminum signs cost in Saskatoon?",
          a: "ACP signs at True Color start at $13/sqft single-sided. Common sizes: 12×18\" = $29, 24×36\" = $66, 4×4 ft = $136, 4×8 ft = $272. ACP is the material of choice for permanent storefront signs, office building directories, and any application where rigid, weather-resistant signage is required.",
        },
        {
          q: "Where can I get a sign made in Saskatoon?",
          a: "True Color Display Printing is at 216 33rd St W, Saskatoon, SK S7L 0V5 — west side of the city near Circle Drive. We print coroplast, ACP, vinyl banners, vehicle magnets, and window decals in-house with a standard 1–3 business day turnaround. Same-day rush available. Call (306) 954-8688.",
        },
      ]}
    />
  );
}
