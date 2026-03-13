import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Graduation Banners Saskatoon | From $90 | True Color" },
  description:
    "Vinyl graduation banners, foam board displays & retractable stands for Saskatoon schools. Banners from $90. Same-day rush. Local pickup.",
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
    images: [{ url: "/images/seasonal/graduation/hero.webp", width: 1200, height: 500 }],
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
      heroImage="/images/seasonal/graduation/hero.webp"
      heroAlt="Graduation banners and foam board photo displays printed in Saskatoon by True Color Display Printing"
      description="Vinyl graduation banners start at $90 for a 2×6 ft banner at True Color Display Printing in Saskatoon, Saskatchewan — printed in-house on our Roland UV printer with hemming and grommets included. We produce graduation signage for elementary schools, high schools, universities, colleges, and private grad parties across Saskatoon and surrounding Saskatchewan communities. A 4×8 ft convocation banner for a gymnasium entrance or outdoor ceremony is $240 + GST — the most popular size for Saskatoon high school and U of S graduation events. Foam board photo displays start at $10/sqft with a $45 minimum — a 24×36 inch panel is $65, perfect for table centrepieces with the graduate's name, photo, and year. Retractable banner stands are $219 complete including the full-colour print — no separate graphic fee — and work as step-and-repeat photo backdrops, event entrance displays, and reception area signage. For schools ordering multiple banners, volume discounts apply automatically at 5+ units (8% off) and 10+ units (17% off). Our in-house designer creates custom layouts from your school crest, colours, and grad year for $35 flat with a same-day proof — no outside designer needed, no back-and-forth delays. Same-day rush printing is available for +$40 flat on orders placed before 10 AM — call (306) 954-8688 to confirm capacity. Standard turnaround is 1–3 business days after artwork approval. For June graduation season, order by late May to avoid peak volume. True Color prints everything in-house at 216 33rd St W, Saskatoon — no shipping from Toronto or Vancouver, no courier delays, no risk of your banner arriving after the ceremony. Whether you need a single banner for a backyard grad party or 20 banners for a school district, we handle the full run with consistent colour and quality across every piece. Flyers and programs for graduation ceremonies are available from $45 for 100 copies on 80lb gloss. Business cards for graduating students entering the workforce start at 250 for $40. Local pickup means you drive across town and pick up your order — not waiting by the mailbox hoping it arrives in time."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed mb-10">
            True Color Display Printing produces{" "}
            <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              vinyl graduation banners
            </Link>
            , foam board photo backdrops,
            and{" "}
            <Link href="/retractable-banners-saskatoon" className="text-[#16C2F3] underline font-medium">
              retractable banner stands
            </Link>{" "}
            for Saskatoon schools, universities, and event venues.
            We serve all levels — elementary and high school ceremonies, university convocation at the
            U of S or SIAST, and private grad parties across Saskatoon, Saskatchewan. Bring your school
            colours and grad year — our in-house designer handles the layout. Local pickup at
            216 33rd St W. Same-day rush available: +$40 flat, order before 10 AM.
          </p>

          {/* Banner design directions */}
          <div className="mb-10">
            <h3 className="text-xl font-bold text-[#1c1712] mb-1">Banner design directions</h3>
            <p className="text-sm text-gray-500 mb-5">Tell us your school colours and grad year — or send your own artwork and we&apos;ll match it exactly.</p>
            <div className="grid grid-cols-2 gap-4 max-w-lg">
              <div>
                <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-[#f8f4ef] mb-3">
                  <Image src="/images/seasonal/graduation/banner-school-colors.webp" alt="Graduation banner in blue and gold school colours — Class of 2026 Congratulations Graduates" fill className="object-contain" sizes="(max-width:640px) 50vw, 260px" />
                </div>
                <p className="font-semibold text-sm text-[#1c1712]">School Colours</p>
                <p className="text-xs text-gray-500 mt-0.5">School crest, custom colours — gyms, convocation entrances, outdoor ceremony</p>
              </div>
              <div>
                <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-[#f8f4ef] mb-3">
                  <Image src="/images/seasonal/graduation/banner-gold-classic.webp" alt="Classic navy and gold graduation banner with grad cap — Congratulations Class of 2026" fill className="object-contain" sizes="(max-width:640px) 50vw, 260px" />
                </div>
                <p className="font-semibold text-sm text-[#1c1712]">Classic Gold</p>
                <p className="text-xs text-gray-500 mt-0.5">Navy &amp; gold, grad cap — university convocation, private grad parties</p>
              </div>
            </div>
          </div>

          {/* Retractable banner stands */}
          <div className="mb-10">
            <h3 className="text-xl font-bold text-[#1c1712] mb-1">Retractable banner stands</h3>
            <p className="text-sm text-gray-500 mb-5">24×80&quot; stand + full-colour grad print — from $219 + GST complete. No separate graphic fee.</p>
            <div className="max-w-[220px]">
              <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-[#f8f4ef] mb-3">
                <Image src="/images/seasonal/graduation/hero.webp" alt="Retractable graduation banner stand — Class of 2026 step-and-repeat backdrop in navy and gold" fill className="object-contain" sizes="220px" />
              </div>
              <p className="font-semibold text-sm text-[#1c1712]">Step-and-repeat backdrop</p>
              <p className="text-xs text-gray-500 mt-0.5">Class of 2026, school colours — photo booth setups, event entrances</p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-[#1c1712] mb-3">
            Graduation banner sizes and pricing
          </h3>
          <p className="text-gray-600 leading-relaxed mb-8">
            The most popular size for a Saskatoon high school gymnasium or convocation entrance is
            4×8 ft ($240 + GST) — large enough to read from across a parking lot and weatherproof for
            outdoor use. For photo opportunity backdrops and step-and-repeat walls, a 4×8 ft vinyl banner
            on a retractable stand ($219 complete) is the go-to setup. For table centrepieces and
            directional signs inside a venue,{" "}
            <Link href="/foamboard-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              foam board panels
            </Link>{" "}
            ($10/sqft, 24×36&quot; = $65) are
            lightweight and easy to position without hardware.
          </p>

          <h3 className="text-xl font-bold text-[#1c1712] mb-3">
            Don&apos;t risk a late delivery on grad day
          </h3>
          <p className="text-gray-600 leading-relaxed">
            National online printers ship from Toronto or Vancouver — a shipping delay means your banner
            arrives after the ceremony. True Color prints in-house in Saskatoon. Order by <strong>late
            May</strong> for June graduation season, and you pick it up locally with days to spare.
            If you need it faster,{" "}
            <Link href="/same-day-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              same-day rush printing
            </Link>{" "}
            is available for +$40 flat — call (306) 954-8688
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
        {
          q: "Can you print graduation flyers, programs, and business cards for students?",
          a: "Yes — graduation ceremony programs and event flyers are printed on 80lb gloss stock: 100 copies for $45 (2-sided), 250 for $110, 500 for $135. For graduating students entering the workforce, business cards start at 250 for $40 (14pt gloss, 2-sided). Our in-house designer can create layouts for $35 flat with same-day proof. Local pickup at 216 33rd St W, Saskatoon.",
        },
      ]}
    />
  );
}
