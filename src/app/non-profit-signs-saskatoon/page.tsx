import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Non-Profit Signs Saskatoon | Banners & Boards | True Color" },
  description:
    "Non-profit signs and banners in Saskatoon from $24. Coroplast yard signs, vinyl banners, flyers, retractable banners. Volume discounts. Same-day rush +$40. 216 33rd St W.",
  alternates: { canonical: "/non-profit-signs-saskatoon" },
  openGraph: {
    title: "Non-Profit Signs Saskatoon | True Color Display Printing",
    description:
      "Fundraiser and event signage from $24. Coroplast, banners, flyers, retractable. Volume discounts, no minimums. Same-day rush. Local Saskatoon pickup.",
    url: "https://truecolorprinting.ca/non-profit-signs-saskatoon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function NonProfitSignsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="non-profit-signs-saskatoon"
      primaryProductSlug="coroplast-signs"
      title="Non-Profit Signs Saskatoon"
      subtitle="Fundraiser campaigns, galas, and awareness days — without blowing the budget."
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="Non-profit and charity signs and banners printed in Saskatoon"
      description="True Color prints signs, banners, flyers, and event displays for non-profits, charities, community organizations, and fundraising events across Saskatoon. Coroplast yard signs from $24 (18×24&quot;). Vinyl banners from $66 with grommets. Flyers 100 for $45. Retractable banners from $219 for gala entrances and donor recognition. Volume discounts apply at 5+ signs (8% off). No minimums. In-house designer $35 flat, same-day proof. Same-day rush +$40 flat on orders before 10 AM. We print in-house on our Roland UV printer. Pickup at 216 33rd St W, Saskatoon or call (306) 954-8688."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            When your print budget is $300 and your gala is Saturday, every dollar has to work.
            Coroplast yard signs start at $24 for 18×24&quot; — order 5 and save 8%. Vinyl banners
            with grommets from $66. Flyers 100 for $45. No minimums on any product. Saskatoon
            non-profits, charities, and community organizations use these to run fundraiser
            campaigns, awareness drives, and events without stretching their budgets.
            Same-day rush available for +$40 flat on orders placed before 10 AM.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Galas, auctions, and awareness events need signage that looks polished on a tight
            budget. Retractable banners ($219 Economy, $299 Deluxe) work for donor recognition
            walls, sponsor displays, and event entrances — pull up at 6 PM, pull down after the
            event. Foamboard displays from $45 handle auction item boards, event program signs,
            table numbers, and welcome boards. Vinyl banners from $66 go up outside your venue
            for street visibility. For a full event signage package, browse the{" "}
            <Link href="/event-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              event signs page
            </Link>
            {" "}for complete pricing by sign type.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Fundraiser flyers and awareness campaign handouts are printed on 80lb gloss stock —
            100 for $45, 500 for $135. Tri-fold brochures (100 for $70) work well for program
            guides, donor thank-you packages, and community information handouts. We print
            in-house on our Roland UV printer so turnaround is 1–3 business days and colour is
            sharp. Need{" "}
            <Link href="/flyer-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              flyers printed in bulk
            </Link>
            {" "}for a door-to-door campaign or canvass? We handle quantities from 100 to 10,000+.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Our in-house designer works for $35 flat with same-day proof — no need to budget for
            an agency. Bring your logo and messaging and we&apos;ll build a print-ready layout.
            We understand non-profit budgets and will help you pick the right combination of
            products to maximize visibility per dollar. Pickup at 216 33rd St W, Saskatoon or
            call (306) 954-8688.
          </p>
        </>
      }
      products={[
        { name: "Coroplast Yard Signs", from: "from $30", slug: "coroplast-signs" },
        { name: "Vinyl Banners", from: "from $66", slug: "vinyl-banners" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Foamboard Displays", from: "from $45", slug: "foamboard-displays" },
        { name: "Flyers", from: "from $45 / 100", slug: "flyers" },
        { name: "Brochures (tri-fold)", from: "from $70 / 100", slug: "brochures" },
      ]}
      whyPoints={[
        "50 lawn signs for a fundraiser campaign — coroplast 18×24\" from $30, 8% off at 5+",
        "Street visibility without the cost — vinyl banners from $66 with grommets, outdoor-rated Roland UV print",
        "Donor recognition wall done right — retractable banners from $219, pull up at 6 PM, pack flat after",
        "Full gala room covered — foamboard displays from $45 for auction boards, programs, table numbers",
        "Door-to-door flyer run — 100 for $45, 500 for $135, quantities to 10,000+",
        "Donor packages and program guides — tri-fold brochures 100 for $70",
        "No minimums — order what you need, not what a minimum forces you to order",
        "No agency budget needed — in-house designer $35 flat, logo to print-ready in same day",
      ]}
      faqs={[
        {
          q: "How much do fundraiser yard signs cost in Saskatoon?",
          a: "Coroplast yard signs are 18×24\" from $24 each, single-sided. Buy 5+ and save 8%. H-stakes are $2.50 each. For a standard lawn sign fundraiser campaign — 50 signs with stakes — you're looking at approximately $1,200–$1,350 total. We print in-house so turnaround is 1–3 business days.",
        },
        {
          q: "What signage do non-profits typically need for a gala or fundraising event?",
          a: "The most common gala package includes: retractable banners ($219+) for sponsor displays and entrances, foamboard boards ($45+) for auction items and event programs, a vinyl banner ($66+) outside the venue for street visibility, and a table sign set for donor recognition or auction lot numbers. We can quote a full event package — call (306) 954-8688.",
        },
        {
          q: "Do you offer discounts for non-profits?",
          a: "We offer the same volume discounts available to all customers — 8% off coroplast signs at 5+, and quantity pricing that drops significantly as quantities increase. For large runs (500+ flyers, 10+ banners), call (306) 954-8688 to discuss pricing. We work within non-profit budgets and can advise on the most cost-effective products for your goals.",
        },
        {
          q: "Can you print flyers for a door-to-door awareness campaign?",
          a: "Yes — flyers on 80lb gloss stock, double-sided: 100 for $45, 500 for $135. We handle quantities up to 10,000+. Bring your artwork or use our in-house designer for $35 flat. Standard turnaround is 1–3 business days. Same-day rush available for +$40 flat on orders before 10 AM.",
        },
        {
          q: "What's the fastest way to get event signage for a non-profit event this week?",
          a: "Order before 10 AM and add same-day rush (+$40 flat) — most signs are ready the same day. Foamboard displays, coroplast signs, and vinyl banners are all eligible for rush. Call (306) 954-8688 to confirm availability for your quantities. Pickup at 216 33rd St W, Saskatoon.",
        },
        {
          q: "Can you print retractable banners for a donor recognition wall?",
          a: "Yes — retractable banners are ideal for donor walls. Economy model at $219, Deluxe at $299, Premium at $349. Print a different sponsor or donor tier on each banner and line them up at the entrance or stage. They store flat in a carry bag between events. Layout from our designer is $35 flat.",
        },
        {
          q: "Do you print brochures for community programs?",
          a: "Yes — tri-fold brochures on 80lb gloss: 100 for $70, 250 for $105, 500 for $195. Common uses: donor thank-you packages, community program guides, outreach campaign handouts, newcomer welcome kits, and grant application leave-behinds. Design is $35 flat with same-day proof.",
        },
        {
          q: "Where can non-profits get signs printed in Saskatoon?",
          a: "True Color Display Printing at 216 33rd St W, Saskatoon — (306) 954-8688. We print in-house on our Roland UV printer, have no minimums, offer volume discounts, same-day rush, and an in-house designer for $35 flat. We serve non-profits, charities, and community organizations across Saskatoon and Saskatchewan.",
        },
      ]}
    />
  );
}
