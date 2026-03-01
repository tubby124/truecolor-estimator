import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Healthcare Signs Saskatoon | Clinic & Medical Office Signage | True Color",
  description:
    "Clinic signs, wayfinding, patient banners, and office directories for Saskatoon healthcare providers. ACP from $13/sqft. In-house designer. Local pickup.",
  alternates: { canonical: "/healthcare-signs-saskatoon" },
  openGraph: {
    title: "Healthcare Signs Saskatoon | True Color Display Printing",
    description:
      "Professional clinic and medical office signage in Saskatoon. ACP directories, foam board displays, vinyl banners. Same-day available.",
    url: "https://truecolorprinting.ca/healthcare-signs-saskatoon",
    type: "website",
  },
};

const descriptionNode = (
  <>
    Saskatoon clinics, medical offices, dental practices, and wellness centres rely on True
    Color for signage that&apos;s clean, professional, and easy to update. ACP aluminum panels
    for building directories and room signs. Foam board displays for waiting room education.
    Vinyl banners for seasonal health programs and grand openings. Retractable stands for
    health fairs and community events. We print in-house, control quality start to finish,
    and deliver locally — no shipping delays when your waiting room signage needs to be ready
    for Monday.{" "}
    Running a dental practice?{" "}
    <Link href="/dental-office-signs-saskatoon" className="text-[#16C2F3] underline">
      See our dedicated dental office signs page
    </Link>{" "}
    for business cards, ACP suite signs, and same-day turnaround for new associates.
  </>
);

export default function HealthcareSignsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="healthcare-signs-saskatoon"
      primaryProductSlug="acp-signs"
      title="Healthcare Signs Saskatoon"
      subtitle="Clinic signage, wayfinding, and patient-facing displays. Professional and compliant."
      heroImage="/images/products/heroes/healthcare-hero-1200x500.webp"
      heroAlt="Healthcare clinic signs and wayfinding printed in Saskatoon by True Color Display Printing"
      description="Saskatoon clinics, medical offices, dental practices, and wellness centres rely on True Color for signage that's clean, professional, and easy to update. ACP aluminum panels for building directories and room signs. Foam board displays for waiting room education. Vinyl banners for seasonal health programs and grand openings. Retractable stands for health fairs and community events. We print in-house, control quality start to finish, and deliver locally — no shipping delays when your waiting room signage needs to be ready for Monday."
      descriptionNode={descriptionNode}
      products={[
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Foamboard Displays", from: "from $8/sqft", slug: "foamboard-displays" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Window Decals", from: "from $8/sqft", slug: "window-decals" },
        { name: "Business Cards", from: "250 for $40", slug: "business-cards" },
      ]}
      whyPoints={[
        "ACP aluminum directories from $13/sqft — rigid, permanent, and easy to read",
        "Foam board patient displays — lightweight, affordable, and easy to update seasonally",
        "Retractable stands from $219 — ideal for health fairs, flu clinics, and community events",
        "Window decals for clinic branding and hours — removable without residue",
        "In-house designer creates AODA-accessible signage from your content",
        "Same-day rush (+$40 flat) when you need signage ready for Monday opening",
      ]}
      faqs={[
        {
          q: "What types of signs do healthcare clinics in Saskatoon typically order?",
          a: "The most common items are: ACP aluminum building directories (permanent, 10+ year lifespan), foam board patient education displays (lightweight, easy to swap), vinyl banners for seasonal programs (flu shot clinics, new services), retractable stands for health fairs, and window decals for clinic hours and branding.",
        },
        {
          q: "What's the best material for a clinic waiting room display?",
          a: "3/16\" foam board is the standard for indoor waiting room displays — lightweight, clean edges, and easy to hang or stand in a frame. For permanent wall-mounted directories, 3mm aluminum composite (ACP) lasts 10+ years and never warps or yellows.",
        },
        {
          q: "Can you match our clinic's brand colours?",
          a: "Yes — bring us your brand guide or Pantone references. Our Roland UV printer produces consistent, accurate colour. If you have existing printed materials, bring a sample and we'll match it.",
        },
        {
          q: "Do you design accessible (AODA-compliant) signage?",
          a: "Our in-house designer can build signage with high-contrast text, readable fonts, and appropriate sizing for patients with visual impairments. Bring your content requirements and we'll handle the layout.",
        },
        {
          q: "Can I update my signage seasonally without replacing the entire display?",
          a: "Yes — foam board is inexpensive enough to reprint seasonally. Retractable banner replacement graphics are also available at less than the cost of a full unit. We keep your artwork on file for easy reorders.",
        },
        {
          q: "What is your turnaround time for clinic signage?",
          a: "Standard turnaround is 1–3 business days after artwork approval. Same-day rush is +$40 flat if ordered before 10 AM — call (306) 954-8688 to confirm availability.",
        },
      ]}
    />
  );
}
