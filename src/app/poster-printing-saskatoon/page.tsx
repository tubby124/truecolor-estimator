import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";
import { DesignDirectionGrid } from "@/components/site/DesignDirectionGrid";

export const metadata: Metadata = {
  title: { absolute: "Poster Printing Saskatoon | From $15 | True Color" },
  description:
    "Photo poster printing in Saskatoon from $15. Roland Photobase Matte 220gsm. 18×24\" $22, 24×36\" $35. Foamboard displays $45. Same-day rush +$40. 216 33rd St W.",
  alternates: { canonical: "/poster-printing-saskatoon" },
  openGraph: {
    title: "Poster Printing Saskatoon | True Color Display Printing",
    description:
      "Photo posters from $15 in Saskatoon. 18×24\" = $22, 24×36\" = $35. Foamboard from $45. Same-day rush +$40 flat. In-house Roland UV printer.",
    url: "https://truecolorprinting.ca/poster-printing-saskatoon",
    type: "website",
  },
};

const designDirections = [
  {
    title: "Event & Concert Posters",
    subtitle:
      "12×18\" from $15 · 18×24\" $22 · 24×36\" $35 — Roland Photobase Matte 220gsm, 1–3 business days",
    aspect: "3/4" as const,
    maxCols: 3 as const,
    items: [
      {
        src: "/images/industries/poster-printing/poster-concert-music.webp",
        alt: "Concert and music event poster printed in Saskatoon — True Color Display Printing, Saskatoon SK",
        label: "Concert / Music Event",
        caption: "18×24\" — $22",
      },
      {
        src: "/images/industries/poster-printing/poster-fundraiser-gala.webp",
        alt: "Fundraiser gala event poster for Saskatoon non-profit — True Color Display Printing, Saskatoon SK",
        label: "Fundraiser & Gala",
        caption: "18×24\" — $22",
      },
      {
        src: "/images/industries/poster-printing/poster-sports-tournament.webp",
        alt: "Sports tournament poster for Saskatoon school or recreation league — True Color Display Printing, Saskatoon SK",
        label: "Sports Tournament",
        caption: "12×18\" — $15",
      },
    ],
  },
  {
    title: "Indoor Display & Foamboard Prints",
    subtitle:
      "18×24\" from $45 · 24×36\" $65 — rigid 5mm foamboard, easel-ready, no frame needed",
    aspect: "4/3" as const,
    maxCols: 3 as const,
    items: [
      {
        src: "/images/industries/poster-printing/display-restaurant-specials.webp",
        alt: "Restaurant daily specials foamboard display printed in Saskatoon — True Color Display Printing, Saskatoon SK",
        label: "Restaurant Specials Board",
        caption: "18×24\" — $45",
      },
      {
        src: "/images/industries/poster-printing/display-retail-promotion.webp",
        alt: "Retail store promotion foamboard display for Saskatoon business — True Color Display Printing, Saskatoon SK",
        label: "Retail Promotion Display",
        caption: "24×36\" — $65",
      },
      {
        src: "/images/industries/poster-printing/display-open-house.webp",
        alt: "Real estate open house foamboard display board in Saskatoon — True Color Display Printing, Saskatoon SK",
        label: "Real Estate Open House",
        caption: "18×24\" — $45",
      },
    ],
  },
  {
    title: "Retractable Banner Stands",
    subtitle:
      "From $219 — 33×79\" graphic included · packs into carry bag · trade shows, events, lobbies",
    aspect: "3/8" as const,
    maxCols: 2 as const,
    items: [
      {
        src: "/images/industries/poster-printing/retractable-nonprofit-event.webp",
        alt: "Non-profit fundraiser retractable banner stand for Saskatoon event — True Color Display Printing, Saskatoon SK",
        label: "Non-Profit / Event Booth",
        caption: "Economy stand — $219",
      },
      {
        src: "/images/industries/poster-printing/retractable-trade-show-display.webp",
        alt: "Trade show retractable banner stand display for Saskatoon business — True Color Display Printing, Saskatoon SK",
        label: "Trade Show Display",
        caption: "Deluxe stand — $299",
      },
    ],
  },
];

