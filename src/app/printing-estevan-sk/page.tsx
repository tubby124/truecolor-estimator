import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Printing Estevan SK | Signs, Banners & Magnets | True Color" },
  description:
    "Signs and printing for Estevan SK oilfield and energy businesses. Vehicle magnets from $24/sqft, ACP aluminum from $13/sqft. Printed in Saskatoon — shipped to Estevan.",
  alternates: { canonical: "/printing-estevan-sk" },
  openGraph: {
    title: "Printing Estevan SK | True Color Display Printing",
    description:
      "Vehicle magnets, ACP aluminum signs, coroplast, and vinyl banners for Estevan SK. Printed in Saskatoon — shipped to Estevan. From $24/sqft for magnets.",
    url: "https://truecolorprinting.ca/printing-estevan-sk",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function PrintingEstevanPage() {
  return (
    <IndustryPage
      canonicalSlug="printing-estevan-sk"
      primaryProductSlug="vehicle-magnets"
      title="Signs & Printing Estevan SK"
      subtitle="Vehicle magnets, ACP aluminum signs, coroplast, and vinyl banners for Estevan's oilfield and energy sector — printed in Saskatoon, shipped to Estevan."
      heroImage="/images/products/heroes/construction-hero-1200x500.webp"
      heroAlt="Signs and printing for Estevan SK oilfield and energy businesses — True Color Display Printing Saskatoon"
      description="Oilfield service companies and energy contractors in Estevan need signage that performs on a job site — not a generic print shop that outsources the work and doubles the timeline. True Color prints vehicle magnets from $24/sqft, ACP aluminum from $13/sqft, and coroplast from $8/sqft in-house on Roland UV equipment in Saskatoon. Ship directly to Estevan, about 300km southeast. Order online, approve by email, delivered in 3–5 business days."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            Oilfield service companies, heavy equipment operators, and energy contractors in
            Estevan need signage that performs on a job site and survives a prairie winter —
            not a generic print shop that outsources the work and adds a week to the timeline.
            True Color prints everything in-house in Saskatoon on our Roland UV press and ships
            directly to Estevan, about 300km southeast of Saskatoon.{" "}
            <Link href="/vehicle-magnets-saskatoon" className="text-[#16C2F3] underline font-medium">
              Vehicle magnets
            </Link>{" "}
            from $24/sqft (minimum $45) are printed on 30mil magnetic stock — built to hold on
            steel service truck doors and oilfield equipment cabs through Saskatchewan winters,
            then remove cleanly when not needed.
          </p>
          <p className="text-gray-600 leading-relaxed">
            For permanent facility and yard signage,{" "}
            <Link href="/aluminum-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              ACP aluminum signs
            </Link>{" "}
            from $13/sqft are the right choice — rigid composite panel, UV-printed on our Roland
            press, survives southeast Saskatchewan freeze-thaw cycles for 10+ years without
            fading or warping. An 18×24&quot; panel is $60 (minimum applies); 24×36&quot; is $66. Coroplast signs
            from $8/sqft for short-term site and yard signage. Vinyl banners from $8.25/sqft for
            company events, facility openings, and safety signage — 13oz outdoor-rated vinyl,
            hemmed and grommeted.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order for Estevan delivery: call (306) 954-8688 or submit at truecolorprinting.ca.
            We send a digital proof by email before printing — no surprises. After approval and
            payment, we print in-house and ship to your Estevan address. Standard timeline:
            3–5 business days. No design file? Our in-house designer handles artwork from any
            format for $35 flat, same-day proof. Rush production available for +$40 — place
            by 10 AM for same-day print.
          </p>
        </>
      }
      products={[
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
      ]}
      whyPoints={[
        "In-house Roland UV press — no outsourcing, no extra markup, ships direct to Estevan",
        "Vehicle magnets from $24/sqft — 30mil stock, stays on steel truck doors through SE Saskatchewan winters",
        "ACP aluminum from $13/sqft — permanent facility and yard signage rated 10+ years outdoors",
        "Coroplast from $8/sqft — Roland UV-printed, weatherproof, H-stakes $2.50 each",
        "Vinyl banners from $8.25/sqft — 13oz outdoor vinyl, hemmed and grommeted as standard",
        "Ships to Estevan — approve proof by email, 3–5 business days to your door",
        "In-house designer — $35 flat, same-day proof, rush production +$40",
      ]}
      faqs={[
        {
          q: "How do I order signs or vehicle magnets shipped to Estevan?",
          a: "Submit your order at truecolorprinting.ca or call (306) 954-8688. We email a digital proof for approval. Once approved and payment confirmed, we print in-house in Saskatoon and ship to your Estevan address. Standard timeline is 3–5 business days. Estevan is about 300km from Saskatoon.",
        },
        {
          q: "What does shipping to Estevan cost?",
          a: "Shipping is the customer's responsibility. We quote it before you commit. For a small order — 10 or fewer signs or a set of vehicle magnets — shipping to Estevan is typically $30–$45 by courier. ACP panels ship flat and may cost more depending on size; call (306) 954-8688 for a freight estimate on large orders.",
        },
        {
          q: "Do your vehicle magnets hold up on oilfield trucks and equipment in SE Saskatchewan?",
          a: "Yes — our vehicle magnets are printed on 30mil magnetic stock, the standard for service truck and commercial vehicle use. They stay secure on steel doors through cold prairie temperatures and highway driving. Remove cleanly with no adhesive residue. Minimum $45, priced from $24/sqft.",
        },
        {
          q: "What type of sign is best for permanent oilfield facility signage near Estevan?",
          a: "ACP aluminum composite is the right choice for permanent outdoor installation in southeast Saskatchewan's climate. It's rigid, UV-printed on our Roland press, and won't fade, warp, or delaminate for 10+ years outdoors. An 18×24\" panel is $60 (minimum applies) and a 24×36\" panel is $66. For larger signage, call (306) 954-8688.",
        },
        {
          q: "Is there a local print shop in Estevan that can produce what you offer?",
          a: "Estevan has general print services, but large-format UV printing and vehicle magnets are typically outsourced or unavailable locally. True Color owns our Roland UV press in Saskatoon — everything is produced in-house, which keeps quality consistent and prices lower than shops that outsource production.",
        },
        {
          q: "Can you rush an order for an Estevan energy company event?",
          a: "Yes — rush production is available for +$40 flat. Place your order before 10 AM and we print the same day. Factor in 1–2 additional business days for courier shipping to Estevan. For urgent orders, call (306) 954-8688 to confirm timelines before submitting online.",
        },
      ]}
    />
  );
}
