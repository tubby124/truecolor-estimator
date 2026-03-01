import type { Metadata } from "next";
import Image from "next/image";
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
    <p className="text-gray-600 text-lg leading-relaxed mb-10">
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
    </p>

    {/* Design directions — Vinyl Banners */}
    <div className="mb-10">
      <h3 className="text-xl font-bold text-[#1c1712] mb-1">Banner design directions</h3>
      <p className="text-sm text-gray-500 mb-5">
        Tell us which style fits — or send your own artwork and we&apos;ll match it exactly.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <div className="relative aspect-[3/1] w-full rounded-lg overflow-hidden mb-3">
            <Image
              src="/images/industries/healthcare/banner-clinical-professional.png"
              alt="New Patients Welcome clinic vinyl banner — navy and white professional style"
              fill
              className="object-cover"
              sizes="(max-width:640px) 100vw, 33vw"
            />
          </div>
          <p className="font-semibold text-sm text-[#1c1712]">Professional Clinic</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Navy + white, medical cross — new patient announcements, clinic exteriors
          </p>
        </div>
        <div>
          <div className="relative aspect-[3/1] w-full rounded-lg overflow-hidden mb-3">
            <Image
              src="/images/industries/healthcare/banner-health-campaign.png"
              alt="Flu Shot Clinic health awareness vinyl banner — teal gradient walk-ins welcome"
              fill
              className="object-cover"
              sizes="(max-width:640px) 100vw, 33vw"
            />
          </div>
          <p className="font-semibold text-sm text-[#1c1712]">Seasonal Campaign</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Teal gradient, bold typography — flu clinics, vaccination drives, health fairs
          </p>
        </div>
        <div>
          <div className="relative aspect-[3/1] w-full rounded-lg overflow-hidden mb-3">
            <Image
              src="/images/industries/healthcare/banner-event-promo.png"
              alt="Health event promotional vinyl banner — walk-in clinic community promotion"
              fill
              className="object-cover"
              sizes="(max-width:640px) 100vw, 33vw"
            />
          </div>
          <p className="font-semibold text-sm text-[#1c1712]">Health Event</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Sky blue, high-contrast — walk-in promotions, community health events
          </p>
        </div>
      </div>
    </div>

    {/* Design directions — ACP + Foam Board */}
    <div className="mb-10">
      <h3 className="text-xl font-bold text-[#1c1712] mb-1">Indoor display directions</h3>
      <p className="text-sm text-gray-500 mb-5">
        ACP panels from $13/sqft · Foam board from $8/sqft — no separate graphic fee.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden mb-3">
            <Image
              src="/images/industries/healthcare/display-lobby-directory.png"
              alt="Clinic lobby directory panel — acrylic wall-mounted suite listing sign"
              fill
              className="object-cover"
              sizes="(max-width:640px) 100vw, 33vw"
            />
          </div>
          <p className="font-semibold text-sm text-[#1c1712]">Lobby Directory</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Suite listings, provider names — clinic entrances, multi-tenant buildings
          </p>
        </div>
        <div>
          <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden mb-3">
            <Image
              src="/images/industries/healthcare/display-waiting-room-panel.png"
              alt="Waiting room foam board education display — Know Your Numbers annual screening checklist"
              fill
              className="object-cover"
              sizes="(max-width:640px) 100vw, 33vw"
            />
          </div>
          <p className="font-semibold text-sm text-[#1c1712]">Patient Education</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Foam board on easel — waiting rooms, exam rooms, seasonal health messaging
          </p>
        </div>
        <div>
          <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden mb-3">
            <Image
              src="/images/industries/healthcare/display-acp-permanent.png"
              alt="ACP aluminum composite clinic directory sign — wall-mounted permanent standoff sign"
              fill
              className="object-cover"
              sizes="(max-width:640px) 100vw, 33vw"
            />
          </div>
          <p className="font-semibold text-sm text-[#1c1712]">ACP Permanent Panel</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Brushed aluminum, standoff mount — 10+ year lifespan, building directories
          </p>
        </div>
      </div>
    </div>

    {/* Design directions — Retractable Banners */}
    <div>
      <h3 className="text-xl font-bold text-[#1c1712] mb-1">Retractable banner directions</h3>
      <p className="text-sm text-gray-500 mb-5">
        24×80&quot; stand + print complete from $219 + GST — no separate graphic fee.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 max-w-md">
        <div>
          <div className="relative aspect-[3/8] w-full rounded-lg overflow-hidden mb-3">
            <Image
              src="/images/industries/healthcare/retractable-health-fair.png"
              alt="Community Health Fair retractable banner stand — free screenings, book your spot"
              fill
              className="object-cover"
              sizes="(max-width:640px) 50vw, 25vw"
            />
          </div>
          <p className="font-semibold text-sm text-[#1c1712]">Health Fair Display</p>
          <p className="text-xs text-gray-500 mt-0.5">Community events, flu clinics, trade shows</p>
        </div>
        <div>
          <div className="relative aspect-[3/8] w-full rounded-lg overflow-hidden mb-3">
            <Image
              src="/images/industries/healthcare/retractable-reception-welcome.png"
              alt="Welcome new patients retractable banner stand for clinic reception area"
              fill
              className="object-cover"
              sizes="(max-width:640px) 50vw, 25vw"
            />
          </div>
          <p className="font-semibold text-sm text-[#1c1712]">Reception Welcome</p>
          <p className="text-xs text-gray-500 mt-0.5">Clinic reception, waiting room, new patient info</p>
        </div>
      </div>
    </div>
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
