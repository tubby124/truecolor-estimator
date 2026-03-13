import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";
import { DesignDirectionGrid } from "@/components/site/DesignDirectionGrid";

export const metadata: Metadata = {
  title: { absolute: "Healthcare Signs Saskatoon | Clinic Signage | True Color" },
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

const designDirections = [
  {
    title: "Banner design directions",
    subtitle: "Tell us which style fits \u2014 or send your own artwork and we\u2019ll match it exactly.",
    aspect: "3/1" as const,
    items: [
      {
        src: "/images/industries/healthcare/banner-clinical-professional.png",
        alt: "New Patients Welcome clinic vinyl banner \u2014 navy and white professional style",
        label: "Professional Clinic",
        caption: "Navy + white, medical cross \u2014 new patient announcements, clinic exteriors",
      },
      {
        src: "/images/industries/healthcare/banner-health-campaign.png",
        alt: "Flu Shot Clinic health awareness vinyl banner \u2014 teal gradient walk-ins welcome",
        label: "Seasonal Campaign",
        caption: "Teal gradient, bold typography \u2014 flu clinics, vaccination drives, health fairs",
      },
      {
        src: "/images/industries/healthcare/banner-event-promo.png",
        alt: "Health event promotional vinyl banner \u2014 walk-in clinic community promotion",
        label: "Health Event",
        caption: "Sky blue, high-contrast \u2014 walk-in promotions, community health events",
      },
    ],
  },
  {
    title: "Indoor display directions",
    subtitle: "ACP panels from $13/sqft \u00b7 Foam board from $10/sqft \u2014 no separate graphic fee.",
    aspect: "4/3" as const,
    items: [
      {
        src: "/images/industries/healthcare/display-lobby-directory.png",
        alt: "Clinic lobby directory panel \u2014 acrylic wall-mounted suite listing sign",
        label: "Lobby Directory",
        caption: "Suite listings, provider names \u2014 clinic entrances, multi-tenant buildings",
      },
      {
        src: "/images/industries/healthcare/display-waiting-room-panel.png",
        alt: "Waiting room foam board education display \u2014 Know Your Numbers annual screening checklist",
        label: "Patient Education",
        caption: "Foam board on easel \u2014 waiting rooms, exam rooms, seasonal health messaging",
      },
      {
        src: "/images/industries/healthcare/display-acp-permanent.png",
        alt: "ACP aluminum composite clinic directory sign \u2014 wall-mounted permanent standoff sign",
        label: "ACP Permanent Panel",
        caption: "Brushed aluminum, standoff mount \u2014 10+ year lifespan, building directories",
      },
    ],
  },
  {
    title: "Retractable banner directions",
    subtitle: '24\u00d780" stand + print complete from $219 + GST \u2014 no separate graphic fee.',
    aspect: "3/8" as const,
    maxCols: 2 as const,
    items: [
      {
        src: "/images/industries/healthcare/retractable-health-fair.png",
        alt: "Community Health Fair retractable banner stand \u2014 free screenings, book your spot",
        label: "Health Fair Display",
        caption: "Community events, flu clinics, trade shows",
      },
      {
        src: "/images/industries/healthcare/retractable-reception-welcome.png",
        alt: "Welcome new patients retractable banner stand for clinic reception area",
        label: "Reception Welcome",
        caption: "Clinic reception, waiting room, new patient info",
      },
    ],
  },
];

const descriptionNode = (
  <>
    <p className="text-gray-600 text-lg leading-relaxed mb-10">
      Saskatoon clinics, medical offices, dental practices, and wellness centres rely on True
      Color for signage that&apos;s clean, professional, and easy to update.{" "}
      <Link href="/aluminum-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
        ACP aluminum panels
      </Link>{" "}
      for building directories and room signs.{" "}
      <Link href="/foamboard-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
        Foam board displays
      </Link>{" "}
      for waiting room education.{" "}
      <Link href="/banner-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
        Vinyl banners
      </Link>{" "}
      for seasonal health programs and grand openings.{" "}
      <Link href="/retractable-banners-saskatoon" className="text-[#16C2F3] underline font-medium">
        Retractable stands
      </Link>{" "}
      for health fairs and community events. We print in-house, control quality start to finish,
      and deliver locally — no shipping delays when your waiting room signage needs to be ready
      for Monday.{" "}
      Running a dental practice?{" "}
      <Link href="/dental-office-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
        See our dedicated dental office signs page
      </Link>{" "}
      for business cards, ACP suite signs, and same-day turnaround for new associates.
    </p>

    <DesignDirectionGrid sections={designDirections} />
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
      description="ACP aluminum clinic signs start at $13/sqft at True Color Display Printing in Saskatoon, Saskatchewan — a 24×18 inch exterior suite sign is $60 ($60 minimum applies), a 24×36 inch building directory panel is $66 + GST. Saskatoon clinics, medical offices, dental practices, physiotherapy centres, and wellness studios rely on True Color for signage that's clean, professional, and easy to update. We print everything in-house on our Roland UV printer — no outsourcing, no courier delays, and consistent colour that matches your brand guide exactly. ACP aluminum composite panels are the standard for permanent building directories and room identification signs: rigid, weather-resistant, and lasting 10+ years without fading or warping. For multi-tenant medical buildings, we size directory panels to your specific entrance layout. Foam board displays start at $10/sqft with a $45 minimum — a 24×36 inch panel is $65, perfect for waiting room patient education, seasonal health messaging like flu shot reminders, and exam room information boards. Foam board is lightweight enough to hang with adhesive strips or stand on a tabletop easel, and inexpensive enough to reprint seasonally when your messaging changes. Vinyl banners from $8.25/sqft work for grand opening announcements, seasonal flu shot clinics, new service launches, and community health fair backdrops — a 3×8 ft vinyl banner for a clinic exterior is $180. Retractable banner stands are $219 complete including the full-colour print — ideal for health fairs, community wellness events, dental association conferences, and reception area new-patient promotions. Window decals for clinic hours, branding, and seasonal messages start at $11/sqft with a $45 minimum. Business cards for medical professionals start at 250 for $45 on 14pt gloss — new associate joining the practice? Cards are ready in 24–48 hours. Flyers for patient education handouts and new service announcements are available from $45 for 100 copies on 80lb gloss. Postcards for appointment reminders and direct mail start at 50 for $40. Our in-house designer creates accessible, high-contrast signage layouts from your clinic's brand guide for $35 flat with same-day proof — no outside designer, no delays. Same-day rush printing is available for +$40 flat on orders placed before 10 AM — call (306) 954-8688 when your waiting room signage needs to be ready by Monday opening. Standard turnaround is 1–3 business days after artwork approval. We keep your artwork on file for fast seasonal updates and reorders. Local Saskatoon pickup at 216 33rd St W, Saskatchewan."
      descriptionNode={descriptionNode}
      products={[
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Foamboard Displays", from: "from $10/sqft", slug: "foamboard-displays" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
      ]}
      whyPoints={[
        "ACP aluminum directories from $13/sqft — rigid, permanent, and easy to read",
        "Foam board patient displays — lightweight, affordable, and easy to update seasonally",
        "Retractable stands from $219 — ideal for health fairs, flu clinics, and community events",
        "Window decals for clinic branding and hours — removable without residue",
        "In-house designer creates accessible, high-contrast signage from your content",
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
          q: "Do you design accessible signage for healthcare clinics?",
          a: "Yes — our in-house designer builds signage with high-contrast text, readable fonts, and appropriate sizing for patients with visual impairments. Bring your content requirements and we'll handle the layout for $35 flat with same-day proof.",
        },
        {
          q: "Can I update my signage seasonally without replacing the entire display?",
          a: "Yes — foam board is inexpensive enough to reprint seasonally. Retractable banner replacement graphics are also available at less than the cost of a full unit. We keep your artwork on file for easy reorders.",
        },
        {
          q: "What is your turnaround time for clinic signage?",
          a: "Standard turnaround is 1–3 business days after artwork approval. Same-day rush is +$40 flat if ordered before 10 AM — call (306) 954-8688 to confirm availability.",
        },
        {
          q: "How much do business cards for healthcare professionals cost in Saskatoon?",
          a: "Business cards start at 250 for $45 (14pt gloss, double-sided) or $40 single-sided at True Color Display Printing. 500 cards are $65 (2-sided), 1000 cards are $110. New associate joining the clinic? We print cards in 24–48 hours — Staples quotes 5 business days. We keep each provider's file on record so reorders are fast.",
        },
        {
          q: "Can you print patient education flyers and appointment reminder postcards?",
          a: "Yes — 80lb gloss flyers for patient handouts and clinic newsletters start at 100 for $45 (2-sided, 8.5×11 inch). Postcards for appointment reminders and direct mail to surrounding neighbourhoods start at 50 for $40 on 14pt gloss (4×6 inch, always double-sided). Our in-house designer creates the layout from your branding for $35 flat with same-day proof.",
        },
      ]}
    />
  );
}
