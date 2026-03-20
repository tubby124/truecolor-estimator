import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Custom Vinyl Lettering Saskatoon | From $40 | Same-Day" },
  description:
    "Custom vinyl lettering in Saskatoon from $40 ($8.50/sqft). Storefronts, vehicles, boats, office doors. In-house Roland UV cut vinyl. Same-day rush +$40.",
  alternates: { canonical: "/vinyl-lettering-saskatoon" },
  openGraph: {
    title: "Custom Vinyl Lettering Saskatoon | From $40 | Same-Day Rush",
    description:
      "Custom vinyl lettering in Saskatoon from $40 ($8.50/sqft). Storefronts, vehicles, boats, office doors. In-house Roland UV cut vinyl. Same-day rush +$40.",
    url: "https://truecolorprinting.ca/vinyl-lettering-saskatoon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function VinylLetteringSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="vinyl-lettering-saskatoon"
      primaryProductSlug="vinyl-lettering"
      title="Vinyl Lettering Saskatoon"
      subtitle="Storefront hours, vehicle door text, office suite numbers — clean cut vinyl from $40."
      heroImage="/images/products/heroes/retail-hero-1200x500.webp"
      heroAlt="Vinyl lettering Saskatoon storefront and vehicle"
      description="Cut vinyl lettering is the cleanest, lowest-cost way to put text and simple shapes on Saskatoon storefront windows, vehicle doors, office glass, boats, and trailers. From $8.50/sqft with a $40 minimum — no printing, no laminate, just precision-cut single-colour vinyl applied flat to your surface. Common uses include business hours on a front door, your company name on a shop window, vehicle door lettering with a phone number, boat registration numbers, and office suite or room numbers. Our Roland UV plotter cuts clean edges on premium outdoor-rated vinyl that lasts 5–7 years on exterior surfaces. Same-day rush available for $40 flat on orders before 10 AM. Designer available for $35 flat. Pickup at 216 33rd St W, Saskatoon."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            Cut vinyl lettering is the cleanest, lowest-cost way to put text and simple shapes on a
            Saskatoon storefront window, vehicle door, office glass, boat hull, or trailer. Starting
            from $8.50/sqft with a $40 minimum — no printing, no laminate, just precision-cut
            single-colour vinyl applied flat. Common jobs include business hours on a front door,
            your company name across a shop window, vehicle door lettering with a phone number, and
            office suite or room numbers. Compare it to{" "}
            <Link href="/window-decals-saskatoon" className="text-[#16C2F3] underline font-medium">
              printed window decals
            </Link>{" "}
            — lettering is lower cost when you only need text or single-colour shapes (no photos,
            gradients, or full-colour logos).
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            We cut vinyl lettering on our in-house Roland UV plotter using premium outdoor-rated
            cast vinyl. Properly installed on exterior glass or a painted vehicle door, cut vinyl
            lasts 5–7 years without peeling or fading. We offer standard colours including white,
            black, red, dark blue, and gold — perfect for most Saskatoon retail storefronts and
            service vehicles. The vinyl goes on clean and is removable without damaging glass or
            factory paint when it&apos;s time to update.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            For vehicle door lettering, the most common order is your business name, phone number,
            and website in two to three lines on each door. A typical single door set (roughly
            12&times;24&quot;) starts around $40–$55. Boat registration numbers — required by
            Transport Canada to be at least 7.5cm tall — are a quick job that usually runs $40–$60
            for a set. If you need a fully printed graphic instead of plain text,{" "}
            <Link href="/wall-graphics-saskatoon" className="text-[#16C2F3] underline font-medium">
              wall graphics
            </Link>{" "}
            and window decals support full-colour artwork including photographs and complex logos.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Not sure which vinyl product fits your job? Call (306) 954-8688 and we&apos;ll walk
            you through it in two minutes. Standard turnaround is 1–3 business days. Same-day rush
            is available for $40 flat on orders placed before 10 AM. Our in-house designer handles
            text layout and spacing for $35 flat with a same-day proof. Pickup at 216 33rd St W,
            Saskatoon.
          </p>
        </>
      }
      products={[
        { name: "Vinyl Lettering", from: "from $40", slug: "vinyl-lettering" },
        { name: "Window Decals", from: "from $45", slug: "window-decals" },
        { name: "Perforated Window Vinyl", from: "from $40", slug: "window-perf" },
        { name: "Vehicle Magnets", from: "from $45", slug: "vehicle-magnets" },
        { name: "Coroplast Signs", from: "from $30", slug: "coroplast-signs" },
      ]}
      whyPoints={[
        "From $8.50/sqft, $40 minimum — lowest-cost option when you only need text or single-colour shapes",
        "Roland UV plotter — clean, precise cuts on premium outdoor-rated cast vinyl",
        "5–7 year outdoor life on glass and painted vehicle surfaces",
        "Standard colours: white, black, red, dark blue, gold — available in stock for fast turnaround",
        "Removable without damaging glass or factory paint when it's time to update",
        "Same-day rush for $40 flat — need your storefront hours on the door before opening? Done",
        "In-house designer at $35 — text layout, spacing, and font selection handled same day",
        "Local pickup at 216 33rd St W, Saskatoon — 1–3 business day standard turnaround",
      ]}
      faqs={[
        {
          q: "How much does vinyl lettering cost in Saskatoon?",
          a: "Cut vinyl lettering starts at $8.50/sqft with a $40 minimum. A typical storefront door with business name and hours in two lines (roughly 6×24\") runs $40–$55. Vehicle door lettering (business name, phone, website — two lines per door) usually starts around $40–$60 per door set. Larger storefront window text is priced by the square footage of the lettering area.",
        },
        {
          q: "What is the difference between vinyl lettering and window decals?",
          a: "Vinyl lettering is cut from single-colour vinyl film — ideal for text, outlines, and simple shapes. There is no background, no printing, just clean-cut characters. Window decals are digitally printed and can include photographs, full-colour logos, and gradients. If you only need text or a single-colour shape, vinyl lettering costs less. If you need a full-colour design, printed window decals are the right call and start at $45.",
        },
        {
          q: "Can you put vinyl lettering on vehicle doors?",
          a: "Yes — vehicle door lettering is one of our most common vinyl lettering jobs. We use outdoor-rated cast vinyl that adheres to factory paint without damaging it. A typical door set (business name, phone number, website) starts around $40–$60 per door. When you no longer need it, vinyl lettering removes cleanly from most vehicle paint.",
        },
        {
          q: "Do you cut boat registration numbers?",
          a: "Yes — Transport Canada requires registration numbers to be at least 7.5cm (3\") tall, in a colour that contrasts with the hull, on both sides of the bow. We cut registration numbers from outdoor-rated vinyl. A standard set for both sides usually runs $40–$55. Bring your registration number and we'll have them cut same-day or next-day.",
        },
        {
          q: "How long does vinyl lettering last outdoors in Saskatchewan?",
          a: "Premium outdoor-rated cast vinyl used for exterior applications lasts 5–7 years on glass and painted surfaces in Saskatchewan conditions — including UV exposure, freeze-thaw cycles, and car washes. Economy vinyl for short-term or indoor applications is also available at lower cost. We'll recommend the right product for your specific surface and environment.",
        },
        {
          q: "Can you do same-day vinyl lettering in Saskatoon?",
          a: "Yes — same-day rush is available for $40 flat on orders placed before 10 AM. Standard turnaround is 1–3 business days. Call (306) 954-8688 to confirm same-day availability for your job size. Simple text jobs cut faster than large multi-element designs.",
        },
        {
          q: "What colours are available for vinyl lettering?",
          a: "We carry a full range of standard colours in stock, including white, matte black, gloss black, red, dark blue, royal blue, gold, silver, and green. Custom colours are available on request. White is the most popular choice for dark window glass. Black is common for office door suite numbers and interior applications. Call (306) 954-8688 if you need a specific colour match.",
        },
        {
          q: "Do you install vinyl lettering or is it pickup only?",
          a: "Standard orders are pickup at 216 33rd St W, Saskatoon. For storefront or office glass, we offer professional installation starting at $75. Vehicle door lettering is best applied in our shop where we can control temperature and dust for a clean finish. Call (306) 954-8688 to add installation to your order.",
        },
      ]}
    />
  );
}
