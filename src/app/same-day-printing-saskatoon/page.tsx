import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Same Day Printing Saskatoon | Rush $40 Flat",
  description:
    "Same-day printing in Saskatoon. Order before 10 AM, pick up by 5 PM. Signs, banners, business cards, flyers. Rush fee $40 flat — no per-item upcharge. 216 33rd St W.",
  alternates: { canonical: "/same-day-printing-saskatoon" },
  openGraph: {
    title: "Same Day Printing Saskatoon | True Color Display Printing",
    description:
      "Order before 10 AM, ready by 5 PM. Signs, banners, cards, flyers. Rush +$40 flat. Local Saskatoon pickup.",
    url: "https://truecolorprinting.ca/same-day-printing-saskatoon",
    type: "website",
  },
};

export default function SameDayPrintingSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="same-day-printing-saskatoon"
      primaryProductSlug="coroplast-signs"
      title="Same Day Printing Saskatoon"
      subtitle="Order before 10 AM — pick up by 5 PM. Rush is +$40 flat, no per-item upcharge."
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="Same day printing Saskatoon — signs, banners, and cards ready today"
      description="True Color Display Printing offers genuine same-day printing in Saskatoon. Order before 10 AM and we confirm availability by phone — your order is ready by 5 PM the same day. The rush fee is a flat $40 added to your order total, not a per-item surcharge. We print coroplast signs, vinyl banners, business cards, flyers, foamboard displays, and vehicle magnets entirely in-house on our Roland UV printer. No outsourcing, no supplier delays, no excuses. Same-day available Monday through Friday — call (306) 954-8688 before ordering to confirm capacity."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            True Color Display Printing offers genuine same-day printing in Saskatoon — not
            &ldquo;we&apos;ll try&rdquo; same-day, but confirmed same-day. Order before 10 AM,
            call (306) 954-8688 to confirm capacity, and your order is ready for pickup by 5 PM
            the same business day. The rush fee is a flat $40 added to your order total —
            not per sign, not per sqft. Whether you&apos;re ordering 1 banner or 50 coroplast
            signs, the rush surcharge is the same $40.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            We print entirely in-house on our Roland UV equipment. That means we control the
            timeline — no waiting on a supplier, no courier delays, no excuses. Same-day
            options include{" "}
            <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              coroplast signs
            </Link>
            ,{" "}
            <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              vinyl banners
            </Link>
            ,{" "}
            <Link href="/business-cards-saskatoon" className="text-[#16C2F3] underline font-medium">
              business cards
            </Link>
            , flyers, vehicle magnets, and foam board displays.
            Aluminum composite (ACP) signs may need an extra day — call to confirm.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            No print-ready file? Not a problem. Our in-house designer can prep your artwork
            on the spot from a low-res logo, a Word doc, or a rough sketch — design starts
            at $35 and usually takes under 2 hours for simple layouts. Pickup is at
            216 33rd St W, Saskatoon. No delivery fees, no shipping guesswork —
            your order is in your hands the same day you ordered it.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Same-day printing is the right call when you&apos;ve lost a sign to wind damage,
            had a last-minute event pop up, or simply forgot to order ahead of a trade show
            or grand opening. Our Saskatoon shop serves contractors, realtors, event organizers,
            and local businesses who need reliable same-day turnaround without the inflated
            pricing of big-box stores. A standard 4×8 coroplast sign is $232 — $272 with the
            $40 rush fee. A 2×6 vinyl banner runs $90 standard, $130 same-day. No hidden
            costs, no minimum orders, no waiting in a queue behind out-of-town jobs.
            We&apos;re a local Saskatoon print shop and your order always comes first. See our{" "}
            <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
              coroplast sign pricing
            </Link>
            ,{" "}
            <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
              banner printing options
            </Link>
            , or use the{" "}
            <Link href="/quote" className="text-[#16C2F3] underline font-medium">
              instant quote tool
            </Link>
            {" "}to get an exact price before you call.
          </p>
        </>
      }
      products={[
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Business Cards", from: "250 for $40", slug: "business-cards" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
        { name: "Foamboard Displays", from: "from $8/sqft", slug: "foamboard-displays" },
      ]}
      whyPoints={[
        "Rush fee is $40 flat on the full order — no per-sign or per-item upcharge",
        "Order before 10 AM — ready for pickup by 5 PM the same day",
        "In-house Roland UV printer — we never outsource, so we control the timeline",
        "In-house designer: bring your file or we prep it on the spot (from $35)",
        "Call (306) 954-8688 to confirm same-day capacity before ordering",
        "Pickup at 216 33rd St W, Saskatoon — no shipping delay, ever",
      ]}
      faqs={[
        {
          q: "How does same-day printing work at True Color?",
          a: "Order before 10 AM and call (306) 954-8688 to confirm capacity. We add a flat $40 rush fee to your order total. Your prints are ready for pickup by 5 PM the same business day. Same-day applies to: coroplast signs, vinyl banners, foamboard, flyers, business cards, and vehicle magnets.",
        },
        {
          q: "What's the rush fee?",
          a: "A flat $40 added to your order. Not per sign, not per sqft — just $40 total regardless of order size. So if you're ordering 20 signs, the rush fee is still $40.",
        },
        {
          q: "What products are available same-day?",
          a: "Coroplast signs, vinyl banners, foamboard displays, flyers, business cards, and vehicle magnets. Aluminum composite (ACP) signs may require an extra day. Call to confirm for your specific order.",
        },
        {
          q: "What if I don't have a print-ready file?",
          a: "Our in-house designer can prep your file on the spot starting at $35. Bring a logo (any quality), a sketch, or a reference photo. Design turnaround is usually under 2 hours for simple layouts.",
        },
        {
          q: "Do you offer same-day delivery in Saskatoon?",
          a: "We don't deliver — but we're at 216 33rd St W, which is 10 minutes from most of Saskatoon. Pickup is free, instant, and you can inspect your order before you leave.",
        },
        {
          q: "I need signs for an event tomorrow morning. Can you help?",
          a: "Yes — order by end of business today (5 PM) for next-morning standard turnaround with no rush fee. Or order first thing tomorrow before 10 AM for same-day rush. Call us and we'll figure it out.",
        },
        {
          q: "How much does same-day printing cost in Saskatoon?",
          a: "Standard pricing plus a flat $40 rush fee. A 4×8 coroplast sign is $232 standard — $272 same-day. A 2×6 vinyl banner is $90 standard — $130 same-day. Business cards (250, 2-sided) are $45 standard — $85 same-day. The $40 rush fee applies to your whole order, not per item, so ordering more doesn't make the rush proportionally more expensive.",
        },
        {
          q: "What's the deadline to order same-day printing in Saskatoon?",
          a: "Order before 10 AM and call (306) 954-8688 to confirm same-day availability. We're at 216 33rd St W, Saskatoon — open Monday to Friday. Calling ahead is important because same-day capacity is limited on busy days. If you miss the 10 AM cutoff, we can often turn orders around for next-morning pickup with no rush fee.",
        },
      ]}
    />
  );
}
