import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Hotel Signs Saskatoon | Event & Conference Printing | True Color",
  description:
    "Hotel and conference centre signs in Saskatoon from $45. Foamboard, retractable banners, vinyl banners, ACP exterior signs, window decals. Same-day rush +$40. 216 33rd St W.",
  alternates: { canonical: "/hotel-signs-saskatoon" },
  openGraph: {
    title: "Hotel Signs Saskatoon | True Color Display Printing",
    description:
      "Hotel event signage from $45. Foamboard meeting room signs, retractable banners, vinyl, ACP exterior. Same-day rush available. Local Saskatoon pickup.",
    url: "https://truecolorprinting.ca/hotel-signs-saskatoon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function HotelSignsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="hotel-signs-saskatoon"
      primaryProductSlug="foamboard-displays"
      title="Hotel Signs Saskatoon"
      subtitle="Conference setup by noon. Your signage is ready."
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="Hotel and conference centre signs printed in Saskatoon"
      description="True Color prints signs and displays for hotels, motels, B&Bs, and conference centres in Saskatoon. Foamboard displays from $45 for meeting room signs, event programs, and wayfinding boards. Retractable banners from $219 for conference branding and sponsor displays. Vinyl banners from $66 for outdoor event promotions and seasonal signage. ACP aluminum signs from $39 for permanent exterior directional. Window decals from $45 for lobby and entrance branding. Same-day rush available for +$40 flat on orders placed before 10 AM — event setup today, sign ordered this morning. In-house Roland UV printer. Designer $35 flat. Pickup at 216 33rd St W, Saskatoon or call (306) 954-8688."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            Saskatoon hotels and conference centres need signage fast — a conference books
            last-minute, a meeting room changes, a sponsor banner needs updating before
            registration opens. True Color prints foamboard displays from $45, retractable
            banners from $219, and vinyl banners from $66, all in-house on our Roland UV
            printer. Same-day rush is available for +$40 flat on orders placed before 10 AM.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Foamboard is the go-to for event room signage — lightweight, professional, and
            easy to move between rooms. An 18×24&quot; foamboard sign ($45) on an easel works
            for meeting room names, session schedules, and speaker bios. A 24×36&quot; board
            ($65) handles event programs and wayfinding maps. For a multi-day conference,
            a set of foamboard boards covers every room at a fraction of permanent sign costs.
            See full event signage options on the{" "}
            <Link href="/event-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              event signs page
            </Link>
            .
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Retractable banners ($219 Economy, $299 Deluxe, $349 Premium) work for conference
            registration desks, sponsor recognition displays, and branded lobby entrances — pull
            up before the first guest arrives, roll down after the last one leaves. For permanent
            exterior directional signs — parking entrance, check-in arrows, conference wing
            indicators — ACP aluminum signs from $39 (18×24&quot;) hold up in Saskatchewan
            weather year-round. For larger displays and{" "}
            <Link href="/trade-show-displays-saskatoon" className="text-[#16C2F3] underline font-medium">
              trade show display systems
            </Link>
            {" "}that work in conference and expo settings, we have full backwall and popup
            display options as well.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Window decals from $45 work for lobby branding, seasonal promotions, and directional
            arrows on glass partitions. Our in-house designer handles layouts for $35 flat with
            same-day proof — bring your event schedule, sponsor logos, or hotel brand guide and
            we&apos;ll build print-ready files. Pickup at 216 33rd St W, Saskatoon or call
            (306) 954-8688 to confirm same-day availability.
          </p>
        </>
      }
      products={[
        { name: "Foamboard Displays", from: "from $45", slug: "foamboard-displays" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Vinyl Banners", from: "from $66", slug: "vinyl-banners" },
        { name: "ACP Aluminum Signs", from: "from $39", slug: "acp-signs" },
        { name: "Window Decals", from: "from $45", slug: "window-decals" },
      ]}
      whyPoints={[
        "Foamboard meeting room signs from $45 — 18×24\" on easel, ready same day with rush",
        "Retractable banners from $219 — conference branding, sponsor displays, registration desks",
        "Vinyl banners from $66 — outdoor event promotions, seasonal hotel signage",
        "ACP aluminum signs from $39 — permanent exterior directionals, weatherproof year-round",
        "Window decals from $45 — lobby branding, glass partition wayfinding, seasonal promos",
        "Same-day rush +$40 flat — conference starts at noon, order before 10 AM",
        "In-house Roland UV printer — sharp colour, fast turnaround, no outsourcing delays",
        "In-house designer $35 flat, same-day proof — works from your event schedule or brand guide",
      ]}
      faqs={[
        {
          q: "How quickly can you print meeting room signs for a conference?",
          a: "Same-day is available with rush (+$40 flat) on orders placed before 10 AM. Foamboard meeting room signs (18×24\") are $45 each and are the most common conference room sign we print for Saskatoon hotels. Standard turnaround without rush is 1–3 business days from artwork approval.",
        },
        {
          q: "What size foamboard signs work best for hotel meeting rooms?",
          a: "18×24\" foamboard on an easel is the standard for room name signs, speaker names, and session titles — $45 each. 24×36\" works for event programs, wayfinding maps, and multi-session schedules — approximately $65. Both sizes are printed on rigid foamboard with a gloss UV surface, in-house on our Roland UV printer.",
        },
        {
          q: "Can you print retractable banners for a conference or corporate event?",
          a: "Yes — retractable banners are a hotel and conference centre staple. Economy at $219, Deluxe at $299, Premium at $349. Use them at registration desks, sponsor recognition walls, stage backdrops, and branded entrances. They pack flat into a carry case between events. Layout from our designer is $35 flat.",
        },
        {
          q: "Do you print permanent exterior signs for hotels?",
          a: "Yes — ACP (aluminum composite panel) signs are weatherproof and suitable for permanent exterior installation. 18×24\" from $39, 24×36\" from $66. Common uses include parking entrance signs, check-in directionals, conference wing indicators, and rate signs. We print in-house on our Roland UV printer — colour stays sharp through Saskatchewan winters.",
        },
        {
          q: "Can you print vinyl banners for outdoor hotel events or seasonal promotions?",
          a: "Yes — vinyl banners with grommets start at $66 (2×4\"). Popular hotel uses include outdoor event announcements, patio or pool seasonal banners, parking lot sale signs, and conference or gala signage on building fascia. Grommets and finished edges are included. Same-day rush available for +$40 flat.",
        },
        {
          q: "Do you print window decals for hotel lobbies?",
          a: "Yes — window decals from $45 work for lobby branding, seasonal promotions, directional arrows on glass partitions, and room number indicators on glass doors. We print on perforated window film (see-through from inside) or opaque vinyl depending on your needs. Design is $35 flat.",
        },
        {
          q: "Can you handle signage for a multi-day conference at a Saskatoon hotel?",
          a: "Yes — we regularly handle conference signage packages. A typical multi-day package includes: foamboard room signs for each session space, a retractable banner for registration, a vinyl banner for the building exterior, and foamboard wayfinding for hallways. Call (306) 954-8688 and we&apos;ll quote the full package.",
        },
        {
          q: "Where can hotels get signs printed in Saskatoon?",
          a: "True Color Display Printing at 216 33rd St W, Saskatoon — (306) 954-8688. We print foamboard, retractable banners, vinyl banners, ACP signs, and window decals in-house on our Roland UV printer. Same-day rush available. Designer on staff. No outsourcing — everything done locally.",
        },
      ]}
    />
  );
}
