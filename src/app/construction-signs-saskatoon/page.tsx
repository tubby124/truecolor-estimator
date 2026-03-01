import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Construction Signs Saskatoon | Coroplast, Magnets & Cards | True Color",
  description:
    "Site signs, truck magnets, and business cards for Saskatoon contractors. Coroplast from $30, magnets from $45. In-house designer. Local pickup same day.",
  alternates: { canonical: "/construction-signs-saskatoon" },
  openGraph: {
    title: "Construction Signs Saskatoon | True Color",
    description:
      "Job site coroplast signs and safety banners from $30. Same-day rush. Local Saskatoon pickup at 216 33rd St W.",
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
      subtitle="Job site signs, truck magnets, and business cards. Ready when your crew is."
      heroImage="/images/products/heroes/construction-hero-1200x500.webp"
      heroAlt="Construction site signs and truck magnets Saskatoon"
      description="Most Saskatoon contractors don't order site signs until the job is already live — then they're stuck waiting. True Color has your coroplast signs, door magnets, and business cards ready in 1–3 business days. In-house designer handles everything from your logo to a rough sketch. No Toronto shipping wait."
      products={[
        { name: "Coroplast Signs", from: "from $30", slug: "coroplast-signs" },
        { name: "Vehicle Magnets", from: "from $45", slug: "vehicle-magnets" },
        { name: "Business Cards", from: "from $40", slug: "business-cards" },
      ]}
      whyPoints={[
        "Coroplast that survives Saskatchewan winters — UV-resistant, waterproof, 2–3 year outdoor lifespan",
        "30mil truck door magnets that stay on at highway speeds",
        "In-house designer — bring your logo or a napkin sketch, we handle the rest",
        "250 business cards from $40 — cheaper than a Tim's run for the crew",
        "Local Saskatoon pickup at 216 33rd St W — no shipping, no waiting",
      ]}
      faqs={[
        {
          q: "How long do coroplast job site signs last?",
          a: "2–3 years outdoors in Saskatchewan conditions — UV-resistant print and waterproof substrate. They survive freeze/thaw cycles and won't rust or rot.",
        },
        {
          q: "Can I order just 1 pair of truck magnets?",
          a: "Yes — no minimum beyond 1 magnet. Most contractors order pairs (driver + passenger door).",
        },
        {
          q: "What's the turnaround time?",
          a: "Standard is 1–3 business days after artwork approval. Rush (same day or next morning) available for a flat $40 fee — confirm availability when ordering.",
        },
        {
          q: "I just have a rough logo from my phone. Can you work with that?",
          a: "Yes — our in-house designer handles low-res logos, rough sketches, and phone photos. We'll upscale, clean up, and make it print-ready. Starting at $35.",
        },
      ]}
    />
  );
}
