import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Trade Show Displays Saskatoon | From $219 | True Color" },
  description:
    "Trade show displays in Saskatoon from $219. Retractable banners, vinyl banners, foamboard, coroplast signs. Roland UV, 1–3 day turnaround. 216 33rd St W.",
  alternates: { canonical: "/trade-show-displays-saskatoon" },
  openGraph: {
    title: "Trade Show Displays Saskatoon | True Color Display Printing",
    description:
      "Retractable banners from $219, foamboard displays, vinyl banners. In-house Saskatoon printing, 1–3 day turnaround.",
    url: "https://truecolorprinting.ca/trade-show-displays-saskatoon",
    type: "website",
  },
};

export default function TradeShowDisplaysSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="trade-show-displays-saskatoon"
      primaryProductSlug="retractable-banners"
      title="Trade Show Displays Saskatoon"
      subtitle="Retractable banners from $219. Foamboard, vinyl banners, and coroplast — all printed in-house."
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="Trade show displays Saskatoon — retractable banners and booth signage printed locally"
      description="True Color Display Printing produces trade show displays for Saskatoon businesses exhibiting at Prairieland Park, TCU Place, and events across Saskatchewan. Retractable banner stands from $219 — printed, assembled, and ready to roll. Foamboard counter displays, vinyl banners, coroplast signs, and window decals to complete your booth. In-house Roland UV printing means no outsourcing, no courier delays, and a 1–3 business day turnaround from artwork approval."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            True Color Display Printing produces trade show displays for Saskatoon businesses
            exhibiting at Prairieland Park, TCU Place, and events across Saskatchewan.
            Our{" "}
            <Link href="/products/retractable-banners" className="text-[#16C2F3] underline font-medium">
              retractable banner stands
            </Link>
            {" "}start at $219 — printed with vibrant Roland UV colour, hardware included,
            ready to set up in under a minute. Standard 33×80&quot; size fits most 8×10 and
            10×10 booth configurations. Deluxe ($299) and Premium ($349) stands offer wider
            bases and higher-quality cassette mechanisms for frequent travellers.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Beyond banner stands, we print everything your booth needs in one stop.{" "}
            <Link href="/products/foamboard-displays" className="text-[#16C2F3] underline font-medium">
              Foamboard displays
            </Link>
            {" "}from $45 for 18×24&quot; countertop pieces — lightweight, professional, and
            easy to transport. Large-format{" "}
            <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              vinyl banners
            </Link>
            {" "}from $8.25/sqft for hanging signage above your booth or backdrop walls.
            Coroplast signs from $8/sqft for directional and floor signage. Window decals
            for glass partitions and venue windows.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Don&apos;t have print-ready artwork? Our in-house Photoshop designer builds
            trade show layouts from scratch for $35 — bring your logo, colour codes, and
            key message, and we&apos;ll handle the rest with same-day proofs. Standard
            turnaround is 1–3 business days after artwork approval. Need to reprint
            worn-out banner graphics before the next event? Bring in your stand and we&apos;ll
            reprint the graphic insert only — no need to buy a new stand.
          </p>
          <p className="text-gray-600 leading-relaxed">
            We&apos;re local to Saskatoon at 216 33rd St W — no shipping wait and no
            courier guesswork. If your trade show is coming up fast, same-day rush is
            available for +$40 flat on orders placed before 10 AM. Call (306) 954-8688
            to confirm same-day availability. See all{" "}
            <Link href="/products/retractable-banners" className="text-[#16C2F3] underline font-medium">
              retractable banner stand options
            </Link>
            {" "}or use our{" "}
            <Link href="/quote" className="text-[#16C2F3] underline font-medium">
              instant quote tool
            </Link>
            {" "}to price out your full booth kit.
          </p>
        </>
      }
      products={[
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Foamboard Displays", from: "from $45", slug: "foamboard-displays" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
      ]}
      whyPoints={[
        "Retractable banner stands from $219 — Economy, Deluxe ($299), and Premium ($349) options",
        "33×80\" standard size fits most 10×10 and 8×10 booth configurations",
        "Foamboard countertop displays from $45 — lightweight, professional, easy to carry",
        "In-house Roland UV printer — no outsourcing, consistent colour, 1–3 business day turnaround",
        "In-house designer builds full booth layouts from $35 — same-day proofs",
        "Graphic reprint service — replace worn banner graphics without buying a new stand",
        "Same-day rush available for +$40 flat on orders placed before 10 AM",
        "Local pickup at 216 33rd St W, Saskatoon — no shipping delay before your event",
      ]}
      faqs={[
        {
          q: "How much does a trade show banner stand cost in Saskatoon?",
          a: "Retractable banner stands at True Color start at $219 for the Economy model (33×80\", hardware + printed graphic included). The Deluxe is $299 and the Premium is $349 — both offer sturdier cassette mechanisms for frequent show use. All prices include full-colour Roland UV printing. Foamboard displays start at $45 for 18×24\".",
        },
        {
          q: "What size banner stand should I order for a 10×10 trade show booth?",
          a: "A standard 33×80\" retractable banner stands about 6.5 feet tall — the most common size for 10×10 booths. Most exhibitors use 1–2 banner stands plus a foamboard countertop display and a vinyl backdrop banner. We can help you plan your full booth layout — call (306) 954-8688.",
        },
        {
          q: "How long does trade show printing take in Saskatoon?",
          a: "Standard turnaround is 1–3 business days from artwork approval. If you have a print-ready file, we can often turn around banner stands in 1 business day. Same-day rush is available for +$40 flat on orders placed before 10 AM — call to confirm capacity.",
        },
        {
          q: "Can you design my trade show booth graphics?",
          a: "Yes — our in-house Photoshop designer builds trade show layouts from scratch for $35. Bring your logo, brand colours, and key message. Proofs are typically ready the same day. We work with your existing brand guidelines to produce booth graphics that match your other marketing materials.",
        },
        {
          q: "Can I reprint just the banner graphic without buying a new stand?",
          a: "Yes — if your stand is still in good condition, bring it in and we'll reprint the graphic insert only. This is significantly cheaper than replacing the whole unit. Call (306) 954-8688 with your stand dimensions to confirm compatibility before coming in.",
        },
        {
          q: "What other trade show materials can you print?",
          a: "In one stop: retractable banner stands, foamboard countertop displays, large vinyl banners (backdrop or hanging), coroplast directional signs, window decals for glass partitions, and business cards for the table. Most Saskatoon exhibitors order a banner stand + foamboard + business cards as their core booth kit.",
        },
        {
          q: "Do you offer same-day trade show printing in Saskatoon?",
          a: "Yes — order before 10 AM and call (306) 954-8688 to confirm availability. A flat $40 rush fee applies to the full order. Same-day applies to retractable banners, foamboard, vinyl banners, and coroplast signs. We're at 216 33rd St W, Saskatoon.",
        },
        {
          q: "Where can I get trade show displays printed in Saskatoon?",
          a: "True Color Display Printing at 216 33rd St W, Saskatoon — (306) 954-8688. We print trade show displays entirely in-house with 1–3 day turnaround, no outsourcing, and an in-house designer to help with layouts. Open Monday to Friday.",
        },
      ]}
    />
  );
}
