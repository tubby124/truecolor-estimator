import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Event Signs Saskatoon | Boards From $30 | True Color" },
  description:
    "Event signs in Saskatoon from $30. Vinyl banners, coroplast signs, foamboard displays, and retractable stands for weddings, galas, conferences, and community events. 216 33rd St W.",
  alternates: { canonical: "/event-signs-saskatoon" },
  openGraph: {
    title: "Event Signs Saskatoon | True Color Display Printing",
    description:
      "Vinyl banners, coroplast, foamboard, and retractable displays for events in Saskatoon. From $30. 1–3 day turnaround.",
    url: "https://truecolorprinting.ca/event-signs-saskatoon",
    type: "website",
  },
};

export default function EventSignsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="event-signs-saskatoon"
      primaryProductSlug="vinyl-banners"
      title="Event Signs Saskatoon"
      subtitle="Banners, boards, and displays for weddings, conferences, galas, and community events — all printed in-house."
      heroImage="/images/products/heroes/sports-hero-1200x500.webp"
      heroAlt="Event signs Saskatoon — vinyl banners and display boards for events and conferences"
      description="True Color Display Printing produces event signage for weddings, corporate galas, conferences, fundraisers, and community events across Saskatoon and Saskatchewan. Vinyl banners from $8.25/sqft, coroplast directional signs from $8/sqft, foamboard displays from $45, and retractable banner stands from $219 — everything in one local print shop with 1–3 business day turnaround and same-day rush available."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            True Color Display Printing produces event signage for weddings, corporate galas,
            conferences, fundraisers, and community events across Saskatoon and Saskatchewan.
            Whether you need a 3×8 welcome banner for a gala entrance, directional signs for
            a venue, or a full suite of event graphics, we print everything in-house on our
            Roland UV printer — no outsourcing, no courier delays, and a 1–3 business day
            turnaround from artwork approval.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Popular event print combinations include{" "}
            <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              vinyl banners
            </Link>
            {" "}(from $8.25/sqft) for stage backdrops, entrance signage, and sponsor walls;{" "}
            <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              coroplast signs
            </Link>
            {" "}(from $8/sqft) for parking, seating, and directional arrows;{" "}
            <Link href="/products/foamboard-displays" className="text-[#16C2F3] underline font-medium">
              foamboard displays
            </Link>
            {" "}(from $45) for table seating cards and easel displays; and{" "}
            <Link href="/products/retractable-banners" className="text-[#16C2F3] underline font-medium">
              retractable banner stands
            </Link>
            {" "}(from $219) for reusable sponsor and branding displays at recurring events.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            No designer on your event team? Our in-house Photoshop designer handles event
            layouts — sponsor logos, seating charts, event programs, and custom artwork —
            from $35 flat with same-day proofs. We work from your event theme, colour palette,
            or existing brand assets. Grommets and rope are included on all vinyl banners.
            Coroplast signs come with H-stake holes pre-drilled on request. All banners are
            wind-resistant 13oz scrim vinyl — proven for Saskatchewan outdoor events.
          </p>
          <p className="text-gray-600 leading-relaxed">
            We&apos;re at 216 33rd St W, Saskatoon — local pickup available Monday through Friday.
            Last-minute event? Same-day rush is +$40 flat on orders placed before 10 AM.
            Call (306) 954-8688 to confirm same-day availability for your order quantity.
            Use our{" "}
            <Link href="/quote" className="text-[#16C2F3] underline font-medium">
              instant quote tool
            </Link>
            {" "}to price your event kit, or check our{" "}
            <Link href="/same-day-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              same-day printing page
            </Link>
            {" "}for rush options.
          </p>
        </>
      }
      products={[
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Foamboard Displays", from: "from $45", slug: "foamboard-displays" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Window Decals", from: "from /sqft", slug: "window-decals" },
      ]}
      whyPoints={[
        "13oz scrim vinyl banners — outdoor-rated, wind-resistant, grommets and rope included",
        "Coroplast directional signs from $8/sqft — H-stake holes pre-drilled on request",
        "Foamboard displays from $45 — easel-ready for seating charts and table displays",
        "Retractable banner stands from $219 — reusable for recurring annual events",
        "In-house designer handles sponsor walls, seating charts, and custom event layouts from $35",
        "1–3 business day standard turnaround from artwork approval",
        "Same-day rush available +$40 flat — order before 10 AM, pick up by 5 PM",
        "Local Saskatoon pickup at 216 33rd St W — no shipping risk before event day",
      ]}
      faqs={[
        {
          q: "How much do event signs cost in Saskatoon?",
          a: "Vinyl banners start at $8.25/sqft — a 3×8 banner is $180, a 4×8 is $264. Coroplast directional signs start at $8/sqft — an 18×24\" sign is about $24. Foamboard displays start at $45 for 18×24\". Retractable banner stands from $219 including print. Same-day rush adds +$40 flat to the full order.",
        },
        {
          q: "What event signs are most popular in Saskatoon?",
          a: "For corporate events and galas: a 3×8 or 4×10 vinyl banner for the entrance or stage backdrop, plus a retractable stand for sponsors. For community events: coroplast directional signs with H-stakes. For weddings: foamboard easel displays for seating charts and welcome signs, plus a vinyl banner for the ceremony backdrop.",
        },
        {
          q: "How long does event sign printing take in Saskatoon?",
          a: "Standard turnaround is 1–3 business days from artwork approval. For urgent events, same-day rush is available for +$40 flat on orders placed before 10 AM — call (306) 954-8688 to confirm capacity for your quantity.",
        },
        {
          q: "Can you design event graphics from scratch?",
          a: "Yes — our in-house Photoshop designer builds event layouts starting at $35. Bring your event theme, colour palette, sponsor logos, and any reference images. Proofs come back the same day for simple layouts.",
        },
        {
          q: "What banner material do you use for outdoor events in Saskatchewan?",
          a: "We print on 13oz scrim vinyl — industry standard for outdoor event banners. It's wind-resistant, UV-stable, and won't curl or peel in Saskatchewan weather. Grommets are installed every 2 feet along the edges and rope is included for hanging.",
        },
        {
          q: "Can I reuse event banners for annual events?",
          a: "Yes — 13oz vinyl banners stored properly last 3–5 years. Retractable banner stands are especially good for recurring events because you can replace just the graphic insert. We offer graphic reprint service on existing stands — bring your hardware and we'll print a new insert.",
        },
        {
          q: "Do you make wedding signs in Saskatoon?",
          a: "Yes — popular wedding items include foamboard welcome signs (18×24\" from $45 or 24×36\" from $65), vinyl seating chart banners, and ceremony backdrop banners. Our designer can match your wedding colours and font style. Foamboard works on easels; vinyl banners can be hung or framed.",
        },
        {
          q: "Where can I get event signs printed in Saskatoon?",
          a: "True Color Display Printing at 216 33rd St W, Saskatoon — (306) 954-8688. We print vinyl banners, coroplast, foamboard, and retractable displays entirely in-house. Open Monday to Friday, 1–3 day standard turnaround, same-day rush available.",
        },
      ]}
    />
  );
}
