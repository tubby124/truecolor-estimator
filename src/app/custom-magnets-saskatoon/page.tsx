import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Custom Magnets Saskatoon | Vehicle & Calendar | True Color" },
  description:
    "Custom magnets in Saskatoon — vehicle magnets from $45, magnet calendars $140/10 (8.5×11\"). Roland UV in-house. Same-day rush +$40. Service trucks, B2B promo. 216 33rd St W.",
  alternates: { canonical: "/custom-magnets-saskatoon" },
  openGraph: {
    title: "Custom Magnets Saskatoon | True Color Display Printing",
    description:
      "Vehicle magnets from $45. Magnet calendars $140/10. Roland UV in-house. Same-day rush +$40. Perfect for service trucks and B2B promo giveaways. Local Saskatoon pickup.",
    url: "https://truecolorprinting.ca/custom-magnets-saskatoon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function CustomMagnetsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="custom-magnets-saskatoon"
      primaryProductSlug="vehicle-magnets"
      title="Custom Magnets Saskatoon"
      subtitle="Vehicle magnets for service trucks and magnet calendars for B2B client gifts — printed in-house in Saskatoon."
      heroImage="/images/products/heroes/construction-hero-1200x500.webp"
      heroAlt="Custom vehicle magnets and magnet calendars Saskatoon"
      description="True Color prints custom magnets in Saskatoon for two distinct applications: vehicle magnets for service trucks and company fleet vehicles, and magnet calendars as year-round B2B promotional giveaways. Vehicle magnets are 30mil thick, start at $45 from $24/sqft, and are safe for most vehicle paint. Magnet calendars are printed full-colour on magnetic stock — 8.5×11&quot; at $140 for 10, 5×8&quot; at $60 for 10. We also print smaller custom fridge magnets for business branding. All printed in-house on our Roland UV printer for accurate colour. Same-day rush available for $40 flat on orders before 10 AM. Designer available for $35. Pickup at 216 33rd St W, Saskatoon."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            Your service truck drives past hundreds of homes every day — with a{" "}
            <Link href="/vehicle-magnets-saskatoon" className="text-[#16C2F3] underline font-medium">
              vehicle magnet
            </Link>{" "}
            on the door, that&apos;s a moving billboard that comes off at night and goes back on
            in the morning. Our vehicle magnets are 30mil thick — heavy enough to stay put at highway
            speeds — and start at $45 from $24/sqft. Safe for most factory paint, printed full-colour
            in-house on our Roland UV printer for durable colour that holds through a Saskatchewan summer.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Magnet calendars are one of the best-value B2B promotional items for Saskatoon trades
            and service businesses. A client who puts your magnet calendar on their fridge in
            January sees your logo and phone number every single day for twelve months — that is
            365 brand impressions for the price of one item. Our 8.5&times;11&quot; full-colour
            magnet calendars are $140 for 10 (just $14 each). Smaller 5&times;8&quot; calendars
            are $60 for 10. Hand them out at the end of December with your invoice and your number
            stays on the fridge all year.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            We also print smaller custom fridge magnets for business branding — a simple 3&times;4&quot;
            business card magnet with your logo and contact info is an inexpensive leave-behind that
            actually gets kept. Priced from $24/sqft (minimum $45), these are popular with
            plumbers, electricians, HVAC companies, and other service businesses in Saskatoon who
            want a sticky reminder on the client&apos;s appliance. Pair them with{" "}
            <Link href="/business-cards-saskatoon" className="text-[#16C2F3] underline font-medium">
              business cards
            </Link>{" "}
            for a complete leave-behind package.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Standard turnaround is 1–3 business days. Same-day rush is available for $40 flat on
            orders placed before 10 AM — perfect if you want to hand out calendars at a holiday
            client event. Our in-house designer handles your layout for $35 flat with a same-day
            proof. Call (306) 954-8688 or pickup at 216 33rd St W, Saskatoon.
          </p>
        </>
      }
      products={[
        { name: "Vehicle Magnets", from: "from $45", slug: "vehicle-magnets" },
        { name: "Magnet Calendars", from: "$60 / 10", slug: "magnet-calendars" },
        { name: "Business Cards", from: "from $40", slug: "business-cards" },
        { name: "Coroplast Signs", from: "from $24", slug: "coroplast-signs" },
        { name: "Vinyl Banners", from: "from $66", slug: "vinyl-banners" },
      ]}
      whyPoints={[
        "Your truck becomes a moving billboard — 30mil vehicle magnets from $45, on at 7 AM, off when you park at home",
        "Remove without damaging vehicle paint — brand your truck on the job, drive unbranded on personal time",
        "365 daily brand impressions per client — 8.5×11\" magnet calendars at $140/10 ($14 each)",
        "Smaller 5×8\" magnet calendars at $60/10 — cost-effective for larger client lists",
        "Your number on their fridge when something breaks — custom fridge magnets from $45 for plumbers, electricians, HVAC",
        "UV-resistant colour that outlasts a Saskatchewan summer — Roland UV in-house, no outsourcing",
        "Order before 10 AM, hand out at your holiday event same day — rush +$40 flat",
        "Logo, layout, calendar grid all handled for you — in-house designer $35 flat, same-day proof",
      ]}
      faqs={[
        {
          q: "How much do vehicle magnets cost in Saskatoon?",
          a: "Vehicle magnets start at $45 each, priced from $24/sqft. Common sizes: a 12×18\" door magnet (1.5 sqft) runs approximately $36–$45. Larger 18×24\" magnets are around $60–$72. Pairs for both doors are common — call (306) 954-8688 for a quote on your specific dimensions. All vehicle magnets are 30mil thick and printed full-colour on our in-house Roland UV printer.",
        },
        {
          q: "What thickness are your vehicle magnets?",
          a: "Our vehicle magnets are 30mil — the industry-standard thickness for vehicle door magnets. This is heavy enough to hold firmly on the highway at highway speeds without shifting. Thinner 20mil magnets are available for indoor use or refrigerators, but for service truck and fleet vehicle applications we recommend 30mil.",
        },
        {
          q: "Will vehicle magnets damage my truck's paint?",
          a: "No — properly applied magnets are safe for factory paint. A few tips to avoid issues: clean the surface before applying, remove the magnet at least weekly to prevent moisture buildup underneath, and don't apply to a surface that has been repainted (non-factory paint can vary). Our magnets are designed to be applied and removed regularly without adhesive residue.",
        },
        {
          q: "How much do magnet calendars cost in Saskatoon?",
          a: "Magnet calendars are priced per pack of 10. Our 8.5×11\" full-colour magnet calendars are $140 for 10 — just $14 each. Smaller 5×8\" calendars are $60 for 10 ($6 each). Both are printed full-colour on magnetic stock and include a 12-month calendar grid. In-house design (adding your logo, contact info, and a brand photo) is $35 flat.",
        },
        {
          q: "When should I order magnet calendars to hand out to clients?",
          a: "Order by early to mid-December to ensure they are ready before your holiday client visits. Standard turnaround is 1–3 business days, but December is a busy print period — ordering early avoids the rush. If you are cutting it close, same-day rush is available for $40 flat on orders placed before 10 AM. Call (306) 954-8688 to check availability.",
        },
        {
          q: "Can you print small fridge magnets with just my business logo and phone number?",
          a: "Yes — custom business card fridge magnets are popular with plumbers, electricians, HVAC technicians, and other service businesses. A simple 3×4\" magnet with your logo, name, and phone number is a leave-behind that actually gets kept — it goes on the fridge next to the stove where homeowners look when something breaks. From $45 for a minimum order, priced at $24/sqft for larger quantities.",
        },
        {
          q: "How long does it take to print custom magnets in Saskatoon?",
          a: "Standard turnaround is 1–3 business days from artwork approval. Same-day rush is available for $40 flat on orders placed before 10 AM — call (306) 954-8688 to confirm availability for your quantity. We print all magnets in-house on our Roland UV printer at 216 33rd St W, Saskatoon, so we control the timeline.",
        },
      ]}
    />
  );
}