export default function PosterPrintingSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="poster-printing-saskatoon"
      primaryProductSlug="photo-posters"
      title="Poster Printing Saskatoon"
      subtitle="Photo posters from $15 on Roland Photobase Matte 220gsm. Foamboard displays from $45. Retractable stands from $219. Same-day rush +$40."
      heroImage="/images/products/product/photo-posters-800x600.webp"
      heroAlt="Poster printing in Saskatoon by True Color Display Printing — photo posters, foamboard displays, and retractable banner stands"
      description={`True Color Display Printing offers poster printing in Saskatoon, Saskatchewan, starting from $15 for a 12×18" photo poster on Roland Photobase Matte 220gsm with 1–3 business day turnaround and in-house design for $35 flat. An 18×24" poster is $22, a 24×36" poster is $35, and a 36×48" poster is $65. All posters are printed in-house on a Roland UV printer at 216 33rd St W, Saskatoon SK S7L 0V5 — (306) 954-8688.

Photo posters on Roland Photobase Matte 220gsm are the standard format for events, concerts, fundraisers, school sports announcements, retail promotions, and real estate open houses in Saskatoon and Saskatchewan. The matte finish reduces glare for indoor display — waiting rooms, event lobbies, restaurant feature walls, clinic bulletin boards. For rigid freestanding display, True Color Display Printing also produces 5mm foamboard-mounted displays starting at $45 for 18×24" and $65 for 24×36". Foamboard displays are self-supporting on an easel and require no frame — standard for trade show presentations, real estate open house boards, and event lobby signage in Saskatoon.

| Product | Size | Price | Turnaround |
|---------|------|-------|-----------|
| Photo Poster (Roland Photobase Matte 220gsm) | 12×18" | $15 | 1–3 business days |
| Photo Poster | 18×24" | $22 | 1–3 business days |
| Photo Poster | 24×36" | $35 | 1–3 business days |
| Photo Poster | 36×48" | $65 | 1–3 business days |
| Foamboard Display (5mm) | 18×24" | $45 | 1–3 business days |
| Foamboard Display (5mm) | 24×36" | $65 | 1–3 business days |
| Retractable Banner Stand (graphic included) | 33×79" | $219 | 1–3 business days |
| Rush (any product) | any size | +$40 flat | Same day (order before 10 AM) |

True Color Display Printing serves the full range of Saskatoon poster buyers: event planners and non-profits running fundraisers, restaurants promoting seasonal specials, retail stores updating interior displays, schools ordering sports and event posters, real estate agents printing open house boards, and University of Saskatchewan researchers printing academic conference posters (36×48" = $65). The Saskatoon Fringe Festival (late July–August) generates high seasonal demand from 200+ performing artists needing 18×24" and 24×36" event posters. Retractable banner stands ($219, economy, graphic print included) are used by Saskatoon businesses for trade show booths, event displays, and recurring branded presentations that pack into a carry bag between events.

True Color's in-house Photoshop designer handles layout, resizing, colour correction, and new artwork for a flat $35 design fee with a same-day proof — eliminating the need for a separate design vendor before printing. Same-day rush printing is available for +$40 flat on orders placed before 10 AM. Standard turnaround is 1–3 business days after artwork approval. Walk-ins welcome at 216 33rd St W, Saskatoon SK S7L 0V5. Phone: (306) 954-8688. Every poster printed at True Color Display Printing is produced in-house on the Roland UV printer — no outsourcing, consistent colour, reliable timelines.`}
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            True Color Display Printing offers poster printing in Saskatoon, Saskatchewan, starting
            from $15 for a 12×18&quot; photo poster on Roland Photobase Matte 220gsm with 1–3
            business day turnaround and in-house design for $35 flat. An 18×24&quot; poster is $22,
            a 24×36&quot; poster is $35, and a 36×48&quot; poster is $65. All posters are printed
            in-house on a Roland UV printer at 216 33rd St W, Saskatoon SK. Same-day rush is
            available for +$40 flat when ordered before 10 AM — call (306) 954-8688.
          </p>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            <Link
              href="/photo-poster-printing-saskatoon"
              className="text-[#16C2F3] underline font-medium"
            >
              Photo posters
            </Link>{" "}
            on Roland Photobase Matte 220gsm suit events, concerts, fundraisers, school sports
            announcements, retail promotions, and real estate open houses. The matte finish reduces
            glare for indoor display — waiting rooms, event lobbies, restaurant feature walls. For
            rigid freestanding display,{" "}
            <Link
              href="/foamboard-printing-saskatoon"
              className="text-[#16C2F3] underline font-medium"
            >
              foamboard displays
            </Link>{" "}
            add a 5mm rigid backing that sits on any easel without a frame — starting at $45 for
            18×24&quot; and $65 for 24×36&quot;. This pairing (paper poster for daily swaps +
            foamboard for permanent display) is common for Saskatoon restaurants, real estate
            showings, and event welcome boards.
          </p>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            For trade shows, event booths, and lobby presentations,{" "}
            <Link
              href="/products/retractable-banners"
              className="text-[#16C2F3] underline font-medium"
            >
              retractable banner stands
            </Link>{" "}
            start at $219 with the 33×79&quot; graphic print included. The stand packs into a
            shoulder carry bag between events — standard for non-profits, contractors, and Saskatoon
            businesses that exhibit at trade shows or community events throughout the year. True
            Color Display Printing prints the graphic in-house on the Roland UV, so colour matches
            your brand and turnaround is 1–3 business days.
          </p>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            True Color&apos;s in-house Photoshop designer handles layout, resizing, colour
            correction, and new artwork for $35 flat with a same-day proof. Bring a logo file,
            rough description, or reference image — the designer will build a print-ready file
            without back-and-forth between vendors. Design and printing happen at the same location:
            216 33rd St W, Saskatoon SK S7L 0V5. For event packages, also see{" "}
            <Link
              href="/flyer-printing-saskatoon"
              className="text-[#16C2F3] underline font-medium"
            >
              flyer printing from $45
            </Link>{" "}
            and{" "}
            <Link
              href="/banner-printing-saskatoon"
              className="text-[#16C2F3] underline font-medium"
            >
              vinyl banners from $8.25/sqft
            </Link>{" "}
            — True Color prints everything in one shop, so event orders ship together.
          </p>
          <DesignDirectionGrid sections={designDirections} />
        </>
      }
      products={[
        { name: "Photo Posters", from: "from $15", slug: "photo-posters" },
        { name: "Foamboard Displays", from: "from $10/sqft", slug: "foamboard-displays" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Flyers", from: "from $45", slug: "flyers" },
      ]}
      whyPoints={[
        "Photo posters from $15 on Roland Photobase Matte 220gsm — no minimum, single prints welcome",
        "No-frame display: 5mm foamboard mounts from $45 sit on any easel, ready to place",
        "In-house Roland UV printer — True Color Display Printing controls colour and timeline, no outsourcing",
        "In-house Photoshop designer: $35 flat, same-day proof from logo, description, or reference image",
        "Same-day rush for +$40 flat when ordered before 10 AM — call (306) 954-8688 to confirm",
        "Everything in one shop: photo posters, foamboard, retractable stands, banners, and flyers",
      ]}
      faqs={[
        {
          q: "How much does poster printing cost in Saskatoon?",
          a: "True Color Display Printing offers photo posters on Roland Photobase Matte 220gsm starting at $15 for 12×18\", $22 for 18×24\", $35 for 24×36\", and $65 for 36×48\". Foamboard-mounted displays start at $45 for 18×24\" and $65 for 24×36\". All prices are pre-tax. Design is $35 flat with a same-day proof, and same-day rush adds +$40 flat. Call (306) 954-8688 or visit 216 33rd St W, Saskatoon.",
        },
        {
          q: "Can I get same-day poster printing in Saskatoon?",
          a: "Yes. True Color Display Printing offers same-day rush printing for a flat +$40 fee on orders placed before 10 AM. A 12×18\" photo poster starts at $15, an 18×24\" at $22, and a 24×36\" at $35 before the rush fee. Standard turnaround is 1–3 business days after artwork approval. Walk-ins welcome at 216 33rd St W, Saskatoon, or call (306) 954-8688 to confirm same-day capacity.",
        },
        {
          q: "What poster sizes are available in Saskatoon?",
          a: "True Color Display Printing prints photo posters in six sizes: 12×18\" ($15), 16×20\" ($18), 18×24\" ($22), 24×36\" ($35), 30×40\" ($48), and 36×48\" ($65). Foamboard-mounted displays are available at 18×24\" ($45) and 24×36\" ($65). Retractable banner stands are 33×79\" with the graphic included, starting at $219. Custom sizes are available — call (306) 954-8688 for a quote.",
        },
        {
          q: "What is the difference between a photo poster and a foamboard display?",
          a: "A photo poster is printed on Roland Photobase Matte 220gsm paper — flat, lightweight, ideal for framing, pinning, or taping to a wall. Prices start at $15 for 12×18\" and $35 for 24×36\". A foamboard display adds a rigid 3/16\" foam backing that stands on any easel without a frame, making it self-supporting for tabletop or floor-stand use. Foamboard displays start at $45 for 18×24\" and $65 for 24×36\". Both are printed in-house at True Color Display Printing, 216 33rd St W, Saskatoon.",
        },
        {
          q: "What file format do I need for poster printing?",
          a: "True Color Display Printing accepts PDF at 150 dpi minimum at print size, or high-resolution JPG/PNG at 300 dpi in CMYK colour mode. If your file is lower resolution or not print-ready, True Color's in-house Photoshop designer can prepare it for a flat $35 fee with a same-day proof. Call (306) 954-8688 to confirm file specs before sending artwork.",
        },
        {
          q: "Do you offer poster printing for events and trade shows in Saskatoon?",
          a: "Yes. True Color Display Printing produces event photo posters (from $15), foamboard displays (from $45), retractable banner stands (from $219 with graphic), and vinyl banners (from $66 for 2×4ft). All are printed in-house on the Roland UV in Saskatoon with 1–3 business day turnaround and same-day rush for +$40 flat. The in-house designer handles event artwork for $35 flat with a same-day proof. Call (306) 954-8688 to plan your event order.",
        },
        {
          q: "What is the cheapest way to print a large poster in Saskatoon?",
          a: "A 24×36\" photo poster at True Color Display Printing costs $35 — printed in-house on Roland Photobase Matte 220gsm with no outsourcing markup. That is among the lowest prices in Saskatoon for large-format printing on quality 220gsm stock. If you have print-ready artwork, there is no design fee. Standard turnaround is 1–3 business days; same-day adds +$40 flat. Visit 216 33rd St W or call (306) 954-8688.",
        },
        {
          q: "Can I get a poster designed and printed at the same shop in Saskatoon?",
          a: "Yes. True Color Display Printing has an in-house Photoshop designer who handles layout, resizing, colour correction, and new artwork for a flat $35 design fee with a same-day proof. Design and printing happen at the same location — 216 33rd St W, Saskatoon SK S7L 0V5 — no files moving between vendors. Same-day rush is available for +$40 flat on orders placed before 10 AM. Call (306) 954-8688.",
        },
      ]}
    />
  );
}
