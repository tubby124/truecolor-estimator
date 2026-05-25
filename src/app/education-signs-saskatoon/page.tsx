import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Education Signs Saskatoon | School & Daycare | True Color" },
  description:
    "Signs and banners for Saskatoon schools and daycares. Coroplast yard signs, vinyl banners, and foam board displays from $8/sqft.",
  alternates: { canonical: "/education-signs-saskatoon" },
  openGraph: {
    title: "Education Signs Saskatoon | True Color Display Printing",
    description:
      "Yard signs, enrollment banners, and event displays for Saskatoon schools and daycares. Coroplast from $8/sqft. In-house printing.",
    url: "https://truecolorprinting.ca/education-signs-saskatoon",
    type: "website",
  },
};

const descriptionNode = (
  <>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      Saskatoon schools, daycares, and educational institutions trust True Color for signage
      that communicates clearly and holds up through the school year.{" "}
      <Link href="/school-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
        School signs
      </Link>{" "}
      for enrollment season, spirit events, and fundraiser promotions.{" "}
      <Link href="/daycare-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
        Daycare signs
      </Link>{" "}
      for exterior panels, window decals, and parent communication displays. Whether you
      need a dozen{" "}
      <Link href="/coroplast-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
        coroplast yard signs
      </Link>{" "}
      for an open house or a full set of banners for graduation, we print in-house and
      have your order ready in 1–3 business days.
    </p>

    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
        Vinyl banners
      </Link>{" "}
      from $8.25/sqft are the workhorse for school events — gym backdrops, sports season
      kickoffs, and new student welcome banners. A standard 3×8 ft banner is $180.{" "}
      <Link href="/foamboard-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
        Foam board displays
      </Link>{" "}
      from $10/sqft are ideal for classroom projects, hallway announcements, and science fair
      backboards — lightweight and easy to mount without tools. For permanent exterior signage,
      ACP aluminum panels at $13/sqft give schools a professional, long-lasting facade that
      won&apos;t fade through Saskatchewan winters.
    </p>

    <p className="text-gray-600 text-lg leading-relaxed mb-10">
      Education signage follows a seasonal rhythm — enrollment campaigns in August, event
      banners through October and May, graduation displays in June. We keep your artwork on
      file so reorders are fast and colours stay consistent year over year. Call{" "}
      <a href="tel:3069548688" className="text-[#16C2F3] underline font-medium">
        (306) 954-8688
      </a>{" "}
      for volume pricing on multi-school or district orders. Local pickup at 216 33rd St W,
      Saskatoon.
    </p>
  </>
);

export default function EducationSignsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="education-signs-saskatoon"
      primaryProductSlug="coroplast-signs"
      title="Education Signs Saskatoon"
      subtitle="Yard signs, enrollment banners, and event displays for schools and daycares."
      heroImage="/images/products/heroes/school-hero-1200x500.webp"
      heroAlt="Education signs and school banners printed in Saskatoon by True Color Display Printing"
      description="Signs and banners for Saskatoon schools, daycares, and educational institutions. Coroplast yard signs from $8/sqft. Vinyl banners from $8.25/sqft. Foam board displays from $10/sqft. ACP aluminum exterior panels from $13/sqft. Business cards, flyers, and retractable banners also available. In-house printing at 216 33rd St W, Saskatoon — 1–3 business day turnaround."
      descriptionNode={descriptionNode}
      products={[
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Foam Board Displays", from: "from $10/sqft", slug: "foamboard-displays" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
      ]}
      whyPoints={[
        "Coroplast yard signs from $8/sqft — open house and enrollment season staple",
        "Vinyl banners from $8.25/sqft — gym backdrops, sports banners, graduation displays",
        "Foam board displays from $10/sqft — lightweight, easy to mount, affordable to reprint",
        "ACP aluminum exterior panels from $13/sqft — permanent, weather-resistant facade signage",
        "Artwork kept on file — fast seasonal reorders, consistent colours year over year",
        "Volume pricing available for multi-school and district orders",
      ]}
      faqs={[
        {
          q: "What signs do Saskatoon schools typically order for enrollment season?",
          a: "Enrollment season (late July through August) typically calls for coroplast yard signs at $8/sqft — a 24×18 inch sign is $16 (tops up to the $25 order-total minimum at checkout for a single sign), so most schools order 3–5 signs per location. Vinyl banners for the school exterior ($8.25/sqft, 4×8 ft is $240) and window decals ($11/sqft) for office hours and contact info are also common. We keep artwork on file for fast annual reorders.",
        },
        {
          q: "Can you print graduation banners for Saskatoon schools?",
          a: "Yes — graduation banners are typically 4×8 ft or 3×10 ft vinyl banners printed with grad year, school colours, and a congratulations message. A 4×8 ft banner is $240 at $8.25/sqft, ready in 1–3 business days after artwork approval. Retractable banner stands ($219 complete) work well for indoor ceremonies. We keep previous years' artwork on file so updates are quick.",
        },
        {
          q: "What's the best signage for a Saskatoon daycare exterior?",
          a: "For permanent daycare exteriors, 3mm ACP aluminum at $13/sqft is the most durable choice — a 24×36 inch panel is $78, weather-resistant and UV-stable through Saskatchewan winters. For temporary or seasonal displays, coroplast at $8/sqft and window decals at $11/sqft are cost-effective. We can match your daycare's brand colours and include regulatory information like licensing details.",
        },
        {
          q: "Do you print foam board displays for school science fairs and hallway exhibits?",
          a: "Yes — 3/16\" foam board at $10/sqft (standard 18×24\" fixed SKU from $45) is the standard for science fair backboards and hallway display panels. A 36×48 inch display board is $105. Foam board is lightweight enough for students to carry and can be mounted with adhesive strips or displayed on a tabletop easel. In-house design available for $35 flat if you need a professional layout.",
        },
        {
          q: "Can you handle printing for multiple schools across a Saskatoon school division?",
          a: "Yes — we offer volume pricing for multi-school and school division orders. Call (306) 954-8688 with your quantity and spec requirements for a same-day quote. We keep all school artwork files organized for fast annual season reorders and can batch-ship or hold for pickup.",
        },
        {
          q: "How much do school event banners cost in Saskatoon?",
          a: "Vinyl banners are priced at $8.25/sqft with a $25 small-order minimum at checkout. A 2×6 ft banner is $90, a 3×8 ft banner is $180, a 4×8 ft banner is $240. Retractable banner stands (stand + print) are $219 complete — ideal for gym and auditorium events. Standard turnaround is 1–3 business days. Same-day rush is +$40 flat if ordered before 10 AM.",
        },
      ]}
      relatedCities={[
        { name: "Regina", slug: "coroplast-signs-regina" },
        { name: "Moose Jaw", slug: "signs-moose-jaw-sk" },
        { name: "Prince Albert", slug: "signs-prince-albert-sk" },
        { name: "Yorkton", slug: "signs-yorkton-sk" },
      ]}
    />
  );
}
