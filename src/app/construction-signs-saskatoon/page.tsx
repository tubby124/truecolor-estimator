import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Construction Signs Saskatoon | Site Signs, Magnets & Banners | True Color",
  description:
    "Job site coroplast signs, safety banners, truck magnets, and hoarding banners for Saskatoon contractors and home builders. Coroplast from $8/sqft. Same-day rush. 216 33rd St W.",
  keywords: [
    "construction signs saskatoon",
    "construction site signs saskatoon",
    "job site coroplast signs saskatoon",
    "contractor signs saskatoon",
    "home builder signs saskatoon",
    "safety signs saskatoon construction",
    "hoarding banner saskatoon",
    "truck magnets saskatoon contractor",
  ],
  alternates: { canonical: "/construction-signs-saskatoon" },
  openGraph: {
    title: "Construction Signs Saskatoon | Site Signs, Magnets & Banners | True Color",
    description:
      "Job site coroplast signs, safety banners, truck magnets, and hoarding banners for Saskatoon contractors. Same-day rush. Local pickup at 216 33rd St W.",
    url: "https://truecolorprinting.ca/construction-signs-saskatoon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function ConstructionPage() {
  return (
    <IndustryPage
      canonicalSlug="construction-signs-saskatoon"
      primaryProductSlug="coroplast-signs"
      title="Construction Signs Saskatoon"
      subtitle="Job site signs, hoarding banners, truck magnets, and safety signs for Saskatoon contractors and home builders — ready in 1–3 business days. Same-day rush available."
      heroImage="/images/products/heroes/construction-hero-1200x500.webp"
      heroAlt="Construction site signs, hoarding banners, and truck magnets for Saskatoon contractors"
      description="Most Saskatoon contractors don't order site signs until the job is already live — then they're stuck waiting. True Color has your coroplast signs, hoarding banners, truck door magnets, and business cards ready in 1–3 business days. In-house designer handles everything from your logo to a rough sketch. No Toronto shipping wait. Local pickup at 216 33rd St W, Saskatoon, Saskatchewan."
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            Most Saskatoon contractors don&apos;t order site signs until the job is already live —
            then they&apos;re stuck waiting a week for shipping from a national print chain. True Color
            Display Printing has your coroplast signs, hoarding banners, truck door magnets, and
            business cards ready in 1–3 business days. In-house designer handles everything from your
            logo to a rough sketch on a napkin. No Toronto shipping wait. Local pickup at 216 33rd St W,
            Saskatoon, Saskatchewan.
          </p>

          <h3 className="text-xl font-bold text-[#1c1712] mb-3">
            What Saskatoon contractors order most
          </h3>
          <p className="text-gray-600 leading-relaxed mb-8">
            The standard job site package for a Saskatoon contractor: one or two coroplast site ID signs
            (18×24&quot;, $24–30) with the company name and permit number, a pair of 30mil truck door
            magnets ($45–90/pair depending on size), and 250 business cards ($40) to hand on-site.
            Home builders and developers add development signage (4×8 ft coroplast, $232) for the lot
            and directional coroplast signs (18×24&quot;, $24) for subdivision roads. For fencing and
            hoarding, a full-colour vinyl banner ($8.25/sqft) runs the length of your site perimeter
            and doubles as advertising to passing traffic.
          </p>

          <h3 className="text-xl font-bold text-[#1c1712] mb-3">
            Safety signs for Saskatoon job sites
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Common job site safety signs — &quot;Hard Hat Area&quot;, &quot;No Unauthorized Entry&quot;,
            &quot;Safety Glasses Required&quot;, site identification with contractor name and permit number
            — are printed on 4mm coroplast from $8/sqft, UV-resistant and waterproof through Saskatchewan
            winters. Standard sizes: 18×24&quot; ($24) or 24×36&quot; ($48). Bring your requirements
            and we&apos;ll lay out a compliant sign. Call (306) 954-8688 to confirm turnaround for
            compliance-critical orders.
          </p>
        </>
      }
      products={[
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Vehicle Magnets", from: "from $45", slug: "vehicle-magnets" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Business Cards", from: "250 from $40", slug: "business-cards" },
      ]}
      whyPoints={[
        "Coroplast that survives Saskatchewan winters — UV-resistant, waterproof, 2–3 year outdoor lifespan",
        "18×24\" job site ID sign — $24–30, ready in 1–3 business days from your logo or sketch",
        "4×8ft home builder development sign — $232 + GST, the standard for new subdivision lots",
        "30mil truck door magnets that stay on at highway speeds — from $45 per magnet",
        "Safety signs: Hard Hat Area, No Entry, site ID — coroplast $8/sqft, 18×24\" from $24",
        "250 business cards from $40 — one stop for signs, magnets, and cards — call (306) 954-8688",
        "In-house designer handles low-res logos, rough sketches, and phone photos — from $35",
        "Local Saskatoon pickup at 216 33rd St W — no shipping delays from a national print chain",
      ]}
      faqs={[
        {
          q: "How much do construction site signs cost in Saskatoon?",
          a: "At True Color Display Printing (216 33rd St W, Saskatoon, SK), coroplast job site signs are from $8/sqft. An 18×24\" sign (standard job site ID size) is $24–30. A 24×36\" safety or permit sign is $48. A 4×8 ft development or show home sign is $232 + GST. All are UV-resistant and waterproof for Saskatchewan outdoor conditions.",
        },
        {
          q: "How long do coroplast job site signs last?",
          a: "2–3 years outdoors in Saskatchewan conditions — UV-resistant print and waterproof substrate. They survive freeze/thaw cycles and won't rust or rot. For permanent site identification where longevity matters, ACP aluminum composite signs (from $13/sqft) last 10+ years and are common for permanent job site or company yard signage.",
        },
        {
          q: "Can I order just 1 pair of truck magnets?",
          a: "Yes — no minimum beyond 1 magnet. Most Saskatoon contractors order pairs (driver + passenger door). 30mil magnets are rated for highway speeds. Size affects price — a 12×18\" pair is $45–60, a 12×24\" pair is $60–80. Bring your logo file or we can design from scratch.",
        },
        {
          q: "Do you print safety signs for Saskatoon construction sites?",
          a: "Yes — safety signs including 'Hard Hat Area', 'No Unauthorized Entry', 'Safety Glasses Required', and custom site ID signs with contractor name and permit number. Printed on 4mm coroplast at $8/sqft, UV-resistant and waterproof. Standard sizes: 18×24\" ($24) or 24×36\" ($48). Bring your requirements and we'll lay out a compliant sign in-house.",
        },
        {
          q: "Can you print hoarding banners and construction fence banners in Saskatoon?",
          a: "Yes — full-colour vinyl banners at $8.25/sqft (13oz scrim) are popular for construction fencing and hoarding panels in Saskatoon. A 4×20 ft hoarding banner is $660 + GST and turns your site perimeter into advertising for the project. Hemming and grommets included. Standard turnaround 1–3 business days — call (306) 954-8688 for urgent site deadlines.",
        },
        {
          q: "Do you print home builder signs and development project signs in Saskatoon?",
          a: "Yes — new home builders and developers in Saskatoon order coroplast development signs (4×8 ft, $232 + GST), show home directional signs (18×24\", $24), and job site identification signs. We print in-house and have orders ready in 1–3 business days. For subdivision launches and show home openings, same-day rush is +$40 flat — call (306) 954-8688.",
        },
        {
          q: "What's the turnaround time for construction signs in Saskatoon?",
          a: "Standard turnaround is 1–3 business days after artwork approval at True Color Display Printing. Rush (same day or next morning) is available for a flat $40 fee — call (306) 954-8688 to confirm capacity before 10 AM. We print in-house on a Roland UV printer — no outsourcing, no waiting for Toronto shipping.",
        },
        {
          q: "I just have a rough logo from my phone. Can you work with that?",
          a: "Yes — our in-house designer handles low-res logos, rough sketches, and phone photos. We'll upscale, clean up, and make it print-ready for coroplast, magnets, and business cards. Design service starts at $35. If you've worked with us before, your artwork is on file and reprints are ready faster.",
        },
      ]}
    />
  );
}
