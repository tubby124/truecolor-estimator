import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Dental Office Signs Saskatoon | Business Cards, ACP Signs & More | True Color",
  description:
    "Business cards, ACP suite signs, and retractable banners for Saskatoon dental offices. New associate? Cards ready in 24–48 hrs. Local pickup at 216 33rd St W.",
  alternates: { canonical: "/dental-office-signs-saskatoon" },
  openGraph: {
    title: "Dental Office Signs Saskatoon | True Color Display Printing",
    description:
      "Business cards for new associates in 24–48 hrs. ACP suite signs, retractable banners, and foamboard displays for Saskatoon dental clinics. Local pickup.",
    url: "https://truecolorprinting.ca/dental-office-signs-saskatoon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

const descriptionNode = (
  <>
    Saskatoon dental clinics rely on True Color for business cards, ACP suite signs, and
    patient-facing displays. Multi-dentist practice? Order all your providers in one batch —
    one proof per associate, one pickup, one invoice. New associate starting this week? We
    print 250 cards in 24–48 hrs. Staples quotes 5 business days. For clinics in newer
    suburban strips (Stonebridge, Evergreen, Brighton, McKercher), we size ACP signs to fit
    your specific fascia slot — bring the measurements and we handle the rest. In-house
    designer matches your existing brand colours exactly. Local pickup at 216 33rd St W.{" "}
    See all{" "}
    <Link href="/healthcare-signs-saskatoon" className="text-[#16C2F3] underline">
      healthcare signage options
    </Link>
    {" "}or go straight to{" "}
    <Link href="/products/business-cards" className="text-[#16C2F3] underline">
      business card pricing
    </Link>
    .
  </>
);

export default function DentalOfficeSignsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="dental-office-signs-saskatoon"
      primaryProductSlug="business-cards"
      title="Dental Office Signs Saskatoon"
      subtitle="New associate starting Monday? Cards done by Friday. Local Saskatoon pickup."
      heroImage="/images/products/heroes/healthcare-hero-1200x500.webp"
      heroAlt="Business cards and signs for Saskatoon dental offices printed by True Color Display Printing"
      description="Saskatoon dental clinics rely on True Color for business cards, ACP suite signs, and patient-facing displays. Multi-dentist practice? Order all your providers in one batch — one proof per associate, one pickup, one invoice. New associate starting this week? We print 250 cards in 24–48 hrs. Staples quotes 5 business days."
      descriptionNode={descriptionNode}
      products={[
        { name: "Business Cards", from: "250 for $40", slug: "business-cards" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Foamboard Displays", from: "from $8/sqft", slug: "foamboard-displays" },
        { name: "Window Decals", from: "from $8/sqft", slug: "window-decals" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
      ]}
      whyPoints={[
        "New associate? 250 business cards printed and ready in 24–48 hrs — Staples quotes 5 business days",
        "Multi-dentist clinic? Order all providers in one batch — one proof, one pickup, one price",
        "ACP suite signs sized to your specific strip mall fascia slot — permanent, professional, 10+ year lifespan",
        "Retractable banner stands from $219 — new-patient promos at reception, health fairs, community events",
        "In-house designer matches your existing brand colours exactly — no outside designer needed",
        "Same-day rush available — $40 flat, order before noon, pick up next morning at 216 33rd St W",
      ]}
      faqs={[
        {
          q: "What card stock do most dental offices choose?",
          a: "Most dental clinics choose 16pt gloss or matte — it feels premium in a patient's hand and holds up to being carried in a wallet or pocket. 14pt is the budget-friendly option. Both are available in single or double-sided. 250 cards from $40, 1000 cards from $80.",
        },
        {
          q: "We have 4 dentists — can we order all their cards at once?",
          a: "Yes — batch orders are our most common dental order. You get one proof per provider, one pickup appointment, and one invoice. We keep each associate's file on record so reorders are fast when the next hire joins.",
        },
        {
          q: "How fast can you turn around cards for a new hire starting Monday?",
          a: "Order Friday before noon and cards are ready Saturday morning or first thing Monday. Standard turnaround is 1–3 business days from artwork approval. Same-day rush is +$40 flat if ordered before 10 AM. Call (306) 954-8688 to confirm.",
        },
        {
          q: "What size is an ACP suite sign for a strip mall exterior?",
          a: "The most common sizes for exterior suite fascia are 24×18\" and 24×36\". We recommend measuring your specific slot — bring the dimensions and we cut to size. 3mm aluminum composite (ACP) is the standard for exterior signs: rigid, weather-resistant, 10+ year lifespan.",
        },
        {
          q: "Can you match our existing brand guide and logo colours?",
          a: "Yes — send us your brand guide, a Pantone reference, or an existing printed piece. Our Roland UV printer produces consistent, accurate colour. If you have existing cards from another printer, bring a sample and we'll match it.",
        },
        {
          q: "How do we reorder without re-uploading everything?",
          a: "We keep your artwork on file. Call or email with your order number and quantity — we pull your file and print. No re-uploading, no re-proofing unless something has changed (new associate, new phone number, new address).",
        },
      ]}
    />
  );
}
