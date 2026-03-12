import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "School Signs Saskatoon | Banners & Coroplast | True Color" },
  description:
    "Coroplast signs from $8/sqft, vinyl banners from $8.25/sqft, and flyers for Saskatoon K-12 schools, daycares & sports teams. Rush orders +$40. Local pickup.",
  alternates: {
    canonical: "/school-signs-saskatoon",
  },
  openGraph: {
    title: "School Signs Saskatoon | True Color Display Printing",
    description:
      "Coroplast signs from $8/sqft, vinyl banners from $8.25/sqft, and flyers for Saskatoon K-12 schools, daycares & sports teams. Rush orders +$40. Local pickup.",
    url: "https://truecolorprinting.ca/school-signs-saskatoon",
    type: "website",
  },
};

const description =
  "Tournament weekend is Thursday. Your coroplast signs, gym banner, and event flyers need to be ready by Friday. Saskatoon K-12 schools, daycares, and school boards get exactly that from True Color — coroplast yard signs from $8/sqft (18×24\" = $24 each), vinyl banners from $8.25/sqft with grommets included, and flyers from $45 per 100. We print in-house on our Roland UV printer — weather-resistant colour with no outsourcing delays. Same-day rush for +$40 flat when you order before 10 AM. In-house designer $35 flat with a same-day proof. Standard turnaround is 1–3 business days.";

export default function SchoolSignsSaskatoon() {
  return (
    <IndustryPage
      title="School Signs Saskatoon"
      subtitle="Signs, gym banners, and event flyers ready before your next tournament or school event — 1–3 business days, same-day rush available for +$40."
      heroImage="/images/products/heroes/sports-hero-1200x500.webp"
      heroAlt="School sports banners and signs printed in Saskatoon"
      description={description}
      descriptionNode={
        <>
          <p>
            Tournament weekend is Thursday. Your coroplast signs and gym banner need to be
            ready by Friday — and you can't afford to wait on a courier from out of province.
            Saskatoon K-12 schools, daycares, and school boards get their print done in-house
            at True Color, with same-day rush available for <strong>+$40 flat</strong>.{" "}
            <Link
              href="/products/coroplast-signs"
              className="text-[#16C2F3] underline font-medium"
            >
              Coroplast yard signs
            </Link>{" "}
            start at $8/sqft — an 18×24&Prime; sign is $24 each, and orders of 5+ get an 8% bulk
            discount. Our in-house Roland UV printer prints directly onto 4mm corrugated plastic
            for weather-resistant colour that holds up through rain, wind, and a full Saskatchewan
            fall season.
          </p>
          <p>
            Need a gym banner for tournament weekend?{" "}
            <Link
              href="/products/vinyl-banners"
              className="text-[#16C2F3] underline font-medium"
            >
              Vinyl banners
            </Link>{" "}
            start at $8.25/sqft — a 2×4&prime; banner is $66, a 3×6&prime; is $135 — and grommets
            are always included. Foamboard display boards (18×24&Prime; = $45, 24×36&Prime; = $65)
            are ideal for indoor hallway displays, gym entrance signage, and science fair boards.
          </p>
          <p>
            Event flyers start at $45 for 100 copies (500 for $135), and business cards for admin
            and teachers start at $40 for 250. Rush orders go same day for a +$40 flat fee when
            you order before 10 AM. Our in-house designer creates your layout for $35 flat with a
            same-day proof — no files required. Standard turnaround is 1–3 business days from
            artwork approval. Pick up at 216 33rd St W, Saskatoon, or call{" "}
            <a href="tel:+13069548688" className="text-[#16C2F3] underline font-medium">
              (306) 954-8688
            </a>
            .
          </p>
        </>
      }
      products={[
        {
          name: "Coroplast Signs",
          from: "From $8/sqft — 18×24\" = $24",
          slug: "coroplast-signs",
        },
        {
          name: "Vinyl Banners",
          from: "From $8.25/sqft — 2×4' = $66",
          slug: "vinyl-banners",
        },
        {
          name: "Foamboard Displays",
          from: "From $45 — 18×24\" indoor board",
          slug: "foamboard-displays",
        },
        {
          name: "Flyers",
          from: "From $45 for 100 copies",
          slug: "flyers",
        },
        {
          name: "Business Cards",
          from: "250 for $40 | 500 for $65",
          slug: "business-cards",
        },
      ]}
      whyPoints={[
        "Signs ready before your event — same-day rush for +$40 flat, order before 10 AM",
        "Coroplast colour holds through rain, wind, and a full Saskatchewan fall — printed Roland UV in-house",
        "Order 5+ coroplast signs and the price drops 8% automatically",
        "Bring a logo and your text — our designer builds the layout for $35 flat, same-day proof",
        "Gym banners come with grommets — no extra charge, ready to hang on tournament day",
        "1–3 business day standard turnaround — nothing outsourced, no third-party delays",
        "Pick up at 216 33rd St W, Saskatoon — no shipping, no courier to track",
      ]}
      faqs={[
        {
          q: "How much do school coroplast signs cost in Saskatoon?",
          a: "Coroplast signs start at $8/sqft on our Roland UV printer. An 18×24\" sign is $24 and a 24×36\" sign is $48. Orders of 5 or more signs get an 8% bulk discount applied automatically. Rush production is +$40 flat for same-day turnaround when ordered before 10 AM.",
        },
        {
          q: "Can you print gym banners for school sports tournaments?",
          a: "Yes. Vinyl banners start at $8.25/sqft with grommets included. A 2×4' banner is $66 and a 3×6' banner is $135. Need it fast? Same-day rush is +$40 flat. We print in-house on our Roland UV so there's no outsourcing delay.",
        },
        {
          q: "Do you print foamboard displays for school hallways and science fairs?",
          a: "Yes. Foamboard prints start at an 18×24\" board for $45 and a 24×36\" board for $65. The 5mm foam is lightweight, easy to mount with adhesive strips, and produces sharp edges — ideal for hallway directories, indoor event signage, and classroom displays.",
        },
        {
          q: "How much does it cost to print event flyers for a school fundraiser?",
          a: "Flyers start at $45 for 100 copies and $135 for 500 copies. If you need a layout designed from scratch, our in-house designer handles it for $35 flat with a same-day proof. Standard turnaround is 1–3 business days from artwork approval.",
        },
        {
          q: "Can we get business cards for school admin staff?",
          a: "Yes. Business cards are 250 for $40 or 500 for $65 (2-sided). Our designer can set up a school-branded template for $35 flat so all staff cards stay consistent. Rush production is +$40 if you need them same day.",
        },
        {
          q: "Do you offer bulk pricing for school board orders?",
          a: "Coroplast signs get an 8% bulk discount at 5+ units. For larger school board orders across multiple schools — signs, banners, and printed materials — call us at (306) 954-8688 to discuss volume pricing.",
        },
        {
          q: "How fast can you print signs for a last-minute school event?",
          a: "Same-day rush production is +$40 flat — order before 10 AM and your signs are ready for pickup by end of day. Standard turnaround is 1–3 business days. We print everything in-house on our Roland UV so there are no third-party delays.",
        },
        {
          q: "Do I need to provide print-ready artwork?",
          a: "No. Our in-house designer creates your layout from scratch for $35 flat and sends a proof same day. You just provide your logo, text, and any colours or references. Edits are included until you approve.",
        },
      ]}
      canonicalSlug="school-signs-saskatoon"
      primaryProductSlug="coroplast-signs"
    />
  );
}
