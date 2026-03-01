import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Graduation Banners Saskatoon | Schools & Event Venues | True Color",
  description:
    "Vinyl graduation banners, foam board displays & retractable stands for Saskatoon schools and venues. Banners from $90. Same-day rush. Local pickup 216 33rd St W.",
  keywords: [
    "graduation banners saskatoon",
    "grad banners saskatoon",
    "graduation backdrop printing saskatoon",
    "school event banners saskatoon",
    "university convocation banners saskatoon",
    "step and repeat banner saskatoon",
    "foam board graduation display saskatoon",
  ],
  alternates: { canonical: "/graduation-banners-saskatoon" },
  openGraph: {
    title: "Graduation Banners Saskatoon | Schools & Event Venues | True Color",
    description:
      "Vinyl graduation banners, foam board displays & retractable stands for Saskatoon schools and venues. Banners from $90. Same-day rush available.",
    url: "https://truecolorprinting.ca/graduation-banners-saskatoon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function GraduationBannersPage() {
  return (
    <IndustryPage
      canonicalSlug="graduation-banners-saskatoon"
      primaryProductSlug="vinyl-banners"
      title="Graduation Banners Saskatoon"
      subtitle="Vinyl banners, foam board photo displays, and retractable stands for Saskatoon schools, universities, and event venues — don't risk a shipping delay before grad day."
      heroImage="/images/products/heroes/sports-hero-1200x500.webp"
      heroAlt="Graduation banners and foam board photo displays printed in Saskatoon by True Color Display Printing"
      description="True Color Display Printing produces vinyl graduation banners, foam board photo displays, and retractable banner stands for Saskatoon schools, universities, and event venues. We serve all levels — elementary and high school graduation ceremonies, university and college convocation events, and private graduation parties. A 2×6 ft grad banner is $90 + GST. A 4×8 ft convocation banner is $240 + GST. Foam board display panels from $10/sqft. Retractable banner stand complete from $219 + GST. Standard turnaround: 1–3 business days from artwork approval. Same-day rush: +$40 flat, order before 10 AM. In-house Roland UV printer. Local pickup at 216 33rd St W, Saskatoon, Saskatchewan."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            True Color Display Printing produces vinyl graduation banners, foam board photo backdrops,
            and retractable banner stands for Saskatoon schools, universities, and event venues.
            We serve all levels — elementary and high school ceremonies, university convocation at the
            U of S or SIAST, and private grad parties across Saskatoon, Saskatchewan. Bring your school
            colours and grad year — our in-house designer handles the layout. Local pickup at
            216 33rd St W. Same-day rush available: +$40 flat, order before 10 AM.
          </p>

          <h3 className="text-xl font-bold text-[#1c1712] mb-3">
            Graduation banner sizes and pricing
          </h3>
          <p className="text-gray-600 leading-relaxed mb-8">
            The most popular size for a Saskatoon high school gymnasium or convocation entrance is
            4×8 ft ($240 + GST) — large enough to read from across a parking lot and weatherproof for
            outdoor use. For photo opportunity backdrops and step-and-repeat walls, a 4×8 ft vinyl banner
            on a retractable stand ($219 complete) is the go-to setup. For table centrepieces and
            directional signs inside a venue, foam board panels ($10/sqft, 24×36&quot; = $65) are
            lightweight and easy to position without hardware.
          </p>

          <h3 className="text-xl font-bold text-[#1c1712] mb-3">
            Don&apos;t risk a late delivery on grad day
          </h3>
          <p className="text-gray-600 leading-relaxed">
            National online printers ship from Toronto or Vancouver — a shipping delay means your banner
            arrives after the ceremony. True Color prints in-house in Saskatoon. Order by <strong>late
            May</strong> for June graduation season, and you pick it up locally with days to spare.
            If you need it faster, same-day rush is available for +$40 flat — call (306) 954-8688
            before 10 AM.
          </p>
        </>
      }
      products={[
        { name: "Vinyl Banners", from: "from $90", slug: "vinyl-banners" },
        { name: "Foamboard Displays", from: "from $10/sqft", slug: "foamboard-displays" },
        { name: "Retractable Banners", from: "from $219 complete", slug: "retractable-banners" },
        { name: "Flyers", from: "250 from $110", slug: "flyers" },
      ]}
      whyPoints={[
        "Vinyl 2×6ft grad banner — $90 + GST, hemming and grommets included, ready in 1–3 business days",
        "4×8ft convocation or gymnasium banner — $240 + GST — most popular size for Saskatoon schools",
        "Foam board photo backdrop panels from $10/sqft — 24×36\" display for $65, no adhesive, reusable",
        "Retractable banner stand + full-colour grad print — $219 complete, no separate graphic fee",
        "Same-day rush for +$40 flat — don't risk a late delivery before grad day — call (306) 954-8688",
        "In-house designer builds layouts from your school crest, grad photo, and year — $35–50 flat",
        "Volume discounts on 5+ banners — schools ordering for multiple events save automatically",
        "Local Saskatoon pickup at 216 33rd St W — no shipping from Toronto, no surprises",
      ]}
      faqs={[
        {
          q: "How much do graduation banners cost in Saskatoon?",
          a: "At True Color Display Printing (216 33rd St W, Saskatoon, SK), vinyl graduation banners start at $90 for a 2×6 ft banner. A 4×8 ft convocation banner for a gym or auditorium entrance is $240 + GST. Foam board photo backdrop panels are from $10/sqft — a 24×36\" panel is $65. Retractable banner stands complete from $219 + GST. All vinyl banners include hemming and grommets. Volume discounts apply for 5+ banners.",
        },
        {
          q: "What type of banner is best for a graduation ceremony in Saskatoon?",
          a: "For outdoor use (parking lots, school entrances), a 13oz scrim vinyl banner with hemming and grommets is weatherproof and holds up in Saskatchewan wind. For photo backdrops, a 4×8 ft vinyl banner on a retractable stand ($219 complete) creates a clean branded backdrop for grad photos. Foam board displays ($10/sqft) work well for table centrepieces and directional signs inside a venue.",
        },
        {
          q: "Can you print graduation banners for Saskatoon schools, universities, and private grad parties?",
          a: "Yes — True Color Display Printing serves all levels: elementary and high school grad events, university and college convocation ceremonies at U of S or Sask Polytechnic, and private graduation parties in Saskatoon, Saskatchewan. Whether you need 1 banner or 20, we print in-house with no outsourcing. Bring your school logo, colours, and grad year — we handle the layout.",
        },
        {
          q: "What's the turnaround time for graduation banners in Saskatoon?",
          a: "Standard turnaround is 1–3 business days after artwork approval at True Color Display Printing, Saskatoon. Same-day rush is available for +$40 flat if you order before 10 AM — call (306) 954-8688 to confirm. For June graduation season, order by late May to avoid peak rush. We print in-house — no shipping delays from a national online printer.",
        },
        {
          q: "Do you print foam board graduation displays and photo backdrops in Saskatoon?",
          a: "Yes — 5mm foam board display panels start at $10/sqft with a $45 minimum. An 18×24\" board is $45. A 24×36\" panel — perfect for a table display with the grad's name and year — is $65. For photo opportunity walls, we print large-format vinyl banners on retractable stands. In-house designer can create a layout from your grad's photo and school colours.",
        },
        {
          q: "How much does a step-and-repeat photo backdrop cost in Saskatoon?",
          a: "A 4×8 ft vinyl banner for a step-and-repeat photo backdrop is $240 + GST at True Color Display Printing, 216 33rd St W, Saskatoon. A retractable banner stand to mount it on is $219 complete (stand + print). Foam board backing on a tabletop easel is also an option for smaller private events. In-house designer can lay out the repeat pattern from your school logo or family monogram.",
        },
        {
          q: "Where can I get graduation banners printed same day in Saskatoon?",
          a: "True Color Display Printing at 216 33rd St W, Saskatoon, SK offers same-day rush printing for a flat $40 fee. Call (306) 954-8688 before 10 AM to confirm capacity. We print vinyl banners and foam board displays in-house on our Roland UV printer. Pickup is available the same business day — no shipping risk before your graduation ceremony.",
        },
      ]}
    />
  );
}
